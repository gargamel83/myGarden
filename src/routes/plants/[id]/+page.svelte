<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidate, goto } from '$app/navigation';
	import { toast } from '$lib/toast.svelte';
	import Lightbox from '$lib/components/Lightbox.svelte';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { EXPOSURE_LABELS, SOIL_LABELS, WATERING_LABELS, type SunExposure, type SoilType, type Watering } from '$lib/types';
	import { monthsInRange, serializeCommaSeparated } from '$lib/utils';
	import { localeStore, t } from '$lib/i18n';
	let _locale = $localeStore;

	let { data } = $props();

	let plant = $derived(data.plant);
	let companions = $derived(data.companions);
	let antagonists = $derived(data.antagonists);
	let sameFamily = $derived(data.sameFamily);
	// svelte-ignore state_referenced_locally
	let isFavorite = $state(data.isFavorite);

	let editing = $state(false);
	let initPhotos: string[] = (() => { try { return plant.photos ? JSON.parse(plant.photos) : []; } catch { return []; } })();
	let photos = $state(initPhotos);
	let uploading = $state(false);
	let lightboxIndex = $state<number | null>(null);
	// svelte-ignore state_referenced_locally
	let editName = $state(plant.commonName);
	// svelte-ignore state_referenced_locally
	let editLatin = $state(plant.latinName || '');
	// svelte-ignore state_referenced_locally
	let editFamily = $state(plant.family || '');
	// svelte-ignore state_referenced_locally
	let editDesc = $state(plant.description || '');
	// svelte-ignore state_referenced_locally
	let editSowingS = $state(plant.sowingStart || '');
	// svelte-ignore state_referenced_locally
	let editSowingE = $state(plant.sowingEnd || '');
	// svelte-ignore state_referenced_locally
	let editPlantingS = $state(plant.plantingStart || '');
	// svelte-ignore state_referenced_locally
	let editPlantingE = $state(plant.plantingEnd || '');
	// svelte-ignore state_referenced_locally
	let editHarvestS = $state(plant.harvestStart || '');
	// svelte-ignore state_referenced_locally
	let editHarvestE = $state(plant.harvestEnd || '');
	// svelte-ignore state_referenced_locally
	let editSun = $state(plant.sunExposure || '');
	// svelte-ignore state_referenced_locally
	let editSoil = $state(plant.soilType || '');
	// svelte-ignore state_referenced_locally
	let editWater = $state(plant.watering || '');
	// svelte-ignore state_referenced_locally
	let editSpacing = $state(plant.spacing ? String(plant.spacing) : '');
	// svelte-ignore state_referenced_locally
	let editRowSpacing = $state(plant.rowSpacing ? String(plant.rowSpacing) : '');

	let editCompanions = $state('');
	let editAntagonists = $state('');

	// Parse companion/antagonist names for editing
	try {
		// svelte-ignore state_referenced_locally
		if (plant.companions) editCompanions = JSON.parse(plant.companions).join(', ');
		// svelte-ignore state_referenced_locally
		if (plant.antagonists) editAntagonists = JSON.parse(plant.antagonists).join(', ');
	} catch {}

	let monthLabels = $derived.by(() => { _locale; return t('monthLabels') as unknown as string[]; });

	const handleUpdateEnhance: SubmitFunction = (_input) => {
		return async ({ result, formData }) => {
			if (result.type === 'success') {
				editing = false;
				toast(t('plant.updated'));
				await invalidate('app:plant');
				await invalidate('app:plants');
			} else if (result.type === 'failure') {
				toast(result.data?.error || t('common.error'), 'error');
			}
		};
	}

	const handleDeleteEnhance: SubmitFunction = (_input) => {
		return async ({ result }) => {
			if (result.type === 'success') {
				toast(t('plant.deleted'));
				await goto('/plants');
			}
		};
	}

	const handleFavoriteEnhance: SubmitFunction = (_input) => {
		return async ({ result }) => {
			if (result.type === 'success' && result.data?.favorited !== undefined) {
				isFavorite = result.data.favorited;
				toast(result.data.favorited ? t('plant.favorited') : t('plant.unfavorited'));
				await invalidate('app:plants');
			} else if (result.type === 'failure') {
				toast(result.data?.error || t('common.error'), 'error');
			}
		};
	}

	const onPlantSubmit: SubmitFunction = ({ formData }) => {
		const companions = formData.get('companions') as string;
		const antagonists = formData.get('antagonists') as string;
		if (companions) {
			formData.set('companions', serializeCommaSeparated(companions));
		}
		if (antagonists) {
			formData.set('antagonists', serializeCommaSeparated(antagonists));
		}
		return async ({ result }) => {
			if (result.type === 'success') {
				editing = false;
				toast(t('plant.updated'));
				await invalidate('app:plant');
				await invalidate('app:plants');
			} else if (result.type === 'failure') {
				toast(result.data?.error || t('common.error'), 'error');
			}
		};
	}

	async function uploadPhoto(file: File) {
		uploading = true;
		const fd = new FormData();
		fd.set('photo', file);
		const res = await fetch('?/uploadPhoto', { method: 'POST', body: fd });
		if (res.ok) {
			const data = await res.json();
			photos = [...photos, data.url];
		}
		uploading = false;
	}

	function movePhoto(idx: number, dir: -1 | 1) {
		const target = idx + dir;
		if (target < 0 || target >= photos.length) return;
		const arr = [...photos];
		[arr[idx], arr[target]] = [arr[target], arr[idx]];
		photos = arr;
	}

	function removePhoto(idx: number) {
		photos = photos.filter((_, i) => i !== idx);
	}
