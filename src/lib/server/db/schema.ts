import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const gardenBeds = sqliteTable('garden_beds', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull(),
	polygon: text('polygon').notNull(), // JSON array of [x,y] or [lng,lat] points
	type: text('type').default('pixel'), // 'pixel' or 'geo'
	color: text('color').default('#4ade80'),
	soilType: text('soil_type'),
	sunExposure: text('sun_exposure'),
	length: real('length'),
	width: real('width'),
	orientation: text('orientation'), // N, S, E, W, NE, NW, SE, SW
	notes: text('notes'),
	createdAt: text('created_at').notNull().$default(() => new Date().toISOString()),
	updatedAt: text('updated_at').notNull().$default(() => new Date().toISOString())
});

export const plants = sqliteTable('plants', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	commonName: text('common_name').notNull(), // nom commun
	latinName: text('latin_name'),
	family: text('family'), // famille botanique (pour rotation)
	description: text('description'),
	// Culture
	sowingStart: text('sowing_start'), // date de début semis (MM-DD)
	sowingEnd: text('sowing_end'),
	plantingStart: text('planting_start'),
	plantingEnd: text('planting_end'),
	harvestStart: text('harvest_start'),
	harvestEnd: text('harvest_end'),
	floweringStart: text('flowering_start'),
	floweringEnd: text('flowering_end'),
	// Exigences
	sunExposure: text('sun_exposure'),
	soilType: text('soil_type'),
	watering: text('watering'), // faible, moyen, élevé
	spacing: real('spacing'), // cm entre plants
	rowSpacing: real('row_spacing'), // cm entre rangs
	// Compagnonnage
	companions: text('companions'), // JSON array of plant IDs
	antagonists: text('antagonists'), // JSON array of plant IDs
	// Photos
	photos: text('photos'), // JSON array of URLs/paths
	createdAt: text('created_at').notNull().$default(() => new Date().toISOString()),
	updatedAt: text('updated_at').notNull().$default(() => new Date().toISOString())
});

export const plantations = sqliteTable('plantations', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	gardenBedId: integer('garden_bed_id').notNull().references(() => gardenBeds.id),
	plantId: integer('plant_id').references(() => plants.id),
	plantName: text('plant_name').notNull(), // nom libre si pas dans la base
	variety: text('variety'), // variété
	// Cycles
	sowingDate: text('sowing_date'),
	plantingDate: text('planting_date'), // repiquage
	harvestDate: text('harvest_date'), // récolte prévue
	actualHarvestDate: text('actual_harvest_date'), // récolte réelle
	status: text('status').notNull().default('planned'), // planned, sown, planted, harvested, cancelled
	quantity: integer('quantity'),
	notes: text('notes'),
	createdAt: text('created_at').notNull().$default(() => new Date().toISOString()),
	updatedAt: text('updated_at').notNull().$default(() => new Date().toISOString())
});

export const gardenPhotos = sqliteTable('garden_photos', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	label: text('label').notNull(),
	filename: text('filename').notNull(),
	width: integer('width'),
	height: integer('height'),
	createdAt: text('created_at').notNull().$default(() => new Date().toISOString())
});
