CREATE TABLE `progress_mutations` (
  `user_id` text NOT NULL,
  `mutation_id` text NOT NULL,
  `revision` integer NOT NULL CHECK (`revision` >= 1),
  `payload_hash` text NOT NULL,
  `updated_at` text NOT NULL,
  PRIMARY KEY (`user_id`, `mutation_id`)
);
