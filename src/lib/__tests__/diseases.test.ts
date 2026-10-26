import { describe, it, expect } from 'vitest';
import { parseJsonArray, allHostPlants, filterDiseases, type DiseaseItem } from '../diseases';

function makeDisease(overrides: Partial<DiseaseItem> = {}): DiseaseItem {
	return {
		id: 1,
		name: 'Mildiou',
		latinName: 'Phytophthora infestans',
		symptoms: 'Taches brunes sur les feuilles',
		causes: 'Humidité et chaleur',
		treatments: 'Bouillie bordelaise',
		prevention: 'Rotation des cultures',
		hostPlants: ['Tomate', 'Pomme de terre'],
		photos: [],
		...overrides
	};
}

describe('parseJsonArray', () => {
	it('parses a JSON array of strings', () => {
		expect(parseJsonArray('["Tomate","Carotte"]')).toEqual(['Tomate', 'Carotte']);
	});

	it('returns an empty array for null, invalid JSON or non-array values', () => {
		expect(parseJsonArray(null)).toEqual([]);
		expect(parseJsonArray('not json')).toEqual([]);
		expect(parseJsonArray('{"a":1}')).toEqual([]);
	});

	it('drops non-string entries', () => {
		expect(parseJsonArray('["Tomate",3,null]')).toEqual(['Tomate']);
	});
});

describe('allHostPlants', () => {
	it('returns sorted unique host plant names', () => {
		const list = [
			makeDisease({ id: 1, hostPlants: ['Tomate', 'Pomme de terre'] }),
			makeDisease({ id: 2, hostPlants: ['Tomate', 'Aubergine'] })
		];
		expect(allHostPlants(list)).toEqual(['Aubergine', 'Pomme de terre', 'Tomate']);
	});

	it('returns an empty array when no disease has host plants', () => {
		expect(allHostPlants([makeDisease({ hostPlants: [] })])).toEqual([]);
	});
});

describe('filterDiseases', () => {
	const list = [
		makeDisease({ id: 1, name: 'Mildiou', hostPlants: ['Tomate', 'Pomme de terre'] }),
		makeDisease({
			id: 2,
			name: 'Oïdium',
			latinName: 'Erysiphe spp.',
			symptoms: 'Feutrage blanc poudreux',
			hostPlants: ['Courgette', 'Vigne']
		}),
		makeDisease({
			id: 3,
			name: 'Pucerons',
			latinName: 'Aphidoidea',
			symptoms: 'Amas de petits insectes verts',
			hostPlants: ['Haricot', 'Rosier']
		})
	];

	it('returns every disease when the search is empty', () => {
		expect(filterDiseases(list, '')).toHaveLength(3);
		expect(filterDiseases(list, '   ')).toHaveLength(3);
	});

	it('matches the name, case-insensitively', () => {
		expect(filterDiseases(list, 'oïd').map(d => d.name)).toEqual(['Oïdium']);
	});

	it('matches a symptom', () => {
		expect(filterDiseases(list, 'feutrage').map(d => d.name)).toEqual(['Oïdium']);
	});

	it('matches a host plant', () => {
		expect(filterDiseases(list, 'rosier').map(d => d.name)).toEqual(['Pucerons']);
	});

	it('matches the latin name', () => {
		expect(filterDiseases(list, 'aphidoidea').map(d => d.name)).toEqual(['Pucerons']);
	});

	it('filters by host plant', () => {
		expect(filterDiseases(list, '', 'Tomate').map(d => d.name)).toEqual(['Mildiou']);
		expect(filterDiseases(list, '', 'Vigne').map(d => d.name)).toEqual(['Oïdium']);
	});

	it('combines the text search and the host plant filter', () => {
		expect(filterDiseases(list, 'mildiou', 'Courgette')).toEqual([]);
		expect(filterDiseases(list, 'mildiou', 'Tomate').map(d => d.name)).toEqual(['Mildiou']);
	});

	it('returns an empty array when nothing matches', () => {
		expect(filterDiseases(list, 'introuvable')).toEqual([]);
	});
});
