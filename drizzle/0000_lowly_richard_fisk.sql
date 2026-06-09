CREATE TABLE `garden_beds` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`polygon` text NOT NULL,
	`color` text DEFAULT '#4ade80',
	`soil_type` text,
	`sun_exposure` text,
	`notes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `garden_photos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`label` text NOT NULL,
	`filename` text NOT NULL,
	`width` integer,
	`height` integer,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `plantations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`garden_bed_id` integer NOT NULL,
	`plant_id` integer,
	`plant_name` text NOT NULL,
	`variety` text,
	`sowing_date` text,
	`planting_date` text,
	`harvest_date` text,
	`actual_harvest_date` text,
	`status` text DEFAULT 'planned' NOT NULL,
	`quantity` integer,
	`notes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`garden_bed_id`) REFERENCES `garden_beds`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`plant_id`) REFERENCES `plants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `plants` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`common_name` text NOT NULL,
	`latin_name` text,
	`family` text,
	`description` text,
	`sowing_start` text,
	`sowing_end` text,
	`planting_start` text,
	`planting_end` text,
	`harvest_start` text,
	`harvest_end` text,
	`sun_exposure` text,
	`soil_type` text,
	`watering` text,
	`spacing` real,
	`row_spacing` real,
	`companions` text,
	`antagonists` text,
	`photos` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
