CREATE TABLE `harvest_records` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`plantation_id` integer NOT NULL,
	`weight_kg` real,
	`quantity` integer,
	`condition` text,
	`notes` text,
	`photo` text,
	`harvested_at` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`plantation_id`) REFERENCES `plantations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_harvest_records_plantation_id` ON `harvest_records` (`plantation_id`);--> statement-breakpoint
CREATE INDEX `idx_harvest_records_user_id` ON `harvest_records` (`user_id`);