CREATE TABLE `progress_sync` (
  `user_id` text PRIMARY KEY NOT NULL,
  `revision` integer NOT NULL CHECK (`revision` >= 1),
  `generation` text NOT NULL,
  `progress_json` text NOT NULL CHECK (json_valid(`progress_json`)),
  `last_mutation_id` text NOT NULL,
  `updated_at` text NOT NULL
);