</script>

<a href="/plants" class="text-sm text-blue-600 hover:underline">{t('plant.back')}</a>

<div class="mt-4">
	{#if editing}
		<!-- Edit mode -->
		<form method="POST" action="?/update" use:enhance={onPlantSubmit}>
			<input type="hidden" name="photos" value={JSON.stringify(photos)} />
			<div class="max-w-2xl space-y-3 text-sm">
				<h1 class="text-2xl font-bold mb-4">{t('plant.editTitle', { name: plant.commonName })}</h1>
				<div class="grid grid-cols-2 gap-3">
					<div>
						<label class="block text-gray-600">
							{t('plants.form.name')}
							<input type="text" name="commonName" bind:value={editName} required class="w-full border rounded px-2 py-1" />
						</label>
					</div>
					<div>
						<label class="block text-gray-600">
							{t('plants.form.latinName')}
							<input type="text" name="latinName" bind:value={editLatin} class="w-full border rounded px-2 py-1" />
						</label>
					</div>
				</div>
				<div>
					<label class="block text-gray-600">
						{t('plants.form.family')}
						<input type="text" name="family" bind:value={editFamily} class="w-full border rounded px-2 py-1" />
					</label>
				</div>
				<div>
					<label class="block text-gray-600">
						{t('plants.form.description')}
						<textarea name="description" bind:value={editDesc} class="w-full border rounded px-2 py-1" rows="3"></textarea>
					</label>
				</div>
				<div class="grid grid-cols-2 gap-3">
					<div>
						<label class="block text-gray-600">
							{t('plants.form.exposure')}
							<select name="sunExposure" bind:value={editSun} class="w-full border rounded px-2 py-1">
								<option value="">—</option>
								<option value="plein_soleil">{t('exposure.plein_soleil')}</option>
								<option value="mi_ombre">{t('exposure.mi_ombre')}</option>
								<option value="ombre">{t('exposure.ombre')}</option>
							</select>
						</label>
					</div>
					<div>
						<label class="block text-gray-600">
							{t('plants.form.soilType')}
							<select name="soilType" bind:value={editSoil} class="w-full border rounded px-2 py-1">
								<option value="">—</option>
								<option value="riche">{t('soil.riche')}</option>
								<option value="meuble">{t('soil.meuble')}</option>
								<option value="lourd">{t('soil.lourd')}</option>
								<option value="léger">{t('soil.léger')}</option>
							</select>
						</label>
					</div>
				</div>
				<div class="grid grid-cols-3 gap-3">
					<div>
						<label class="block text-gray-600">
							{t('plants.form.watering')}
							<select name="watering" bind:value={editWater} class="w-full border rounded px-2 py-1">
								<option value="">—</option>
								<option value="faible">{t('watering.faible')}</option>
								<option value="moyen">{t('watering.moyen')}</option>
								<option value="élevé">{t('watering.élevé')}</option>
							</select>
						</label>
					</div>
					<div>
						<label class="block text-gray-600">
							{t('plants.form.spacing')}
							<input type="number" name="spacing" bind:value={editSpacing} class="w-full border rounded px-2 py-1" />
						</label>
					</div>
					<div>
						<label class="block text-gray-600">
							{t('plants.form.rowSpacing')}
							<input type="number" name="rowSpacing" bind:value={editRowSpacing} class="w-full border rounded px-2 py-1" />
						</label>
					</div>
				</div>
				<fieldset class="border rounded p-3">
					<legend class="text-xs font-medium text-gray-500 px-1">{t('plant.periods')}</legend>
					<div class="grid grid-cols-3 gap-3 mt-2">
						<div><label class="block text-gray-600">{t('plants.form.sowingStart')}<input type="text" name="sowingStart" bind:value={editSowingS} placeholder="03-15" class="w-full border rounded px-2 py-1" /></label></div>
						<div><label class="block text-gray-600">{t('plants.form.sowingEnd')}<input type="text" name="sowingEnd" bind:value={editSowingE} placeholder="05-15" class="w-full border rounded px-2 py-1" /></label></div>
						<div></div>
						<div><label class="block text-gray-600">{t('plants.form.transplantingStart')}<input type="text" name="plantingStart" bind:value={editPlantingS} placeholder="04-15" class="w-full border rounded px-2 py-1" /></label></div>
						<div><label class="block text-gray-600">{t('plants.form.transplantingEnd')}<input type="text" name="plantingEnd" bind:value={editPlantingE} placeholder="06-15" class="w-full border rounded px-2 py-1" /></label></div>
						<div></div>
						<div><label class="block text-gray-600">{t('plants.form.harvestStart')}<input type="text" name="harvestStart" bind:value={editHarvestS} placeholder="06-01" class="w-full border rounded px-2 py-1" /></label></div>
						<div><label class="block text-gray-600">{t('plants.form.harvestEnd')}<input type="text" name="harvestEnd" bind:value={editHarvestE} placeholder="10-01" class="w-full border rounded px-2 py-1" /></label></div>
						<div></div>
					</div>
				</fieldset>
				<div class="grid grid-cols-2 gap-3">
					<div>
					<label class="block text-gray-600">
						{t('plants.form.companions')}
						<input type="text" name="companions" bind:value={editCompanions} class="w-full border rounded px-2 py-1" />
					</label>
				</div>
				<div>
					<label class="block text-gray-600">
						{t('plants.form.antagonists')}
						<input type="text" name="antagonists" bind:value={editAntagonists} class="w-full border rounded px-2 py-1" />
					</label>
				</div>
				</div>
				<div class="flex gap-2 justify-end pt-2">
					<button type="button" class="px-4 py-2 border rounded" onclick={() => editing = false}>{t('plants.form.cancel')}</button>
					<button type="submit" class="px-4 py-2 bg-[var(--btn-bg)] text-white rounded">{t('plants.form.create')}</button>
				</div>
			</div>
		</form>

		<!-- Photos -->
		<div class="mt-6 border rounded-lg p-4">
			<h2 class="font-bold text-lg mb-3">{t('plant.photos')}</h2>
			<div class="flex flex-wrap gap-3">
				{#each photos as url, i}
					<div class="relative group">
						<img src={url} alt="" loading="lazy" class="w-32 h-32 object-cover rounded border" />
						<div class="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition">
							<button type="button" class="bg-white rounded shadow text-xs px-1 py-0.5 hover:bg-gray-100 disabled:opacity-30" onclick={() => movePhoto(i, -1)} disabled={i === 0}>↑</button>
							<button type="button" class="bg-white rounded shadow text-xs px-1 py-0.5 hover:bg-gray-100 disabled:opacity-30" onclick={() => movePhoto(i, 1)} disabled={i === photos.length - 1}>↓</button>
							<button type="button" class="bg-red-500 text-white rounded shadow text-xs px-1 py-0.5 hover:bg-red-600" onclick={() => removePhoto(i)}>✕</button>
						</div>
					</div>
				{/each}
			</div>
			<div class="mt-3">
				<label class="cursor-pointer inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 rounded px-3 py-1.5 text-sm">
					{uploading ? t('plant.uploading') : t('plant.addPhoto')}
					<input type="file" accept="image/*" class="hidden"
						onchange={(e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) uploadPhoto(f); }}
					/>
				</label>
			</div>
		</div>
	{:else}
		<!-- View mode -->
		<div class="flex items-start justify-between">
			<div>
				<h1 class="text-3xl font-bold">{plant.commonName}</h1>
				{#if plant.latinName}
					<p class="text-lg italic text-gray-500">{plant.latinName}</p>
				{/if}
			</div>
			<div class="flex items-start gap-3">
				<form method="POST" action="?/favorite" use:enhance={handleFavoriteEnhance} class="inline">
					<button type="submit" class="text-2xl focus:outline-none" title={isFavorite ? t('plant.unfavorite') : t('plant.favorite')} aria-label={isFavorite ? t('plant.unfavorite') : t('plant.favorite')}>
						<span class={isFavorite ? 'text-yellow-500' : 'text-gray-300'}>{isFavorite ? '★' : '☆'}</span>
					</button>
				</form>
				<form method="POST" action="?/delete" use:enhance={handleDeleteEnhance} class="inline">
					<button type="submit" class="text-sm text-red-600 hover:underline">{t('plant.delete')}</button>
				</form>
				<button class="text-sm text-blue-600 hover:underline" onclick={() => editing = true}>{t('plant.edit')}</button>
				{#if plant.family}
					<div class="text-right">
						<span class="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full">{plant.family}</span>
						{#if sameFamily.length > 0}
							<p class="text-xs text-gray-400 mt-1">{t('plant.otherSameFamily', { count: sameFamily.length })}</p>
						{/if}
					</div>
				{/if}
			</div>
		</div>

		{#if plant.description}
			<p class="mt-4 text-gray-700">{plant.description}</p>
		{/if}

		<div class="mt-6 grid gap-6 md:grid-cols-2">
			<div class="border rounded-lg p-4">
				<h2 class="font-bold text-lg mb-3">{t('plant.periods')}</h2>
				<div class="space-y-3">
					{#if plant.sowingStart}
						<div>
							<p class="text-sm font-medium text-gray-600">{t('plant.sowing')}</p>
							<div class="flex gap-0.5 h-4 mt-1">
								{#each monthsInRange(plant.sowingStart, plant.sowingEnd) as active, i}
									<div class="flex-1 rounded {active ? 'bg-[var(--bar-fill)]' : 'bg-gray-100'}" title={monthLabels[i]}></div>
								{/each}
							</div>
							<div class="flex justify-between text-[10px] text-gray-400 mt-0.5">
								<span>{plant.sowingStart}</span><span>{plant.sowingEnd}</span>
							</div>
						</div>
					{/if}
					{#if plant.plantingStart}
						<div>
							<p class="text-sm font-medium text-gray-600">{t('plant.transplanting')}</p>
							<div class="flex gap-0.5 h-4 mt-1">
								{#each monthsInRange(plant.plantingStart, plant.plantingEnd) as active, i}
									<div class="flex-1 rounded {active ? 'bg-blue-500' : 'bg-gray-100'}" title={monthLabels[i]}></div>
								{/each}
							</div>
							<div class="flex justify-between text-[10px] text-gray-400 mt-0.5">
								<span>{plant.plantingStart}</span><span>{plant.plantingEnd}</span>
							</div>
						</div>
					{/if}
					{#if plant.harvestStart}
						<div>
							<p class="text-sm font-medium text-gray-600">{t('plant.harvest')}</p>
							<div class="flex gap-0.5 h-4 mt-1">
								{#each monthsInRange(plant.harvestStart, plant.harvestEnd) as active, i}
									<div class="flex-1 rounded {active ? 'bg-[var(--bar-fill)]' : 'bg-gray-100'}" title={monthLabels[i]}></div>
								{/each}
							</div>
							<div class="flex justify-between text-[10px] text-gray-400 mt-0.5">
								<span>{plant.harvestStart}</span><span>{plant.harvestEnd}</span>
							</div>
						</div>
					{/if}
				</div>
			</div>

			<div class="border rounded-lg p-4">
				<h2 class="font-bold text-lg mb-3">{t('plant.requirements')}</h2>
				<dl class="space-y-2 text-sm">
					{#if plant.sunExposure}<div class="flex justify-between"><dt class="text-gray-500">{t('plant.exposure')}</dt><dd>{EXPOSURE_LABELS[plant.sunExposure as SunExposure] || plant.sunExposure}</dd></div>{/if}
					{#if plant.soilType}<div class="flex justify-between"><dt class="text-gray-500">{t('plant.soil')}</dt><dd>{SOIL_LABELS[plant.soilType as SoilType] || plant.soilType}</dd></div>{/if}
					{#if plant.watering}<div class="flex justify-between"><dt class="text-gray-500">{t('plant.watering')}</dt><dd>{WATERING_LABELS[plant.watering as Watering] || plant.watering}</dd></div>{/if}
					{#if plant.spacing}<div class="flex justify-between"><dt class="text-gray-500">{t('plant.spacing')}</dt><dd>{plant.spacing} cm</dd></div>{/if}
					{#if plant.rowSpacing}<div class="flex justify-between"><dt class="text-gray-500">{t('plant.rows')}</dt><dd>{plant.rowSpacing} cm</dd></div>{/if}
				</dl>
			</div>
		</div>

		<div class="mt-6 grid gap-6 md:grid-cols-2">
			{#if companions.length > 0}
				<div class="border rounded-lg p-4">
					<h2 class="font-bold text-lg mb-2 text-[var(--text-primary)]">{t('plant.goodCompanions')}</h2>
					<div class="flex flex-wrap gap-2">
						{#each companions as c}
							<a href="/plants/{c.id}" class="bg-[var(--badge-bg)] text-[var(--badge-text)] px-3 py-1 rounded-full text-sm hover:bg-[var(--badge-hover)]">{c.commonName}</a>
						{/each}
					</div>
				</div>
			{/if}
			{#if antagonists.length > 0}
				<div class="border rounded-lg p-4">
					<h2 class="font-bold text-lg mb-2 text-red-700">{t('plant.badNeighbors')}</h2>
					<div class="flex flex-wrap gap-2">
						{#each antagonists as a}
							<a href="/plants/{a.id}" class="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm hover:bg-red-200">{a.commonName}</a>
						{/each}
					</div>
				</div>
			{/if}
		</div>

		<!-- Photos gallery -->
		{#if photos.length > 0}
			<div class="mt-6 border rounded-lg p-4">
			<h2 class="font-bold text-lg mb-3">{t('plant.photos')}</h2>
				<div class="flex flex-wrap gap-3">
					{#each photos as url, i}
						<button class="p-0 border-0 bg-transparent cursor-pointer" onclick={() => lightboxIndex = i}>
							<img src={url} alt="" loading="lazy" class="w-32 h-32 object-cover rounded border hover:opacity-80 transition-opacity" />
						</button>
					{/each}
				</div>
			</div>
		{/if}
	{/if}
</div>

{#if lightboxIndex !== null}
	<Lightbox images={photos} startIndex={lightboxIndex} onclose={() => lightboxIndex = null} />
{/if}
