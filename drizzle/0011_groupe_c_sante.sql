CREATE TABLE `diseases` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`latin_name` text,
	`symptoms` text,
	`causes` text,
	`treatments` text,
	`prevention` text,
	`host_plants` text,
	`photos` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `diseases_name_unique` ON `diseases` (`name`);--> statement-breakpoint
CREATE INDEX `idx_diseases_name` ON `diseases` (`name`);--> statement-breakpoint
CREATE TABLE `plant_health_records` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`plantation_id` integer NOT NULL,
	`type` text DEFAULT 'disease' NOT NULL,
	`severity` text DEFAULT 'medium' NOT NULL,
	`photo` text,
	`treatment` text,
	`notes` text,
	`detected_at` text NOT NULL,
	`resolved_at` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`plantation_id`) REFERENCES `plantations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_plant_health_records_plantation_id` ON `plant_health_records` (`plantation_id`);--> statement-breakpoint
CREATE INDEX `idx_plant_health_records_user_id` ON `plant_health_records` (`user_id`);