"use client";

import { useEffect, useRef, useState } from "react";
import {
  INITIAL_PROGRESS_GENERATION,
  PROGRESS_VERSION,
  isCanonicalIsoTimestamp,
  nextProgressGeneration,
  parseProgressPayload,
  parseProgressPutRequest,
  parseProgressSnapshot,
  validateProgress,
  type Progress,
  type ProgressPayload,
  type ProgressPutRequest,
  type ProgressSnapshot,
} from "./progressData";
import { payloadEqual, reconcileWithServer, type Reconciliation } from "./progressSync";

export type SyncStatus = "loading" | "syncing" | "synced" | "offline" | "sign-in" | "error" | "conflict";

export type ProgressConflict = {
  remote: ProgressSnapshot;
  reason: Extract<Reconciliation, { kind: "conflict" }>["reason"] | "legacy-unowned";
};

type PendingRetry = { kind: "saved" | "conflict"; snapshot: ProgressSnapshot };

const legacyStorageKey = "grammaire-claire-progress-v1";
const legacyGenerationKey = "grammaire-claire-progress-generation-v1";
const progressKey = "grammaire-claire-progress-user-v1";
const generationKey = "grammaire-claire-progress-generation-user-v1";
const baselineKey = "grammaire-claire-progress-baseline-v1";
const pendingKey = "grammaire-claire-progress-pending-v1";
const localEventKey = "grammaire-claire-progress-event-v1";
const conflictDraftKey = "grammaire-claire-progress-conflict-draft-v1";
type LocalIntent = "update" | "replace" | "server";

function isOwnerToken(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

function scopedKey(base: string, owner: string): string {
  return `${base}:${owner}`;
}

function localPayloadFromStorage(owner: string | null): { payload: ProgressPayload; exists: boolean } {
  let payload: ProgressPayload | null = null;
  try {
    const storageKey = owner ? scopedKey(progressKey, owner) : legacyStorageKey;
    const localGenerationKey = owner ? scopedKey(generationKey, owner) : legacyGenerationKey;
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const json: unknown = JSON.parse(raw);
      payload = parseProgressPayload(json);
      if (!payload) {
        const legacy = validateProgress(json);
        if (legacy) payload = { generation: INITIAL_PROGRESS_GENERATION, progress: legacy };
      }
    }
    const storedGeneration = localStorage.getItem(localGenerationKey);
    if (isCanonicalIsoTimestamp(storedGeneration) && (!payload || storedGeneration > payload.generation)) {
      return { payload: { generation: storedGeneration, progress: {} }, exists: true };
    }
  } catch {
    // A damaged or unavailable device cache must not block the course.
  }
  return {
    payload: payload ?? { generation: INITIAL_PROGRESS_GENERATION, progress: {} },
    exists: payload !== null,
  };
}

