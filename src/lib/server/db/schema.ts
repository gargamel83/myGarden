import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	username: text('username').notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	createdAt: text('created_at').notNull().$default(() => new Date().toISOString())
});

export const sessions = sqliteTable('sessions', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	userId: integer('user_id').notNull().references(() => users.id),
	token: text('token').notNull().unique(),
	expiresAt: text('expires_at').notNull(),
	createdAt: text('created_at').notNull().$default(() => new Date().toISOString())
}, (table) => ({
	userIdIdx: index('idx_sessions_user_id').on(table.userId),
	tokenIdx: index('idx_sessions_token').on(table.token)
}));

export const gardenBeds = sqliteTable('garden_beds', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	userId: integer('user_id').notNull().references(() => users.id),
	name: text('name').notNull(),
	polygon: text('polygon').notNull(), // JSON array of [x,y] or [lng,lat] points
	type: text('type').default('pixel'), // 'pixel' or 'geo'
	color: text('color').default('#64748b'),
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
	commonName: text('common_name').notNull(),
	latinName: text('latin_name'),
	family: text('family'),
	description: text('description'),
	sowingStart: text('sowing_start'),
	sowingEnd: text('sowing_end'),
	plantingStart: text('planting_start'),
	plantingEnd: text('planting_end'),
	harvestStart: text('harvest_start'),
	harvestEnd: text('harvest_end'),
	floweringStart: text('flowering_start'),
	floweringEnd: text('flowering_end'),
	sunExposure: text('sun_exposure'),
	soilType: text('soil_type'),
	watering: text('watering'),
	spacing: real('spacing'),
	rowSpacing: real('row_spacing'),
	companions: text('companions'),
	antagonists: text('antagonists'),
	photos: text('photos'),
	createdAt: text('created_at').notNull().$default(() => new Date().toISOString()),
	updatedAt: text('updated_at').notNull().$default(() => new Date().toISOString())
}, (table) => ({
	familyIdx: index('idx_plants_family').on(table.family),
	commonNameIdx: index('idx_plants_common_name').on(table.commonName),
	sunExposureIdx: index('idx_plants_sun_exposure').on(table.sunExposure)
}));

export const plantations = sqliteTable('plantations', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	userId: integer('user_id').notNull().references(() => users.id),
	gardenBedId: integer('garden_bed_id').notNull().references(() => gardenBeds.id),
	plantId: integer('plant_id').references(() => plants.id),
	plantName: text('plant_name').notNull(),
	variety: text('variety'),
	sowingDate: text('sowing_date'),
	plantingDate: text('planting_date'),
	harvestDate: text('harvest_date'),
	actualHarvestDate: text('actual_harvest_date'),
	status: text('status').notNull().default('planned'),
	quantity: integer('quantity'),
	notes: text('notes'),
	createdAt: text('created_at').notNull().$default(() => new Date().toISOString()),
	updatedAt: text('updated_at').notNull().$default(() => new Date().toISOString())
}, (table) => ({
	gardenBedIdIdx: index('idx_plantations_garden_bed_id').on(table.gardenBedId),
	plantIdIdx: index('idx_plantations_plant_id').on(table.plantId),
	statusIdx: index('idx_plantations_status').on(table.status)
}));

export const notifications = sqliteTable('notifications', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	userId: integer('user_id').notNull().references(() => users.id),
	type: text('type').notNull(),
	key: text('key').notNull().unique(),
	message: text('message').notNull(),
	link: text('link'),
	isRead: integer('is_read', { mode: 'boolean' }).notNull().default(false),
	createdAt: text('created_at').notNull().$default(() => new Date().toISOString())
}, (table) => ({
	isReadIdx: index('idx_notifications_is_read').on(table.isRead)
}));

export const gardenPhotos = sqliteTable('garden_photos', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	userId: integer('user_id').notNull().references(() => users.id),
	label: text('label').notNull(),
	filename: text('filename').notNull(),
	width: integer('width'),
	height: integer('height'),
	createdAt: text('created_at').notNull().$default(() => new Date().toISOString())
});
