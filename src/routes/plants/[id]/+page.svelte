<script lang="ts">
	let { data } = $props();

	let plant = $derived(data.plant);
	let companions = $derived(data.companions);
	let antagonists = $derived(data.antagonists);
	let sameFamily = $derived(data.sameFamily);

	let editing = $state(false);
	let initPhotos: string[] = (() => { try { return plant.photos ? JSON.parse(plant.photos) : []; } catch { return []; } })();
	let photos = $state(initPhotos);
	let uploading = $state(false);
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

	// Parse companion/antagonist names for editing
	try {
		if (plant.companions) editCompanions = JSON.parse(plant.companions).join(', ');
		if (plant.antagonists) editAntagonists = JSON.parse(plant.antagonists).join(', ');
	} catch {}

	const exposureLabels: Record<string, string> = {
		plein_soleil: '☀️ Plein soleil',
		mi_ombre: '🌤 Mi-ombre',
		ombre: '🌑 Ombre'
	};

	const soilLabels: Record<string, string> = {
		riche: 'Riche (terreau/fumier)',
		meuble: 'Meuble (sablo-limoneux)',
		lourd: 'Lourd (argileux)',
		léger: 'Léger (sableux)'
	};

	const wateringLabels: Record<string, string> = {
		faible: '💧 Faible',
		moyen: '💧💧 Moyen',
		élevé: '💧💧💧 Élevé'
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

	async function submitUpdate() {
		const fd = new FormData();
		fd.set('commonName', editName);
		fd.set('latinName', editLatin);
		fd.set('family', editFamily);
		fd.set('description', editDesc);
		fd.set('sowingStart', editSowingS);
		fd.set('sowingEnd', editSowingE);
		fd.set('plantingStart', editPlantingS);
		fd.set('plantingEnd', editPlantingE);
		fd.set('harvestStart', editHarvestS);
		fd.set('harvestEnd', editHarvestE);
		fd.set('sunExposure', editSun);
		fd.set('soilType', editSoil);
		fd.set('watering', editWater);
		fd.set('spacing', editSpacing);
		fd.set('rowSpacing', editRowSpacing);
		fd.set('companions', editCompanions ? JSON.stringify(editCompanions.split(',').map(s => s.trim()).filter(Boolean)) : '');
		fd.set('antagonists', editAntagonists ? JSON.stringify(editAntagonists.split(',').map(s => s.trim()).filter(Boolean)) : '');
		fd.set('photos', JSON.stringify(photos));
		await fetch('?/update', { method: 'POST', body: fd });
		window.location.reload();
	}

	async function deletePlant() {
		if (!confirm('Supprimer cette plante ?')) return;
		await fetch('?/delete', { method: 'POST' });
		window.location.href = '/plants';
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

<a href="/plants" class="text-sm text-blue-600 hover:underline">&larr; Retour aux plantes</a>

<div class="mt-4">
	{#if editing}
		<!-- Edit mode -->
		<div class="max-w-2xl space-y-3 text-sm">
			<h1 class="text-2xl font-bold mb-4">Modifier {plant.commonName}</h1>
			<div class="grid grid-cols-2 gap-3">
				<div>
					<label class="block text-gray-600">
						Nom *
						<input type="text" bind:value={editName} class="w-full border rounded px-2 py-1" />
					</label>
				</div>
				<div>
					<label class="block text-gray-600">
						Nom latin
						<input type="text" bind:value={editLatin} class="w-full border rounded px-2 py-1" />
					</label>
				</div>
			</div>
			<div>
				<label class="block text-gray-600">
					Famille
					<input type="text" bind:value={editFamily} class="w-full border rounded px-2 py-1" />
				</label>
			</div>
			<div>
				<label class="block text-gray-600">
					Description
					<textarea bind:value={editDesc} class="w-full border rounded px-2 py-1" rows="3"></textarea>
				</label>
			</div>
			<div class="grid grid-cols-2 gap-3">
				<div>
					<label class="block text-gray-600">
						Exposition
						<select bind:value={editSun} class="w-full border rounded px-2 py-1">
							<option value="">—</option>
							<option value="plein_soleil">Plein soleil</option>
							<option value="mi_ombre">Mi-ombre</option>
							<option value="ombre">Ombre</option>
						</select>
					</label>
				</div>
				<div>
					<label class="block text-gray-600">
						Type de sol
						<select bind:value={editSoil} class="w-full border rounded px-2 py-1">
							<option value="">—</option>
							<option value="riche">Riche</option>
							<option value="meuble">Meuble</option>
							<option value="lourd">Lourd</option>
							<option value="léger">Léger</option>
						</select>
					</label>
				</div>
			</div>
			<div class="grid grid-cols-3 gap-3">
				<div>
					<label class="block text-gray-600">
						Arrosage
						<select bind:value={editWater} class="w-full border rounded px-2 py-1">
							<option value="">—</option>
							<option value="faible">Faible</option>
							<option value="moyen">Moyen</option>
							<option value="élevé">Élevé</option>
						</select>
					</label>
				</div>
				<div>
					<label class="block text-gray-600">
						Espacement (cm)
						<input type="number" bind:value={editSpacing} class="w-full border rounded px-2 py-1" />
					</label>
				</div>
				<div>
					<label class="block text-gray-600">
						Entre rangs (cm)
						<input type="number" bind:value={editRowSpacing} class="w-full border rounded px-2 py-1" />
					</label>
				</div>
			</div>
			<fieldset class="border rounded p-3">
				<legend class="text-xs font-medium text-gray-500 px-1">Périodes (MM-DD)</legend>
				<div class="grid grid-cols-3 gap-3 mt-2">
					<div><label class="block text-gray-600">Semis début<input type="text" bind:value={editSowingS} placeholder="03-15" class="w-full border rounded px-2 py-1" /></label></div>
					<div><label class="block text-gray-600">Semis fin<input type="text" bind:value={editSowingE} placeholder="05-15" class="w-full border rounded px-2 py-1" /></label></div>
					<div></div>
					<div><label class="block text-gray-600">Plantation début<input type="text" bind:value={editPlantingS} placeholder="04-15" class="w-full border rounded px-2 py-1" /></label></div>
					<div><label class="block text-gray-600">Plantation fin<input type="text" bind:value={editPlantingE} placeholder="06-15" class="w-full border rounded px-2 py-1" /></label></div>
					<div></div>
					<div><label class="block text-gray-600">Récolte début<input type="text" bind:value={editHarvestS} placeholder="06-01" class="w-full border rounded px-2 py-1" /></label></div>
					<div><label class="block text-gray-600">Récolte fin<input type="text" bind:value={editHarvestE} placeholder="10-01" class="w-full border rounded px-2 py-1" /></label></div>
					<div></div>
				</div>
			</fieldset>
			<div class="grid grid-cols-2 gap-3">
				<div>
					<label class="block text-gray-600">
						Compagnons (séparés par ,)
						<input type="text" bind:value={editCompanions} class="w-full border rounded px-2 py-1" />
					</label>
				</div>
				<div>
					<label class="block text-gray-600">
						Antagonistes (séparés par ,)
						<input type="text" bind:value={editAntagonists} class="w-full border rounded px-2 py-1" />
					</label>
				</div>
			</div>
			<div class="flex gap-2 justify-end pt-2">
				<button class="px-4 py-2 border rounded" onclick={() => editing = false}>Annuler</button>
				<button class="px-4 py-2 bg-red-600 text-white rounded" onclick={deletePlant}>Supprimer</button>
				<button class="px-4 py-2 bg-green-600 text-white rounded" onclick={submitUpdate}>Enregistrer</button>
			</div>
		</div>

		<!-- Photos -->
		<div class="mt-6 border rounded-lg p-4">
			<h2 class="font-bold text-lg mb-3">Photos</h2>
			<div class="flex flex-wrap gap-3">
				{#each photos as url, i}
					<div class="relative group">
						<img src={url} alt="" class="w-32 h-32 object-cover rounded border" />
						<div class="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition">
							<button class="bg-white rounded shadow text-xs px-1 py-0.5 hover:bg-gray-100 disabled:opacity-30" onclick={() => movePhoto(i, -1)} disabled={i === 0}>↑</button>
							<button class="bg-white rounded shadow text-xs px-1 py-0.5 hover:bg-gray-100 disabled:opacity-30" onclick={() => movePhoto(i, 1)} disabled={i === photos.length - 1}>↓</button>
							<button class="bg-red-500 text-white rounded shadow text-xs px-1 py-0.5 hover:bg-red-600" onclick={() => removePhoto(i)}>✕</button>
						</div>
					</div>
				{/each}
			</div>
			<div class="mt-3">
				<label class="cursor-pointer inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 rounded px-3 py-1.5 text-sm">
					{uploading ? 'Upload...' : '+ Ajouter une photo'}
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
				<button class="text-sm text-blue-600 hover:underline" onclick={() => editing = true}>Modifier</button>
				{#if plant.family}
					<div class="text-right">
						<span class="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full">{plant.family}</span>
						{#if sameFamily.length > 0}
							<p class="text-xs text-gray-400 mt-1">{sameFamily.length} autre(s) plante(s) de la même famille</p>
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
				<h2 class="font-bold text-lg mb-3">Périodes</h2>
				<div class="space-y-3">
					{#if plant.sowingStart}
						<div>
							<p class="text-sm font-medium text-gray-600">Semis</p>
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
							<p class="text-sm font-medium text-gray-600">Repiquage</p>
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
							<p class="text-sm font-medium text-gray-600">Récolte</p>
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
				<h2 class="font-bold text-lg mb-3">Exigences</h2>
				<dl class="space-y-2 text-sm">
					{#if plant.sunExposure}<div class="flex justify-between"><dt class="text-gray-500">Exposition</dt><dd>{exposureLabels[plant.sunExposure] || plant.sunExposure}</dd></div>{/if}
					{#if plant.soilType}<div class="flex justify-between"><dt class="text-gray-500">Sol</dt><dd>{soilLabels[plant.soilType] || plant.soilType}</dd></div>{/if}
					{#if plant.watering}<div class="flex justify-between"><dt class="text-gray-500">Arrosage</dt><dd>{wateringLabels[plant.watering] || plant.watering}</dd></div>{/if}
					{#if plant.spacing}<div class="flex justify-between"><dt class="text-gray-500">Espacement</dt><dd>{plant.spacing} cm</dd></div>{/if}
					{#if plant.rowSpacing}<div class="flex justify-between"><dt class="text-gray-500">Rangs</dt><dd>{plant.rowSpacing} cm</dd></div>{/if}
				</dl>
			</div>
		</div>

		<div class="mt-6 grid gap-6 md:grid-cols-2">
			{#if companions.length > 0}
				<div class="border rounded-lg p-4">
					<h2 class="font-bold text-lg mb-2 text-green-700">🌱 Bons compagnons</h2>
					<div class="flex flex-wrap gap-2">
						{#each companions as c}
							<a href="/plants/{c.id}" class="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm hover:bg-green-200">{c.commonName}</a>
						{/each}
					</div>
				</div>
			{/if}
			{#if antagonists.length > 0}
				<div class="border rounded-lg p-4">
					<h2 class="font-bold text-lg mb-2 text-red-700">🚫 Mauvais voisins</h2>
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
					{#each photos as url}
						<img src={url} alt="" class="w-32 h-32 object-cover rounded border" />
					{/each}
				</div>
			</div>
		{/if}
	{/if}
</div>