function readBaseline(owner: string | null): ProgressSnapshot | null {
  if (!owner) return null;
  try {
    const raw = localStorage.getItem(scopedKey(baselineKey, owner));
    return raw ? parseProgressSnapshot(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

function readPending(owner: string | null): ProgressPutRequest | null {
  if (!owner) return null;
  try {
    const prefix = `${scopedKey(pendingKey, owner)}:`;
    const keys: string[] = [];
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key?.startsWith(prefix)) keys.push(key);
    }
    keys.sort();
    for (const key of keys) {
      const raw = localStorage.getItem(key);
      const parsed = raw ? parseProgressPutRequest(JSON.parse(raw)) : null;
      if (parsed) return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function readPendingMutationIds(owner: string | null): string[] {
  if (!owner) return [];
  try {
    const prefix = `${scopedKey(pendingKey, owner)}:`;
    const ids: string[] = [];
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key?.startsWith(prefix)) continue;
      const raw = localStorage.getItem(key);
      const parsed = raw ? parseProgressPutRequest(JSON.parse(raw)) : null;
      if (parsed) ids.push(parsed.mutationId);
    }
    return ids.sort();
  } catch {
    return [];
  }
}

function readConflictDraft(owner: string | null): ProgressPayload | null {
  if (!owner) return null;
  try {
    const raw = localStorage.getItem(scopedKey(conflictDraftKey, owner));
    return raw ? parseProgressPayload(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

function createMutationId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `mutation-${Date.now()}-${Math.random().toString(36).slice(2, 14)}`;
}

function retryDelay(retryCount: number): number {
  const jitter = 0.8 + Math.random() * 0.4;
  return Math.round(Math.min(60_000, 1_000 * 2 ** Math.min(retryCount, 6)) * jitter);
}

function conflictSnapshot(value: unknown): ProgressSnapshot | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return parseProgressSnapshot((value as { current?: unknown }).current);
}

function responseOwner(response: Response): string | null {
  const owner = response.headers.get("x-progress-owner");
  return isOwnerToken(owner) ? owner : null;
}

function parseLocalEvent(value: unknown, owner: string): { generation: string; intent: LocalIntent } | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const event = value as { version?: unknown; owner?: unknown; generation?: unknown; intent?: unknown; operationId?: unknown };
  if (event.version !== 1 || event.owner !== owner || !isCanonicalIsoTimestamp(event.generation)) return null;
  if (event.intent !== "update" && event.intent !== "replace" && event.intent !== "server") return null;
  if (typeof event.operationId !== "string" || event.operationId.length < 8 || event.operationId.length > 128) return null;
  return { generation: event.generation, intent: event.intent };
}

export function syncStatusLabel(status: SyncStatus): string {
  const labels: Record<SyncStatus, string> = {
    loading: "Loading saved progress…",
    syncing: "Syncing…",
    synced: "Synced across devices",
    offline: "Offline — saved locally",
    "sign-in": "Sign in to sync",
    error: "Sync unavailable — saved locally",
    conflict: "Sync choice needed",
  };
  return labels[status];
}

export function useProgressSync() {
  const [progress, setProgress] = useState<Progress>({});
  const [generation, setGeneration] = useState(INITIAL_PROGRESS_GENERATION);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<SyncStatus>("loading");
  const [conflict, setConflict] = useState<ProgressConflict | null>(null);

  const progressRef = useRef<Progress>({});
  const generationRef = useRef(INITIAL_PROGRESS_GENERATION);
  const ownerRef = useRef<string | null>(null);
  const ownerConfirmedRef = useRef(false);
  const unownedLegacyRef = useRef(false);
  const baselineRef = useRef<ProgressSnapshot | null>(null);
  const pendingRef = useRef<ProgressPutRequest | null>(null);
  const mutationSequenceRef = useRef(0);
  const readyRef = useRef(false);
  const mountedRef = useRef(true);
  const activeRef = useRef(false);
  const rerunRef = useRef(false);
  const rerunDelayRef = useRef<number | null>(null);
  const pausedRef = useRef(false);
  const retryCountRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const conflictResolutionRef = useRef(false);
  const requestSyncRef = useRef<(delay?: number) => void>(() => undefined);
  const localMutationTailRef = useRef<Promise<void>>(Promise.resolve());

  function currentPayload(): ProgressPayload {
    return { generation: generationRef.current, progress: progressRef.current };
  }

  function persistLocal(payload: ProgressPayload, intent: LocalIntent) {
    try {
      const owner = !unownedLegacyRef.current && ownerConfirmedRef.current ? ownerRef.current : null;
      if (!owner) unownedLegacyRef.current = true;
      const localGenerationKey = owner ? scopedKey(generationKey, owner) : legacyGenerationKey;
      const storageKey = owner ? scopedKey(progressKey, owner) : legacyStorageKey;
      localStorage.setItem(localGenerationKey, payload.generation);
      localStorage.setItem(storageKey, JSON.stringify({
        version: PROGRESS_VERSION,
        generation: payload.generation,
        updatedAt: new Date().toISOString(),
        progress: payload.progress,
      }));
      if (owner && ownerConfirmedRef.current) {
        localStorage.setItem(scopedKey(localEventKey, owner), JSON.stringify({
          version: 1,
          owner,
          generation: payload.generation,
          intent,
          operationId: createMutationId(),
        }));
      }
    } catch {
      // The in-memory course remains usable when browser storage is unavailable.
    }
  }

  function saveBaseline(snapshot: ProgressSnapshot) {
    const owner = ownerRef.current;
    if (!owner || !ownerConfirmedRef.current) return;
    const shared = readBaseline(owner);
    if (shared && shared.revision > snapshot.revision) {
      baselineRef.current = shared;
      rerunRef.current = true;
      rerunDelayRef.current = 0;
      return;
    }
    baselineRef.current = snapshot;
    try { localStorage.setItem(scopedKey(baselineKey, owner), JSON.stringify(snapshot)); } catch { /* Keep the in-memory baseline. */ }
  }

  function savePending(request: ProgressPutRequest | null) {
    const owner = ownerRef.current;
    if (!owner || !ownerConfirmedRef.current) return;
    const previous = pendingRef.current;
    try {
      if (request) {
        localStorage.setItem(`${scopedKey(pendingKey, owner)}:${request.mutationId}`, JSON.stringify(request));
      } else if (previous) {
        localStorage.removeItem(`${scopedKey(pendingKey, owner)}:${previous.mutationId}`);
      }
    } catch { /* Retain the in-memory request for this session. */ }
    pendingRef.current = request ?? readPending(owner);
    if (!request && pendingRef.current) {
      rerunRef.current = true;
      rerunDelayRef.current = 0;
    }
  }

  function applyPayload(payload: ProgressPayload, markMutation: boolean, persist = true, intent: LocalIntent = markMutation ? "update" : "server") {
    progressRef.current = payload.progress;
    generationRef.current = payload.generation;
    setProgress(payload.progress);
    setGeneration(payload.generation);
    if (persist) persistLocal(payload, intent);
    if (markMutation) mutationSequenceRef.current += 1;
  }

  async function withLocalMutationLock<T>(task: () => T | Promise<T>, lockOwner = ownerRef.current ?? "unowned"): Promise<T> {
    const run = async () => {
      if (typeof navigator !== "undefined" && navigator.locks) {
        return navigator.locks.request(`grammaire-claire-progress:${lockOwner}`, async () => task());
      }
      return task();
    };
    const operation = localMutationTailRef.current.then(run, run);
    localMutationTailRef.current = operation.then(() => undefined, () => undefined);
    return operation;
  }

  function queueLocalMutation(task: () => void | Promise<void>) {
    void withLocalMutationLock(task);
  }

  function persistConflictDraft(payload: ProgressPayload | null) {
    const owner = ownerRef.current;
    if (!owner) return;
    try {
      const key = scopedKey(conflictDraftKey, owner);
      if (payload) {
        localStorage.setItem(key, JSON.stringify({ version: PROGRESS_VERSION, generation: payload.generation, progress: payload.progress }));
      } else {
        localStorage.removeItem(key);
      }
    } catch { /* Keep the draft in memory if browser storage is unavailable. */ }
  }

  async function confirmOwner(owner: string, remote: ProgressSnapshot): Promise<boolean> {
    return withLocalMutationLock(() => {
    const previousOwner = ownerRef.current;
    if (previousOwner === owner && ownerConfirmedRef.current) return true;

    ownerRef.current = owner;
    ownerConfirmedRef.current = true;

    if (previousOwner === owner) {
      if (unownedLegacyRef.current) {
        pausedRef.current = true;
        setConflict({ remote, reason: "legacy-unowned" });
        persistConflictDraft(currentPayload());
        setStatus("conflict");
        return false;
      }
      baselineRef.current = readBaseline(owner);
      pendingRef.current = readPending(owner);
      return true;
    }

    const target = localPayloadFromStorage(owner);
    if (unownedLegacyRef.current) {
      pausedRef.current = true;
      setConflict({ remote, reason: "legacy-unowned" });
      persistConflictDraft(currentPayload());
      setStatus("conflict");
      return false;
    }

    const draft = readConflictDraft(owner);
    if (draft) {
      baselineRef.current = readBaseline(owner);
      pendingRef.current = readPending(owner);
      applyPayload(draft, false, false);
      pausedRef.current = true;
      setConflict({ remote, reason: "competing-replacements" });
      setStatus("conflict");
      return false;
    }

    unownedLegacyRef.current = false;
    pendingRef.current = readPending(owner);
    if (target.exists) {
      baselineRef.current = readBaseline(owner);
      applyPayload(target.payload, false);
    } else {
      pendingRef.current = null;
      applyPayload(remote, false);
      saveBaseline(remote);
    }
    setConflict(null);
    pausedRef.current = false;
    return true;
    }, owner);
  }

  function requestSync(delay = 350) {
    if (!readyRef.current || pausedRef.current || !mountedRef.current) return;
    if (activeRef.current) {
      rerunRef.current = true;
      rerunDelayRef.current = rerunDelayRef.current === null ? delay : Math.min(rerunDelayRef.current, delay);
      return;
    }
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      void synchronize();
    }, delay);
  }
  function scheduleRetry() {
    const delay = retryDelay(retryCountRef.current);
    retryCountRef.current += 1;
    requestSync(delay);
  }

  async function readJson(response: Response): Promise<unknown> {
    try { return await response.json(); } catch { return null; }
  }

  async function sendPut(input: ProgressPutRequest, signal: AbortSignal): Promise<Response> {
    if (!ownerRef.current || !ownerConfirmedRef.current) throw new Error("Progress owner is not confirmed.");
    const response = await fetch("/api/progress", {
      method: "PUT",
      credentials: "same-origin",
      cache: "no-store",
      headers: { "Content-Type": "application/json", "X-Progress-Owner": ownerRef.current },
      body: JSON.stringify(input),
      signal,
    });
    if (response.status !== 401 && response.status !== 403 && responseOwner(response) !== ownerRef.current) {
      throw new Error("Progress owner changed during synchronization.");
    }
    return response;
  }

  function handleUnavailable(response: Response) {
    if (response.status === 401 || response.status === 403) {
      setStatus("sign-in");
      return;
    }
    setStatus("error");
    if (response.status >= 500 || response.status === 429) scheduleRetry();
  }

  function refreshOwnerScopedState(remote: ProgressSnapshot, baseline: ProgressSnapshot | null) {
    const owner = ownerRef.current;
    if (!owner || !ownerConfirmedRef.current) return { remote, baseline };

    const sharedBaseline = readBaseline(owner);
    let latestRemote = remote;
    let latestBaseline = baseline;
    for (const candidate of [baselineRef.current, sharedBaseline]) {
      if (!candidate) continue;
      if (!latestBaseline || candidate.revision > latestBaseline.revision) latestBaseline = candidate;
      if (candidate.revision > latestRemote.revision) latestRemote = candidate;
    }
    baselineRef.current = latestBaseline;

    const shared = localPayloadFromStorage(owner);
    if (shared.exists && !payloadEqual(shared.payload, currentPayload())) {
      // This exact payload was committed under the same cross-tab lock. Adopt
      // it rather than merging it as a second copy of the same user action.
      applyPayload(shared.payload, true, false);
    }
    pendingRef.current = readPending(owner);
    return { remote: latestRemote, baseline: latestBaseline };
  }

  async function retryPending(signal: AbortSignal): Promise<PendingRetry | "stop" | null> {
    const pending = await withLocalMutationLock(() => {
      const owner = ownerRef.current;
      const shared = localPayloadFromStorage(owner);
      if (shared.exists && !payloadEqual(shared.payload, currentPayload())) {
        applyPayload(shared.payload, true, false);
      }
      pendingRef.current = readPending(owner);
      while (pendingRef.current && pendingRef.current.generation !== generationRef.current) {
        // A reset/import or explicit conflict choice supersedes outbox entries
        // from an older replacement epoch. Remove only that exact request;
        // unrelated same-epoch work from another tab remains queued.
        const staleId = pendingRef.current.mutationId;
        savePending(null);
        if (pendingRef.current?.mutationId === staleId) {
          pendingRef.current = null;
          break;
        }
      }
      return pendingRef.current;
    });
    if (!pending) return null;
    const response = await sendPut(pending, signal);
    const json = await readJson(response);
    if (response.ok) {
      const snapshot = parseProgressSnapshot(json);
      if (!snapshot) {
        setStatus("error");
        return "stop";
      }
      await withLocalMutationLock(() => {
        savePending(null);
        saveBaseline(snapshot);
      });
      return { kind: "saved", snapshot };
    }
    if (response.status === 409) {
      const remote = conflictSnapshot(json);
      if (!remote) {
        setStatus("error");
        return "stop";
      }
      await withLocalMutationLock(() => savePending(null));
      return { kind: "conflict", snapshot: remote };
    }
    handleUnavailable(response);
    return "stop";
  }

  function pauseForConflict(result: Extract<Reconciliation, { kind: "conflict" }>) {
    pausedRef.current = true;
    setConflict({ remote: result.remote, reason: result.reason });
    persistConflictDraft(currentPayload());
    setStatus("conflict");
  }

  function reconcileSharedSnapshot(shared: ProgressSnapshot) {
    if (pausedRef.current) return;
    const previousBaseline = baselineRef.current;
    const result = reconcileWithServer(currentPayload(), previousBaseline, shared);
    if (result.kind === "conflict") {
      pauseForConflict(result);
      return;
    }
    baselineRef.current = shared;
    if (!payloadEqual(result.local, currentPayload())) {
      applyPayload(result.local, result.needsUpload, result.needsUpload);
    }
    if (result.needsUpload) {
      setStatus("syncing");
      requestSyncRef.current(0);
    } else {
      setStatus("synced");
    }
  }

  async function reconcileAndUpload(
    firstRemote: ProgressSnapshot,
    firstBaseline: ProgressSnapshot | null,
    signal: AbortSignal,
  ) {
    let remote = firstRemote;
    let baseline = firstBaseline;

    for (let collision = 0; collision < 3; collision += 1) {
      let candidate: ProgressPayload | null = null;
      let sentSequence = 0;
      let input: ProgressPutRequest | null = null;
      const shouldSend = await withLocalMutationLock(() => {
        const refreshed = refreshOwnerScopedState(remote, baseline);
        remote = refreshed.remote;
        baseline = refreshed.baseline;
        const result = reconcileWithServer(currentPayload(), baseline, remote);
        if (result.kind === "conflict") {
          pauseForConflict(result);
          return false;
        }
        if (!result.needsUpload) {
          if (!payloadEqual(result.local, currentPayload())) applyPayload(result.local, false);
          saveBaseline(remote);
          retryCountRef.current = 0;
          setStatus("synced");
          return false;
        }
        if (!payloadEqual(result.local, currentPayload())) applyPayload(result.local, true);
        if (pendingRef.current) {
          rerunRef.current = true;
          rerunDelayRef.current = 0;
          return false;
        }

        saveBaseline(remote);
        candidate = currentPayload();
        sentSequence = mutationSequenceRef.current;
        input = {
          version: PROGRESS_VERSION,
          baseRevision: remote.revision,
          mutationId: createMutationId(),
          generation: candidate.generation,
          progress: candidate.progress,
        };
        savePending(input);
        return true;
      });
      if (!shouldSend || !candidate || !input) return;

      const response = await sendPut(input, signal);
      const json = await readJson(response);
      if (response.ok) {
        const saved = parseProgressSnapshot(json);
        if (!saved) {
          setStatus("error");
          return;
        }
        await withLocalMutationLock(() => {
          savePending(null);
          retryCountRef.current = 0;

          const owner = ownerRef.current;
          const sharedBaseline = readBaseline(owner);
          const shared = owner ? localPayloadFromStorage(owner) : { payload: currentPayload(), exists: false };
          const baselineAdvanced = Boolean(sharedBaseline && sharedBaseline.revision > saved.revision);
          if (baselineAdvanced) {
            baselineRef.current = sharedBaseline;
          } else {
            saveBaseline(saved);
          }

          const cacheStillCandidate = !shared.exists || payloadEqual(shared.payload, candidate!);
          const tabStillCandidate = sentSequence === mutationSequenceRef.current && payloadEqual(candidate!, currentPayload());
          if (!baselineAdvanced && cacheStillCandidate && tabStillCandidate) {
            applyPayload(saved, false);
            setStatus("synced");
            return;
          }

          if (shared.exists && !payloadEqual(shared.payload, currentPayload())) {
            // Another tab moved the shared state while this request was in
            // flight. Adopt that exact state and sync only its remaining delta.
            applyPayload(shared.payload, true, false);
          }
          const acknowledged = baselineRef.current;
          if (acknowledged && payloadEqual(currentPayload(), acknowledged)) {
            setStatus("synced");
          } else {
            setStatus("syncing");
            rerunRef.current = true;
            rerunDelayRef.current = 0;
          }
        });
        return;
      }
      if (response.status !== 409) {
        handleUnavailable(response);
        return;
      }
      const conflicted = conflictSnapshot(json);
      if (!conflicted) {
        setStatus("error");
        return;
      }
      await withLocalMutationLock(() => {
        savePending(null);
        const refreshed = refreshOwnerScopedState(conflicted, remote);
        remote = refreshed.remote;
        baseline = refreshed.baseline;
      });
    }

    setStatus("error");
    scheduleRetry();
  }

  async function synchronize() {
    if (!readyRef.current || pausedRef.current || activeRef.current || !mountedRef.current) return;
    activeRef.current = true;
    rerunRef.current = false;
    rerunDelayRef.current = null;
    setStatus("syncing");
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const response = await fetch("/api/progress", {
        credentials: "same-origin",
        cache: "no-store",
        signal: controller.signal,
      });
      if (!response.ok) {
        handleUnavailable(response);
        return;
      }
      const owner = responseOwner(response);
      if (!owner) {
        setStatus("error");
        return;
      }
      const remote = parseProgressSnapshot(await readJson(response));
      if (!remote) {
        setStatus("error");
        return;
      }
      if (!await confirmOwner(owner, remote)) return;

      const baselineBeforePending = baselineRef.current;
      const pendingRemote = await retryPending(controller.signal);
      if (pendingRemote === "stop") return;
      if (pendingRemote?.kind === "conflict") {
        await reconcileAndUpload(pendingRemote.snapshot, baselineBeforePending, controller.signal);
        return;
      }
      if (pendingRemote?.kind === "saved") {
        const latest = remote.revision > pendingRemote.snapshot.revision ? remote : pendingRemote.snapshot;
        await reconcileAndUpload(latest, pendingRemote.snapshot, controller.signal);
        return;
      }
      await reconcileAndUpload(remote, baselineRef.current, controller.signal);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setStatus(typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "error");
      scheduleRetry();
    } finally {
      activeRef.current = false;
      abortRef.current = null;
      if (rerunRef.current && !pausedRef.current) {
        const delay = rerunDelayRef.current ?? 0;
        rerunDelayRef.current = null;
        requestSync(delay);
      }
    }
  }

  useEffect(() => {
    mountedRef.current = true;
    requestSyncRef.current = requestSync;
    const hydrationTimer = window.setTimeout(() => {
      if (!mountedRef.current) return;
      // The platform identity is available only to the worker. Never open or
      // mutate a remembered account namespace until a fresh GET confirms it.
      // Work completed before confirmation stays in the unowned device draft.
      const local = localPayloadFromStorage(null);
      const meaningfulLegacy = local.exists
        && (local.payload.generation !== INITIAL_PROGRESS_GENERATION || Object.keys(local.payload.progress).length > 0);
      ownerRef.current = null;
      ownerConfirmedRef.current = false;
      unownedLegacyRef.current = meaningfulLegacy;
      progressRef.current = local.payload.progress;
      generationRef.current = local.payload.generation;
      baselineRef.current = null;
      pendingRef.current = null;
      setProgress(local.payload.progress);
      setGeneration(local.payload.generation);
      setReady(true);
      readyRef.current = true;
      requestSyncRef.current(0);
    }, 0);

    const onOnline = () => requestSyncRef.current(0);
    const onFocus = () => requestSyncRef.current(0);
    const onVisible = () => { if (document.visibilityState === "visible") requestSyncRef.current(0); };
    const onStorage = (event: StorageEvent) => {
      try {
        const owner = ownerRef.current;
        if (!owner) return;
        const currentBaselineKey = owner ? scopedKey(baselineKey, owner) : null;
        const currentProgressKey = unownedLegacyRef.current
          ? legacyStorageKey
          : owner ? scopedKey(progressKey, owner) : null;
        const pendingPrefix = `${scopedKey(pendingKey, owner)}:`;
        if (event.key?.startsWith(pendingPrefix)) {
          queueLocalMutation(() => {
            if (ownerRef.current !== owner || !ownerConfirmedRef.current) return;
            pendingRef.current = readPending(owner);
            if (event.newValue) requestSyncRef.current(0);
          });
          return;
        }
        if (event.key === scopedKey(localEventKey, owner)) {
          if (!event.newValue || pausedRef.current || unownedLegacyRef.current) return;
          const localEvent = parseLocalEvent(JSON.parse(event.newValue), owner);
          if (!localEvent || localEvent.intent === "server") return;
          queueLocalMutation(() => {
            if (ownerRef.current !== owner || pausedRef.current || unownedLegacyRef.current) return;
            const cached = localPayloadFromStorage(owner);
            if (!cached.exists || cached.payload.generation !== localEvent.generation) return;
            applyPayload(cached.payload, true, false);
            setStatus(typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "syncing");
            requestSyncRef.current(0);
          });
          return;
        }
        if (currentBaselineKey && event.key === currentBaselineKey) {
          if (!event.newValue) return;
          const sharedBaseline = parseProgressSnapshot(JSON.parse(event.newValue));
          if (!sharedBaseline) return;
          queueLocalMutation(() => {
            if (ownerRef.current !== owner || pausedRef.current || unownedLegacyRef.current) return;
            const cachedRaw = currentProgressKey ? localStorage.getItem(currentProgressKey) : null;
            const cached = cachedRaw ? parseProgressPayload(JSON.parse(cachedRaw)) : null;
            if (cached && payloadEqual(cached, sharedBaseline)) reconcileSharedSnapshot(sharedBaseline);
          });
          return;
        }
        // Owner-scoped progress writes are followed by an explicit event or an
        // acknowledged baseline write; wait for that intent before applying.
      } catch {
        // Ignore malformed writes from another tab.
      }
    };
    window.addEventListener("online", onOnline);
    window.addEventListener("focus", onFocus);
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      mountedRef.current = false;
      readyRef.current = false;
      window.clearTimeout(hydrationTimer);
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      abortRef.current?.abort();
      window.removeEventListener("online", onOnline);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisible);
    };
  // All synchronization callbacks read current values through refs by design.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateProgress(updater: (current: Progress) => Progress) {
    queueLocalMutation(() => {
      let base = currentPayload();
      const owner = ownerRef.current;
      if (!pausedRef.current && owner && ownerConfirmedRef.current && !unownedLegacyRef.current) {
        const shared = localPayloadFromStorage(owner);
        if (shared.exists) base = shared.payload;
      }
      const next = updater(base.progress);
      if (next === base.progress) return;
      const payload = { generation: base.generation, progress: next };
      if (pausedRef.current) {
        applyPayload(payload, true, false);
        persistConflictDraft(payload);
      } else {
        applyPayload(payload, true);
      }
      setStatus(pausedRef.current ? "conflict" : typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "syncing");
      requestSyncRef.current();
    });
  }

  function finishConflictChoice() {
    persistConflictDraft(null);
    if (unownedLegacyRef.current) {
      unownedLegacyRef.current = false;
      try {
        localStorage.removeItem(legacyStorageKey);
        localStorage.removeItem(legacyGenerationKey);
      } catch { /* The owner-scoped copy is still authoritative. */ }
    }
  }

  function replaceProgress(next: Progress) {
    const conflictAtCall = conflict;
    queueLocalMutation(() => {
      if (conflictAtCall) {
        saveBaseline(conflictAtCall.remote);
        finishConflictChoice();
        pausedRef.current = false;
        setConflict(null);
      }
      const shared = ownerRef.current && ownerConfirmedRef.current
        ? localPayloadFromStorage(ownerRef.current).payload
        : currentPayload();
      const nextGeneration = nextProgressGeneration(shared.generation);
      applyPayload({ generation: nextGeneration, progress: next }, true, true, "replace");
      setStatus(typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "syncing");
      requestSyncRef.current(0);
    });
  }

  async function resolveSyncedCopy() {
    if (!conflict || conflictResolutionRef.current) return;
    const legacyChoice = conflict.reason === "legacy-unowned";
    const draftAtChoice = currentPayload();
    const expectedOwner = ownerRef.current;
    if (!expectedOwner) return;
    conflictResolutionRef.current = true;
    setStatus("syncing");
    try {
      const before = await withLocalMutationLock(() => ({
        baseline: readBaseline(expectedOwner),
        cache: localPayloadFromStorage(expectedOwner),
        pendingIds: readPendingMutationIds(expectedOwner),
      }), expectedOwner);
      const response = await fetch("/api/progress", { credentials: "same-origin", cache: "no-store" });
      const owner = responseOwner(response);
      const fresh = response.ok ? parseProgressSnapshot(await readJson(response)) : null;
      if (!fresh || !owner || owner !== expectedOwner) {
        setStatus(typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "error");
        return;
      }

      await withLocalMutationLock(() => {
        if (!pausedRef.current || ownerRef.current !== owner || !payloadEqual(currentPayload(), draftAtChoice)) {
          setStatus("conflict");
          return;
        }
        const sharedBaseline = readBaseline(owner);
        const shared = localPayloadFromStorage(owner);
        const pending = readPending(owner);
        const pendingIds = readPendingMutationIds(owner);
        const freshest = sharedBaseline && sharedBaseline.revision > fresh.revision ? sharedBaseline : fresh;
        const baselineMoved = (before.baseline?.revision ?? -1) !== (sharedBaseline?.revision ?? -1);
        const cacheMoved = before.cache.exists !== shared.exists
          || (before.cache.exists && shared.exists && !payloadEqual(before.cache.payload, shared.payload));
        const pendingMoved = before.pendingIds.length !== pendingIds.length
          || before.pendingIds.some((id, index) => id !== pendingIds[index]);
        const ownerCacheWasDirty = before.cache.exists
          && (!before.baseline || !payloadEqual(before.cache.payload, before.baseline));
        const preexistingOwnerWork = before.pendingIds.length > 0
          || (legacyChoice ? ownerCacheWasDirty : before.cache.exists && !payloadEqual(before.cache.payload, draftAtChoice));
        const sharedMoved = preexistingOwnerWork || baselineMoved || cacheMoved || pendingMoved;

        finishConflictChoice();
        pausedRef.current = false;
        setConflict(null);
        pendingRef.current = pending;
        if (sharedMoved && shared.exists) {
          applyPayload(shared.payload, true, false);
          saveBaseline(freshest);
        } else {
          applyPayload(freshest, false);
          saveBaseline(freshest);
        }
        setStatus("syncing");
        requestSyncRef.current(0);
      }, owner);
    } catch {
      setStatus(typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "error");
    } finally {
      conflictResolutionRef.current = false;
    }
  }

  function adoptSyncedCopy() {
    void resolveSyncedCopy();
  }

  function keepDeviceCopy() {
    if (!conflict) return;
    const choice = conflict;
    queueLocalMutation(() => {
      finishConflictChoice();
      let nextGeneration = nextProgressGeneration(generationRef.current);
      if (nextGeneration === choice.remote.generation) nextGeneration = nextProgressGeneration(nextGeneration);
      applyPayload({ generation: nextGeneration, progress: progressRef.current }, true, true, "replace");
      saveBaseline(choice.remote);
      pausedRef.current = false;
      setConflict(null);
      setStatus("syncing");
      requestSyncRef.current(0);
    });
  }

  return {
    progress,
    generation,
    ready,
    status,
    conflict,
    updateProgress,
    replaceProgress,
    retrySync: () => requestSyncRef.current(0),
    adoptSyncedCopy,
    keepDeviceCopy,
  };
}
