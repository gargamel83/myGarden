CREATE INDEX `idx_plantations_garden_bed_id` ON `plantations` (`garden_bed_id`);--> statement-breakpoint
CREATE INDEX `idx_plantations_plant_id` ON `plantations` (`plant_id`);--> statement-breakpoint
CREATE INDEX `idx_plantations_status` ON `plantations` (`status`);--> statement-breakpoint
CREATE INDEX `idx_plants_family` ON `plants` (`family`);--> statement-breakpoint
CREATE INDEX `idx_plants_common_name` ON `plants` (`common_name`);--> statement-breakpoint
CREATE INDEX `idx_plants_sun_exposure` ON `plants` (`sun_exposure`);