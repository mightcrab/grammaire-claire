import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { INITIAL_PROGRESS_GENERATION } from "../app/progressData";
import { handleProgressApiRequest, type D1DatabaseLike, type D1PreparedStatementLike } from "../worker/progressApi";

type Row = {
  revision: number;
  generation: string;
  progressJson: string;
  lastMutationId: string;
  updatedAt: string;
};

type Receipt = { revision: number; payloadHash: string; updatedAt: string };
const userOwner = createHash("sha256").update("grammaire-claire-progress:user-123").digest("hex");

class MemoryStatement implements D1PreparedStatementLike {
  private values: Array<string | number | null> = [];

  constructor(
    private readonly rows: Map<string, Row>,
    private readonly receipts: Map<string, Receipt>,
    private readonly query: string,
  ) {}

  bind(...values: Array<string | number | null>): D1PreparedStatementLike {
    this.values = values;
    return this;
  }

  async first<T>(): Promise<T | null> {
    const userId = this.values[0] as string;
    if (this.query.includes("FROM progress_mutations")) {
      return (this.receipts.get(`${userId}:${this.values[1]}`) ?? null) as T | null;
    }
    if (this.query.trimStart().startsWith("SELECT") && this.query.includes("FROM progress_sync")) {
      return (this.rows.get(userId) ?? null) as T | null;
    }
    if (this.query.includes("INSERT INTO progress_mutations")) {
      const mutationId = this.values[1] as string;
      const current = this.rows.get(userId);
      if (current?.lastMutationId === mutationId) {
        this.receipts.set(`${userId}:${mutationId}`, {
          revision: current.revision,
          payloadHash: this.values[2] as string,
          updatedAt: current.updatedAt,
        });
      }
      return null;
    }

    const current = this.rows.get(userId);
    const inserting = this.query.includes("INSERT INTO progress_sync");
    if (inserting && current) return null;
    const baseRevision = inserting ? 0 : this.values[1] as number;
    if (!inserting && (!current || current.revision !== baseRevision)) return null;
    const row: Row = {
      revision: current ? current.revision + 1 : 1,
      generation: this.values[inserting ? 1 : 2] as string,
      progressJson: this.values[inserting ? 2 : 3] as string,
      lastMutationId: this.values[inserting ? 3 : 4] as string,
      updatedAt: this.values[inserting ? 4 : 5] as string,
    };
    this.rows.set(userId, row);
    return row as T;
  }
}

class MemoryD1 implements D1DatabaseLike {
  readonly rows = new Map<string, Row>();
  readonly receipts = new Map<string, Receipt>();

  prepare(query: string): D1PreparedStatementLike {
    return new MemoryStatement(this.rows, this.receipts, query);
  }

  async batch(statements: D1PreparedStatementLike[]): Promise<unknown[]> {
    const results = [];
    for (const statement of statements) results.push(await statement.first());
    return results;
  }
}

function putRequest(body: unknown, headers?: HeadersInit): Request {
  return new Request("https://course.example/api/progress", {
    method: "PUT",
    headers: { "content-type": "application/json", "oai-authenticated-user-id": "user-123", "x-progress-owner": userOwner, ...headers },
    body: JSON.stringify(body),
  });
}

function validPut(overrides: Record<string, unknown> = {}) {
  return {
    version: 1,
    baseRevision: 0,
    mutationId: "b83d209b-74ae-44db-80d9-6916d0d820b2",
    generation: INITIAL_PROGRESS_GENERATION,
    progress: {},
    ...overrides,
  };
}

