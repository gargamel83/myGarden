<script lang="ts">
	import Modal from '$lib/components/Modal.svelte';
	import Lightbox from '$lib/components/Lightbox.svelte';
	import { localeStore, t } from '$lib/i18n';
	import { allHostPlants, filterDiseases, type DiseaseItem } from '$lib/diseases';
	let _locale = $localeStore;

	let { data } = $props();

	let search = $state('');
	let hostPlant = $state('');
	let selected = $state<DiseaseItem | null>(null);
	let lightboxIndex = $state<number | null>(null);

	let hostPlants = $derived(allHostPlants(data.diseases));
	let filtered = $derived(filterDiseases(data.diseases, search, hostPlant));

	function closeDetail() {
		selected = null;
		lightboxIndex = null;
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between gap-3 flex-wrap">
		<h1 class="text-2xl font-bold">{t('diseases.title')}</h1>
		<span class="text-sm text-gray-500">{t('diseases.count', { count: filtered.length })}</span>
	</div>

	<div class="flex gap-3 flex-wrap">
		<input
			type="text"
			bind:value={search}
			placeholder={t('diseases.search')}
			class="border rounded px-3 py-2 flex-1 min-w-[200px]"
		/>
		<select bind:value={hostPlant} class="border rounded px-3 py-2">
			<option value="">{t('diseases.allHosts')}</option>
			{#each hostPlants as plant}
				<option value={plant}>{plant}</option>
			{/each}
		</select>
		<button class="bg-gray-200 px-4 py-2 rounded" onclick={() => { search = ''; hostPlant = ''; }}>
			{t('diseases.reset')}
		</button>
	</div>

	{#if filtered.length === 0}
		<p class="text-gray-500 text-center py-8">{t('diseases.none')}</p>
	{/if}

	<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
		{#each filtered as disease (disease.id)}
			<button
				type="button"
				class="border rounded-lg p-4 hover:shadow-lg transition text-left"
				onclick={() => selected = disease}
			>
				{#if disease.photos.length > 0}
					<img src={disease.photos[0]} alt="" loading="lazy" class="w-full h-28 object-cover rounded mb-3" />
				{/if}
				<h3 class="font-bold text-lg">{disease.name}</h3>
				{#if disease.latinName}
					<p class="text-sm italic text-gray-500">{disease.latinName}</p>
				{/if}
				{#if disease.symptoms}
					<p class="text-xs text-gray-600 mt-2 line-clamp-3">{disease.symptoms}</p>
				{/if}
				<div class="flex flex-wrap gap-1 mt-3">
					{#each disease.hostPlants as plant}
						<span class="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{plant}</span>
					{/each}
				</div>
			</button>
		{/each}
	</div>
</div>

<Modal open={!!selected} onclose={closeDetail} class="w-[36rem] max-w-[92vw] max-h-[85vh] overflow-y-auto">
	{#if selected}
		<div class="space-y-4">
			<div class="flex items-start justify-between gap-3">
				<div>
					<h2 class="text-xl font-bold">{selected.name}</h2>
					{#if selected.latinName}
						<p class="text-sm italic text-gray-500">{selected.latinName}</p>
					{/if}
				</div>
				<button type="button" class="text-gray-500 hover:text-gray-800 text-lg" onclick={closeDetail} aria-label={t('diseases.close')}>✕</button>
			</div>

			{#if selected.photos.length > 0}
				<div class="grid grid-cols-2 gap-2">
					{#each selected.photos as photo, i}
						<button type="button" class="block" onclick={() => lightboxIndex = i}>
							<img src={photo} alt="" loading="lazy" class="w-full h-32 object-cover rounded" />
						</button>
					{/each}
				</div>
			{/if}

			{#if selected.symptoms}
				<section>
					<h3 class="font-semibold text-sm text-gray-700">{t('diseases.symptoms')}</h3>
					<p class="text-sm text-gray-600">{selected.symptoms}</p>
				</section>
			{/if}
			{#if selected.causes}
				<section>
					<h3 class="font-semibold text-sm text-gray-700">{t('diseases.causes')}</h3>
					<p class="text-sm text-gray-600">{selected.causes}</p>
				</section>
			{/if}
			{#if selected.treatments}
				<section>
					<h3 class="font-semibold text-sm text-gray-700">{t('diseases.treatments')}</h3>
					<p class="text-sm text-gray-600">{selected.treatments}</p>
				</section>
			{/if}
			{#if selected.prevention}
				<section>
					<h3 class="font-semibold text-sm text-gray-700">{t('diseases.prevention')}</h3>
					<p class="text-sm text-gray-600">{selected.prevention}</p>
				</section>
			{/if}
			{#if selected.hostPlants.length > 0}
				<section>
					<h3 class="font-semibold text-sm text-gray-700">{t('diseases.hostPlants')}</h3>
					<div class="flex flex-wrap gap-1 mt-1">
						{#each selected.hostPlants as plant}
							<span class="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{plant}</span>
						{/each}
					</div>
				</section>
			{/if}
		</div>
	{/if}
</Modal>

{#if selected && lightboxIndex !== null}
	<Lightbox images={selected.photos} startIndex={lightboxIndex} onclose={() => lightboxIndex = null} />
{/if}
