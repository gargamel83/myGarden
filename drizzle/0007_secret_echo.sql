CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`token` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_unique` ON `sessions` (`token`);
--> statement-breakpoint
CREATE INDEX `idx_sessions_user_id` ON `sessions` (`user_id`);
--> statement-breakpoint
CREATE INDEX `idx_sessions_token` ON `sessions` (`token`);
--> statement-breakpoint
-- Insert default admin user (id=1) for existing data migration
INSERT INTO `users` (`id`, `username`, `password_hash`, `created_at`) VALUES (1, 'admin', '', datetime('now'));
--> statement-breakpoint
PRAGMA foreign_keys=OFF;
--> statement-breakpoint
CREATE TABLE `__new_garden_beds` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL DEFAULT 1,
	`name` text NOT NULL,
	`polygon` text NOT NULL,
	`type` text DEFAULT 'pixel',
	`color` text DEFAULT '#64748b',
	`soil_type` text,
	`sun_exposure` text,
	`length` real,
	`width` real,
	`orientation` text,
	`notes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_garden_beds`("id", "name", "polygon", "type", "color", "soil_type", "sun_exposure", "length", "width", "orientation", "notes", "created_at", "updated_at") SELECT "id", "name", "polygon", "type", "color", "soil_type", "sun_exposure", "length", "width", "orientation", "notes", "created_at", "updated_at" FROM `garden_beds`;
--> statement-breakpoint
UPDATE `__new_garden_beds` SET `user_id` = 1;
--> statement-breakpoint
DROP TABLE `garden_beds`;
--> statement-breakpoint
ALTER TABLE `__new_garden_beds` RENAME TO `garden_beds`;
--> statement-breakpoint
PRAGMA foreign_keys=ON;
--> statement-breakpoint
ALTER TABLE `garden_photos` ADD `user_id` integer NOT NULL DEFAULT 1;
--> statement-breakpoint
ALTER TABLE `notifications` ADD `user_id` integer NOT NULL DEFAULT 1;
--> statement-breakpoint
ALTER TABLE `plantations` ADD `user_id` integer NOT NULL DEFAULT 1;
