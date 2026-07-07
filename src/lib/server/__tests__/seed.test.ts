import { describe, it, expect } from 'vitest';
import { seeds } from '../db/seed-data';

const recognizedFamilies = new Set([
	'Solanaceae', 'Brassicaceae', 'Cucurbitaceae', 'Apiaceae', 'Fabaceae',
	'Amaryllidaceae', 'Asteraceae', 'Chenopodiaceae', 'Poaceae', 'Lamiaceae',
	'Rosaceae', 'Asparagaceae', 'Boraginaceae', 'Tropaeolaceae', 'Convolvulaceae',
	'Valerianaceae', 'Papaveraceae', 'Verbenaceae'
]);

const datePattern = /^\d{2}-\d{2}$/;

describe('seed data integrity', () => {
	it('should have exactly 58 plants', () => {
		expect(seeds.length).toBe(58);
	});

	it('should have a non-empty commonName on every plant', () => {
		for (const plant of seeds) {
			expect(plant.commonName, `${plant.commonName} is missing commonName`).toBeTruthy();
			expect(typeof plant.commonName, `commonName for ${plant.commonName} is not a string`).toBe('string');
		}
	});

	it('should have a non-empty family on every plant', () => {
		for (const plant of seeds) {
			expect(plant.family, `${plant.commonName} is missing family`).toBeTruthy();
			expect(typeof plant.family, `family for ${plant.commonName} is not a string`).toBe('string');
		}
	});

	it('should have a non-empty latinName on every plant', () => {
		for (const plant of seeds) {
			expect(plant.latinName, `${plant.commonName} is missing latinName`).toBeTruthy();
			expect(typeof plant.latinName, `latinName for ${plant.commonName} is not a string`).toBe('string');
		}
	});

	it('should have unique commonNames (no duplicates)', () => {
		const names = seeds.map(p => p.commonName);
		const duplicates = names.filter((name, i) => names.indexOf(name) !== i);
		expect(duplicates, `Duplicate commonNames: ${duplicates.join(', ')}`).toEqual([]);
	});

	it('should have all families from the recognized set', () => {
		const allFamilies = new Set(seeds.map(p => p.family));
		for (const family of allFamilies) {
			expect(recognizedFamilies.has(family), `Unknown family: ${family}`).toBe(true);
		}
	});

	it('should have at least 10 distinct families represented', () => {
		const families = new Set(seeds.map(p => p.family));
		expect(families.size).toBeGreaterThanOrEqual(10);
	});

	it('should have valid MM-DD date format for all date fields that are non-null', () => {
		const dateFields = ['sowingStart', 'sowingEnd', 'plantingStart', 'plantingEnd',
			'harvestStart', 'harvestEnd', 'floweringStart', 'floweringEnd'] as const;
		for (const plant of seeds) {
			for (const field of dateFields) {
				const val = plant[field as keyof typeof plant] as string | null;
				if (val !== null) {
					expect(val, `${plant.commonName}.${field} = "${val}" is not MM-DD`).toMatch(datePattern);
				}
			}
		}
	});

	it('should have valid JSON arrays for companions', () => {
		for (const plant of seeds) {
			expect(() => JSON.parse(plant.companions), `${plant.commonName}: invalid companions JSON`).not.toThrow();
			const parsed = JSON.parse(plant.companions);
			expect(Array.isArray(parsed), `${plant.commonName}: companions is not an array`).toBe(true);
		}
	});

	it('should have valid JSON arrays for antagonists', () => {
		for (const plant of seeds) {
			expect(() => JSON.parse(plant.antagonists), `${plant.commonName}: invalid antagonists JSON`).not.toThrow();
			const parsed = JSON.parse(plant.antagonists);
			expect(Array.isArray(parsed), `${plant.commonName}: antagonists is not an array`).toBe(true);
		}
	});

	it('should have valid photo URLs (JSON array of http strings)', () => {
		for (const plant of seeds) {
			expect(() => JSON.parse(plant.photos), `${plant.commonName}: invalid photos JSON`).not.toThrow();
			const parsed = JSON.parse(plant.photos);
			expect(Array.isArray(parsed), `${plant.commonName}: photos is not an array`).toBe(true);
			for (const url of parsed) {
				expect(typeof url, `${plant.commonName}: photo URL is not a string`).toBe('string');
				expect(url, `${plant.commonName}: photo URL does not start with http`).toMatch(/^http/);
			}
		}
	});

	it('should have valid sunExposure, soilType, and watering values', () => {
		const validExposures = ['plein_soleil', 'mi_ombre', 'ombre'];
		const validSoilTypes = ['riche', 'meuble', 'léger', 'lourd'];
		const validWatering = ['faible', 'moyen', 'élevé'];
		for (const plant of seeds) {
			expect(validExposures, `${plant.commonName}: invalid sunExposure "${plant.sunExposure}"`).toContain(plant.sunExposure);
			expect(validSoilTypes, `${plant.commonName}: invalid soilType "${plant.soilType}"`).toContain(plant.soilType);
			expect(validWatering, `${plant.commonName}: invalid watering "${plant.watering}"`).toContain(plant.watering);
		}
	});

	it('should have positive spacing and rowSpacing values', () => {
		for (const plant of seeds) {
			expect(plant.spacing, `${plant.commonName}: spacing must be positive`).toBeGreaterThan(0);
			expect(plant.rowSpacing, `${plant.commonName}: rowSpacing must be positive`).toBeGreaterThan(0);
		}
	});

	it('should have a description on every plant', () => {
		for (const plant of seeds) {
			expect(plant.description, `${plant.commonName} is missing description`).toBeTruthy();
		}
	});
});
