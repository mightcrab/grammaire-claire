import {
  INITIAL_PROGRESS_GENERATION,
  PROGRESS_VERSION,
  isCanonicalIsoTimestamp,
  isMutationId,
  parseProgressPutRequest,
  validateProgress,
  type ProgressPutRequest,
  type ProgressSnapshot,
} from "../app/progressData";

export const MAX_PROGRESS_BODY_BYTES = 64 * 1024;

type D1Value = string | number | null;

export interface D1PreparedStatementLike {
  bind(...values: D1Value[]): D1PreparedStatementLike;
  first<T = Record<string, unknown>>(): Promise<T | null>;
}

export interface D1DatabaseLike {
  prepare(query: string): D1PreparedStatementLike;
  batch(statements: D1PreparedStatementLike[]): Promise<unknown[]>;
}

export interface ProgressApiEnv {
  DB?: D1DatabaseLike;
}

type ProgressRow = {
  revision: unknown;
  generation: unknown;
  progressJson: unknown;
  lastMutationId: unknown;
  updatedAt: unknown;
};

type MutationReceiptRow = {
  revision: unknown;
  payloadHash: unknown;
  updatedAt: unknown;
};

const localUserId = "local-development-user";
const selectProgressSql = `
  SELECT
    revision,
    generation,
    progress_json AS progressJson,
    last_mutation_id AS lastMutationId,
    updated_at AS updatedAt
  FROM progress_sync
  WHERE user_id = ?1
`;
const insertProgressSql = `
  INSERT INTO progress_sync (
    user_id,
    revision,
    generation,
    progress_json,
    last_mutation_id,
    updated_at
  )
  VALUES (?1, 1, ?2, ?3, ?4, ?5)
  ON CONFLICT(user_id) DO NOTHING
  RETURNING
    revision,
    generation,
    progress_json AS progressJson,
    last_mutation_id AS lastMutationId,
    updated_at AS updatedAt
`;
const updateProgressSql = `
  UPDATE progress_sync
  SET
    revision = revision + 1,
    generation = ?3,
    progress_json = ?4,
    last_mutation_id = ?5,
    updated_at = ?6
  WHERE user_id = ?1
    AND revision = ?2
  RETURNING
    revision,
    generation,
    progress_json AS progressJson,
    last_mutation_id AS lastMutationId,
    updated_at AS updatedAt
`;
const selectMutationReceiptSql = `
  SELECT
    revision,
    payload_hash AS payloadHash,
    updated_at AS updatedAt
  FROM progress_mutations
  WHERE user_id = ?1
    AND mutation_id = ?2
`;
const insertMutationReceiptSql = `
  INSERT INTO progress_mutations (
    user_id,
    mutation_id,
    revision,
    payload_hash,
    updated_at
  )
  SELECT user_id, last_mutation_id, revision, ?3, updated_at
  FROM progress_sync
  WHERE user_id = ?1
    AND last_mutation_id = ?2
  ON CONFLICT(user_id, mutation_id) DO NOTHING
`;

function jsonResponse(body: unknown, status = 200, extraHeaders?: HeadersInit): Response {
  const headers = new Headers(extraHeaders);
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cache-Control", "no-store");
  headers.set("X-Content-Type-Options", "nosniff");
  return new Response(JSON.stringify(body), { status, headers });
}

function errorResponse(error: string, message: string, status: number, extraHeaders?: HeadersInit): Response {
  return jsonResponse({ error, message }, status, extraHeaders);
}

function isLoopbackHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]" || hostname === "::1";
}

function hasControlCharacters(value: string): boolean {
  return Array.from(value).some((character) => {
    const code = character.charCodeAt(0);
    return code <= 31 || code === 127;
  });
}

function authenticatedUserId(request: Request): string | null {
  const header = request.headers.get("oai-authenticated-user-id");
  if (header !== null) {
    return header.length > 0 && header.length <= 512 && header.trim() === header && !hasControlCharacters(header)
      ? header
      : null;
  }
  return isLoopbackHost(new URL(request.url).hostname) ? localUserId : null;
}

async function ownerToken(userId: string): Promise<string> {
  const bytes = new TextEncoder().encode(`grammaire-claire-progress:${userId}`);
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  return [...digest].map((value) => value.toString(16).padStart(2, "0")).join("");
}

function withOwnerToken(response: Response, owner: string): Response {
  response.headers.set("X-Progress-Owner", owner);
  return response;
}

function emptySnapshot(): ProgressSnapshot {
  return {
    version: PROGRESS_VERSION,
    revision: 0,
    generation: INITIAL_PROGRESS_GENERATION,
    updatedAt: null,
    progress: {},
  };
}

function rowToSnapshot(row: ProgressRow): ProgressSnapshot | null {
  if (!Number.isSafeInteger(row.revision) || (row.revision as number) < 1) return null;
  if (!isCanonicalIsoTimestamp(row.generation) || !isCanonicalIsoTimestamp(row.updatedAt)) return null;
  if (typeof row.progressJson !== "string" || !isMutationId(row.lastMutationId)) return null;
  try {
    const progress = validateProgress(JSON.parse(row.progressJson));
    return progress ? {
      version: PROGRESS_VERSION,
      revision: row.revision as number,
      generation: row.generation,
      updatedAt: row.updatedAt,
      progress,
    } : null;
  } catch {
    return null;
  }
}

