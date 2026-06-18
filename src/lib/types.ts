export type PlantStatus = 'planned' | 'sown' | 'planted' | 'harvested' | 'cancelled';

export type SunExposure = 'plein_soleil' | 'mi_ombre' | 'ombre';

export type SoilType = 'riche' | 'meuble' | 'lourd' | 'léger';

export type Watering = 'faible' | 'moyen' | 'élevé';

export const LOG_LEVELS = ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR'] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];

export type Orientation = 'N' | 'S' | 'E' | 'O' | 'NE' | 'NO' | 'SE' | 'SO';

export type CoordinatesType = 'pixel' | 'geo';

export const STATUS_LABELS: Record<PlantStatus, string> = {
	planned: 'Planned',
	sown: 'Sown',
	planted: 'Transplanted',
	harvested: 'Harvested',
	cancelled: 'Cancelled'
};

export const STATUS_COLORS: Record<PlantStatus, string> = {
	planned: 'bg-gray-200 text-gray-700',
	sown: 'bg-blue-100 text-blue-700',
	planted: 'bg-green-100 text-green-700',
	harvested: 'bg-amber-100 text-amber-700',
	cancelled: 'bg-red-100 text-red-700'
};

export const STATUS_BAR_COLORS: Record<PlantStatus, string> = {
	planned: '#9ca3af',
	sown: '#3b82f6',
	planted: '#22c55e',
	harvested: '#f59e0b',
	cancelled: '#ef4444'
};

export const EXPOSURE_LABELS: Record<SunExposure, string> = {
	plein_soleil: 'Full sun',
	mi_ombre: 'Partial shade',
	ombre: 'Shade'
};
