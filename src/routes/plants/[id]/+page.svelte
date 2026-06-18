<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidate, goto } from '$app/navigation';
	import { toast } from '$lib/toast.svelte';
	import Lightbox from '$lib/components/Lightbox.svelte';

	let { data } = $props();

	let plant = $derived(data.plant);
	let companions = $derived(data.companions);
	let antagonists = $derived(data.antagonists);
	let sameFamily = $derived(data.sameFamily);

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

	const exposureLabels: Record<string, string> = {
		plein_soleil: '☀️ Full sun',
		mi_ombre: '🌤 Partial shade',
		ombre: '🌑 Shade'
	};

	const soilLabels: Record<string, string> = {
		riche: 'Rich (loam/manure)',
		meuble: 'Loose (sandy-loam)',
		lourd: 'Heavy (clay)',
		léger: 'Light (sandy)'
	};

	const wateringLabels: Record<string, string> = {
		faible: '💧 Low',
		moyen: '💧💧 Medium',
		élevé: '💧💧💧 High'
	};

	const monthLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

	function monthsBetween(start: string | null, end: string | null): boolean[] {
		if (!start || !end) return [];
		const s = parseInt(start.split('-')[0], 10);
		const e = parseInt(end.split('-')[0], 10);
		return monthLabels.map((_, m) => {
			const month = m + 1;
			if (e >= s) return month >= s && month <= e;
			return month >= s || month <= e;
		});
	}

	function handleUpdateEnhance() {
		return async ({ result, formData }: { result: any; formData: FormData }) => {
			if (result.type === 'success') {
				editing = false;
				toast('Plant updated');
				await invalidate('app:plant');
				await invalidate('app:plants');
			} else if (result.type === 'failure') {
				toast(result.data?.error || 'Error', 'error');
			}
		};
	}

	function handleDeleteEnhance() {
		return async ({ result }: { result: any }) => {
			if (result.type === 'success') {
				toast('Plant deleted');
				await goto('/plants');
			}
		};
	}

	function onPlantSubmit({ formData }: { formData: FormData }) {
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
				editing = false;
				toast('Plant updated');
				await invalidate('app:plant');
				await invalidate('app:plants');
			} else if (result.type === 'failure') {
				toast(result.data?.error || 'Error', 'error');
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

<a href="/plants" class="text-sm text-blue-600 hover:underline">&larr; Back to plants</a>

<div class="mt-4">
	{#if editing}
		<!-- Edit mode -->
		<form method="POST" action="?/update" use:enhance={onPlantSubmit}>
			<input type="hidden" name="photos" value={JSON.stringify(photos)} />
			<div class="max-w-2xl space-y-3 text-sm">
				<h1 class="text-2xl font-bold mb-4">Edit {plant.commonName}</h1>
				<div class="grid grid-cols-2 gap-3">
					<div>
						<label class="block text-gray-600">
							Name *
							<input type="text" name="commonName" bind:value={editName} required class="w-full border rounded px-2 py-1" />
						</label>
					</div>
					<div>
						<label class="block text-gray-600">
							Latin name
							<input type="text" name="latinName" bind:value={editLatin} class="w-full border rounded px-2 py-1" />
						</label>
					</div>
				</div>
				<div>
					<label class="block text-gray-600">
						Family
						<input type="text" name="family" bind:value={editFamily} class="w-full border rounded px-2 py-1" />
					</label>
				</div>
				<div>
					<label class="block text-gray-600">
						Description
						<textarea name="description" bind:value={editDesc} class="w-full border rounded px-2 py-1" rows="3"></textarea>
					</label>
				</div>
				<div class="grid grid-cols-2 gap-3">
					<div>
						<label class="block text-gray-600">
							Exposure
							<select name="sunExposure" bind:value={editSun} class="w-full border rounded px-2 py-1">
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
							<select name="soilType" bind:value={editSoil} class="w-full border rounded px-2 py-1">
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
							<select name="watering" bind:value={editWater} class="w-full border rounded px-2 py-1">
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
							<input type="number" name="spacing" bind:value={editSpacing} class="w-full border rounded px-2 py-1" />
						</label>
					</div>
					<div>
						<label class="block text-gray-600">
							Row spacing (cm)
							<input type="number" name="rowSpacing" bind:value={editRowSpacing} class="w-full border rounded px-2 py-1" />
						</label>
					</div>
				</div>
				<fieldset class="border rounded p-3">
					<legend class="text-xs font-medium text-gray-500 px-1">Periods (MM-DD)</legend>
					<div class="grid grid-cols-3 gap-3 mt-2">
						<div><label class="block text-gray-600">Sowing start<input type="text" name="sowingStart" bind:value={editSowingS} placeholder="03-15" class="w-full border rounded px-2 py-1" /></label></div>
						<div><label class="block text-gray-600">Sowing end<input type="text" name="sowingEnd" bind:value={editSowingE} placeholder="05-15" class="w-full border rounded px-2 py-1" /></label></div>
						<div></div>
						<div><label class="block text-gray-600">Transplanting start<input type="text" name="plantingStart" bind:value={editPlantingS} placeholder="04-15" class="w-full border rounded px-2 py-1" /></label></div>
						<div><label class="block text-gray-600">Transplanting end<input type="text" name="plantingEnd" bind:value={editPlantingE} placeholder="06-15" class="w-full border rounded px-2 py-1" /></label></div>
						<div></div>
						<div><label class="block text-gray-600">Harvest start<input type="text" name="harvestStart" bind:value={editHarvestS} placeholder="06-01" class="w-full border rounded px-2 py-1" /></label></div>
						<div><label class="block text-gray-600">Harvest end<input type="text" name="harvestEnd" bind:value={editHarvestE} placeholder="10-01" class="w-full border rounded px-2 py-1" /></label></div>
						<div></div>
					</div>
				</fieldset>
				<div class="grid grid-cols-2 gap-3">
					<div>
						<label class="block text-gray-600">
							Companions (separated by ,)
							<input type="text" name="companions" bind:value={editCompanions} class="w-full border rounded px-2 py-1" />
						</label>
					</div>
					<div>
						<label class="block text-gray-600">
							Antagonists (separated by ,)
							<input type="text" name="antagonists" bind:value={editAntagonists} class="w-full border rounded px-2 py-1" />
						</label>
					</div>
				</div>
				<div class="flex gap-2 justify-end pt-2">
					<button type="button" class="px-4 py-2 border rounded" onclick={() => editing = false}>Cancel</button>
					<button type="submit" class="px-4 py-2 bg-green-600 text-white rounded">Save</button>
				</div>
			</div>
		</form>

		<!-- Photos -->
		<div class="mt-6 border rounded-lg p-4">
			<h2 class="font-bold text-lg mb-3">Photos</h2>
			<div class="flex flex-wrap gap-3">
				{#each photos as url, i}
					<div class="relative group">
						<img src={url} alt="" class="w-32 h-32 object-cover rounded border" />
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
					{uploading ? 'Uploading...' : '+ Add photo'}
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
				<form method="POST" action="?/delete" use:enhance={handleDeleteEnhance} class="inline">
					<button type="submit" class="text-sm text-red-600 hover:underline">Delete</button>
				</form>
				<button class="text-sm text-blue-600 hover:underline" onclick={() => editing = true}>Edit</button>
				{#if plant.family}
					<div class="text-right">
						<span class="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full">{plant.family}</span>
						{#if sameFamily.length > 0}
							<p class="text-xs text-gray-400 mt-1">{sameFamily.length} other plant(s) from the same family</p>
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
				<h2 class="font-bold text-lg mb-3">Periods</h2>
				<div class="space-y-3">
					{#if plant.sowingStart}
						<div>
							<p class="text-sm font-medium text-gray-600">Sowing</p>
							<div class="flex gap-0.5 h-4 mt-1">
								{#each monthsBetween(plant.sowingStart, plant.sowingEnd) as active, i}
									<div class="flex-1 rounded {active ? 'bg-green-500' : 'bg-gray-100'}" title={monthLabels[i]}></div>
								{/each}
							</div>
							<div class="flex justify-between text-[10px] text-gray-400 mt-0.5">
								<span>{plant.sowingStart}</span><span>{plant.sowingEnd}</span>
							</div>
						</div>
					{/if}
					{#if plant.plantingStart}
						<div>
							<p class="text-sm font-medium text-gray-600">Transplanting</p>
							<div class="flex gap-0.5 h-4 mt-1">
								{#each monthsBetween(plant.plantingStart, plant.plantingEnd) as active, i}
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
							<p class="text-sm font-medium text-gray-600">Harvest</p>
							<div class="flex gap-0.5 h-4 mt-1">
								{#each monthsBetween(plant.harvestStart, plant.harvestEnd) as active, i}
									<div class="flex-1 rounded {active ? 'bg-amber-500' : 'bg-gray-100'}" title={monthLabels[i]}></div>
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
				<h2 class="font-bold text-lg mb-3">Requirements</h2>
				<dl class="space-y-2 text-sm">
					{#if plant.sunExposure}<div class="flex justify-between"><dt class="text-gray-500">Exposure</dt><dd>{exposureLabels[plant.sunExposure] || plant.sunExposure}</dd></div>{/if}
					{#if plant.soilType}<div class="flex justify-between"><dt class="text-gray-500">Soil</dt><dd>{soilLabels[plant.soilType] || plant.soilType}</dd></div>{/if}
					{#if plant.watering}<div class="flex justify-between"><dt class="text-gray-500">Watering</dt><dd>{wateringLabels[plant.watering] || plant.watering}</dd></div>{/if}
					{#if plant.spacing}<div class="flex justify-between"><dt class="text-gray-500">Spacing</dt><dd>{plant.spacing} cm</dd></div>{/if}
					{#if plant.rowSpacing}<div class="flex justify-between"><dt class="text-gray-500">Rows</dt><dd>{plant.rowSpacing} cm</dd></div>{/if}
				</dl>
			</div>
		</div>

		<div class="mt-6 grid gap-6 md:grid-cols-2">
			{#if companions.length > 0}
				<div class="border rounded-lg p-4">
					<h2 class="font-bold text-lg mb-2 text-green-700">🌱 Good companions</h2>
					<div class="flex flex-wrap gap-2">
						{#each companions as c}
							<a href="/plants/{c.id}" class="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm hover:bg-green-200">{c.commonName}</a>
						{/each}
					</div>
				</div>
			{/if}
			{#if antagonists.length > 0}
				<div class="border rounded-lg p-4">
					<h2 class="font-bold text-lg mb-2 text-red-700">🚫 Bad neighbors</h2>
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
				<h2 class="font-bold text-lg mb-3">Photos</h2>
				<div class="flex flex-wrap gap-3">
					{#each photos as url, i}
						<button class="p-0 border-0 bg-transparent cursor-pointer" onclick={() => lightboxIndex = i}>
							<img src={url} alt="" class="w-32 h-32 object-cover rounded border hover:opacity-80 transition-opacity" />
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