test("requires identity remotely but supplies a stable localhost fallback", async () => {
  const db = new MemoryD1();
  const unauthorized = await handleProgressApiRequest(new Request("https://course.example/api/progress"), { DB: db });
  assert.equal(unauthorized.status, 401);
  assert.equal(unauthorized.headers.get("cache-control"), "no-store");

  const local = await handleProgressApiRequest(new Request("http://localhost/api/progress"), { DB: db });
  assert.equal(local.status, 200);
  assert.equal((await local.json() as { revision: number }).revision, 0);
  const localOwner = local.headers.get("x-progress-owner");
  assert.match(localOwner ?? "", /^[a-f0-9]{64}$/);

  const first = await handleProgressApiRequest(new Request("https://course.example/api/progress", { headers: { "oai-authenticated-user-id": "user-123" } }), { DB: db });
  const again = await handleProgressApiRequest(new Request("https://course.example/api/progress", { headers: { "oai-authenticated-user-id": "user-123" } }), { DB: db });
  const other = await handleProgressApiRequest(new Request("https://course.example/api/progress", { headers: { "oai-authenticated-user-id": "user-456" } }), { DB: db });
  assert.equal(first.headers.get("x-progress-owner"), again.headers.get("x-progress-owner"));
  assert.notEqual(first.headers.get("x-progress-owner"), other.headers.get("x-progress-owner"));
  assert.notEqual(first.headers.get("x-progress-owner"), "user-123");
});

test("creates progress once and deduplicates a retried mutation", async () => {
  const db = new MemoryD1();
  const body = validPut();
  const created = await handleProgressApiRequest(putRequest(body), { DB: db });
  assert.equal(created.status, 200);
  assert.equal((await created.json() as { revision: number }).revision, 1);

  const retried = await handleProgressApiRequest(putRequest(body), { DB: db });
  assert.equal(retried.status, 200);
  assert.equal((await retried.json() as { revision: number }).revision, 1);

  const reusedId = await handleProgressApiRequest(putRequest({
    ...body,
    progress: { "fnd-01": { strength: 0, attempts: 1, correct: 1 } },
  }), { DB: db });
  assert.equal(reusedId.status, 409);
  assert.equal((await reusedId.json() as { error: string }).error, "mutation_id_reused");

  const secondBody = validPut({
    baseRevision: 1,
    mutationId: "7d99a043-e764-47de-932b-e9c692b91e52",
    progress: { "fnd-01": { strength: 0, attempts: 1, correct: 1 } },
  });
  const second = await handleProgressApiRequest(putRequest(secondBody), { DB: db });
  assert.equal((await second.json() as { revision: number }).revision, 2);

  const oldRetry = await handleProgressApiRequest(putRequest(body), { DB: db });
  assert.equal(oldRetry.status, 200);
  assert.equal((await oldRetry.json() as { revision: number }).revision, 1);
});

test("uses only the base revision as the write precondition", async () => {
  const db = new MemoryD1();
  await handleProgressApiRequest(putRequest(validPut({ generation: "2026-08-18T10:00:00.000Z" })), { DB: db });

  const revisionConflict = await handleProgressApiRequest(putRequest(validPut({ mutationId: "1b89b41d-319d-4042-aa8d-a14082119f66" })), { DB: db });
  assert.equal(revisionConflict.status, 409);
  assert.equal((await revisionConflict.json() as { error: string }).error, "revision_conflict");

  const olderEpochReplacement = await handleProgressApiRequest(putRequest(validPut({
    baseRevision: 1,
    mutationId: "ac4f48c1-6869-442b-a1a0-3db2be3b4679",
  })), { DB: db });
  assert.equal(olderEpochReplacement.status, 200);
  assert.equal((await olderEpochReplacement.json() as { revision: number }).revision, 2);
});

test("rejects extra fields and oversized bodies", async () => {
  const db = new MemoryD1();
  const invalid = await handleProgressApiRequest(putRequest(validPut({ extra: true })), { DB: db });
  assert.equal(invalid.status, 400);

  const oversized = await handleProgressApiRequest(putRequest(validPut(), { "content-length": "65537" }), { DB: db });
  assert.equal(oversized.status, 413);
});

test("rejects an account switch before writing", async () => {
  const db = new MemoryD1();
  const response = await handleProgressApiRequest(putRequest(validPut(), { "x-progress-owner": "0".repeat(64) }), { DB: db });
  assert.equal(response.status, 409);
  assert.equal((await response.json() as { error: string }).error, "owner_changed");
  assert.equal(db.rows.size, 0);
});