async function readStoredProgress(db: D1DatabaseLike, userId: string): Promise<{ snapshot: ProgressSnapshot; lastMutationId: string | null }> {
  const row = await db.prepare(selectProgressSql).bind(userId).first<ProgressRow>();
  if (!row) return { snapshot: emptySnapshot(), lastMutationId: null };
  const snapshot = rowToSnapshot(row);
  if (!snapshot) throw new Error("Invalid progress row");
  return { snapshot, lastMutationId: row.lastMutationId as string };
}

async function progressPayloadHash(generation: string, progressJson: string): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${generation}\u0000${progressJson}`),
  ));
  return [...digest].map((value) => value.toString(16).padStart(2, "0")).join("");
}

async function readMutationReceipt(db: D1DatabaseLike, userId: string, mutationId: string): Promise<MutationReceiptRow | null> {
  const row = await db.prepare(selectMutationReceiptSql).bind(userId, mutationId).first<MutationReceiptRow>();
  if (!row) return null;
  if (!Number.isSafeInteger(row.revision) || (row.revision as number) < 1) throw new Error("Invalid mutation receipt revision");
  if (typeof row.payloadHash !== "string" || !/^[a-f0-9]{64}$/.test(row.payloadHash)) throw new Error("Invalid mutation receipt hash");
  if (!isCanonicalIsoTimestamp(row.updatedAt)) throw new Error("Invalid mutation receipt date");
  return row;
}

function receiptSnapshot(input: ProgressPutRequest, receipt: MutationReceiptRow): ProgressSnapshot {
  return {
    version: PROGRESS_VERSION,
    revision: receipt.revision as number,
    generation: input.generation,
    updatedAt: receipt.updatedAt as string,
    progress: input.progress,
  };
}

function declaredBodyTooLarge(request: Request): boolean | null {
  const value = request.headers.get("content-length");
  if (value === null) return false;
  if (!/^\d+$/.test(value)) return null;
  return Number(value) > MAX_PROGRESS_BODY_BYTES;
}

async function handlePut(request: Request, db: D1DatabaseLike, userId: string): Promise<Response> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!/^application\/json(?:\s*;|$)/i.test(contentType)) {
    return errorResponse("unsupported_media_type", "Use Content-Type: application/json.", 415);
  }

  const declaredSize = declaredBodyTooLarge(request);
  if (declaredSize === null) return errorResponse("invalid_request", "Content-Length must be a nonnegative integer.", 400);
  if (declaredSize) return errorResponse("payload_too_large", "Progress payload exceeds 64 KiB.", 413);

  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_PROGRESS_BODY_BYTES) {
    return errorResponse("payload_too_large", "Progress payload exceeds 64 KiB.", 413);
  }

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return errorResponse("invalid_json", "Request body must be valid JSON.", 400);
  }
  const input = parseProgressPutRequest(json);
  if (!input) return errorResponse("invalid_progress", "Progress payload has invalid or unexpected fields.", 400);

  const progressJson = JSON.stringify(input.progress);
  const payloadHash = await progressPayloadHash(input.generation, progressJson);
  const existingReceipt = await readMutationReceipt(db, userId, input.mutationId);
  if (existingReceipt) {
    if (existingReceipt.payloadHash !== payloadHash) {
      return errorResponse("mutation_id_reused", "This mutation ID was already used for different progress.", 409);
    }
    return jsonResponse(receiptSnapshot(input, existingReceipt));
  }

  const before = await readStoredProgress(db, userId);
  if (before.lastMutationId === input.mutationId) {
    throw new Error("Accepted mutation is missing its receipt");
  }

  const updatedAt = new Date().toISOString();
  const write = input.baseRevision === 0
    ? db.prepare(insertProgressSql).bind(userId, input.generation, progressJson, input.mutationId, updatedAt)
    : db.prepare(updateProgressSql).bind(userId, input.baseRevision, input.generation, progressJson, input.mutationId, updatedAt);
  const receiptWrite = db.prepare(insertMutationReceiptSql).bind(userId, input.mutationId, payloadHash);
  await db.batch([write, receiptWrite]);

  const storedReceipt = await readMutationReceipt(db, userId, input.mutationId);
  if (storedReceipt) return jsonResponse(receiptSnapshot(input, storedReceipt));

  const current = await readStoredProgress(db, userId);
  return jsonResponse({
    error: "revision_conflict",
    message: "Progress changed after the supplied base revision.",
    current: current.snapshot,
  }, 409);
}

export async function handleProgressApiRequest(request: Request, env: ProgressApiEnv): Promise<Response> {
  const userId = authenticatedUserId(request);
  if (!userId) return errorResponse("authentication_required", "Sign in to synchronize progress.", 401);
  const owner = await ownerToken(userId);
  if (request.method !== "GET" && request.method !== "PUT") {
    return withOwnerToken(errorResponse("method_not_allowed", "Use GET or PUT for this endpoint.", 405, { Allow: "GET, PUT" }), owner);
  }
  if (request.method === "PUT" && request.headers.get("x-progress-owner") !== owner) {
    return withOwnerToken(errorResponse("owner_changed", "Refresh progress before writing to this account.", 409), owner);
  }
  if (!env.DB) return withOwnerToken(errorResponse("storage_unavailable", "Progress synchronization is temporarily unavailable.", 503), owner);

  try {
    if (request.method === "GET") {
      const stored = await readStoredProgress(env.DB, userId);
      return withOwnerToken(jsonResponse(stored.snapshot), owner);
    }
    return withOwnerToken(await handlePut(request, env.DB, userId), owner);
  } catch {
    return withOwnerToken(errorResponse("storage_error", "Progress synchronization could not be completed.", 500), owner);
  }
}
