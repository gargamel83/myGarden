<script lang="ts">
	let { data, form } = $props();

	let search = $state(data.search);
	let family = $state(data.selectedFamily);
	let exposure = $state(data.selectedExposure);

	let showForm = $state(false);
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
		window.location.href = qs ? `/plants?${qs}` : '/plants';
	}

	async function submitPlant() {
		const fd = new FormData();
		fd.set('commonName', formName);
		fd.set('latinName', formLatin);
		fd.set('family', formFamily);
		fd.set('description', formDesc);
		fd.set('sowingStart', formSowingS);
		fd.set('sowingEnd', formSowingE);
		fd.set('plantingStart', formPlantingS);
		fd.set('plantingEnd', formPlantingE);
		fd.set('harvestStart', formHarvestS);
		fd.set('harvestEnd', formHarvestE);
		fd.set('sunExposure', formSun);
		fd.set('soilType', formSoil);
		fd.set('watering', formWater);
		fd.set('spacing', formSpacing);
		fd.set('rowSpacing', formRowSpacing);
		fd.set('companions', formCompanions);
		fd.set('antagonists', formAntagonists);
		await fetch('?/create', { method: 'POST', body: fd });
		window.location.reload();
	}

	const exposureLabels: Record<string, string> = {
		plein_soleil: '☀️ Plein soleil',
		mi_ombre: '🌤 Mi-ombre',
		ombre: '🌑 Ombre'
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
	<h1 class="text-2xl font-bold">Base de connaissances</h1>
	<button class="bg-green-600 text-white px-4 py-2 rounded text-sm" onclick={() => showForm = true}>
		+ Nouvelle plante
	</button>

	<!-- Filters -->
	<div class="flex gap-3 flex-wrap">
		<input
			type="text"
			bind:value={search}
			placeholder="Rechercher une plante..."
			class="border rounded px-3 py-2 flex-1 min-w-[200px]"
			onkeydown={(e) => e.key === 'Enter' && filterUrl()}
		/>
		<select bind:value={family} class="border rounded px-3 py-2" onchange={filterUrl}>
			<option value="">Toutes les familles</option>
			{#each data.families as f}
				<option value={f}>{f}</option>
			{/each}
		</select>
		<select bind:value={exposure} class="border rounded px-3 py-2" onchange={filterUrl}>
			<option value="">Toute exposition</option>
			<option value="plein_soleil">Plein soleil</option>
			<option value="mi_ombre">Mi-ombre</option>
			<option value="ombre">Ombre</option>
		</select>
		<button class="bg-gray-200 px-4 py-2 rounded" onclick={() => { search = ''; family = ''; exposure = ''; filterUrl(); }}>
			Réinitialiser
		</button>
	</div>

	<!-- Grid -->
	{#if data.plants.length === 0}
		<p class="text-gray-500 text-center py-8">Aucune plante trouvée.</p>
	{/if}

	<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
		{#each data.plants as plant}
			{@const firstPhoto = (() => { try { const p = JSON.parse(plant.photos || '[]'); return Array.isArray(p) && p.length > 0 ? p[0] : null; } catch { return null; } })()}
			<a href="/plants/{plant.id}" class="border rounded-lg p-4 hover:shadow-lg transition block">
				{#if firstPhoto}
					<img src={firstPhoto} alt="" class="w-full h-28 object-cover rounded mb-3" />
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
						<p>Sol: {plant.soilType}</p>
					{/if}
				</div>

				<!-- Period bars -->
				<div class="mt-3 space-y-1">
					{#if plant.sowingStart}
						{@const months = periodBar(plant.sowingStart, plant.sowingEnd)}
						<div class="flex gap-0.5 h-2">
							{#each months || [] as active, i}
								<div class="flex-1 rounded-sm {active ? 'bg-green-500' : 'bg-gray-100'}" title={monthLabels[i]}></div>
							{/each}
						</div>
						<p class="text-[10px] text-gray-400">Semis</p>
					{/if}
					{#if plant.plantingStart}
						{@const months = periodBar(plant.plantingStart, plant.plantingEnd)}
						<div class="flex gap-0.5 h-2">
							{#each months || [] as active, i}
								<div class="flex-1 rounded-sm {active ? 'bg-blue-500' : 'bg-gray-100'}" title={monthLabels[i]}></div>
							{/each}
						</div>
						<p class="text-[10px] text-gray-400">Repiquage</p>
					{/if}
					{#if plant.harvestStart}
						{@const months = periodBar(plant.harvestStart, plant.harvestEnd)}
						<div class="flex gap-0.5 h-2">
							{#each months || [] as active, i}
								<div class="flex-1 rounded-sm {active ? 'bg-amber-500' : 'bg-gray-100'}" title={monthLabels[i]}></div>
							{/each}
						</div>
						<p class="text-[10px] text-gray-400">Récolte</p>
					{/if}
				</div>

				<div class="mt-2 text-xs text-gray-500 line-clamp-2">
					{plant.description}
				</div>
			</a>
		{/each}
	</div>
</div>

<!-- New plant dialog -->
{#if showForm}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onclick={() => showForm = false} role="presentation">
		<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
		<div class="bg-white rounded-lg p-6 w-[500px] max-h-[85vh] overflow-y-auto" onclick={(e) => e.stopPropagation()} role="presentation">
			<h2 class="text-lg font-bold mb-4">Nouvelle plante</h2>
			<div class="space-y-3 text-sm">
				<div class="grid grid-cols-2 gap-3">
					<div>
						<label class="block text-gray-600">
							Nom *
							<input type="text" bind:value={formName} class="w-full border rounded px-2 py-1" />
						</label>
					</div>
					<div>
						<label class="block text-gray-600">
							Nom latin
							<input type="text" bind:value={formLatin} class="w-full border rounded px-2 py-1" />
						</label>
					</div>
				</div>
			<div>
				<label class="block text-gray-600">
					Famille
					<input type="text" bind:value={formFamily} class="w-full border rounded px-2 py-1" placeholder="ex: Solanaceae" />
				</label>
			</div>
			<div>
				<label class="block text-gray-600">
					Description
					<textarea bind:value={formDesc} class="w-full border rounded px-2 py-1" rows="2"></textarea>
				</label>
			</div>
				<div class="grid grid-cols-2 gap-3">
					<div>
						<label class="block text-gray-600">
							Exposition
							<select bind:value={formSun} class="w-full border rounded px-2 py-1">
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
							<select bind:value={formSoil} class="w-full border rounded px-2 py-1">
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
							<select bind:value={formWater} class="w-full border rounded px-2 py-1">
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
							<input type="number" bind:value={formSpacing} class="w-full border rounded px-2 py-1" />
						</label>
					</div>
					<div>
						<label class="block text-gray-600">
							Entre rangs (cm)
							<input type="number" bind:value={formRowSpacing} class="w-full border rounded px-2 py-1" />
						</label>
					</div>
				</div>
				<fieldset class="border rounded p-3">
					<legend class="text-xs font-medium text-gray-500 px-1">Périodes (MM-DD)</legend>
					<div class="grid grid-cols-3 gap-3 mt-2">
						<div>
							<label class="block text-gray-600">
								Semis début
								<input type="text" bind:value={formSowingS} placeholder="03-15" class="w-full border rounded px-2 py-1" />
							</label>
						</div>
						<div>
							<label class="block text-gray-600">
								Semis fin
								<input type="text" bind:value={formSowingE} placeholder="05-15" class="w-full border rounded px-2 py-1" />
							</label>
						</div>
						<div></div>
						<div>
							<label class="block text-gray-600">
								Plantation début
								<input type="text" bind:value={formPlantingS} placeholder="04-15" class="w-full border rounded px-2 py-1" />
							</label>
						</div>
						<div>
							<label class="block text-gray-600">
								Plantation fin
								<input type="text" bind:value={formPlantingE} placeholder="06-15" class="w-full border rounded px-2 py-1" />
							</label>
						</div>
						<div></div>
						<div>
							<label class="block text-gray-600">
								Récolte début
								<input type="text" bind:value={formHarvestS} placeholder="06-01" class="w-full border rounded px-2 py-1" />
							</label>
						</div>
						<div>
							<label class="block text-gray-600">
								Récolte fin
								<input type="text" bind:value={formHarvestE} placeholder="10-01" class="w-full border rounded px-2 py-1" />
							</label>
						</div>
						<div></div>
					</div>
				</fieldset>
				<div class="grid grid-cols-2 gap-3">
					<div>
						<label class="block text-gray-600">
							Compagnons (noms séparés par ,)
							<input type="text" bind:value={formCompanions} class="w-full border rounded px-2 py-1" />
						</label>
					</div>
					<div>
						<label class="block text-gray-600">
							Antagonistes (noms séparés par ,)
							<input type="text" bind:value={formAntagonists} class="w-full border rounded px-2 py-1" />
						</label>
					</div>
				</div>
				<div class="flex gap-2 justify-end pt-2">
					<button class="px-4 py-2 border rounded" onclick={() => showForm = false}>Annuler</button>
					<button class="px-4 py-2 bg-green-600 text-white rounded" onclick={submitPlant}>Créer</button>
				</div>
			</div>
		</div>
	</div>
{/if}
