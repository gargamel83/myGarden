<script lang="ts">
	import { onMount } from 'svelte';
	import { toast } from '$lib/toast.svelte';

	let {
		existingBeds = [],
		onSave,
		zoomToBedId,
		onEditBed,
		onShowBedPlantations
	}: {
		existingBeds?: { id: number; polygon: string; color: string | null; name: string }[]
		onSave?: (polygon: string) => void
		zoomToBedId?: number | null
		onEditBed?: (bedId: number) => void
		onShowBedPlantations?: (bedId: number) => void
	} = $props();

	let mapContainer: HTMLDivElement;
	let map: any = $state(null);
	let L: any = $state(null);
	let drawing = $state(false);
	let currentPoints = $state<[number, number][]>([]);
	let markers: any[] = [];
	let polygonLayer: any = null;
	let searchQuery = $state('');
	let searching = $state(false);
	let searchResults = $state<any[]>([]);
	let showResults = $state(false);

	let geoMarker: any = null;
	let bedLayers = new Map<number, any>();

	onMount(async () => {
		const leaflet = (await import('leaflet')).default;
		L = leaflet;
		await import('leaflet/dist/leaflet.css');

		map = L.map(mapContainer, { doubleClickZoom: false }).setView([46.6, 2.0], 6);
		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			maxZoom: 19,
			attribution: '&copy; OpenStreetMap'
		}).addTo(map);

		for (const bed of existingBeds) {
			try {
				const coords = JSON.parse(bed.polygon);
				if (Array.isArray(coords) && coords.length > 0) {
					const layer = L.polygon(coords, {
						color: bed.color || '#4ade80',
						fillOpacity: 0.2
					}).addTo(map);
					layer.bindPopup(`
						<div class="text-sm">
							<strong>${bed.name}</strong>
							<div class="mt-1 flex gap-2">
								<button class="text-blue-600 underline text-xs" id="view-plantations-${bed.id}">Voir les plantations</button>
								<button class="text-gray-500 underline text-xs" id="edit-bed-${bed.id}">Modifier</button>
							</div>
						</div>
					`);
					layer.on('popupopen', () => {
						const viewBtn = document.getElementById(`view-plantations-${bed.id}`);
						const editBtn = document.getElementById(`edit-bed-${bed.id}`);
						if (viewBtn) viewBtn.onclick = () => onShowBedPlantations?.(bed.id);
						if (editBtn) editBtn.onclick = () => onEditBed?.(bed.id);
					});
					bedLayers.set(bed.id, layer);
				}
			} catch { /* empty */ }
		}

		map.on('dblclick', () => {
			// prevent default zoom when not on a polygon
		});

		map.on('click', (e: any) => {
			if (!drawing || !L) return;
			currentPoints = [...currentPoints, [e.latlng.lat, e.latlng.lng]];
			redraw();
		});
	});

	$effect(() => {
		const id = zoomToBedId;
		if (!map || !L || id == null) return;
		const layer = bedLayers.get(id);
		if (layer) {
			map.fitBounds(layer.getBounds(), { padding: [40, 40] });
		}
	});

	async function doSearch() {
		const q = searchQuery.trim();
		if (!q) return;
		searching = true;
		showResults = true;
		try {
			const res = await fetch(
				`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&accept-language=fr`
			);
			searchResults = await res.json();
		} catch {
			searchResults = [];
		}
		searching = false;
	}

	function goToResult(r: any) {
		if (!map) return;
		map.setView([parseFloat(r.lat), parseFloat(r.lon)], 15);
		showResults = false;
		searchQuery = r.display_name.split(',')[0];
	}

	function goToMyLocation() {
		if (!navigator.geolocation) {
			toast('Géolocalisation non supportée par votre navigateur', 'error');
			return;
		}
		if (!map || !L) {
			toast('Carte pas encore chargée, réessayez', 'error');
			return;
		}

		const timeout = setTimeout(() => toast('Géolocalisation : temps d\'attente dépassé', 'error'), 10000);

		function onPosition(pos: GeolocationPosition) {
			clearTimeout(timeout);
			const { latitude, longitude } = pos.coords;
			map.setView([latitude, longitude], 16);
			if (geoMarker) map.removeLayer(geoMarker);
			geoMarker = L.circleMarker([latitude, longitude], {
				radius: 8, color: '#2563eb', fillColor: '#3b82f6', fillOpacity: 0.6
			}).addTo(map).bindPopup('Votre position').openPopup();
		}

		function onError(err: GeolocationPositionError) {
			clearTimeout(timeout);
			if (err.code === err.PERMISSION_DENIED) {
				toast('Géolocalisation refusée — autorisez-la dans les paramètres du navigateur', 'error');
			} else if (err.code === err.TIMEOUT) {
				toast('Géolocalisation : temps d\'attente dépassé', 'error');
			} else {
				// POSITION_UNAVAILABLE — retry without high accuracy
				navigator.geolocation.getCurrentPosition(
					onPosition,
					(err2) => {
						const msg = err2.code === err2.PERMISSION_DENIED
							? 'Géolocalisation refusée'
							: 'Géolocalisation indisponible — vérifiez que la localisation est activée sur votre appareil';
						toast(msg, 'error');
					},
					{ enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
				);
			}
		}

		navigator.geolocation.getCurrentPosition(onPosition, onError, {
			enableHighAccuracy: true, timeout: 5000, maximumAge: 30000
		});
	}

	function redraw() {
		if (!map || !L) return;
		for (const m of markers) map.removeLayer(m);
		markers = [];
		if (polygonLayer) { map.removeLayer(polygonLayer); polygonLayer = null; }

		if (currentPoints.length === 0) return;

		for (const p of currentPoints) {
			const m = L.circleMarker(p, {
				radius: 5, color: '#2563eb', fillColor: '#3b82f6', fillOpacity: 1
			}).addTo(map);
			markers.push(m);
		}

		if (currentPoints.length >= 3) {
			polygonLayer = L.polygon(currentPoints, {
				color: '#fbbf24', fillOpacity: 0.2, dashArray: '5,5'
			}).addTo(map);
		} else if (currentPoints.length === 2) {
			polygonLayer = L.polyline(currentPoints, { color: '#fbbf24', dashArray: '5,5' }).addTo(map);
		}
	}

	function toggleDrawing() {
		drawing = !drawing;
		currentPoints = [];
		for (const m of markers) if (map) map.removeLayer(m);
		markers = [];
		if (polygonLayer && map) { map.removeLayer(polygonLayer); polygonLayer = null; }
	}

	function savePolygon() {
		if (currentPoints.length < 3) return;
		onSave?.(JSON.stringify(currentPoints));
		toggleDrawing();
	}
</script>

<div>
	<!-- Search + controls -->
	<div class="flex items-center gap-2 mb-2 flex-wrap">
		<div class="relative flex-1 min-w-[200px]">
			<form onsubmit={(e) => { e.preventDefault(); doSearch(); }}>
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Ville, village..."
					class="w-full border rounded px-3 py-1.5 text-sm"
				/>
			</form>
			{#if showResults && searchResults.length > 0}
				<div class="absolute top-full left-0 right-0 bg-white border rounded mt-1 shadow-lg z-50 max-h-48 overflow-y-auto">
					{#each searchResults as r}
						<button
							class="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 border-b last:border-0"
							onclick={() => goToResult(r)}
						>
							{r.display_name}
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<button
			class="px-3 py-1.5 rounded text-sm bg-blue-600 text-white whitespace-nowrap"
			onclick={goToMyLocation}
		>
			📌 Ma position
		</button>

		{#if !drawing}
			<button class="px-3 py-1.5 rounded text-sm bg-green-600 text-white whitespace-nowrap" onclick={toggleDrawing}>
				Dessiner une bande
			</button>
		{:else}
			<span class="text-sm font-medium text-blue-700">Cliquez sur la carte</span>
			<button class="px-3 py-1.5 rounded text-sm bg-amber-600 text-white" onclick={savePolygon} disabled={currentPoints.length < 3}>
				Valider ({currentPoints.length} pts)
			</button>
			<button class="px-3 py-1.5 rounded text-sm bg-gray-400 text-white" onclick={toggleDrawing}>
				Annuler
			</button>
		{/if}
	</div>

	<div bind:this={mapContainer} class="h-[65vh] min-h-[400px] rounded border z-0"></div>
</div>
