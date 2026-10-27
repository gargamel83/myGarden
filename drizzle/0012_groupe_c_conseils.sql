CREATE TABLE `garden_tasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`garden_bed_id` integer,
	`title` text NOT NULL,
	`month` integer NOT NULL,
	`year` integer,
	`done` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`garden_bed_id`) REFERENCES `garden_beds`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_garden_tasks_user_month` ON `garden_tasks` (`user_id`,`month`);--> statement-breakpoint
ALTER TABLE `plants` ADD `care_tips` text;