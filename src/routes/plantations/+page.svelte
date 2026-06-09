<script lang="ts">
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import { toast } from '$lib/toast.svelte';

	let { data } = $props();

	let showForm = $state(false);
	let editId = $state<number | null>(null);
	let view = $state<'list' | 'timeline'>('list');
	let confirmDeleteId = $state<number | null>(null);
	let formBedId = $state('');
	let formPlantName = $state('');
	let formPlantId = $state('');
	let formVariety = $state('');
	let formSowing = $state('');
	let formPlanting = $state('');
	let formHarvest = $state('');
	let formQuantity = $state('');
	let formNotes = $state('');

	const statusLabels: Record<string, string> = {
		planned: 'Planifié',
		sown: 'Semé',
		planted: 'Repiqué',
		harvested: 'Récolté',
		cancelled: 'Annulé'
	};

	const statusColors: Record<string, string> = {
		planned: 'bg-gray-200 text-gray-700',
		sown: 'bg-blue-100 text-blue-700',
		planted: 'bg-green-100 text-green-700',
		harvested: 'bg-amber-100 text-amber-700',
		cancelled: 'bg-red-100 text-red-700'
	};

	function nextStatus(current: string): string | null {
		const flow: Record<string, string> = { planned: 'sown', sown: 'planted', planted: 'harvested' };
		return flow[current] || null;
	}

	async function advance(id: number, current: string) {
		const next = nextStatus(current);
		if (!next) return;
		const form = new FormData();
		form.set('id', String(id));
		form.set('status', next);
		const res = await fetch('?/updateStatus', { method: 'POST', body: form });
		if (res.ok) {
			toast('Statut mis à jour');
			setTimeout(() => window.location.reload(), 800);
		}
	}

	async function deletePlantation(id: number) {
		const form = new FormData();
		form.set('id', String(id));
		const res = await fetch('?/delete', { method: 'POST', body: form });
		if (res.ok) {
			confirmDeleteId = null;
			toast('Plantation supprimée');
			setTimeout(() => window.location.reload(), 800);
		}
	}

	function resetForm() {
		editId = null;
		formBedId = '';
		formPlantName = '';
		formPlantId = '';
		formVariety = '';
		formSowing = '';
		formPlanting = '';
		formHarvest = '';
		formQuantity = '';
		formNotes = '';
	}

	function closeForm() {
		resetForm();
		showForm = false;
	}

	function editPlantation(p: typeof data.plantations[0]) {
		editId = p.plantation.id;
		formBedId = String(p.plantation.gardenBedId);
		formPlantName = p.plantation.plantName;
		formPlantId = p.plantation.plantId ? String(p.plantation.plantId) : '';
		formVariety = p.plantation.variety || '';
		formSowing = p.plantation.sowingDate || '';
		formPlanting = p.plantation.plantingDate || '';
		formHarvest = p.plantation.harvestDate || '';
		formQuantity = p.plantation.quantity ? String(p.plantation.quantity) : '';
		formNotes = p.plantation.notes || '';
		showForm = true;
	}

	function firstPhoto(photos: string | null): string | null {
		try {
			const a = JSON.parse(photos || '[]');
			return Array.isArray(a) && a.length > 0 ? a[0] : null;
		} catch { return null; }
	}

	async function submitForm() {
		const url = editId ? '?/update' : '?/create';
		const form = new FormData();
		if (editId) form.set('id', String(editId));
		form.set('gardenBedId', formBedId);
		form.set('plantName', formPlantName);
		form.set('plantId', formPlantId);
		form.set('variety', formVariety);
		form.set('sowingDate', formSowing);
		form.set('plantingDate', formPlanting);
		form.set('harvestDate', formHarvest);
		form.set('quantity', formQuantity);
		form.set('notes', formNotes);
		const res = await fetch(url, { method: 'POST', body: form });
		if (res.ok) {
			toast(editId ? 'Plantation modifiée' : 'Plantation créée');
			closeForm();
			setTimeout(() => window.location.reload(), 800);
		}
	}

	// Timeline computed values
	function getMonths(): string[] {
		const all: string[] = [];
		const now = new Date();
		for (let i = -2; i <= 8; i++) {
			const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
			all.push(d.toISOString().slice(0, 7));
		}
		return all;
	}
	const months = getMonths();

	function monthLabel(ym: string): string {
		const d = new Date(ym + '-01');
		return d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
	}

	function dayOfYear(dateStr: string): number {
		const d = new Date(dateStr);
		const start = new Date(d.getFullYear(), 0, 0);
		return (d.getTime() - start.getTime()) / 86400000;
	}

	function barStyle(p: typeof data.plantations[0]) {
		const sd = p.plantation.sowingDate;
		const pd = p.plantation.plantingDate;
		const hd = p.plantation.harvestDate;
		const now = new Date();
		const year = now.getFullYear();
		const yearStart = new Date(year, 0, 1).getTime();
		const yearEnd = new Date(year + 1, 0, 1).getTime();
		const total = yearEnd - yearStart;

		const startDate = sd || pd;
		let endDate = hd;
		if (!endDate && pd) {
			const d = new Date(pd);
			d.setMonth(d.getMonth() + 3);
			endDate = d.toISOString().slice(0, 10);
		}

		const start = startDate ? Math.max(new Date(startDate).getTime(), yearStart) : yearStart;
		const end = endDate ? Math.min(new Date(endDate).getTime(), yearEnd) : yearEnd;
		if (end <= yearStart || start >= yearEnd) return null;

		const left = ((start - yearStart) / total) * 100;
		const width = ((end - start) / total) * 100;
		return `left: ${left}%; width: ${Math.max(width, 1)}%`;
	}

	function barColor(p: typeof data.plantations[0]): string {
		const colors: Record<string, string> = {
			planned: '#9ca3af',
			sown: '#3b82f6',
			planted: '#22c55e',
			harvested: '#f59e0b',
			cancelled: '#ef4444'
		};
		return colors[p.plantation.status] || '#9ca3af';
	}

	// Group by bed for timeline
	function getBedGroups(): Map<string, typeof data.plantations> {
		const map = new Map<string, typeof data.plantations>();
		for (const p of data.plantations) {
			const key = p.bedName || 'Sans bande';
			if (!map.has(key)) map.set(key, []);
			map.get(key)!.push(p);
		}
		return map;
	}
	const bedGroups = getBedGroups();
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold">Plantations</h1>
		<button class="bg-green-600 text-white px-4 py-2 rounded" onclick={() => { resetForm(); showForm = true; }}>
			+ Nouvelle plantation
		</button>
	</div>

	<!-- View switcher -->
	<div class="flex gap-1 border-b">
		<button
			class="px-4 py-2 -mb-px border-b-2 {view === 'list' ? 'border-green-600 text-green-700 font-medium' : 'border-transparent text-gray-500'}"
			onclick={() => view = 'list'}
		>
			Liste
		</button>
		<button
			class="px-4 py-2 -mb-px border-b-2 {view === 'timeline' ? 'border-green-600 text-green-700 font-medium' : 'border-transparent text-gray-500'}"
			onclick={() => view = 'timeline'}
		>
			Calendrier
		</button>
	</div>

	<!-- Rotation alerts -->
	{#if data.rotationAlerts.length > 0}
		<div class="space-y-2">
			<h2 class="font-bold text-lg">Alertes rotation</h2>
			{#each data.rotationAlerts as alert}
				<div class="border-l-4 px-4 py-2 {alert.type === 'warning' ? 'border-red-500 bg-red-50' : 'border-blue-500 bg-blue-50'}">
					<p class="text-sm"><strong>{alert.bedName} :</strong> {alert.message}</p>
					{#if alert.suggestedPlants}
						<p class="text-xs text-gray-500 mt-1">Suggestions : {alert.suggestedPlants.join(', ')}</p>
					{/if}
				</div>
			{/each}
		</div>
	{/if}

	{#if view === 'list'}
		<!-- List view -->
		{#if data.plantations.length === 0}
			<p class="text-gray-500 text-center py-8">Aucune plantation pour le moment.</p>
		{/if}

		<div class="grid gap-3">
	{#each data.plantations as p}
			{@const pf = firstPhoto(p.plantPhotos)}
			<div class="border rounded p-4 flex items-center justify-between">
				<div class="flex items-center gap-3">
					{#if pf}
						<img src={pf} alt="" class="w-10 h-10 object-cover rounded shrink-0" />
					{/if}
					<div>
						<div class="flex items-center gap-2">
							<span class="font-medium">{p.plantation.plantName}</span>
							{#if p.plantation.variety}
								<span class="text-sm text-gray-500">({p.plantation.variety})</span>
							{/if}
						</div>
						<p class="text-sm text-gray-500">{p.bedName || '—'}</p>
						<div class="flex gap-3 text-xs text-gray-400 mt-1">
							{#if p.plantation.sowingDate}
								<span>Semis: {p.plantation.sowingDate}</span>
							{/if}
							{#if p.plantation.plantingDate}
								<span>Repiquage: {p.plantation.plantingDate}</span>
							{/if}
							{#if p.plantation.harvestDate}
								<span>Récolte: {p.plantation.harvestDate}</span>
							{/if}
						</div>
					</div>
					<div class="flex items-center gap-2">
						<span class="px-2 py-1 rounded text-xs font-medium {statusColors[p.plantation.status]}">
							{statusLabels[p.plantation.status]}
						</span>
						<button class="text-xs text-blue-600 px-2 py-1 rounded hover:bg-blue-50" onclick={() => editPlantation(p)}>
							Modifier
						</button>
						{#if nextStatus(p.plantation.status)}
							<button
								class="text-xs bg-blue-600 text-white px-2 py-1 rounded"
								onclick={() => advance(p.plantation.id, p.plantation.status)}
							>
								Passer à {statusLabels[nextStatus(p.plantation.status)!]}
							</button>
						{/if}
					<button class="text-red-500 text-sm" onclick={() => confirmDeleteId = p.plantation.id}>
						✕
					</button>
					</div>
				</div>
			</div>
			{/each}
		</div>
	{:else}
		<!-- Timeline view -->
		{#if data.plantations.length === 0}
			<p class="text-gray-500 text-center py-8">Aucune plantation à afficher.</p>
		{:else}
			<!-- Month headers -->
			<div class="overflow-x-auto">
				<div class="min-w-[600px]">
					<div class="flex mb-1" style="position: sticky; left: 0;">
						<div class="w-32 shrink-0"></div>
						{#each months as m}
							<div class="flex-1 text-center text-xs text-gray-500 font-medium border-l">
								{monthLabel(m)}
							</div>
						{/each}
					</div>

					{#each [...bedGroups] as [bedName, plantList]}
						<div class="mb-4">
							<h3 class="text-sm font-semibold text-gray-700 mb-1">{bedName}</h3>
							{#each plantList as p}
								{@const pf = firstPhoto(p.plantPhotos)}
								{@const style = barStyle(p)}
								<div class="relative h-7 mb-1">
									<!-- Month grid lines -->
									<div class="absolute inset-0 flex">
										<div class="w-32 shrink-0 flex items-center gap-1 pr-2 leading-7 truncate">
											{#if pf}
												<img src={pf} alt="" class="w-5 h-5 object-cover rounded shrink-0" />
											{/if}
											<span class="text-xs text-gray-600 truncate">{p.plantation.plantName}</span>
										</div>
										{#each months as m}
											<div class="flex-1 border-l border-gray-100"></div>
										{/each}
									</div>
									{#if style}
										<div class="absolute h-5 top-1 rounded" style="background: {barColor(p)}; opacity: 0.7; {style}"></div>
									{/if}
								</div>
							{/each}
						</div>
					{/each}
				</div>
			</div>

			<!-- Legend -->
			<div class="flex gap-4 text-xs text-gray-500">
				<span class="flex items-center gap-1"><span class="w-3 h-3 rounded bg-gray-400"></span> Planifié</span>
				<span class="flex items-center gap-1"><span class="w-3 h-3 rounded bg-blue-500"></span> Semé</span>
				<span class="flex items-center gap-1"><span class="w-3 h-3 rounded bg-green-500"></span> Repiqué</span>
				<span class="flex items-center gap-1"><span class="w-3 h-3 rounded bg-amber-500"></span> Récolté</span>
			</div>
		{/if}
	{/if}
</div>

<!-- New plantation dialog -->
{#if showForm}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center" onclick={closeForm} role="presentation">
		<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
		<div class="bg-white rounded-lg p-6 w-96 max-h-[80vh] overflow-y-auto" onclick={(e) => e.stopPropagation()} role="presentation">
			<h2 class="text-lg font-bold mb-4">{editId ? 'Modifier' : 'Nouvelle'} plantation</h2>
			<div class="space-y-3">
				<div>
					<label class="block text-sm text-gray-600">
						Bande *
						<select bind:value={formBedId} class="w-full border rounded px-2 py-1">
							<option value="">Sélectionner une bande</option>
							{#each data.beds as bed}
								<option value={bed.id}>{bed.name}</option>
							{/each}
						</select>
					</label>
				</div>
				<div>
					<label class="block text-sm text-gray-600">
						Plante (base)
						<select bind:value={formPlantId} class="w-full border rounded px-2 py-1">
							<option value="">—</option>
							{#each data.plants as plant}
								<option value={plant.id}>{plant.commonName}</option>
							{/each}
						</select>
					</label>
				</div>
				<div>
					<label class="block text-sm text-gray-600">
						Nom de la plante *
						<input type="text" bind:value={formPlantName} class="w-full border rounded px-2 py-1" />
					</label>
				</div>
				<div>
					<label class="block text-sm text-gray-600">
						Variété
						<input type="text" bind:value={formVariety} class="w-full border rounded px-2 py-1" />
					</label>
				</div>
				<div class="grid grid-cols-3 gap-2">
					<div>
						<label class="block text-sm text-gray-600">
							Semis
							<input type="date" bind:value={formSowing} class="w-full border rounded px-2 py-1 text-sm" />
						</label>
					</div>
					<div>
						<label class="block text-sm text-gray-600">
							Repiquage
							<input type="date" bind:value={formPlanting} class="w-full border rounded px-2 py-1 text-sm" />
						</label>
					</div>
					<div>
						<label class="block text-sm text-gray-600">
							Récolte
							<input type="date" bind:value={formHarvest} class="w-full border rounded px-2 py-1 text-sm" />
						</label>
					</div>
				</div>
				<div>
					<label class="block text-sm text-gray-600">
						Quantité
						<input type="number" bind:value={formQuantity} class="w-full border rounded px-2 py-1" />
					</label>
				</div>
				<div>
					<label class="block text-sm text-gray-600">
						Notes
						<textarea bind:value={formNotes} class="w-full border rounded px-2 py-1"></textarea>
					</label>
				</div>
				<div class="flex gap-2 justify-end pt-2">
					<button class="px-4 py-2 border rounded" onclick={closeForm}>Annuler</button>
					<button class="px-4 py-2 bg-green-600 text-white rounded" onclick={submitForm}>{editId ? 'Enregistrer' : 'Créer'}</button>
				</div>
			</div>
		</div>
	</div>
{/if}

{#if confirmDeleteId}
	<ConfirmDialog
		title="Supprimer la plantation"
		message="Cette action est irréversible."
		confirmLabel="Supprimer"
		onconfirm={() => deletePlantation(confirmDeleteId!)}
		oncancel={() => confirmDeleteId = null}
	/>
{/if}
