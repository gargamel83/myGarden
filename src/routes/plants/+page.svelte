<script lang="ts">
import { enhance } from '$app/forms';
import { invalidate } from '$app/navigation';
import { toast } from '$lib/toast.svelte';
import type { SubmitFunction } from '@sveltejs/kit';
import { EXPOSURE_LABELS } from '$lib/types';
import { monthsInRange, serializeCommaSeparated } from '$lib/utils';
import Modal from '$lib/components/Modal.svelte';
import { localeStore, t } from '$lib/i18n';
let _locale = $localeStore;

	let { data, form } = $props();

	// svelte-ignore state_referenced_locally
	let search = $state(data.search);
	// svelte-ignore state_referenced_locally
	let family = $state(data.selectedFamily);
	// svelte-ignore state_referenced_locally
	let exposure = $state(data.selectedExposure);
	// svelte-ignore state_referenced_locally
	let favoritesOnly = $state(data.favoritesOnly);

	let showForm = $state(false);

	const PAGE_SIZE = 20;
	let visibleCount = $state(PAGE_SIZE);
	let favoriteSet = $derived(new Set(data.favoriteIds));
	let filteredPlants = $derived(
		data.plants.filter(p => {
			if (favoritesOnly && !favoriteSet.has(p.id)) return false;
			if (search && !p.commonName.toLowerCase().includes(search.toLowerCase()) && !p.latinName?.toLowerCase().includes(search.toLowerCase())) return false;
			if (family && p.family !== family) return false;
			if (exposure && p.sunExposure !== exposure) return false;
			return true;
		})
	);
	let visiblePlants = $derived(filteredPlants.slice(0, visibleCount));
	let hasMore = $derived(visibleCount < filteredPlants.length);

	function showMore() {
		visibleCount += PAGE_SIZE;
	}
	let formName = $state('');
	let formLatin = $state('');
	let formFamily = $state('');
	let formDesc = $state('');
	let formSowingS = $state('');
	let formSowingE = $state('');
	let formPlantingS = $state('');
	let formPlantingE = $state('');
	let formHarvestS = $state('');
	let formHarvestE = $state('');
	let formSun = $state('');
	let formSoil = $state('');
	let formWater = $state('');
	let formSpacing = $state('');
	let formRowSpacing = $state('');
	let formCompanions = $state('');
	let formAntagonists = $state('');

	const handleCreateEnhance: SubmitFunction = (_input) => {
		return async ({ result, formData }) => {
			if (result.type === 'success') {
				showForm = false;
				toast(t('plants.created'));
				await invalidate('app:plants');
			} else if (result.type === 'failure') {
				toast(result.data?.error || t('common.error'), 'error');
			}
		};
	}

	function onPlantCreate({ formData }: Parameters<SubmitFunction>[0]): ReturnType<SubmitFunction> {
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
				showForm = false;
				toast(t('plants.created'));
				await invalidate('app:plants');
			} else if (result.type === 'failure') {
				toast(result.data?.error || t('common.error'), 'error');
			}
		};
	}



	let monthLabels = $derived.by(() => { _locale; return t('monthLabels') as unknown as string[]; });


</script>

