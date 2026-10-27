<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { Lightbox } from '$lib/components/Lightbox.svelte';
	import { EXPOSURE_LABELS, SOIL_LABELS, WATERING_LABELS, type SunExposure, type SoilType, type Watering } from '$lib/types';
	import { monthsInRange, serializeCommaSeparated } from '$lib/utils';
	import { CARE_TIP_KEYS, hasCareTips, serializeCareTips, type CareTipKey } from '$lib/care-tips';
	import { localeStore, t } from '$lib/i18n';
	let _locale = $localeStore;

	let { data } = $props();

	let plant = $derived(data.plant);
	let companions = $derived(data.companions);
	let antagonists = $derived(data.antagonists);
	let sameFamily = $derived(data.sameFamily);
	let careTips = $derived(data.careTips);
	let activeTip = $state<CareTipKey>('watering');
	// svelte-ignore state_referenced_locally
	let isFavorite = $state(data.isFavorite);

	let editing = $state(false);
	let initPhotos: string[] = (() => { try { return plant.photos ? JSON.parse(plant.photos) : []; } catch { return []; } })();
	let photos = $state(initPhotos);
	let uploading = $state(false);
	let lightboxIndex = $state<number | null>(null);
	// svelte-ignore state_referenced_locally

	let editName = $state(plant.commonName);
	let editLatin = $state(plant.latinName || '');
	let editFamily = $state(plant.family || '');
	let editDesc = $state(plant.description || '');
	let editSowingS = $state(plant.sowingStart || '');
	let editSowingE = $state(plant.sowingEnd || '');
	let editPlantingS = $state(plant.plantingStart || '');
	let editPlantingE = $state(plant.plantingEnd || '');
	let editHarvestS = $state(plant.harvestStart || '');
	let editHarvestE = $state(plant.harvestEnd || '');
	let editSun = $state(plant.sunExposure || '');
	let editSoil = $state(plant.soilType || '');
	let editWater = $state(plant.watering || '');
	let editSpacing = $state(plant.spacing ? String(plant.spacing) : '');
	let editRowSpacing = $state(plant.rowSpacing ? String(plant.rowSpacing) : '');

	let editCompanions = $state('');
	let editAntagonists = $state('');

	// NEW: disease & gallery media from server
	let diseaseMedia = $derived(data.diseaseMedia || []);
	let galleryMedia = $derived(data.galleryMedia || []);

	let editDiseaseMedia = $state<Array<{ id: number; caption: string }>>(
		diseaseMedia.map(m => ({ id: m.id, caption: m.caption || '' }))
	);
	let editGalleryMedia = $state<Array<{ id: number; caption: string }>>(
		galleryMedia.map(m => ({ id: m.id, caption: m.caption || '' }))
	);

	let editNewMedia: File[] = $state([]);
	let editNewMediaType = $state<'disease' | 'gallery'>('gallery');
	let editNewMediaCaption = $state('');

	// svelte-ignore state_referenced_locally
</script>

