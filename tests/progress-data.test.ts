import assert from "node:assert/strict";
import test from "node:test";
import {
  INITIAL_PROGRESS_GENERATION,
  mergeProgress,
  nextProgressGeneration,
  parseProgressPutRequest,
  reconcileProgress,
  validateProgress,
} from "../app/progressData";

const firstStudy = "2026-08-17T10:00:00.000Z";
const laterStudy = "2026-08-18T10:00:00.000Z";
const validRecord = { strength: 1, attempts: 2, correct: 1, lastStudied: firstStudy };

test("strictly validates progress records and the PUT envelope", () => {
  assert.deepEqual(validateProgress({ "fnd-01": validRecord }), { "fnd-01": validRecord });
  assert.equal(validateProgress({ "not-a-lesson": validRecord }), null);
  assert.equal(validateProgress({ "fnd-01": { ...validRecord, extra: true } }), null);
  assert.equal(validateProgress({ "fnd-01": { ...validRecord, correct: 3 } }), null);

  const parsed = parseProgressPutRequest({
    version: 1,
    baseRevision: 0,
    mutationId: "b83d209b-74ae-44db-80d9-6916d0d820b2",
    generation: INITIAL_PROGRESS_GENERATION,
    progress: { "fnd-01": validRecord },
  });
  assert.equal(parsed?.baseRevision, 0);
  assert.equal(parseProgressPutRequest({ ...parsed, unexpected: true }), null);
  assert.equal(parseProgressPutRequest({ ...parsed, mutationId: "short" }), null);
});

test("merges records by study time and treats generations as epoch tokens", () => {
  const current = { "fnd-01": validRecord };
  const incoming = {
    "fnd-01": { ...validRecord, attempts: 3, correct: 2 },
    "fnd-02": { strength: 0, attempts: 1, correct: 1, lastStudied: laterStudy },
  };
  assert.deepEqual(mergeProgress(current, incoming), incoming);

  const reset = reconcileProgress(
    { generation: laterStudy, progress: current },
    { generation: INITIAL_PROGRESS_GENERATION, progress: {} },
  );
  assert.deepEqual(reset, { generation: INITIAL_PROGRESS_GENERATION, progress: {} });
});

test("creates a generation strictly newer than the current one", () => {
  assert.equal(
    nextProgressGeneration("2026-08-18T10:00:00.000Z", new Date("2026-08-18T09:00:00.000Z")),
    "2026-08-18T10:00:00.001Z",
  );
});
