import {
  INITIAL_PROGRESS_GENERATION,
  mergeProgress,
  type Progress,
  type ProgressPayload,
  type ProgressSnapshot,
  type RecordState,
} from "./progressData";

export type Reconciliation =
  | { kind: "ready"; local: ProgressPayload; needsUpload: boolean }
  | { kind: "conflict"; remote: ProgressSnapshot; reason: "competing-replacements" | "offline-edits-after-replacement" };

function recordEqual(left?: RecordState, right?: RecordState): boolean {
  return left?.completed === right?.completed
    && left?.strength === right?.strength
    && left?.attempts === right?.attempts
    && left?.correct === right?.correct
    && left?.nextReview === right?.nextReview
    && left?.lastStudied === right?.lastStudied;
}

export function progressEqual(left: Progress, right: Progress): boolean {
  const ids = new Set([...Object.keys(left), ...Object.keys(right)]);
  return [...ids].every((id) => recordEqual(left[id], right[id]));
}

export function payloadEqual(left: ProgressPayload, right: ProgressPayload): boolean {
  return left.generation === right.generation && progressEqual(left.progress, right.progress);
}

function latestTimestamp(left?: string, right?: string): string | undefined {
  if (!left) return right;
  if (!right) return left;
  return Date.parse(left) >= Date.parse(right) ? left : right;
}

function changedFrom(record: RecordState | undefined, baseline: RecordState | undefined): boolean {
  return !recordEqual(record, baseline);
}

function mergeConcurrentRecord(
  baseline: RecordState | undefined,
  local: RecordState | undefined,
  remote: RecordState | undefined,
): RecordState | undefined {
  const localChanged = changedFrom(local, baseline);
  const remoteChanged = changedFrom(remote, baseline);
  if (!localChanged) return remote;
  if (!remoteChanged) return local;
  if (recordEqual(local, remote)) return remote;
  if (!local) return remote;
  if (!remote) return local;

  const baseAttempts = baseline?.attempts ?? 0;
  const baseCorrect = baseline?.correct ?? 0;
  const attempts = baseAttempts
    + Math.max(0, local.attempts - baseAttempts)
    + Math.max(0, remote.attempts - baseAttempts);
  const correct = Math.min(
    attempts,
    baseCorrect
      + Math.max(0, local.correct - baseCorrect)
      + Math.max(0, remote.correct - baseCorrect),
  );
  const merged: RecordState = {
    strength: remote.strength,
    attempts,
    correct,
  };
  if (Boolean(local.completed) || Boolean(remote.completed)) merged.completed = true;
  if (remote.nextReview !== undefined) merged.nextReview = remote.nextReview;
  const lastStudied = latestTimestamp(local.lastStudied, remote.lastStudied);
  if (lastStudied) merged.lastStudied = lastStudied;
  return merged;
}

/**
 * Merge changes made from one acknowledged server baseline. Remote mastery
 * scheduling wins a same-lesson collision so one due review is never credited
 * twice; independent attempt/correct deltas are retained.
 */
export function mergeConcurrentProgress(baseline: Progress, local: Progress, remote: Progress): Progress {
  const result: Progress = {};
  const ids = new Set([...Object.keys(baseline), ...Object.keys(local), ...Object.keys(remote)]);
  for (const id of ids) {
    const record = mergeConcurrentRecord(baseline[id], local[id], remote[id]);
    if (record) result[id] = record;
  }
  return result;
}

function isEmpty(progress: Progress): boolean {
  return Object.keys(progress).length === 0;
}

/**
 * Reconcile device-local work against the latest server state. Generations are
 * equality-only replacement epochs; server revisions, not device clocks, order
 * accepted writes.
 */
export function reconcileWithServer(
  local: ProgressPayload,
  baseline: ProgressSnapshot | null,
  remote: ProgressSnapshot,
): Reconciliation {
  if (payloadEqual(local, remote)) return { kind: "ready", local, needsUpload: false };

  if (!baseline) {
    if (local.generation === remote.generation) {
      const progress = mergeProgress(remote.progress, local.progress);
      const merged = { generation: local.generation, progress };
      return { kind: "ready", local: merged, needsUpload: !payloadEqual(merged, remote) };
    }
    if (local.generation === INITIAL_PROGRESS_GENERATION && isEmpty(local.progress)) {
      return { kind: "ready", local: remote, needsUpload: false };
    }
    if (remote.generation === INITIAL_PROGRESS_GENERATION && isEmpty(remote.progress)) {
      return { kind: "ready", local, needsUpload: true };
    }
    return { kind: "conflict", remote, reason: "competing-replacements" };
  }

  const localOnBaseline = local.generation === baseline.generation;
  const remoteOnBaseline = remote.generation === baseline.generation;

  if (local.generation === remote.generation) {
    if (!localOnBaseline) {
      return { kind: "conflict", remote, reason: "competing-replacements" };
    }
    const baseProgress = baseline.progress;
    const progress = mergeConcurrentProgress(baseProgress, local.progress, remote.progress);
    const merged = { generation: local.generation, progress };
    return { kind: "ready", local: merged, needsUpload: !payloadEqual(merged, remote) };
  }

  if (localOnBaseline && !remoteOnBaseline) {
    if (payloadEqual(local, baseline)) return { kind: "ready", local: remote, needsUpload: false };
    return { kind: "conflict", remote, reason: "offline-edits-after-replacement" };
  }

  if (!localOnBaseline && remoteOnBaseline) {
    if (remote.revision === baseline.revision && payloadEqual(remote, baseline)) {
      return { kind: "ready", local, needsUpload: true };
    }
    return { kind: "conflict", remote, reason: "offline-edits-after-replacement" };
  }

  return { kind: "conflict", remote, reason: "competing-replacements" };
}
