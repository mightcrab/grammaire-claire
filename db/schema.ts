/** Shared names and row shape for the D1 progress_sync table. */
export const progressSync = {
  name: "progress_sync",
  columns: {
    userId: "user_id",
    revision: "revision",
    generation: "generation",
    progressJson: "progress_json",
    lastMutationId: "last_mutation_id",
    updatedAt: "updated_at",
  },
} as const;

export type ProgressSyncRow = {
  userId: string;
  revision: number;
  generation: string;
  progressJson: string;
  lastMutationId: string;
  updatedAt: string;
};

export const progressMutations = {
  name: "progress_mutations",
  columns: {
    userId: "user_id",
    mutationId: "mutation_id",
    revision: "revision",
    payloadHash: "payload_hash",
    updatedAt: "updated_at",
  },
} as const;

export type ProgressMutationRow = {
  userId: string;
  mutationId: string;
  revision: number;
  payloadHash: string;
  updatedAt: string;
};
