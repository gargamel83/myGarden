<script lang="ts">
	import { localeStore, t } from '$lib/i18n';
	import { weatherLabel, type WeatherReport } from '$lib/weather';
	let _locale = $localeStore;

	let { lat = undefined, lng = undefined }: { lat?: number; lng?: number } = $props();

	let customCoords = $state<{ lat: number; lng: number } | null>(null);
	let coords = $derived(
		customCoords ?? (lat != null && lng != null ? { lat, lng } : null)
	);
	let report = $state<WeatherReport | null>(null);
	let loading = $state(false);
	let error = $state('');
	let locating = $state(false);

	const ICONS: Record<string, string> = {
		clear: '☀️',
		mostlyClear: '🌤️',
		partlyCloudy: '⛅',
		overcast: '☁️',
		fog: '🌫️',
		drizzle: '🌦️',
		rain: '🌧️',
		snow: '❄️',
		showers: '🌧️',
		thunderstorm: '⛈️',
		unknown: '🌡️'
	};

	async function load() {
		if (!coords) return;
		loading = true;
		error = '';
		try {
			const res = await fetch(`/api/weather?lat=${coords.lat}&lng=${coords.lng}`);
			if (!res.ok) throw new Error('weather.error');
			const data = await res.json();
			if (data?.error) throw new Error('weather.error');
			report = data;
		} catch (e) {
			error = e instanceof Error ? e.message : 'weather.error';
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		if (coords) void load();
	});

	function locate() {
		if (typeof navigator === 'undefined' || !navigator.geolocation) return;
		locating = true;
		navigator.geolocation.getCurrentPosition(
			(pos) => {
				customCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
				locating = false;
			},
			() => {
				locating = false;
			},
			{ timeout: 8000 }
		);
	}

	function fmtDay(date: string) {
		const d = new Date(date + 'T12:00:00');
		return d.toLocaleDateString(_locale === 'fr' ? 'fr-FR' : 'en-GB', { weekday: 'short', day: 'numeric' });
	}

	let currentLabel = $derived(report ? weatherLabel(report.current.code) : 'unknown');
</script>

<div class="border rounded-lg p-3 bg-[var(--bg-subtle)] shadow-sm" aria-busy={loading}>
	<div class="flex items-center justify-between mb-2">
		<h3 class="text-sm font-semibold text-[var(--text-primary)]">{t('weather.title')}</h3>
		<button
			class="text-xs bg-[var(--btn-bg)] text-white px-2 py-1 rounded hover:bg-[var(--btn-hover)]"
			onclick={locate}
			disabled={locating}
		>
			{locating ? '…' : '📍 ' + t('weather.myLocation')}
		</button>
	</div>

	{#if error}
		<p class="text-sm text-red-500">{t(error)}</p>
	{:else if loading && !report}
		<p class="text-sm text-gray-500">{t('weather.loading')}</p>
	{:else if report}
		<div class="flex items-center gap-3">
			<span class="text-3xl" aria-hidden="true">{ICONS[currentLabel] ?? ICONS.unknown}</span>
			<div>
				<div class="text-2xl font-bold text-[var(--text-primary)]">{report.current.temperature.toFixed(1)}°C</div>
				<div class="text-xs text-gray-500">{t('weather.code.' + currentLabel)}</div>
			</div>
		</div>
		<div class="grid grid-cols-5 gap-2 mt-3">
			{#each report.daily as day}
				<div class="text-center text-xs">
					<div class="text-gray-500">{fmtDay(day.date)}</div>
					<div aria-hidden="true">{ICONS[weatherLabel(day.code)] ?? ICONS.unknown}</div>
					<div class="font-medium text-[var(--text-primary)]">
						<span>{day.max != null ? Math.round(day.max) : '–'}°</span>
					</div>
					<div class="text-gray-400">{day.min != null ? Math.round(day.min) : '–'}°</div>
				</div>
			{/each}
		</div>
	{:else}
		<p class="text-sm text-gray-500">{t('weather.noLocation')}</p>
	{/if}
</div>
