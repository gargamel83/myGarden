<script lang="ts">
	import LeafletMap from '$lib/components/LeafletMap.svelte';
	import { enhance } from '$app/forms';
	import { invalidate } from '$app/navigation';
	import { toast } from '$lib/toast.svelte';

	let { data } = $props();

	let photos = $derived(data.photos);
	let beds = $derived(data.beds);
	// svelte-ignore state_referenced_locally
	let selectedPhoto = $state(data.photos[0]?.filename || null);
	let drawingMode = $state(false);
	let currentPolygon = $state<[number, number][]>([]);
	let editingBed = $state<typeof beds[0] | null>(null);
	let showForm = $state(false);
	let tab = $state<'photo' | 'map'>((typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('gardenTab') as 'photo' | 'map' : null) || 'photo');
	let confirmDeleteId = $state<number | null>(null);
	let zoomToBedId = $state<number | null>(null);
	let showPlantations = $state<typeof data.beds[0] | null>(null);

	let canvas = $state<HTMLCanvasElement | null>(null);
	let img = $state<HTMLImageElement | null>(null);
	let scale = $state(1);

	function loadImage(filename: string) {
		selectedPhoto = filename;
		const image = new Image();
		image.src = `/uploads/${filename}`;
		image.onload = () => {
			img = image;
			drawCanvas();
		};
	}

	function drawCanvas() {
		if (!canvas || !img) return;
		const ctx = canvas.getContext('2d')!;
		const w = Math.min(img.naturalWidth, 1200);
		const h = img.naturalHeight * (w / img.naturalWidth);
		canvas.width = w;
		canvas.height = h;
		scale = img.naturalWidth / w;
		ctx.drawImage(img, 0, 0, w, h);

		for (const bed of beds) {
			drawPolygon(ctx, JSON.parse(bed.polygon), bed.color || '#4ade80', false);
		}

		if (currentPolygon.length > 0) {
			drawPolygon(ctx, currentPolygon, '#fbbf24', true);
		}
	}

	function drawPolygon(ctx: CanvasRenderingContext2D, pts: [number, number][], color: string, dashed: boolean) {
		if (pts.length < 2) return;
		ctx.beginPath();
		ctx.moveTo(pts[0][0], pts[0][1]);
		for (let i = 1; i < pts.length; i++) {
			ctx.lineTo(pts[i][0], pts[i][1]);
		}
		if (pts.length > 2) ctx.closePath();
		ctx.strokeStyle = color;
		ctx.lineWidth = dashed ? 2 : 3;
		ctx.setLineDash(dashed ? [5, 5] : []);
		ctx.stroke();
		if (pts.length > 2) {
			ctx.fillStyle = color + '33';
			ctx.fill();
		}
		ctx.setLineDash([]);
	}

	function handleCanvasClick(e: MouseEvent) {
		if (!drawingMode) return;
		if (!canvas) return;
		const rect = canvas.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;
		currentPolygon = [...currentPolygon, [x, y]];
		drawCanvas();
	}

	function finishPolygon() {
		if (currentPolygon.length < 3) return;
		editingBed = {
			id: 0,
			name: '',
			polygon: JSON.stringify(currentPolygon),
			type: 'pixel',
			color: '#4ade80',
			soilType: null,
			sunExposure: null,
			length: null,
			width: null,
			orientation: null,
			notes: null,
			createdAt: '',
			updatedAt: ''
		};
		showForm = true;
	}

	function cancelDrawing() {
		currentPolygon = [];
		drawingMode = false;
		drawCanvas();
	}

	function zoomToBed(bed: typeof beds[0]) {
		if (bed.type === 'geo' && bed.id) {
			zoomToBedId = bed.id;
			tab = 'map';
			sessionStorage.setItem('gardenTab', 'map');
		}
	}

	function editBed(bed: typeof beds[0]) {
		editingBed = bed;
		showForm = true;
	}

	function handleSaveEnhance() {
		return async ({ result }: { result: any }) => {
			if (result.type === 'success') {
				const isEdit = !!editingBed?.id;
				showForm = false;
				editingBed = null;
				currentPolygon = [];
				drawingMode = false;
				toast(isEdit ? 'Bed updated' : 'Bed created');
				await invalidate('app:garden');
			} else if (result.type === 'failure') {
				toast(result.data?.error || 'Error', 'error');
			}
		};
	}

	function handleDeleteEnhance() {
		return async ({ result }: { result: any }) => {
			if (result.type === 'success') {
				confirmDeleteId = null;
				showForm = false;
				toast('Bed deleted');
				await invalidate('app:garden');
			}
		};
	}

	function handleUploadEnhance() {
		return async ({ result }: { result: any }) => {
			if (result.type === 'success') {
				toast('Photo added');
			}
		};
	}

	function onMapBed(polygon: string) {
		editingBed = {
			id: 0,
			name: '',
			polygon,
			type: 'geo',
			color: '#4ade80',
			soilType: null,
			sunExposure: null,
			length: null,
			width: null,
			orientation: null,
			notes: null,
			createdAt: '',
			updatedAt: ''
		};
		showForm = true;
	}

	$effect(() => {
		if (tab === 'photo' && selectedPhoto) loadImage(selectedPhoto);
	});
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold">My Garden</h1>
	</div>

	<!-- Tab switcher -->
	<div class="flex gap-1 border-b">
		<button
			class="px-4 py-2 -mb-px border-b-2 {tab === 'photo' ? 'border-green-600 text-green-700 font-medium' : 'border-transparent text-gray-500'}"
			onclick={() => { tab = 'photo'; sessionStorage.setItem('gardenTab', 'photo'); }}
		>
			Satellite
		</button>
		<button
			class="px-4 py-2 -mb-px border-b-2 {tab === 'map' ? 'border-green-600 text-green-700 font-medium' : 'border-transparent text-gray-500'}"
			onclick={() => { tab = 'map'; sessionStorage.setItem('gardenTab', 'map'); }}
		>
			OSM Map
		</button>
	</div>

	{#if tab === 'photo'}
		<!-- Photo upload -->
		<form method="POST" action="?/upload" enctype="multipart/form-data" use:enhance={handleUploadEnhance} class="flex gap-3 items-end">
			<div>
				<label class="block text-sm text-gray-600 mb-1">
					Satellite photo
					<input type="file" name="photo" accept="image/*" class="block" />
				</label>
			</div>
			<div>
				<label class="block text-sm text-gray-600 mb-1">
					Name
					<input type="text" name="label" class="border rounded px-2 py-1" />
				</label>
			</div>
			<button class="bg-blue-600 text-white px-4 py-2 rounded">Upload</button>
		</form>

		<!-- Photo selector -->
		{#if data.photos.length > 0}
			<div class="flex gap-2 flex-wrap">
				{#each data.photos as photo}
					<button
						class="px-3 py-1 rounded text-sm {selectedPhoto === photo.filename ? 'bg-green-600 text-white' : 'bg-gray-200'}"
						onclick={() => loadImage(photo.filename)}
					>
						{photo.label}
					</button>
				{/each}
			</div>
		{/if}

		<!-- Canvas -->
		<div class="relative border rounded overflow-hidden bg-gray-100">
			<canvas
				bind:this={canvas}
				onclick={handleCanvasClick}
				class="max-w-full cursor-crosshair"
			></canvas>
			{#if !drawingMode}
				<div class="absolute top-2 left-2">
					<button class="bg-green-600 text-white px-3 py-1 rounded text-sm" onclick={() => { drawingMode = true; currentPolygon = []; drawCanvas(); }}>
						Add a bed
					</button>
				</div>
			{:else}
				<div class="absolute top-2 left-2 bg-black/70 text-white px-3 py-1 rounded text-sm">
					Click to add points.
					<button class="text-green-300 underline" onclick={finishPolygon}>Finish</button>
					<button class="text-red-300 underline ml-2" onclick={cancelDrawing}>Cancel</button>
				</div>
			{/if}
		</div>
	{:else}
		<!-- OSM Map -->
		<LeafletMap existingBeds={beds} onSave={onMapBed} {zoomToBedId} onEditBed={(id) => {
			const bed = beds.find(b => b.id === id);
			if (bed) editBed(bed);
		}} onShowBedPlantations={(id) => {
			const bed = beds.find(b => b.id === id);
			if (bed) showPlantations = bed;
		}} />
	{/if}

	<!-- Bed list -->
	<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
		{#each beds as bed}
			{@const bPlantations = data.bedPlantations[bed.id] || []}
			<button
				class="border rounded p-3 text-left hover:shadow"
				onclick={() => showPlantations = bed}
			>
				<div class="flex items-center gap-2">
					<span class="w-3 h-3 rounded-full shrink-0" style="background: {bed.color}"></span>
					<span class="font-medium truncate">{bed.name}</span>
					{#if bed.type === 'geo'}
						<span class="text-xs text-gray-400 shrink-0">🌍</span>
					{/if}
				</div>
				<div class="text-xs text-gray-500 mt-1 space-y-0.5">
					{#if bed.length && bed.width}
						<p>{bed.length} × {bed.width} m</p>
					{/if}
					{#if bed.soilType}
						<p>{bed.soilType}</p>
					{/if}
					{#if bed.orientation}
						<p>Orientation {bed.orientation}</p>
					{/if}
					{#if bPlantations.length > 0}
						<p class="text-xs {bPlantations.filter(p => p.status !== 'harvested' && p.status !== 'cancelled').length > 0 ? 'text-green-600' : 'text-gray-400'}">
							{bPlantations.length} plantation{bPlantations.length > 1 ? 's' : ''}
						</p>
					{/if}
				</div>
			</button>
		{/each}
	</div>

	<!-- Rotation alerts -->
	{#if data.rotationAlerts.length > 0}
		<div class="space-y-2">
			<h2 class="font-bold text-lg">Crop rotation</h2>
			{#each data.rotationAlerts as alert}
				<div class="border-l-4 px-4 py-2 {alert.type === 'warning' ? 'border-red-500 bg-red-50' : 'border-blue-500 bg-blue-50'}">
					<p class="text-sm">{alert.message}</p>
					{#if alert.suggestedPlants}
						<p class="text-xs text-gray-500 mt-1">
							Suggestions: {alert.suggestedPlants.join(', ')}
						</p>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Bed edit dialog -->
{#if showForm && editingBed}

	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center" onclick={(e) => { if (e.target === e.currentTarget) showForm = false; }} onkeydown={(e) => e.key === 'Escape' && (showForm = false)} role="dialog" aria-modal="true" tabindex="-1">
		<div class="bg-white rounded-lg p-6 w-96" role="none">
			<form method="POST" action="?/saveBed" use:enhance={handleSaveEnhance} onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()}>
				<input type="hidden" name="id" value={editingBed.id || ''} />
				<input type="hidden" name="polygon" value={editingBed.polygon} />
				<input type="hidden" name="coordinatesType" value={tab === 'map' ? 'geo' : 'pixel'} />
				<input type="hidden" name="color" value={editingBed.color || '#4ade80'} />
				<h2 class="text-lg font-bold mb-4">
					{editingBed.id ? 'Edit' : 'New'} bed
				</h2>
				{#if editingBed.soilType || editingBed.sunExposure}
					{@const advice = data.bedAdvice[editingBed.id] || []}
					{#if advice.length > 0}
						<div class="mb-4 p-3 bg-green-50 rounded text-xs">
							<p class="font-medium text-green-700 mb-1">🌱 Plants suitable for this bed</p>
							<p class="text-green-600">{advice.join(', ')}</p>
						</div>
					{/if}
				{/if}
				{#if editingBed.id}
					{@const bedId = editingBed.id}
					{@const history = data.bedHistories[bedId]}
					{@const alert = data.rotationAlerts.find(a => a.bedId === bedId)}
					{#if history && history.length > 0}
						<div class="mb-4 p-3 bg-gray-50 rounded text-xs">
							<p class="font-medium text-gray-700 mb-1">Planting history</p>
							{#each history as h}
								<div class="flex justify-between">
									<span>{h.plantName}</span>
									<span class="text-gray-400">{h.family || '—'}</span>
								</div>
							{/each}
							{#if alert}
								<p class="mt-2 text-{alert.type === 'warning' ? 'red' : 'blue'}-600">{alert.message}</p>
							{/if}
						</div>
					{/if}
				{/if}
				<div class="space-y-3">
					<div>
						<label class="block text-sm text-gray-600">
						Name
						<input type="text" name="name" bind:value={editingBed.name} required class="w-full border rounded px-2 py-1" />
						</label>
					</div>
					<div class="flex gap-3">
						<div class="flex-1">
							<label class="block text-sm text-gray-600">
								Exposure
								<select name="sunExposure" bind:value={editingBed.sunExposure} class="w-full border rounded px-2 py-1">
									<option value="">—</option>
									<option value="plein_soleil">Full sun</option>
									<option value="mi_ombre">Partial shade</option>
									<option value="ombre">Shade</option>
								</select>
							</label>
						</div>
					</div>
					<div class="flex gap-3">
						<div class="flex-1">
							<label class="block text-sm text-gray-600">
								Length (m)
								<input type="number" step="0.1" name="length" bind:value={editingBed.length} class="w-full border rounded px-2 py-1" />
							</label>
						</div>
						<div class="flex-1">
							<label class="block text-sm text-gray-600">
								Width (m)
								<input type="number" step="0.1" name="width" bind:value={editingBed.width} class="w-full border rounded px-2 py-1" />
							</label>
						</div>
						<div class="flex-1">
							<label class="block text-sm text-gray-600">
								Orientation
								<select name="orientation" bind:value={editingBed.orientation} class="w-full border rounded px-2 py-1">
									<option value="">—</option>
									<option value="N">North</option>
									<option value="S">South</option>
									<option value="E">East</option>
									<option value="W">West</option>
									<option value="NE">Northeast</option>
									<option value="NW">Northwest</option>
									<option value="SE">Southeast</option>
									<option value="SW">Southwest</option>
								</select>
							</label>
						</div>
					</div>
					<div>
						<label class="block text-sm text-gray-600">
							Soil type
							<input type="text" name="soilType" bind:value={editingBed.soilType} class="w-full border rounded px-2 py-1" />
						</label>
					</div>
					<div>
						<label class="block text-sm text-gray-600">
							Notes
							<textarea name="notes" bind:value={editingBed.notes} class="w-full border rounded px-2 py-1"></textarea>
						</label>
					</div>
					<div class="flex justify-between pt-2">
						{#if editingBed.id}
							<button type="button" class="text-red-600 text-sm" onclick={() => confirmDeleteId = editingBed!.id}>Delete</button>
						{/if}
						<div class="flex gap-2 ml-auto">
							<button type="button" class="px-4 py-2 border rounded" onclick={(e) => { if (e.target === e.currentTarget) showForm = false; }}>Cancel</button>
							<button type="submit" class="px-4 py-2 bg-green-600 text-white rounded">
								Save
							</button>
						</div>
					</div>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Plantations d'une bande -->
{#if showPlantations}
	{@const bed = showPlantations}
	{@const list = data.bedPlantations[bed.id] || []}
	{@const stats = { total: list.length, active: list.filter(p => p.status !== 'harvested' && p.status !== 'cancelled').length }}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onclick={(e) => { if (e.target === e.currentTarget) showPlantations = null; }} onkeydown={(e) => e.key === 'Escape' && (showPlantations = null)} role="dialog" aria-modal="true" tabindex="-1">
		<div class="bg-white rounded-lg p-6 w-[500px] max-h-[80vh] overflow-y-auto" role="none">
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-lg font-bold">{bed.name}</h2>
				<div class="flex items-center gap-2 text-sm text-gray-500">
					{stats.active > 0 ? `${stats.active} active${stats.active > 1 ? 's' : ''}` : ''}
					{stats.total > 0 ? `(${stats.total} total${stats.total > 1 ? 's' : ''})` : 'No plantations'}
				</div>
			</div>

			{#if bed.soilType || bed.sunExposure || bed.orientation}
				<div class="flex gap-3 mb-4 text-xs text-gray-500">
					{#if bed.soilType}<span>Soil: {bed.soilType}</span>{/if}
					{#if bed.sunExposure}<span>Exposure: {bed.sunExposure}</span>{/if}
					{#if bed.orientation}<span>Orientation: {bed.orientation}</span>{/if}
				</div>
			{/if}

			{#if list.length === 0}
				<p class="text-gray-400 text-center py-8 text-sm">No plantations in this bed.</p>
			{:else}
				<div class="space-y-2">
					{#each list as p}
						<div class="border rounded p-3 flex items-center justify-between">
							<div>
								<div class="flex items-center gap-2">
									<span class="font-medium text-sm">{p.plantName}</span>
									{#if p.variety}
										<span class="text-xs text-gray-400">({p.variety})</span>
									{/if}
								</div>
								<div class="text-xs text-gray-400 mt-1 flex gap-2">
									{#if p.sowingDate}<span>Sowing: {p.sowingDate}</span>{/if}
									{#if p.plantingDate}<span>Transplanting: {p.plantingDate}</span>{/if}
									{#if p.harvestDate}<span>Harvest: {p.harvestDate}</span>{/if}
								</div>
							</div>
							<span class="px-2 py-0.5 rounded text-xs font-medium {p.status === 'planned' ? 'bg-gray-200 text-gray-600' : p.status === 'sown' ? 'bg-blue-100 text-blue-700' : p.status === 'planted' ? 'bg-green-100 text-green-700' : p.status === 'harvested' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}">
								{p.status === 'planned' ? 'Planned' : p.status === 'sown' ? 'Sown' : p.status === 'planted' ? 'Transplanted' : p.status === 'harvested' ? 'Harvested' : 'Cancelled'}
							</span>
						</div>
					{/each}
				</div>
			{/if}

			<div class="flex justify-between mt-6 pt-4 border-t">
				<button class="text-blue-600 text-sm" onclick={() => { showPlantations = null; editBed(bed); }}>
					Edit bed
				</button>
				<div class="flex gap-2">
					{#if bed.type === 'geo'}
						<button class="text-sm text-gray-600 underline" onclick={() => { showPlantations = null; zoomToBed(bed); }}>
							View on map
						</button>
					{/if}
					<a href="/plantations" class="text-sm bg-green-600 text-white px-3 py-1.5 rounded">
						+ New planting
					</a>
				</div>
			</div>
		</div>
	</div>
{/if}

{#if confirmDeleteId}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onclick={(e) => { if (e.target === e.currentTarget) confirmDeleteId = null; }} onkeydown={(e) => e.key === 'Escape' && (confirmDeleteId = null)} role="dialog" aria-modal="true" tabindex="-1">
		<div class="bg-white rounded-lg p-6 w-80 shadow-xl" role="none">
			<form method="POST" action="?/deleteBed" use:enhance={handleDeleteEnhance}>
				<input type="hidden" name="id" value={confirmDeleteId} />
				<h3 class="font-bold text-lg mb-2">Delete bed</h3>
				<p class="text-sm text-gray-600 mb-5">This action is irreversible. All linked plantations will also be deleted.</p>
				<div class="flex justify-end gap-2">
					<button type="button" class="px-4 py-2 border rounded text-sm" onclick={() => confirmDeleteId = null}>Cancel</button>
					<button type="submit" class="px-4 py-2 bg-red-600 text-white rounded text-sm">Delete</button>
				</div>
			</form>
		</div>
	</div>
{/if}
