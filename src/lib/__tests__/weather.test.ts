import { describe, it, expect } from 'vitest';
import { parseWeather, weatherLabel } from '../weather';

describe('weather', () => {
	it('maps weather codes to labels', () => {
		expect(weatherLabel(0)).toBe('clear');
		expect(weatherLabel(2)).toBe('partlyCloudy');
		expect(weatherLabel(61)).toBe('rain');
		expect(weatherLabel(95)).toBe('thunderstorm');
		expect(weatherLabel(999)).toBe('unknown');
	});

	it('parses an Open-Meteo payload into a compact report', () => {
		const report = parseWeather({
			current_weather: { temperature: 18.4, weathercode: 2 },
			daily: {
				time: ['2026-09-03', '2026-09-04', '2026-09-05'],
				weathercode: [2, 61, 0],
				temperature_2m_max: [20, 19, 22],
				temperature_2m_min: [12, 10, 14]
			}
		});

		expect(report.current.temperature).toBe(18.4);
		expect(report.current.code).toBe(2);
		expect(report.daily).toHaveLength(3);
		expect(report.daily[0]).toEqual({ date: '2026-09-03', code: 2, min: 12, max: 20 });
		expect(report.daily[1].code).toBe(61);
	});

	it('handles a missing/empty payload gracefully', () => {
		const empty = parseWeather({});
		expect(empty.current).toEqual({ temperature: 0, code: 0 });
		expect(empty.daily).toEqual([]);
	});
});
