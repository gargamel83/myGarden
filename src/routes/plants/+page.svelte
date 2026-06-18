<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidate, goto } from '$app/navigation';
	import { toast } from '$lib/toast.svelte';

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
	let plants = $derived(data.plants.slice(0, visibleCount));
	let hasMore = $derived(visibleCount < data.plants.length);

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

	function filterUrl() {
		const params = new URLSearchParams();
		if (search) params.set('q', search);
		if (family) params.set('family', family);
		if (exposure) params.set('exposure', exposure);
		const qs = params.toString();
		goto(qs ? `/plants?${qs}` : '/plants');
	}

	function handleCreateEnhance() {
		return async ({ result, formData }: { result: any; formData: FormData }) => {
			if (result.type === 'success') {
				showForm = false;
				toast('Plant created');
				await invalidate('app:plants');
			} else if (result.type === 'failure') {
				toast(result.data?.error || 'Error', 'error');
			}
		};
	}

	function onPlantCreate({ formData }: { formData: FormData }) {
		const companions = formData.get('companions') as string;
		const antagonists = formData.get('antagonists') as string;
		if (companions) {
			formData.set('companions', JSON.stringify(companions.split(',').map(s => s.trim()).filter(Boolean)));
		}
		if (antagonists) {
			formData.set('antagonists', JSON.stringify(antagonists.split(',').map(s => s.trim()).filter(Boolean)));
		}
		return async ({ result }: { result: any }) => {
			if (result.type === 'success') {
				showForm = false;
				toast('Plant created');
				await invalidate('app:plants');
			} else if (result.type === 'failure') {
				toast(result.data?.error || 'Error', 'error');
			}
		};
	}

	const exposureLabels: Record<string, string> = {
		plein_soleil: '☀️ Full sun',
		mi_ombre: '🌤 Partial shade',
		ombre: '🌑 Shade'
	};

	const monthLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

	function periodBar(start: string | null, end: string | null) {
		if (!start || !end) return null;
		const s = parseInt(start.split('-')[0], 10);
		const e = parseInt(end.split('-')[0], 10);
		const months = [];
		for (let m = 1; m <= 12; m++) {
			let active = false;
			if (e >= s) active = m >= s && m <= e;
			else active = m >= s || m <= e; // chevauchement année
			months.push(active);
		}
		return months;
	}
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
			onkeydown={(e) => e.key === 'Enter' && filterUrl()}
		/>
		<select bind:value={family} class="border rounded px-3 py-2" onchange={filterUrl}>
			<option value="">All families</option>
			{#each data.families as f}
				<option value={f}>{f}</option>
			{/each}
		</select>
		<select bind:value={exposure} class="border rounded px-3 py-2" onchange={filterUrl}>
			<option value="">Any exposure</option>
			<option value="plein_soleil">Full sun</option>
			<option value="mi_ombre">Partial shade</option>
			<option value="ombre">Shade</option>
		</select>
		<button class="bg-gray-200 px-4 py-2 rounded" onclick={() => { search = ''; family = ''; exposure = ''; filterUrl(); }}>
			Reset
		</button>
	</div>

	<!-- Grid -->
	{#if data.plants.length === 0}
		<p class="text-gray-500 text-center py-8">No plants found.</p>
	{/if}

	<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
		{#each plants as plant (plant.id)}
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
						<p>{exposureLabels[plant.sunExposure] || plant.sunExposure}</p>
					{/if}
					{#if plant.soilType}
						<p>Soil: {plant.soilType}</p>
					{/if}
				</div>

				<div class="mt-3 space-y-1">
					{#if plant.sowingStart}
						{@const months = periodBar(plant.sowingStart, plant.sowingEnd)}
						<div class="flex gap-0.5 h-2">
							{#each months || [] as active, i}
								<div class="flex-1 rounded-sm {active ? 'bg-green-500' : 'bg-gray-100'}" title={monthLabels[i]}></div>
							{/each}
						</div>
						<p class="text-[10px] text-gray-400">Sowing</p>
					{/if}
					{#if plant.plantingStart}
						{@const months = periodBar(plant.plantingStart, plant.plantingEnd)}
						<div class="flex gap-0.5 h-2">
							{#each months || [] as active, i}
								<div class="flex-1 rounded-sm {active ? 'bg-blue-500' : 'bg-gray-100'}" title={monthLabels[i]}></div>
							{/each}
						</div>
						<p class="text-[10px] text-gray-400">Transplanting</p>
					{/if}
					{#if plant.harvestStart}
						{@const months = periodBar(plant.harvestStart, plant.harvestEnd)}
						<div class="flex gap-0.5 h-2">
							{#each months || [] as active, i}
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
				Show {Math.min(PAGE_SIZE, data.plants.length - visibleCount)} more…
			</button>
		</div>
	{/if}
</div>

<!-- New plant dialog -->
{#if showForm}

	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onkeydown={(e) => e.key === 'Escape' && (showForm = false)} onclick={(e) => { if (e.target === e.currentTarget) showForm = false; }} role="dialog" aria-modal="true" tabindex="-1">

		<div class="bg-white rounded-lg p-6 w-[500px] max-h-[85vh] overflow-y-auto" role="none">
			<form method="POST" action="?/create" use:enhance={onPlantCreate} onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()}>
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
		</div>
	</div>
{/if}
