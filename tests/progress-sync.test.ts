import assert from "node:assert/strict";
import test from "node:test";
import { INITIAL_PROGRESS_GENERATION, type ProgressSnapshot, type RecordState } from "../app/progressData";
import { mergeConcurrentProgress, reconcileWithServer } from "../app/progressSync";

const first = "2026-08-17T10:00:00.000Z";
const later = "2026-08-18T10:00:00.000Z";
const baseRecord: RecordState = { strength: 1, attempts: 2, correct: 1, nextReview: later, lastStudied: first };

function snapshot(overrides: Partial<ProgressSnapshot> = {}): ProgressSnapshot {
  return {
    version: 1,
    revision: 4,
    generation: INITIAL_PROGRESS_GENERATION,
    updatedAt: later,
    progress: { "fnd-01": baseRecord },
    ...overrides,
  };
}

test("three-way merge retains independent lesson edits", () => {
  const baseline = snapshot();
  const local = {
    generation: baseline.generation,
    progress: { ...baseline.progress, "fnd-02": { strength: 0, attempts: 1, correct: 1, lastStudied: later } },
  };
  const remote = snapshot({
    revision: 5,
    progress: { ...baseline.progress, "a1-01": { strength: 0, attempts: 1, correct: 0, lastStudied: later } },
  });
  const result = reconcileWithServer(local, baseline, remote);
  assert.equal(result.kind, "ready");
  if (result.kind === "ready") {
    assert.equal(result.needsUpload, true);
    assert.deepEqual(Object.keys(result.local.progress).sort(), ["a1-01", "fnd-01", "fnd-02"]);
  }
});

test("same-lesson collision combines counters without double mastery credit", () => {
  const localRecord = { ...baseRecord, strength: 2, attempts: 3, correct: 2, nextReview: "2026-08-21T10:00:00.000Z", lastStudied: later };
  const remoteRecord = { ...baseRecord, strength: 0, attempts: 3, correct: 1, nextReview: "2026-08-19T10:00:00.000Z", lastStudied: later };
  const merged = mergeConcurrentProgress(
    { "fnd-01": baseRecord },
    { "fnd-01": localRecord },
    { "fnd-01": remoteRecord },
  )["fnd-01"];
  assert.equal(merged.attempts, 4);
  assert.equal(merged.correct, 2);
  assert.equal(merged.strength, remoteRecord.strength);
  assert.equal(merged.nextReview, remoteRecord.nextReview);
});

test("remote replacement is adopted only when the device has no offline edit", () => {
  const baseline = snapshot();
  const replacement = snapshot({ revision: 5, generation: later, progress: {} });
  const clean = reconcileWithServer({ generation: baseline.generation, progress: baseline.progress }, baseline, replacement);
  assert.equal(clean.kind, "ready");
  if (clean.kind === "ready") assert.deepEqual(clean.local.progress, {});

  const edited = reconcileWithServer({
    generation: baseline.generation,
    progress: { "fnd-01": { ...baseRecord, attempts: 3, lastStudied: later } },
  }, baseline, replacement);
  assert.equal(edited.kind, "conflict");
});

test("revision, not clock ordering, authorizes a local replacement", () => {
  const baseline = snapshot({ generation: "2026-08-18T12:00:00.000Z" });
  const local = { generation: "2026-08-18T11:00:00.000Z", progress: {} };
  const unchangedRemote = snapshot({
    revision: baseline.revision,
    generation: baseline.generation,
    progress: baseline.progress,
  });
  const result = reconcileWithServer(local, baseline, unchangedRemote);
  assert.equal(result.kind, "ready");
  if (result.kind === "ready") assert.equal(result.needsUpload, true);
});

test("does not double an imported history without its replacement seed", () => {
  const baseline = snapshot();
  const importedGeneration = "2026-08-18T11:00:00.000Z";
  const imported = { strength: 1, attempts: 5, correct: 4, lastStudied: first };
  const local = {
    generation: importedGeneration,
    progress: { "fnd-01": { ...imported, attempts: 6, correct: 5, lastStudied: later } },
  };
  const remote = snapshot({
    revision: 5,
    generation: importedGeneration,
    progress: { "fnd-01": imported },
  });
  const result = reconcileWithServer(local, baseline, remote);
  assert.equal(result.kind, "conflict");
});
