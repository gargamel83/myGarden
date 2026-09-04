export interface WeatherItem {
	date: string;
	code: number;
	min: number | null;
	max: number | null;
}

export interface WeatherReport {
	current: { temperature: number; code: number };
	daily: WeatherItem[];
}

export function parseWeather(payload: unknown): WeatherReport {
	const data = payload as any;
	const cur = data?.current_weather;
	const d = data?.daily;
	const daily: WeatherItem[] = [];
	if (d?.time && Array.isArray(d.time)) {
		for (let i = 0; i < d.time.length; i += 1) {
			daily.push({
				date: String(d.time[i] ?? ''),
				code: Number(d.weathercode?.[i] ?? 0),
				min: d.temperature_2m_min?.[i] != null ? Number(d.temperature_2m_min[i]) : null,
				max: d.temperature_2m_max?.[i] != null ? Number(d.temperature_2m_max[i]) : null
			});
		}
	}
	const current = cur
		? { temperature: Number(cur.temperature ?? 0), code: Number(cur.weathercode ?? 0) }
		: { temperature: 0, code: 0 };
	return { current, daily };
}

const CODE_LABELS: Record<number, string> = {
	0: 'clear',
	1: 'mostlyClear',
	2: 'partlyCloudy',
	3: 'overcast',
	45: 'fog',
	48: 'fog',
	51: 'drizzle',
	53: 'drizzle',
	55: 'drizzle',
	56: 'drizzle',
	57: 'drizzle',
	61: 'rain',
	63: 'rain',
	65: 'rain',
	66: 'rain',
	67: 'rain',
	71: 'snow',
	73: 'snow',
	75: 'snow',
	77: 'snow',
	80: 'showers',
	81: 'showers',
	82: 'showers',
	85: 'snow',
	86: 'snow',
	95: 'thunderstorm',
	96: 'thunderstorm',
	99: 'thunderstorm'
};

export function weatherLabel(code: number): string {
	return CODE_LABELS[code] ?? 'unknown';
}
