<script lang="ts">
	import LeafletMap from '$lib/components/LeafletMap.svelte';
	import GridCanvas from '$lib/components/GridCanvas.svelte';
	import { enhance } from '$app/forms';
	import { invalidate } from '$app/navigation';
	import { toast } from '$lib/toast.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import { STATUS_COLORS, type PlantStatus } from '$lib/types';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { localeStore, t } from '$lib/i18n';
	let _locale = $localeStore;

	let { data } = $props();

	let photos = $derived(data.photos);
	let beds = $derived(data.beds);
	let selectedPhoto = $state<(typeof data.photos)[0] | null>(null);
	let editingBed = $state<typeof beds[0] | null>(null);
	let showForm = $state(false);
	let showUpload = $state(true);

	$effect(() => {
		if (data.photos.length > 0 && !selectedPhoto) {
			selectedPhoto = data.photos[0];
			showUpload = false;
		} else if (data.photos.length === 0) {
			selectedPhoto = null;
			showUpload = true;
		}
	});
	let tab = $state<'plan' | 'map'>((typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('gardenTab') as 'plan' | 'map' : null) || 'plan');
	let confirmDeleteId = $state<number | null>(null);
	let zoomToBedId = $state<number | null>(null);
	let showPlantations = $state<typeof data.beds[0] | null>(null);

	function handleSaveBed(polygon: string) {
		editingBed = {
			id: 0,
			userId: 0,
			name: '',
			polygon,
			type: 'pixel',
			color: '#64748b',
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

	function onMapBed(polygon: string) {
		editingBed = {
			id: 0,
			userId: 0,
			name: '',
			polygon,
			type: 'geo',
			color: '#64748b',
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

	const handleSaveEnhance: SubmitFunction = (_input) => {
		const wasEdit = !!editingBed?.id;
		return async ({ result }) => {
			if (result.type === 'success') {
				showForm = false;
				editingBed = null;
				toast(wasEdit ? t('garden.bed.updated') : t('garden.bed.created'));
				await invalidate('app:garden');
			} else if (result.type === 'failure') {
				toast(result.data?.error || t('common.error'), 'error');
			}
		};
	}

	const handleDeleteEnhance: SubmitFunction = (_input) => {
		return async ({ result }) => {
			if (result.type === 'success') {
				confirmDeleteId = null;
				showForm = false;
				toast(t('garden.bed.deleted'));
				await invalidate('app:garden');
			}
		};
	}

	const handleUploadEnhance: SubmitFunction = (_input) => {
		return async ({ result }) => {
			if (result.type === 'success') {
				toast(t('garden.bed.photoAdded'));
				await invalidate('app:garden');
			}
		};
	}

</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold">{t('garden.title')}</h1>
	</div>

	<!-- Tab switcher -->
	<div class="flex gap-1 border-b">
		<button
			class="px-4 py-2 -mb-px border-b-2 {tab === 'plan' ? 'border-[var(--tab-border)] text-[var(--tab-text)] font-medium' : 'border-transparent text-gray-500'}"
			onclick={() => { tab = 'plan'; sessionStorage.setItem('gardenTab', 'plan'); }}
		>
			{t('garden.plan')}
		</button>
		<button
			class="px-4 py-2 -mb-px border-b-2 {tab === 'map' ? 'border-[var(--tab-border)] text-[var(--tab-text)] font-medium' : 'border-transparent text-gray-500'}"
			onclick={() => { tab = 'map'; sessionStorage.setItem('gardenTab', 'map'); }}
		>
			{t('garden.map')}
		</button>
	</div>

	{#if tab === 'plan'}
		{#if photos.length > 0}
			<div class="flex items-center gap-2 mb-2">
				<button class="text-xs text-gray-500 hover:text-gray-700 underline" onclick={() => showUpload = !showUpload}>
					{showUpload ? t('garden.hide') : '📷'} {t('garden.photo')}
				</button>
				<div class="flex gap-1 flex-wrap">
					{#each photos as photo}
						<button
							class="px-2 py-0.5 rounded text-xs {selectedPhoto?.filename === photo.filename ? 'bg-[var(--btn-bg)] text-white' : 'bg-gray-200 hover:bg-gray-300'}"
							onclick={() => selectedPhoto = photo}
						>
							{photo.label}
						</button>
					{/each}
				</div>
			</div>
		{/if}

		{#if showUpload}
			<form method="POST" action="?/upload" enctype="multipart/form-data" use:enhance={handleUploadEnhance} class="flex gap-3 items-end mb-2 p-3 bg-gray-50 rounded border">
				<div>
					<label class="block text-xs text-gray-600 mb-1">
						{t('garden.satellitePhoto')}
						<input type="file" name="photo" accept="image/*" class="block text-sm" />
					</label>
				</div>
				<div>
					<label class="block text-xs text-gray-600 mb-1">
						{t('garden.name')}
						<input type="text" name="label" class="border rounded px-2 py-1 text-sm" />
					</label>
				</div>
				<button class="bg-blue-600 text-white px-3 py-1.5 rounded text-sm">{t('garden.upload')}</button>
			</form>
		{/if}

		<GridCanvas
			beds={data.beds}
			photoUrl={selectedPhoto ? `/uploads/${selectedPhoto.filename}` : null}
			onSaveBed={handleSaveBed}
			onEditBed={(id) => { const bed = beds.find(b => b.id === id); if (bed) editBed(bed); }}
		/>
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
						<p>{t('garden.plantations.orientationLabel', { dir: t('garden.bed.orientation' + bed.orientation) })}</p>
					{/if}
					{#if bPlantations.length > 0}
						<p class="text-xs {bPlantations.filter(p => p.status !== 'harvested' && p.status !== 'cancelled').length > 0 ? 'text-gray-500' : 'text-gray-400'}">
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
			<h2 class="font-bold text-lg">{t('garden.cropRotation')}</h2>
			{#each data.rotationAlerts as alert}
				<div class="border-l-4 px-4 py-2 {alert.type === 'warning' ? 'border-red-500 bg-red-50' : 'border-blue-500 bg-blue-50'}">
					<p class="text-sm">{alert.message}</p>
					{#if alert.suggestedPlants}
						<p class="text-xs text-gray-500 mt-1">
							{t('garden.suggestions', { plants: alert.suggestedPlants.join(', ') })}
						</p>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Bed edit dialog -->
<Modal open={showForm && !!editingBed} onclose={() => showForm = false} class="w-96">
	{#if editingBed}
	<form method="POST" action="?/saveBed" use:enhance={handleSaveEnhance}>
				<input type="hidden" name="id" value={editingBed.id || ''} />
				<input type="hidden" name="polygon" value={editingBed.polygon} />
				<input type="hidden" name="coordinatesType" value={tab === 'map' ? 'geo' : 'pixel'} />
				<input type="hidden" name="color" value={editingBed.color || '#64748b'} />
				<h2 class="text-lg font-bold mb-4">
					{editingBed.id ? t('garden.bed.edit') : t('garden.bed.new')}
				</h2>
				{#if editingBed.soilType || editingBed.sunExposure}
					{@const advice = data.bedAdvice[editingBed.id] || []}
					{#if advice.length > 0}
						<div class="mb-4 p-3 bg-[var(--bg-subtle)] rounded text-xs">
							<p class="font-medium text-[var(--text-primary)] mb-1">{t('garden.suitablePlants')}</p>
							<p class="text-slate-600">{advice.join(', ')}</p>
						</div>
					{/if}
				{/if}
				{#if editingBed.id}
					{@const bedId = editingBed.id}
					{@const history = data.bedHistories[bedId]}
					{@const alert = data.rotationAlerts.find(a => a.bedId === bedId)}
					{#if history && history.length > 0}
						<div class="mb-4 p-3 bg-gray-50 rounded text-xs">
							<p class="font-medium text-gray-700 mb-1">{t('garden.plantingHistory')}</p>
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
						{t('garden.bed.name')}
						<input type="text" name="name" bind:value={editingBed.name} required class="w-full border rounded px-2 py-1" />
						</label>
					</div>
					<div class="flex gap-3">
						<div class="flex-1">
						<label class="block text-sm text-gray-600">
							{t('garden.bed.exposure')}
							<select name="sunExposure" bind:value={editingBed.sunExposure} class="w-full border rounded px-2 py-1">
								<option value="">—</option>
								<option value="plein_soleil">{t('exposure.plein_soleil')}</option>
								<option value="mi_ombre">{t('exposure.mi_ombre')}</option>
								<option value="ombre">{t('exposure.ombre')}</option>
							</select>
						</label>
						</div>
					</div>
					<div class="flex gap-3">
						<div class="flex-1">
						<label class="block text-sm text-gray-600">
							{t('garden.bed.length')}
							<input type="number" step="0.1" name="length" bind:value={editingBed.length} class="w-full border rounded px-2 py-1" />
						</label>
					</div>
					<div class="flex-1">
						<label class="block text-sm text-gray-600">
							{t('garden.bed.width')}
								<input type="number" step="0.1" name="width" bind:value={editingBed.width} class="w-full border rounded px-2 py-1" />
							</label>
						</div>
						<div class="flex-1">
						<label class="block text-sm text-gray-600">
							{t('garden.bed.orientation')}
							<select name="orientation" bind:value={editingBed.orientation} class="w-full border rounded px-2 py-1">
								<option value="">—</option>
								<option value="N">{t('garden.bed.orientationN')}</option>
								<option value="S">{t('garden.bed.orientationS')}</option>
								<option value="E">{t('garden.bed.orientationE')}</option>
								<option value="W">{t('garden.bed.orientationW')}</option>
								<option value="NE">{t('garden.bed.orientationNE')}</option>
								<option value="NW">{t('garden.bed.orientationNW')}</option>
								<option value="SE">{t('garden.bed.orientationSE')}</option>
								<option value="SW">{t('garden.bed.orientationSW')}</option>
							</select>
						</label>
						</div>
					</div>
					<div>
						<label class="block text-sm text-gray-600">
							{t('garden.bed.soilType')}
							<select name="soilType" bind:value={editingBed.soilType} class="w-full border rounded px-2 py-1">
								<option value="">—</option>
								<option value="riche">{t('soil.riche')}</option>
								<option value="meuble">{t('soil.meuble')}</option>
								<option value="lourd">{t('soil.lourd')}</option>
								<option value="léger">{t('soil.léger')}</option>
							</select>
						</label>
					</div>
					<div>
						<label class="block text-sm text-gray-600">
							{t('garden.bed.notes')}
							<textarea name="notes" bind:value={editingBed.notes} class="w-full border rounded px-2 py-1"></textarea>
						</label>
					</div>
					<div class="flex justify-between pt-2">
						{#if editingBed.id}
							<button type="button" class="text-red-600 text-sm" onclick={() => confirmDeleteId = editingBed!.id}>{t('garden.bed.delete')}</button>
						{/if}
						<div class="flex gap-2 ml-auto">
							<button type="button" class="px-4 py-2 border rounded" onclick={(e) => { if (e.target === e.currentTarget) showForm = false; }}>{t('garden.bed.cancel')}</button>
							<button type="submit" class="px-4 py-2 bg-[var(--btn-bg)] text-white rounded">
								{t('garden.bed.save')}
							</button>
						</div>
					</div>
				</div>
			</form>
	{/if}
</Modal>

<!-- Plantations d'une bande -->
<Modal open={!!showPlantations} onclose={() => showPlantations = null} class="w-[500px] max-h-[80vh] overflow-y-auto">
	{#if showPlantations}
	{@const bed = showPlantations}
	{@const list = data.bedPlantations[bed.id] || []}
	{@const stats = { total: list.length, active: list.filter(p => p.status !== 'harvested' && p.status !== 'cancelled').length }}
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-lg font-bold">{t('garden.plantations.title', { name: bed.name })}</h2>
				<div class="flex items-center gap-2 text-sm text-gray-500">
					{stats.active > 0 ? t('garden.plantations.active', { count: stats.active }) : ''}
					{stats.total > 0 ? t('garden.plantations.total', { count: stats.total }) : t('garden.plantations.none')}
				</div>
			</div>

			{#if bed.soilType || bed.sunExposure || bed.orientation}
				<div class="flex gap-3 mb-4 text-xs text-gray-500">
					{#if bed.soilType}<span>{t('garden.plantations.soil', { type: bed.soilType })}</span>{/if}
					{#if bed.sunExposure}<span>{t('garden.plantations.exposure', { type: bed.sunExposure })}</span>{/if}
					{#if bed.orientation}<span>{t('garden.plantations.orientationLabel', { dir: t('garden.bed.orientation' + bed.orientation) })}</span>{/if}
				</div>
			{/if}

			{#if list.length === 0}
				<p class="text-gray-400 text-center py-8 text-sm">{t('garden.plantations.noPlantations')}</p>
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
									{#if p.sowingDate}<span>{t('timeline.sowing', { date: p.sowingDate })}</span>{/if}
									{#if p.plantingDate}<span>{t('timeline.transplanting', { date: p.plantingDate })}</span>{/if}
									{#if p.harvestDate}<span>{t('timeline.harvest', { date: p.harvestDate })}</span>{/if}
								</div>
							</div>
							<span class="px-2 py-0.5 rounded text-xs font-medium {STATUS_COLORS[p.status as PlantStatus]}">
								{t('status.' + p.status)}
							</span>
						</div>
					{/each}
				</div>
			{/if}

			<div class="flex justify-between mt-6 pt-4 border-t">
				<button class="text-blue-600 text-sm" onclick={() => { showPlantations = null; editBed(bed); }}>
					{t('garden.plantations.editBed')}
				</button>
				<div class="flex gap-2">
					{#if bed.type === 'geo'}
						<button class="text-sm text-gray-600 underline" onclick={() => { showPlantations = null; zoomToBed(bed); }}>
							{t('garden.plantations.viewOnMap')}
						</button>
					{/if}
					<a href="/plantations" class="text-sm bg-[var(--btn-bg)] text-white px-3 py-1.5 rounded">
						{t('garden.plantations.newPlanting')}
					</a>
				</div>
			</div>
	{/if}
</Modal>

<Modal open={!!confirmDeleteId} onclose={() => confirmDeleteId = null} class="w-80 shadow-xl">
	<form method="POST" action="?/deleteBed" use:enhance={handleDeleteEnhance}>
		<input type="hidden" name="id" value={confirmDeleteId} />
		<h3 class="font-bold text-lg mb-2">{t('garden.bed.delete')}</h3>
		<p class="text-sm text-gray-600 mb-5">{t('garden.bed.deleteConfirm')}</p>
		<div class="flex justify-end gap-2">
			<button type="button" class="px-4 py-2 border rounded text-sm" onclick={() => confirmDeleteId = null}>{t('garden.bed.cancel')}</button>
			<button type="submit" class="px-4 py-2 bg-red-600 text-white rounded text-sm">{t('garden.bed.delete')}</button>
		</div>
	</form>
</Modal>