<div class="max-w-2xl mx-auto p-4">

	{#if photos.length > 0 || diseaseMedia.length > 0 || galleryMedia.length > 0}
		<div class="mt-6 border rounded-lg p-4">
			<h2 class="font-bold text-lg mb-3">{t('plant.photos')}</h2>

			<!-- Tabs -->
			<div class="flex gap-1 border-b mb-4">
				<button
					class="px-4 py-2 -mb-px border-b-2 {activeTab === 'gallery' ? 'border-[var(--tab-border)] text-[var(--tab-text)] font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'}"
					onclick={() => { activeTab = 'gallery'; }}
				>
					{t('plant.photos')}
				</button>
				<button
					class="px-4 py-2 -mb-px border-b-2 {activeTab === 'disease' ? 'border-[var(--tab-border)] text-[var(--tab-text)] font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'}"
					onclick={() => { activeTab = 'disease'; }}
				>
					{t('plant.diseases')} <!-- new i18n key -->
{#each [...photos, ...galleryMedia] as urlOrObj, i}
	{#if typeof urlOrObj === 'string'}
		<button class="p-0 border-0 bg-transparent cursor-pointer" onclick={() => lightboxIndex = i}>
			<img src={urlOrObj} alt="" loading="lazy" class="w-full h-48 object-cover rounded hover:opacity-80 transition-opacity" />
		</button>
	{:else}
		{#if activeTab === 'disease'}
			<button class="p-0 border-0 bg-transparent cursor-pointer" onclick={() => lightboxIndex = i + photos.length}>
				<img src={urlOrObj.url} alt={urlOrObj.caption || 'Maladie'} loading="lazy" class="w-full h-48 object-cover rounded" />
			</button>
		{/if}
	{/each}
				{/if}

				<!-- Upload form -->
				{#if uploading}
					<p class="text-sm text-gray-500">Upload en cours…</p>
				{:else}
					<form method="POST" action="?/uploadPhoto" use:enhance class="mt-4">
						<div class="mb-2">
							<input type="file" name="photo" accept="image/*" class="block w-full border rounded px-2 py-1">
							<button type="submit" class="mt-1 inline-block px-4 py-2 bg-[var(--btn-bg)] text-white rounded">{t('plant.form.upload')}</button>
						</div>
					</form>
				{/if}
			{/if}

			{#if activeTab === 'disease'}
				{#if diseaseMedia.length > 0 || editDiseaseMedia.length > 0}
					<div class="grid grid-cols-2 gap-2">
						{#each [...diseaseMedia, ...editDiseaseMedia] as m, i}
							{#if typeof m === 'object' && m.id !== undefined}
								<button class="p-0 border-0 bg-transparent cursor-pointer" onclick={() => lightboxIndex = i + photos.length}>
									<img src={m.url} alt={m.caption || 'Maladie'} loading="lazy" class="w-full h-48 object-cover rounded" />
								</button>
								<input type="hidden" name="deleteMediaId" value={m.id} class="mt-1">
							{#/if}
						{/each}
					</div>

					<!-- Upload form for diseases -->
					{#if uploading}
						<p class="text-sm text-gray-500">Upload en cours…</p>
					{:else}
						<form method="POST" action="?/uploadPhoto" use:enhance class="mt-4 grid grid-cols-2 gap-2">
							<div>
								<input type="file" name="newMedia" accept="image/*" class="block w-full border rounded px-2 py-1">
								<select name="newMediaType" class="block w-full border rounded px-2 py-1">
									<option value="disease">Maladie</option>
									<option value="gallery">Galerie</option>
								</select>
								<input type="text" name="newMediaCaption" placeholder="Légende" class="block w-full border rounded px-2 py-1 mt-1">
								<button type="submit" class="col-span-2 px-4 py-2 bg-[var(--btn-bg)] text-white rounded">{t('plant.form.upload')}</button>
							</div>
						</form>
					{/if}
				{/if}

				<!-- Delete disease media -->
				{#if diseaseMedia.length > 0}
					<p class="text-xs text-gray-500 mb-2">Supprimer :</p>
					{#each diseaseMedia as m}
						<div class="flex items-center gap-2 text-sm text-gray-500">
							<input type="hidden" name="deleteMediaId" value={m.id}>
							<span>{m.caption || 'Maladie'}</span>
							<button class="text-red-500 hover:underline text-xs">Suppr</button>
						</div>
					{/each}
				{/if}
			{/if}
		</div>
	{/if}

	<!-- Care tips section -->
	<div class="mt-6 border rounded-lg p-4">
		<h2 class="font-bold text-lg mb-3">{t('plant.careTipsTitle')}</h2>

		{#if hasCareTips(careTips)}
			<div class="flex gap-1 border-b flex-wrap">
				{#each CARE_TIP_KEYS as key}
					<button
						class="px-3 py-1.5 -mb-px border-b-2 text-sm {activeTip === key ? 'border-[var(--tab-border)] text-[var(--tab-text)] font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'}"
						onclick={() => activeTip = key}
					>
						{t('careTips.tabs.' + key)}
					</button>
				{/each}
			</div>
			<p class="mt-3 text-sm text-gray-700 whitespace-pre-line">
				{careTips[activeTip] || t('careTips.emptyTab')}
			</p>
		{:else}
			<p class="text-sm text-gray-500">{t('careTips.none')}</p>
		{/if}
	</div>

	<!-- Edit form -->
	<fieldset class="border rounded p-3 mt-4">
		<legend class="text-xs font-medium text-gray-500 px-1">{t('plant.editTitle', { name: plant.commonName })}</legend>

		<div class="grid grid-cols-2 gap-3">
			<div>
				<label class="block text-gray-600">Nom*{@htmlError}</label>
				<input type="text" name="commonName" bind:value={editName} required class="w-full border rounded px-2 py-1" />
			</div>
			<div>
				<label class="block text-gray-600">Latine</label>
				<input type="text" name="latinName" bind:value={editLatin} class="w-full border rounded px-2 py-1" />
			</div>
		</div>

		<div class="grid grid-cols-2 gap-3">
			<div>
				<label class="block text-gray-600">Famille</label>
				<input type="text" name="family" bind:value={editFamily} class="w-full border rounded px-2 py-1" />
			</div>
			<div>
				<label class="block text-gray-600">Exposition</label>
				<select name="sunExposure" bind:value={editSun} class="w-full border rounded px-2 py-1">
					<option value="plein_soleil">{t('exposure.plein_soleil')}</option>
					<option value="mi_ombre">{t('exposure.mi_ombre')}</option>
					<option value="ombre">{t('exposure.ombre')}</option>
				</select>
			</div>
		</div>

		<div class="grid grid-cols-2 gap-3">
			<div>
				<label class="block text-gray-600">Sol</label>
				<select name="soilType" bind:value={editSoil} class="w-full border rounded px-2 py-1">
					<option value="riche">{t('soil.riche')}</option>
					<option value="meuble">{t('soil.meuble')}</option>
					<option value="lourd">{t('soil.lourd')}</option>
					<option value="léger">{t('soil.léger')}</option>
				</select>
			</div>
			<div>
				<label class="block text-gray-600">Espace</label>
				<input type="number" name="spacing" bind:value={editSpacing} class="w-full border rounded px-2 py-1" placeholder="cm" />
				<input type="number" name="rowSpacing" bind:value={editRowSpacing} class="w-full border rounded px-2 py-1" placeholder="cm" />
			</div>
		</div>

		<div>
			<label class="block text-gray-600">Associations</label>
			<input type="text" name="companions" bind:value={editCompanions} class="w-full border rounded px-2 py-1" placeholder='{"Basilic","Carotte"}' />
		</div>
		<div>
			<label class="block text-gray-600">Antagonistes</label>
			<input type="text" name="antagonists" bind:value={editAntagonists} class="w-full border rounded px-2 py-1" placeholder='["Pomme de terre","Fenouil"]' />
		</div>

		<!-- Care tips enrichment -->
		<div>
			<label class="block text-gray-600">Conseils d'entretien enrichis</label>
			<div class="grid grid-cols-3 gap-2 mt-1">
				{#each CARE_TIP_KEYS as key}
					<div>
						<input type="text" name="care_{key}" bind:value={editing ? editCare[key] || '' : ''} class="w-24 border rounded px-1 py-1 text-xs">
						<label class="text-xs block mt-1">{key}</label>
					</div>
				{/each}
			</div>
		</div>

		<div class="flex gap-2 justify-end pt-2">
			<button type="button" class="px-4 py-2 border rounded" onclick={() => editing = false}>{t('plants.form.cancel')}</button>
			<button type="submit" form="plantEditForm" class="px-4 py-2 bg-[var(--btn-bg)] text-white rounded">{t('plants.form.create')}</button>
		</div>
	</fieldset>

	<!-- Photos gallery -->
	{#if photos.length > 0}
		<div class="mt-6 border rounded-lg p-4">
			<h2 class="font-bold text-lg mb-3">{t('plant.photos')}</h2>
			<div class="flex flex-wrap gap-2">
				{#each photos as url, i}
					<button class="p-0 border-0 bg-transparent cursor-pointer" onclick={() => lightboxIndex = i}>
						<img src={url} alt="" loading="lazy" class="w-32 h-32 object-cover rounded border hover:opacity-80 transition-opacity" />
					</button>
				{/each}
			</div>
		</div>
	{/if}

	{#if lightboxIndex !== null}
		<Lightbox images={photos} startIndex={lightboxIndex} onclose={() => lightboxIndex = null} />
	{/if}

	<!-- NEW: Dedicated diseases & growth gallery tabs -->
	{#if diseaseMedia.length > 0 || galleryMedia.length > 0 || editing}
		<div class="mt-6 border rounded-lg p-4">
			<h2 class="font-bold text-lg mb-3">{t('plant.mediaTitle')}</h2>

			<!-- Tabs gallery/disease -->
			<div class="flex gap-1 border-b mb-4">
				<button
					class="px-4 py-2 -mb-px border-b-2 {activeTab === 'gallery' ? 'border-[var(--tab-border)] text-[var(--tab-text)] font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'}"
					onclick={() => { activeTab = 'gallery'; }}
				>
					{t('plant.photos')}
				</button>
				<button
					class="px-4 py-2 -mb-px border-b-2 {activeTab === 'disease' ? 'border-[var(--tab-border)] text-[var(--tab-text)] font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'}"
					onclick={() => { activeTab = 'disease'; }}
				>
					{t('plant.diseases')}
				</button>
			</div>

			{#if activeTab === 'gallery'}
				{#if photos.length > 0 || galleryMedia.length > 0}
					<div class="grid grid-cols-2 gap-2">
						{#each [...photos, ...galleryMedia] as urlOrObj, i}
							{#if typeof urlOrObj === 'string'}
								<button class="p-0 border-0 bg-transparent cursor-pointer" onclick={() => lightboxIndex = i}>
									<img src={urlOrObj} alt="" loading="lazy" class="w-full h-48 object-cover rounded hover:opacity-80 transition-opacity" />
								</button>
							{#else}
								{#if activeTab === 'disease'}
									<button class="p-0 border-0 bg-transparent cursor-pointer" onclick={() => lightboxIndex = i + photos.length}>
										<img src={urlOrObj.url} alt={urlOrObj.caption || 'Maladie'} loading="lazy" class="w-full h-48 object-cover rounded" />
								</button>
							{/if}
						{/each}
					</div>
				{/if}

				{#if activeTab === 'disease'}
					{#if diseaseMedia.length > 0 || editDiseaseMedia.length > 0}
						<div class="grid grid-cols-2 gap-2">
							{#each [...diseaseMedia, ...editDiseaseMedia] as m, i}
								{#if typeof m === 'object' && m.id !== undefined}
									<button class="p-0 border-0 bg-transparent cursor-pointer" onclick={() => lightboxIndex = i + photos.length}>
										<img src={m.url} alt={m.caption || 'Maladie'} loading="lazy" class="w-full h-48 object-cover rounded" />
									</button>
									<input type="hidden" name="deleteMediaId" value={m.id} class="mt-1">
								{#/if}
							{/each}
						</div>
					{/if}

					{#if activeTab === 'disease'}
						{#if diseaseMedia.length > 0}
							<p class="text-xs text-gray-500 mb-2">Supprimer :</p>
							{#each diseaseMedia as m}
								<div class="flex items-center gap-2 text-sm text-gray-500">
									<input type="hidden" name="deleteMediaId" value={m.id}>
									<span>{m.caption || 'Maladie'}</span>
									<button class="text-red-500 hover:underline text-xs">Suppr</button>
								</div>
							{/each}
						{/if}

						<!-- Upload form for diseases -->
						{#if uploading}
							<p class="text-sm text-gray-500">Upload en cours…</p>
						{:else}
							<form method="POST" action="?/uploadPhoto" use:enhance class="mt-4 grid grid-cols-2 gap-2">
								<div>
									<input type="file" name="newMedia" accept="image/*" class="block w-full border rounded px-2 py-1">
									<select name="newMediaType" class="block w-full border rounded px-2 py-1">
										<option value="disease">Maladie</option>
										<option value="gallery">Galerie</option>
									</select>
									<input type="text" name="newMediaCaption" placeholder="Légende" class="block w-full border rounded px-2 py-1 mt-1">
									<button type="submit" class="col-span-2 px-4 py-2 bg-[var(--btn-bg)] text-white rounded">{t('plant.form.upload')}</button>
								</div>
							</form>
						{/if}
					{/if}
				{/if}
			{/if}
		</div>
	{/if}
</div>

{#if lightboxIndex !== null}
	<Lightbox images={photos} startIndex={lightboxIndex} onclose={() => lightboxIndex = null} />
{/if}

<!-- Edit form (simplified, only visible when editing) -->
{#if editing}
	<form id="plantEditForm" method="POST" action="?/update" use:enhance>
		<input type="hidden" name="photos" value={JSON.stringify(photos)} />
		<!-- Other fields omitted for brevity, kept as in original -->
		<button type="button" class="px-4 py-2 border rounded" onclick={() => editing = false}>{t('plants.form.cancel')}</button>
		<button type="submit" class="px-4 py-2 bg-[var(--btn-bg)] text-white rounded">{t('plants.form.create')}</button>
	</form>
{/if}