<div class="space-y-6">
	<h1 class="text-2xl font-bold">{t('plants.title')}</h1>
	<button class="bg-[var(--btn-bg)] text-white px-4 py-2 rounded text-sm" onclick={() => showForm = true}>
		{t('plants.newPlant')}
	</button>

	<!-- Filters -->
	<div class="flex gap-3 flex-wrap">
		<input
			type="text"
			bind:value={search}
			placeholder={t('plants.search')}
			class="border rounded px-3 py-2 flex-1 min-w-[200px]"
			/>
		<select bind:value={family} class="border rounded px-3 py-2">
			<option value="">{t('plants.allFamilies')}</option>
			{#each data.families as f}
				<option value={f}>{f}</option>
			{/each}
		</select>
		<select bind:value={exposure} class="border rounded px-3 py-2">
			<option value="">{t('plants.anyExposure')}</option>
			<option value="plein_soleil">{t('exposure.plein_soleil')}</option>
			<option value="mi_ombre">{t('exposure.mi_ombre')}</option>
			<option value="ombre">{t('exposure.ombre')}</option>
		</select>
		<button class="bg-gray-200 px-4 py-2 rounded" onclick={() => { search = ''; family = ''; exposure = ''; favoritesOnly = false; visibleCount = PAGE_SIZE; }}>
			{t('plants.reset')}
		</button>
		<button class="px-4 py-2 rounded {favoritesOnly ? 'bg-yellow-400 text-black' : 'bg-gray-200'}" onclick={() => { favoritesOnly = !favoritesOnly; visibleCount = PAGE_SIZE; }}>
			★ {t('plants.favorites')}
		</button>
	</div>

	<!-- Grid -->
	{#if filteredPlants.length === 0}
		<p class="text-gray-500 text-center py-8">{t('plants.none')}</p>
	{/if}

	<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
		{#each visiblePlants as plant (plant.id)}
			<a href="/plants/{plant.id}" class="border rounded-lg p-4 hover:shadow-lg transition block">
				{#if plant.firstPhoto}
					<img src={plant.firstPhoto} alt="" loading="lazy" class="w-full h-28 object-cover rounded mb-3" />
				{/if}
				<div class="flex items-start justify-between">
					<div>
						<h3 class="font-bold text-lg">{plant.commonName}</h3>
						{#if plant.latinName}
							<p class="text-sm italic text-gray-500">{plant.latinName}</p>
						{/if}
					</div>
					<div class="flex items-center gap-1">
						{#if favoriteSet.has(plant.id)}
							<span class="text-yellow-500 text-sm" title={t('plants.favorites')}>★</span>
						{/if}
						{#if plant.family}
							<span class="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{plant.family}</span>
						{/if}
					</div>
				</div>

				<div class="mt-3 space-y-1 text-xs text-gray-600">
					{#if plant.sunExposure}
						<p>{t('exposure.' + plant.sunExposure)}</p>
					{/if}
					{#if plant.soilType}
						<p>{t('plants.soil', { type: t('soil.' + plant.soilType) })}</p>
					{/if}
				</div>

				<div class="mt-3 space-y-1">
					{#if plant.sowingStart}
						{@const months = monthsInRange(plant.sowingStart, plant.sowingEnd)}
						<div class="flex gap-0.5 h-2">
							{#each months as active, i}
								<div class="flex-1 rounded-sm {active ? 'bg-[var(--bar-fill)]' : 'bg-gray-100'}" title={monthLabels[i]}></div>
							{/each}
						</div>
						<p class="text-[10px] text-gray-400">{t('plants.sowingBar')}</p>
					{/if}
					{#if plant.plantingStart}
						{@const months = monthsInRange(plant.plantingStart, plant.plantingEnd)}
						<div class="flex gap-0.5 h-2">
							{#each months as active, i}
								<div class="flex-1 rounded-sm {active ? 'bg-blue-500' : 'bg-gray-100'}" title={monthLabels[i]}></div>
							{/each}
						</div>
						<p class="text-[10px] text-gray-400">{t('plants.transplantingBar')}</p>
					{/if}
					{#if plant.harvestStart}
						{@const months = monthsInRange(plant.harvestStart, plant.harvestEnd)}
						<div class="flex gap-0.5 h-2">
							{#each months as active, i}
								<div class="flex-1 rounded-sm {active ? 'bg-[var(--bar-fill)]' : 'bg-gray-100'}" title={monthLabels[i]}></div>
							{/each}
						</div>
						<p class="text-[10px] text-gray-400">{t('plants.harvestBar')}</p>
					{/if}
				</div>

				<div class="mt-2 text-xs text-gray-500 line-clamp-2">
					{plant.description}
				</div>
			</a>
		{/each}
	</div>

	{#if hasMore}
		<div class="text-center pt-4">
			<button class="bg-[var(--btn-bg)] text-white px-6 py-2 rounded text-sm" onclick={showMore}>
				{t('plants.showMore', { count: Math.min(PAGE_SIZE, filteredPlants.length - visibleCount) })}
			</button>
		</div>
	{/if}
</div>

<Modal open={showForm} onclose={() => showForm = false}>
	<form method="POST" action="?/create" use:enhance={onPlantCreate}>
		<h2 class="text-lg font-bold mb-4">{t('plants.newPlant')}</h2>
		<div class="space-y-3 text-sm">
			<div class="grid grid-cols-2 gap-3">
				<div>
					<label class="block text-gray-600">
						{t('plants.form.name')}
						<input type="text" name="commonName" bind:value={formName} required class="w-full border rounded px-2 py-1" />
					</label>
				</div>
				<div>
					<label class="block text-gray-600">
						{t('plants.form.latinName')}
						<input type="text" name="latinName" bind:value={formLatin} class="w-full border rounded px-2 py-1" />
					</label>
				</div>
			</div>
		<div>
			<label class="block text-gray-600">
				{t('plants.form.family')}
				<input type="text" name="family" bind:value={formFamily} class="w-full border rounded px-2 py-1" placeholder="ex: Solanaceae" />
			</label>
		</div>
		<div>
			<label class="block text-gray-600">
				{t('plants.form.description')}
				<textarea name="description" bind:value={formDesc} class="w-full border rounded px-2 py-1" rows="2"></textarea>
			</label>
		</div>
			<div class="grid grid-cols-2 gap-3">
				<div>
					<label class="block text-gray-600">
						{t('plants.form.exposure')}
						<select name="sunExposure" bind:value={formSun} class="w-full border rounded px-2 py-1">
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
						<select name="soilType" bind:value={formSoil} class="w-full border rounded px-2 py-1">
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
						<select name="watering" bind:value={formWater} class="w-full border rounded px-2 py-1">
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
						<input type="number" name="spacing" bind:value={formSpacing} class="w-full border rounded px-2 py-1" />
					</label>
				</div>
				<div>
					<label class="block text-gray-600">
						{t('plants.form.rowSpacing')}
						<input type="number" name="rowSpacing" bind:value={formRowSpacing} class="w-full border rounded px-2 py-1" />
					</label>
				</div>
			</div>
			<fieldset class="border rounded p-3">
				<legend class="text-xs font-medium text-gray-500 px-1">{t('plant.periods')}</legend>
				<div class="grid grid-cols-3 gap-3 mt-2">
					<div>
						<label class="block text-gray-600">
							{t('plants.form.sowingStart')}
							<input type="text" name="sowingStart" bind:value={formSowingS} placeholder="03-15" class="w-full border rounded px-2 py-1" />
						</label>
					</div>
					<div>
						<label class="block text-gray-600">
							{t('plants.form.sowingEnd')}
							<input type="text" name="sowingEnd" bind:value={formSowingE} placeholder="05-15" class="w-full border rounded px-2 py-1" />
						</label>
					</div>
					<div></div>
					<div>
						<label class="block text-gray-600">
							{t('plants.form.transplantingStart')}
							<input type="text" name="plantingStart" bind:value={formPlantingS} placeholder="04-15" class="w-full border rounded px-2 py-1" />
						</label>
					</div>
					<div>
						<label class="block text-gray-600">
							{t('plants.form.transplantingEnd')}
							<input type="text" name="plantingEnd" bind:value={formPlantingE} placeholder="06-15" class="w-full border rounded px-2 py-1" />
						</label>
					</div>
					<div></div>
					<div>
						<label class="block text-gray-600">
							{t('plants.form.harvestStart')}
							<input type="text" name="harvestStart" bind:value={formHarvestS} placeholder="06-01" class="w-full border rounded px-2 py-1" />
						</label>
					</div>
					<div>
						<label class="block text-gray-600">
							{t('plants.form.harvestEnd')}
							<input type="text" name="harvestEnd" bind:value={formHarvestE} placeholder="10-01" class="w-full border rounded px-2 py-1" />
						</label>
					</div>
					<div></div>
				</div>
			</fieldset>
			<div class="grid grid-cols-2 gap-3">
				<div>
					<label class="block text-gray-600">
						{t('plants.form.companions')}
						<input type="text" name="companions" bind:value={formCompanions} class="w-full border rounded px-2 py-1" />
					</label>
				</div>
				<div>
					<label class="block text-gray-600">
						{t('plants.form.antagonists')}
						<input type="text" name="antagonists" bind:value={formAntagonists} class="w-full border rounded px-2 py-1" />
					</label>
				</div>
			</div>
			<div class="flex gap-2 justify-end pt-2">
				<button type="button" class="px-4 py-2 border rounded" onclick={() => showForm = false}>{t('plants.form.cancel')}</button>
				<button type="submit" class="px-4 py-2 bg-[var(--btn-bg)] text-white rounded">{t('plants.form.create')}</button>
			</div>
		</div>
	</form>
</Modal>
