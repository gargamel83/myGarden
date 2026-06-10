<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidate } from '$app/navigation';
	import { toast } from '$lib/toast.svelte';
	import { STATUS_LABELS, STATUS_COLORS, STATUS_BAR_COLORS } from '$lib/types';
	import type { PlantStatus } from '$lib/types';

	let { data } = $props();

	let showForm = $state(false);
	let editId = $state<number | null>(null);
	let view = $state<'list' | 'timeline'>('list');
	let filterBed = $state('');
	let timelineOffset = $state(0);
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

	const statusLabels = STATUS_LABELS;
	const statusColors = STATUS_COLORS;

	function nextStatus(current: string): string | null {
		const flow: Record<string, string> = { planned: 'sown', sown: 'planted', planted: 'harvested' };
		return flow[current] || null;
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

	function handleFormEnhance() {
		return async ({ result }: { result: any }) => {
			if (result.type === 'success') {
				toast(editId ? 'Planting updated' : 'Planting created');
				closeForm();
				await invalidate('app:plantations');
			} else if (result.type === 'failure') {
				toast(result.data?.error || 'Error', 'error');
			}
		};
	}

	function handleStatusEnhance() {
		return async ({ result }: { result: any }) => {
			if (result.type === 'success') {
				toast('Status updated');
				await invalidate('app:plantations');
			}
		};
	}

	function handleDeleteEnhance() {
		return async ({ result }: { result: any }) => {
			if (result.type === 'success') {
				confirmDeleteId = null;
				toast('Planting deleted');
				await invalidate('app:plantations');
			}
		};
	}

	// Timeline computed values
	function getMonths(): string[] {
		const all: string[] = [];
		const now = new Date();
		for (let i = -2 + timelineOffset; i <= 8 + timelineOffset; i++) {
			const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
			all.push(d.toISOString().slice(0, 7));
		}
		return all;
	}
	const months = $derived(getMonths());

	const monthLabels = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

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
		return STATUS_BAR_COLORS[p.plantation.status as PlantStatus] || '#9ca3af';
	}

	// Group by bed for timeline
	function getBedGroups(): Map<string, typeof data.plantations> {
		const map = new Map<string, typeof data.plantations>();
		const filtered = filterBed
			? data.plantations.filter(p => (p.bedName || 'No bed') === filterBed)
			: data.plantations;
		for (const p of filtered) {
			const key = p.bedName || 'No bed';
			if (!map.has(key)) map.set(key, []);
			map.get(key)!.push(p);
		}
		return map;
	}
	const bedGroups = $derived(getBedGroups());
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold">Plantings</h1>
		<button class="bg-green-600 text-white px-4 py-2 rounded" onclick={() => { resetForm(); showForm = true; }}>
			+ New planting
		</button>
	</div>

	<!-- View switcher -->
	<div class="flex gap-1 border-b">
		<button
			class="px-4 py-2 -mb-px border-b-2 {view === 'list' ? 'border-green-600 text-green-700 font-medium' : 'border-transparent text-gray-500'}"
			onclick={() => view = 'list'}
		>
			List
		</button>
		<button
			class="px-4 py-2 -mb-px border-b-2 {view === 'timeline' ? 'border-green-600 text-green-700 font-medium' : 'border-transparent text-gray-500'}"
			onclick={() => view = 'timeline'}
		>
			Calendar
		</button>
	</div>

	<!-- Rotation alerts -->
	{#if data.rotationAlerts.length > 0}
		<div class="space-y-2">
			<h2 class="font-bold text-lg">Rotation alerts</h2>
			{#each data.rotationAlerts as alert}
				<div class="border-l-4 px-4 py-2 {alert.type === 'warning' ? 'border-red-500 bg-red-50' : 'border-blue-500 bg-blue-50'}">
					<p class="text-sm"><strong>{alert.bedName} :</strong> {alert.message}</p>
					{#if alert.suggestedPlants}
						<p class="text-xs text-gray-500 mt-1">Suggestions: {alert.suggestedPlants.join(', ')}</p>
					{/if}
				</div>
			{/each}
		</div>
	{/if}

	{#if view === 'list'}
		<!-- List view -->
		{#if data.plantations.length === 0}
			<p class="text-gray-500 text-center py-8">No plantations yet.</p>
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
								<span>Sowing: {p.plantation.sowingDate}</span>
							{/if}
							{#if p.plantation.plantingDate}
								<span>Transplanting: {p.plantation.plantingDate}</span>
							{/if}
							{#if p.plantation.harvestDate}
								<span>Harvest: {p.plantation.harvestDate}</span>
							{/if}
						</div>
					</div>
					<div class="flex items-center gap-2">
						<span class="px-2 py-1 rounded text-xs font-medium {statusColors[p.plantation.status]}">
							{statusLabels[p.plantation.status]}
						</span>
						<button class="text-xs text-blue-600 px-2 py-1 rounded hover:bg-blue-50" onclick={() => editPlantation(p)}>
							Edit
						</button>
						{#if nextStatus(p.plantation.status)}
							<form method="POST" action="?/updateStatus" use:enhance={handleStatusEnhance} class="inline">
								<input type="hidden" name="id" value={p.plantation.id} />
								<input type="hidden" name="status" value={nextStatus(p.plantation.status)!} />
								<button type="submit" class="text-xs bg-blue-600 text-white px-2 py-1 rounded">
									Move to {statusLabels[nextStatus(p.plantation.status)!]}
								</button>
							</form>
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
		<!-- Timeline controls -->
			<div class="flex items-center justify-between gap-3">
				<div class="flex items-center gap-1">
				<button class="p-1 rounded border text-sm hover:bg-gray-100" onclick={() => timelineOffset -= 6} title="Previous months">◀</button>
				<button class="p-1 rounded border text-sm hover:bg-gray-100" onclick={() => timelineOffset = 0} title="Today">Today</button>
				<button class="p-1 rounded border text-sm hover:bg-gray-100" onclick={() => timelineOffset += 6} title="Next months">▶</button>
				</div>
				<select bind:value={filterBed} class="border rounded px-2 py-1 text-sm">
					<option value="">All beds</option>
					{#each [...new Set(data.plantations.map(p => p.bedName))] as name}
						<option value={name}>{name}</option>
					{/each}
				</select>
			</div>

			<!-- Month headers -->
			<div class="overflow-x-auto">
				<div class="min-w-[600px]">
					<div class="flex mb-1" style="position: sticky; left: 0;">
						<div class="w-32 shrink-0"></div>
						{#each months as m}
							{@const isCurrent = (() => { const d = new Date(); return m === d.toISOString().slice(0, 7); })()}
							<div class="flex-1 text-center text-xs font-medium border-l {isCurrent ? 'text-green-700 bg-green-50' : 'text-gray-500'}">
								{monthLabel(m)}
							</div>
						{/each}
					</div>

					{#if data.plantations.length === 0}
						<p class="text-gray-400 text-center py-8 text-sm">No plantations to display.</p>
					{:else}
						{#each [...bedGroups] as [bedName, plantList]}
							<div class="mb-4">
								<h3 class="text-sm font-semibold text-gray-700 mb-1">{bedName}</h3>
								{#each plantList as p}
									{@const pf = firstPhoto(p.plantPhotos)}
									{@const style = barStyle(p)}
									<div class="relative h-7 mb-1 group">
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
											<div class="absolute h-5 top-1 rounded cursor-pointer transition-opacity group-hover:opacity-90" style="background: {barColor(p)}; opacity: 0.7; {style}"
												title="{p.plantation.plantName} ({p.bedName})
				Sowing: {p.plantation.sowingDate || '—'}
Transplanting: {p.plantation.plantingDate || '—'}
Harvest: {p.plantation.harvestDate || '—'}
{p.plantation.variety ? 'Variety: ' + p.plantation.variety : ''}">
											</div>
										{/if}
									</div>
								{/each}
							</div>
						{/each}
					{/if}
				</div>
			</div>

			<!-- Legend -->
			<div class="flex gap-4 text-xs text-gray-500">
				<span class="flex items-center gap-1"><span class="w-3 h-3 rounded bg-gray-400"></span> Planned</span>
				<span class="flex items-center gap-1"><span class="w-3 h-3 rounded bg-blue-500"></span> Sown</span>
				<span class="flex items-center gap-1"><span class="w-3 h-3 rounded bg-green-500"></span> Transplanted</span>
				<span class="flex items-center gap-1"><span class="w-3 h-3 rounded bg-amber-500"></span> Harvested</span>
			</div>
	{/if}
</div>

<!-- New plantation dialog -->
{#if showForm}

	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center" onkeydown={(e) => e.key === 'Escape' && closeForm()} onclick={(e) => { if (e.target === e.currentTarget) closeForm(); }} role="dialog" aria-modal="true" tabindex="-1">

		<div class="bg-white rounded-lg p-6 w-96 max-h-[80vh] overflow-y-auto" role="none">
			<form method="POST" action={editId ? '?/update' : '?/create'} use:enhance={handleFormEnhance} onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()}>
				{#if editId}
					<input type="hidden" name="id" value={editId} />
				{/if}
				<h2 class="text-lg font-bold mb-4">{editId ? 'Edit' : 'New'} planting</h2>
				<div class="space-y-3">
					<div>
						<label class="block text-sm text-gray-600">
							Bed *
							<select name="gardenBedId" bind:value={formBedId} required class="w-full border rounded px-2 py-1">
								<option value="">Select a bed</option>
								{#each data.beds as bed}
									<option value={bed.id}>{bed.name}</option>
								{/each}
							</select>
						</label>
					</div>
					<div>
						<label class="block text-sm text-gray-600">
							Plant (base)
							<select name="plantId" bind:value={formPlantId} class="w-full border rounded px-2 py-1">
								<option value="">—</option>
								{#each data.plants as plant}
									<option value={plant.id}>{plant.commonName}</option>
								{/each}
							</select>
						</label>
					</div>
					<div>
						<label class="block text-sm text-gray-600">
							Plant name *
							<input type="text" name="plantName" bind:value={formPlantName} required class="w-full border rounded px-2 py-1" />
						</label>
					</div>
					<div>
						<label class="block text-sm text-gray-600">
							Variety
							<input type="text" name="variety" bind:value={formVariety} class="w-full border rounded px-2 py-1" />
						</label>
					</div>
					<div class="grid grid-cols-3 gap-2">
						<div>
							<label class="block text-sm text-gray-600">
								Sowing
								<input type="date" name="sowingDate" bind:value={formSowing} class="w-full border rounded px-2 py-1 text-sm" />
							</label>
						</div>
						<div>
							<label class="block text-sm text-gray-600">
								Transplanting
								<input type="date" name="plantingDate" bind:value={formPlanting} class="w-full border rounded px-2 py-1 text-sm" />
							</label>
						</div>
						<div>
							<label class="block text-sm text-gray-600">
								Harvest
								<input type="date" name="harvestDate" bind:value={formHarvest} class="w-full border rounded px-2 py-1 text-sm" />
							</label>
						</div>
					</div>
					<div>
						<label class="block text-sm text-gray-600">
							Quantity
							<input type="number" name="quantity" bind:value={formQuantity} class="w-full border rounded px-2 py-1" />
						</label>
					</div>
					<div>
						<label class="block text-sm text-gray-600">
							Notes
							<textarea name="notes" bind:value={formNotes} class="w-full border rounded px-2 py-1"></textarea>
						</label>
					</div>
					<div class="flex gap-2 justify-end pt-2">
						<button type="button" class="px-4 py-2 border rounded" onclick={closeForm}>Cancel</button>
						<button type="submit" class="px-4 py-2 bg-green-600 text-white rounded">{editId ? 'Save' : 'Create'}</button>
					</div>
				</div>
			</form>
		</div>
	</div>
{/if}

{#if confirmDeleteId}

	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onkeydown={(e) => e.key === 'Escape' && (confirmDeleteId = null)} onclick={(e) => { if (e.target === e.currentTarget) confirmDeleteId = null; }} role="dialog" aria-modal="true" tabindex="-1">

		<div class="bg-white rounded-lg p-6 w-80 shadow-xl" role="none">
			<form method="POST" action="?/delete" use:enhance={handleDeleteEnhance} onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()}>
				<input type="hidden" name="id" value={confirmDeleteId} />
				<h3 class="font-bold text-lg mb-2">Delete planting</h3>
				<p class="text-sm text-gray-600 mb-5">This action is irreversible.</p>
				<div class="flex justify-end gap-2">
					<button type="button" class="px-4 py-2 border rounded text-sm" onclick={() => confirmDeleteId = null}>Cancel</button>
					<button type="submit" class="px-4 py-2 bg-red-600 text-white rounded text-sm">Delete</button>
				</div>
			</form>
		</div>
	</div>
{/if}
