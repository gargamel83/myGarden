<script lang="ts">
import { enhance } from '$app/forms';
import { invalidate } from '$app/navigation';
import { toast } from '$lib/toast.svelte';
import type { SubmitFunction } from '@sveltejs/kit';
import { EXPOSURE_LABELS } from '$lib/types';
import { monthsInRange, serializeCommaSeparated } from '$lib/utils';
import Modal from '$lib/components/Modal.svelte';

	let { data, form } = $props();

	// svelte-ignore state_referenced_locally
	let search = $state(data.search);
	// svelte-ignore state_referenced_locally
	let family = $state(data.selectedFamily);
	// svelte-ignore state_referenced_locally
	let exposure = $state(data.selectedExposure);

	let showForm = $state(false);

	const PAGE_SIZE = 20;
	let visibleCount = $state(PAGE_SIZE);
	let filteredPlants = $derived(
		data.plants.filter(p => {
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
				toast('Plant created');
				await invalidate('app:plants');
			} else if (result.type === 'failure') {
				toast(result.data?.error || 'Error', 'error');
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
				toast('Plant created');
				await invalidate('app:plants');
			} else if (result.type === 'failure') {
				toast(result.data?.error || 'Error', 'error');
			}
		};
	}



	const monthLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];


</script>

<div class="space-y-6">
	<h1 class="text-2xl font-bold">Plant knowledge base</h1>
	<button class="bg-green-600 text-white px-4 py-2 rounded text-sm" onclick={() => showForm = true}>
		+ New plant
	</button>

	<!-- Filters -->
	<div class="flex gap-3 flex-wrap">
		<input
			type="text"
			bind:value={search}
			placeholder="Search for a plant..."
			class="border rounded px-3 py-2 flex-1 min-w-[200px]"
			/>
		<select bind:value={family} class="border rounded px-3 py-2">
			<option value="">All families</option>
			{#each data.families as f}
				<option value={f}>{f}</option>
			{/each}
		</select>
		<select bind:value={exposure} class="border rounded px-3 py-2">
			<option value="">Any exposure</option>
			<option value="plein_soleil">Full sun</option>
			<option value="mi_ombre">Partial shade</option>
			<option value="ombre">Shade</option>
		</select>
		<button class="bg-gray-200 px-4 py-2 rounded" onclick={() => { search = ''; family = ''; exposure = ''; visibleCount = PAGE_SIZE; }}>
			Reset
		</button>
	</div>

	<!-- Grid -->
	{#if filteredPlants.length === 0}
		<p class="text-gray-500 text-center py-8">No plants found.</p>
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
					{#if plant.family}
						<span class="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{plant.family}</span>
					{/if}
				</div>

				<div class="mt-3 space-y-1 text-xs text-gray-600">
					{#if plant.sunExposure}
						<p>{EXPOSURE_LABELS[plant.sunExposure as keyof typeof EXPOSURE_LABELS] || plant.sunExposure}</p>
					{/if}
					{#if plant.soilType}
						<p>Soil: {plant.soilType}</p>
					{/if}
				</div>

				<div class="mt-3 space-y-1">
					{#if plant.sowingStart}
						{@const months = monthsInRange(plant.sowingStart, plant.sowingEnd)}
						<div class="flex gap-0.5 h-2">
							{#each months as active, i}
								<div class="flex-1 rounded-sm {active ? 'bg-green-500' : 'bg-gray-100'}" title={monthLabels[i]}></div>
							{/each}
						</div>
						<p class="text-[10px] text-gray-400">Sowing</p>
					{/if}
					{#if plant.plantingStart}
						{@const months = monthsInRange(plant.plantingStart, plant.plantingEnd)}
						<div class="flex gap-0.5 h-2">
							{#each months as active, i}
								<div class="flex-1 rounded-sm {active ? 'bg-blue-500' : 'bg-gray-100'}" title={monthLabels[i]}></div>
							{/each}
						</div>
						<p class="text-[10px] text-gray-400">Transplanting</p>
					{/if}
					{#if plant.harvestStart}
						{@const months = monthsInRange(plant.harvestStart, plant.harvestEnd)}
						<div class="flex gap-0.5 h-2">
							{#each months as active, i}
								<div class="flex-1 rounded-sm {active ? 'bg-amber-500' : 'bg-gray-100'}" title={monthLabels[i]}></div>
							{/each}
						</div>
						<p class="text-[10px] text-gray-400">Harvest</p>
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
			<button class="bg-green-600 text-white px-6 py-2 rounded text-sm" onclick={showMore}>
				Show {Math.min(PAGE_SIZE, filteredPlants.length - visibleCount)} more…
			</button>
		</div>
	{/if}
</div>

<Modal open={showForm} onclose={() => showForm = false}>
	<form method="POST" action="?/create" use:enhance={onPlantCreate}>
		<h2 class="text-lg font-bold mb-4">New plant</h2>
		<div class="space-y-3 text-sm">
			<div class="grid grid-cols-2 gap-3">
				<div>
					<label class="block text-gray-600">
						Name *
						<input type="text" name="commonName" bind:value={formName} required class="w-full border rounded px-2 py-1" />
					</label>
				</div>
				<div>
					<label class="block text-gray-600">
						Latin name
						<input type="text" name="latinName" bind:value={formLatin} class="w-full border rounded px-2 py-1" />
					</label>
				</div>
			</div>
		<div>
			<label class="block text-gray-600">
				Family
				<input type="text" name="family" bind:value={formFamily} class="w-full border rounded px-2 py-1" placeholder="ex: Solanaceae" />
			</label>
		</div>
		<div>
			<label class="block text-gray-600">
				Description
				<textarea name="description" bind:value={formDesc} class="w-full border rounded px-2 py-1" rows="2"></textarea>
			</label>
		</div>
			<div class="grid grid-cols-2 gap-3">
				<div>
					<label class="block text-gray-600">
						Exposure
						<select name="sunExposure" bind:value={formSun} class="w-full border rounded px-2 py-1">
							<option value="">—</option>
							<option value="plein_soleil">Full sun</option>
							<option value="mi_ombre">Partial shade</option>
							<option value="ombre">Shade</option>
						</select>
					</label>
				</div>
				<div>
					<label class="block text-gray-600">
						Soil type
						<select name="soilType" bind:value={formSoil} class="w-full border rounded px-2 py-1">
							<option value="">—</option>
							<option value="riche">Rich</option>
							<option value="meuble">Loose</option>
							<option value="lourd">Heavy</option>
							<option value="léger">Light</option>
						</select>
					</label>
				</div>
			</div>
			<div class="grid grid-cols-3 gap-3">
				<div>
					<label class="block text-gray-600">
						Watering
						<select name="watering" bind:value={formWater} class="w-full border rounded px-2 py-1">
							<option value="">—</option>
							<option value="faible">Low</option>
							<option value="moyen">Medium</option>
							<option value="élevé">High</option>
						</select>
					</label>
				</div>
				<div>
					<label class="block text-gray-600">
						Spacing (cm)
						<input type="number" name="spacing" bind:value={formSpacing} class="w-full border rounded px-2 py-1" />
					</label>
				</div>
				<div>
					<label class="block text-gray-600">
						Row spacing (cm)
						<input type="number" name="rowSpacing" bind:value={formRowSpacing} class="w-full border rounded px-2 py-1" />
					</label>
				</div>
			</div>
			<fieldset class="border rounded p-3">
				<legend class="text-xs font-medium text-gray-500 px-1">Periods (MM-DD)</legend>
				<div class="grid grid-cols-3 gap-3 mt-2">
					<div>
						<label class="block text-gray-600">
							Sowing start
							<input type="text" name="sowingStart" bind:value={formSowingS} placeholder="03-15" class="w-full border rounded px-2 py-1" />
						</label>
					</div>
					<div>
						<label class="block text-gray-600">
							Sowing end
							<input type="text" name="sowingEnd" bind:value={formSowingE} placeholder="05-15" class="w-full border rounded px-2 py-1" />
						</label>
					</div>
					<div></div>
					<div>
						<label class="block text-gray-600">
							Transplanting start
							<input type="text" name="plantingStart" bind:value={formPlantingS} placeholder="04-15" class="w-full border rounded px-2 py-1" />
						</label>
					</div>
					<div>
						<label class="block text-gray-600">
							Transplanting end
							<input type="text" name="plantingEnd" bind:value={formPlantingE} placeholder="06-15" class="w-full border rounded px-2 py-1" />
						</label>
					</div>
					<div></div>
					<div>
						<label class="block text-gray-600">
							Harvest start
							<input type="text" name="harvestStart" bind:value={formHarvestS} placeholder="06-01" class="w-full border rounded px-2 py-1" />
						</label>
					</div>
					<div>
						<label class="block text-gray-600">
							Harvest end
							<input type="text" name="harvestEnd" bind:value={formHarvestE} placeholder="10-01" class="w-full border rounded px-2 py-1" />
						</label>
					</div>
					<div></div>
				</div>
			</fieldset>
			<div class="grid grid-cols-2 gap-3">
				<div>
					<label class="block text-gray-600">
						Companions (names separated by ,)
						<input type="text" name="companions" bind:value={formCompanions} class="w-full border rounded px-2 py-1" />
					</label>
				</div>
				<div>
					<label class="block text-gray-600">
						Antagonists (names separated by ,)
						<input type="text" name="antagonists" bind:value={formAntagonists} class="w-full border rounded px-2 py-1" />
					</label>
				</div>
			</div>
			<div class="flex gap-2 justify-end pt-2">
				<button type="button" class="px-4 py-2 border rounded" onclick={() => showForm = false}>Cancel</button>
				<button type="submit" class="px-4 py-2 bg-green-600 text-white rounded">Create</button>
			</div>
		</div>
	</form>
</Modal>
