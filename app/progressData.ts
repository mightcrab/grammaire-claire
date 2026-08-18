import { lessons } from "./courseData";

export const PROGRESS_VERSION = 1 as const;
export const INITIAL_PROGRESS_GENERATION = "1970-01-01T00:00:00.000Z";

export type RecordState = {
  completed?: boolean;
  strength: number;
  attempts: number;
  correct: number;
  nextReview?: string;
  lastStudied?: string;
};

export type Progress = Record<string, RecordState>;

export type ProgressPayload = {
  progress: Progress;
  generation: string;
};

export type ProgressSnapshot = ProgressPayload & {
  version: typeof PROGRESS_VERSION;
  revision: number;
  updatedAt: string | null;
};

export type ProgressPutRequest = ProgressPayload & {
  version: typeof PROGRESS_VERSION;
  baseRevision: number;
  mutationId: string;
};

const lessonIds = new Set(lessons.map((lesson) => lesson.id));
const recordKeys = new Set(["completed", "strength", "attempts", "correct", "nextReview", "lastStudied"]);
const payloadKeys = new Set(["version", "progress", "generation", "updatedAt", "exportedAt"]);
const putRequestKeys = new Set(["version", "baseRevision", "mutationId", "generation", "progress"]);
const snapshotKeys = new Set(["version", "revision", "generation", "updatedAt", "progress"]);

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, allowed: ReadonlySet<string>): boolean {
  return Object.keys(value).every((key) => allowed.has(key));
}

function hasOwn(value: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function isRevision(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0;
}

export function isCanonicalIsoTimestamp(value: unknown): value is string {
  return typeof value === "string"
    && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)
    && Number.isFinite(Date.parse(value))
    && new Date(value).toISOString() === value;
}

export function isMutationId(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/.test(value);
}

export function validateProgress(value: unknown): Progress | null {
  if (!isObject(value)) return null;

  const result: Progress = {};
  for (const [id, raw] of Object.entries(value)) {
    if (!lessonIds.has(id) || !isObject(raw) || !hasOnlyKeys(raw, recordKeys)) return null;
    if (!hasOwn(raw, "strength") || !Number.isSafeInteger(raw.strength) || (raw.strength as number) < 0 || (raw.strength as number) > 7) return null;
    if (!hasOwn(raw, "attempts") || !Number.isSafeInteger(raw.attempts) || (raw.attempts as number) < 0) return null;
    if (!hasOwn(raw, "correct") || !Number.isSafeInteger(raw.correct) || (raw.correct as number) < 0 || (raw.correct as number) > (raw.attempts as number)) return null;
    if (raw.completed !== undefined && typeof raw.completed !== "boolean") return null;
    if (raw.nextReview !== undefined && !isCanonicalIsoTimestamp(raw.nextReview)) return null;
    if (raw.lastStudied !== undefined && !isCanonicalIsoTimestamp(raw.lastStudied)) return null;

    const record: RecordState = {
      strength: raw.strength as number,
      attempts: raw.attempts as number,
      correct: raw.correct as number,
    };
    if (raw.completed !== undefined) record.completed = raw.completed;
    if (raw.nextReview !== undefined) record.nextReview = raw.nextReview;
    if (raw.lastStudied !== undefined) record.lastStudied = raw.lastStudied;
    result[id] = record;
  }
  return result;
}

/** Parse the versioned device-storage or exported-backup shape. */
export function parseProgressPayload(value: unknown): ProgressPayload | null {
  if (!isObject(value) || !hasOnlyKeys(value, payloadKeys)) return null;
  if (value.version !== PROGRESS_VERSION || !hasOwn(value, "progress")) return null;
  if (value.generation !== undefined && !isCanonicalIsoTimestamp(value.generation)) return null;
  if (value.updatedAt !== undefined && !isCanonicalIsoTimestamp(value.updatedAt)) return null;
  if (value.exportedAt !== undefined && !isCanonicalIsoTimestamp(value.exportedAt)) return null;
  const progress = validateProgress(value.progress);
  return progress ? { progress, generation: value.generation ?? INITIAL_PROGRESS_GENERATION } : null;
}

export function parseProgressPutRequest(value: unknown): ProgressPutRequest | null {
  if (!isObject(value) || !hasOnlyKeys(value, putRequestKeys)) return null;
  if (value.version !== PROGRESS_VERSION || !isRevision(value.baseRevision)) return null;
  if (!isMutationId(value.mutationId) || !isCanonicalIsoTimestamp(value.generation)) return null;
  const progress = validateProgress(value.progress);
  return progress ? {
    version: PROGRESS_VERSION,
    baseRevision: value.baseRevision,
    mutationId: value.mutationId,
    generation: value.generation,
    progress,
  } : null;
}

export function parseProgressSnapshot(value: unknown): ProgressSnapshot | null {
  if (!isObject(value) || !hasOnlyKeys(value, snapshotKeys)) return null;
  if (value.version !== PROGRESS_VERSION || !isRevision(value.revision)) return null;
  if (!isCanonicalIsoTimestamp(value.generation)) return null;
  if (value.updatedAt !== null && !isCanonicalIsoTimestamp(value.updatedAt)) return null;
  const progress = validateProgress(value.progress);
  if (!progress) return null;
  if (value.revision === 0 && (value.updatedAt !== null || value.generation !== INITIAL_PROGRESS_GENERATION || Object.keys(progress).length > 0)) return null;
  if (value.revision > 0 && value.updatedAt === null) return null;
  return {
    version: PROGRESS_VERSION,
    revision: value.revision,
    generation: value.generation,
    updatedAt: value.updatedAt,
    progress,
  };
}

export function mergeProgress(current: Progress, incoming: Progress): Progress {
  let changed = false;
  const merged = { ...current };
  for (const [id, next] of Object.entries(incoming)) {
    const previous = current[id];
    const previousTime = previous?.lastStudied ? Date.parse(previous.lastStudied) : -1;
    const nextTime = next.lastStudied ? Date.parse(next.lastStudied) : -1;
    if (!previous || nextTime > previousTime || (nextTime === previousTime && next.attempts > previous.attempts)) {
      merged[id] = next;
      changed = true;
    }
  }
  return changed ? merged : current;
}

export function reconcileProgress(current: ProgressPayload, incoming: ProgressPayload): ProgressPayload {
  // A generation is an epoch token, not a timestamp ordering primitive. When
  // epochs differ, the caller-provided incoming state is authoritative.
  if (incoming.generation !== current.generation) return incoming;
  const progress = mergeProgress(current.progress, incoming.progress);
  return progress === current.progress ? current : { generation: current.generation, progress };
}

export function nextProgressGeneration(current: string, now = new Date()): string {
  if (!isCanonicalIsoTimestamp(current)) throw new TypeError("Current generation must be a canonical ISO timestamp.");
  const nowValue = now.toISOString();
  if (!isCanonicalIsoTimestamp(nowValue)) throw new RangeError("Generation date is outside the supported range.");
  if (nowValue > current) return nowValue;
  const next = new Date(Date.parse(current) + 1).toISOString();
  if (!isCanonicalIsoTimestamp(next)) throw new RangeError("Generation date is outside the supported range.");
  return next;
}
