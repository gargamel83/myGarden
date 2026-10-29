CREATE TABLE `disease_plants` (
	`disease_id` integer NOT NULL,
	`plant_id` integer NOT NULL,
	PRIMARY KEY(`disease_id`, `plant_id`),
	FOREIGN KEY (`disease_id`) REFERENCES `diseases`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`plant_id`) REFERENCES `plants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_disease_plants_disease_id` ON `disease_plants` (`disease_id`);--> statement-breakpoint
CREATE INDEX `idx_disease_plants_plant_id` ON `disease_plants` (`plant_id`);--> statement-breakpoint
CREATE TABLE `plant_media` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`plant_id` integer NOT NULL,
	`user_id` integer,
	`url` text NOT NULL,
	`type` text DEFAULT 'gallery' NOT NULL,
	`disease_id` integer,
	`caption` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`plant_id`) REFERENCES `plants`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`disease_id`) REFERENCES `diseases`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_plant_media_plant_id` ON `plant_media` (`plant_id`);--> statement-breakpoint
CREATE INDEX `idx_plant_media_disease_id` ON `plant_media` (`disease_id`);