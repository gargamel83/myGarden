import { sqliteTable, text, integer, real, index, uniqueIndex, primaryKey } from 'drizzle-orm/sqlite-core';

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
	zone: text('zone'),
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
	careTips: text('care_tips'), // JSON { watering, fertilizing, pruning, harvest, misc }
	createdAt: text('created_at').notNull().$default(() => new Date().toISOString()),
	updatedAt: text('updated_at').notNull().$default(() => new Date().toISOString())
}, (table) => ({
	familyIdx: index('idx_plants_family').on(table.family),
	commonNameIdx: index('idx_plants_common_name').on(table.commonName),
	sunExposureIdx: index('idx_plants_sun_exposure').on(table.sunExposure)
}));

export const plantFavorites = sqliteTable('plant_favorites', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	userId: integer('user_id').notNull().references(() => users.id),
	plantId: integer('plant_id').notNull().references(() => plants.id),
	createdAt: text('created_at').notNull().$default(() => new Date().toISOString())
}, (table) => ({
	userPlantIdx: uniqueIndex('idx_plant_favorites_user_plant').on(table.userId, table.plantId)
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

export const harvestRecords = sqliteTable('harvest_records', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	userId: integer('user_id').notNull().references(() => users.id),
	plantationId: integer('plantation_id').notNull().references(() => plantations.id),
	weightKg: real('weight_kg'),
	quantity: integer('quantity'),
	condition: text('condition'),
	notes: text('notes'),
	photo: text('photo'),
	harvestedAt: text('harvested_at').notNull().$default(() => new Date().toISOString()),
	createdAt: text('created_at').notNull().$default(() => new Date().toISOString())
}, (table) => ({
	plantationIdIdx: index('idx_harvest_records_plantation_id').on(table.plantationId),
	userIdIdx: index('idx_harvest_records_user_id').on(table.userId)
}));

export const plantHealthRecords = sqliteTable('plant_health_records', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	userId: integer('user_id').notNull().references(() => users.id),
	plantationId: integer('plantation_id').notNull().references(() => plantations.id),
	type: text('type').notNull().default('disease'), // 'disease' | 'pest' | 'deficiency' | 'other'
	severity: text('severity').notNull().default('medium'), // 'low' | 'medium' | 'high'
	photo: text('photo'),
	treatment: text('treatment'),
	notes: text('notes'),
	detectedAt: text('detected_at').notNull().$default(() => new Date().toISOString()),
	resolvedAt: text('resolved_at'),
	createdAt: text('created_at').notNull().$default(() => new Date().toISOString())
}, (table) => ({
	plantationIdIdx: index('idx_plant_health_records_plantation_id').on(table.plantationId),
	userIdIdx: index('idx_plant_health_records_user_id').on(table.userId)
}));

export const diseases = sqliteTable('diseases', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull().unique(),
	latinName: text('latin_name'),
	symptoms: text('symptoms'),
	causes: text('causes'),
	treatments: text('treatments'), // organic treatments
	prevention: text('prevention'),
	hostPlants: text('host_plants'), // JSON array of plant names
	photos: text('photos'), // JSON array of URLs
	createdAt: text('created_at').notNull().$default(() => new Date().toISOString()),
	updatedAt: text('updated_at').notNull().$default(() => new Date().toISOString())
}, (table) => ({
	nameIdx: index('idx_diseases_name').on(table.name)
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

export const gardenTasks = sqliteTable('garden_tasks', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	userId: integer('user_id').notNull().references(() => users.id),
	gardenBedId: integer('garden_bed_id').references(() => gardenBeds.id),
	title: text('title').notNull(),
	month: integer('month').notNull(), // 1-12
	year: integer('year'), // null = every year
	done: integer('done', { mode: 'boolean' }).notNull().default(false),
	createdAt: text('created_at').notNull().$default(() => new Date().toISOString())
}, (table) => ({
	userMonthIdx: index('idx_garden_tasks_user_month').on(table.userId, table.month)
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

export const plantMedia = sqliteTable('plant_media', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	plantId: integer('plant_id').notNull().references(() => plants.id),
	userId: integer('user_id').references(() => users.id),
	url: text('url').notNull(),
	type: text('type').notNull().default('gallery'), // 'gallery' | 'disease' | 'growth'
	diseaseId: integer('disease_id').references(() => diseases.id),
	caption: text('caption'),
	createdAt: text('created_at').notNull().$default(() => new Date().toISOString())
}, (table) => ({
	plantIdIdx: index('idx_plant_media_plant_id').on(table.plantId),
	diseaseIdIdx: index('idx_plant_media_disease_id').on(table.diseaseId)
}));

export const diseasePlants = sqliteTable('disease_plants', {
	diseaseId: integer('disease_id').notNull().references(() => diseases.id),
	plantId: integer('plant_id').notNull().references(() => plants.id)
}, (table) => ({
	pk: primaryKey({ columns: [table.diseaseId, table.plantId] }),
	diseaseIdIdx: index('idx_disease_plants_disease_id').on(table.diseaseId),
	plantIdIdx: index('idx_disease_plants_plant_id').on(table.plantId)
}));
