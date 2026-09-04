<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidate } from '$app/navigation';
	import { toast } from '$lib/toast.svelte';
	import { STATUS_LABELS, STATUS_COLORS, STATUS_BAR_COLORS } from '$lib/types';
	import type { PlantStatus } from '$lib/types';
	import type { SubmitFunction } from '@sveltejs/kit';
import { firstPhoto } from '$lib/utils';
import Modal from '$lib/components/Modal.svelte';
import { localeStore, t } from '$lib/i18n';
let _locale = $localeStore;

	let { data } = $props();

	let showForm = $state(false);
	let editId = $state<number | null>(null);
	let view = $state<'list' | 'timeline'>('list');
	const PAGE_SIZE = 30;
	let visibleCount = $state(PAGE_SIZE);
	let search = $state('');
	let sortBy = $state<'plantName' | 'bedName' | 'sowingDate' | 'status' | 'createdAt'>('createdAt');
	let filterStatus = $state('');

	let filteredSorted = $derived(
		(() => {
			const q = search.trim().toLowerCase();
			const arr = data.plantations.filter((p) => {
				if (filterStatus && p.plantation.status !== filterStatus) return false;
				if (q) {
					const hay = [p.plantation.plantName, p.plantation.variety, p.bedName].filter(Boolean).join(' ').toLowerCase();
					if (!hay.includes(q)) return false;
				}
				return true;
			});
			const col = sortBy;
			arr.sort((a, b) => {
				switch (col) {
					case 'plantName': return a.plantation.plantName.localeCompare(b.plantation.plantName);
					case 'bedName': return (a.bedName || '').localeCompare(b.bedName || '');
					case 'sowingDate': return (a.plantation.sowingDate || '').localeCompare(b.plantation.sowingDate || '');
					case 'status': return a.plantation.status.localeCompare(b.plantation.status);
					default: return (a.plantation.createdAt || '').localeCompare(b.plantation.createdAt || '');
				}
			});
			return arr;
		})()
	);
	let visiblePlantations = $derived(filteredSorted.slice(0, visibleCount));
	let hasMore = $derived(visibleCount < filteredSorted.length);

	$effect(() => {
		search; sortBy; filterStatus;
		visibleCount = PAGE_SIZE;
	});

	function showMore() {
		visibleCount += PAGE_SIZE;
	}

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

	$effect(() => {
		if (formPlantId) {
			const plant = data.plants.find(p => String(p.id) === formPlantId);
			if (plant) formPlantName = plant.commonName;
		}
	});

	const handleFormEnhance: SubmitFunction = (_input) => {
		return async ({ result }) => {
			if (result.type === 'success') {
				toast(editId ? t('plantations.updated') : t('plantations.created'));
				closeForm();
				await invalidate('app:plantations');
			} else if (result.type === 'failure') {
				toast(result.data?.error || t('common.error'), 'error');
			}
		};
	}

	const handleStatusEnhance: SubmitFunction = (_input) => {
		return async ({ result }) => {
			if (result.type === 'success') {
				toast(t('plantations.statusUpdated'));
				await invalidate('app:plantations');
			}
		};
	}

	const handleDeleteEnhance: SubmitFunction = (_input) => {
		return async ({ result }) => {
			if (result.type === 'success') {
				confirmDeleteId = null;
				toast(t('plantations.deleted'));
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
		<h1 class="text-2xl font-bold">{t('plantations.title')}</h1>
		<button class="bg-[var(--btn-bg)] text-white px-4 py-2 rounded" onclick={() => { resetForm(); showForm = true; }}>
			{t('plantations.newPlanting')}
		</button>
	</div>

	<!-- View switcher -->
	<div class="flex gap-1 border-b">
		<button
			class="px-4 py-2 -mb-px border-b-2 {view === 'list' ? 'border-[var(--tab-border)] text-[var(--tab-text)] font-medium' : 'border-transparent text-gray-500'}"
			onclick={() => view = 'list'}
		>
			{t('plantations.list')}
		</button>
		<button
			class="px-4 py-2 -mb-px border-b-2 {view === 'timeline' ? 'border-[var(--tab-border)] text-[var(--tab-text)] font-medium' : 'border-transparent text-gray-500'}"
			onclick={() => view = 'timeline'}
		>
			{t('plantations.calendar')}
		</button>
	</div>

	<!-- Rotation alerts -->
	{#if data.rotationAlerts.length > 0}
		<div class="space-y-2">
			<h2 class="font-bold text-lg">{t('plantations.rotationAlerts')}</h2>
			{#each data.rotationAlerts as alert}
				<div class="border-l-4 px-4 py-2 {alert.type === 'warning' ? 'border-red-500 bg-red-50' : 'border-blue-500 bg-blue-50'}">
					<p class="text-sm"><strong>{alert.bedName} :</strong> {alert.message}</p>
					{#if alert.suggestedPlants}
						<p class="text-xs text-gray-500 mt-1">{t('garden.suggestions', { plants: alert.suggestedPlants.join(', ') })}</p>
					{/if}
				</div>
			{/each}
		</div>
	{/if}

	{#if view === 'list'}
		<!-- List view -->
		<div class="flex gap-3 flex-wrap items-center mb-3">
			<input
				type="text"
				bind:value={search}
				placeholder={t('plantations.search')}
				class="border rounded px-3 py-1 text-sm flex-1 min-w-[180px]"
			/>
			<select bind:value={filterStatus} class="border rounded px-2 py-1 text-sm">
				<option value="">{t('plantations.allStatuses')}</option>
				{#each ['planned', 'sown', 'planted', 'harvested', 'cancelled'] as s}
					<option value={s}>{t('status.' + s)}</option>
				{/each}
			</select>
			<select bind:value={sortBy} class="border rounded px-2 py-1 text-sm">
				<option value="createdAt">{t('plantations.sortCreated')}</option>
				<option value="plantName">{t('plantations.sortName')}</option>
				<option value="bedName">{t('plantations.sortBed')}</option>
				<option value="sowingDate">{t('plantations.sortSowing')}</option>
				<option value="status">{t('plantations.sortStatus')}</option>
			</select>
		</div>

		{#if filteredSorted.length === 0}
			<p class="text-gray-500 text-center py-8">{t('plantations.none')}</p>
		{/if}

		<div class="grid gap-3">
	{#each visiblePlantations as p (p.plantation.id)}
			{@const pf = firstPhoto(p.plantPhotos)}
			<div class="border rounded p-4 flex items-center justify-between">
				<div class="flex items-center gap-3">
					{#if pf}
						<img src={pf} alt="" loading="lazy" class="w-10 h-10 object-cover rounded shrink-0" />
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
								<span>{t('timeline.sowing', { date: p.plantation.sowingDate })}</span>
							{/if}
							{#if p.plantation.plantingDate}
								<span>{t('timeline.transplanting', { date: p.plantation.plantingDate })}</span>
							{/if}
							{#if p.plantation.harvestDate}
								<span>{t('timeline.harvest', { date: p.plantation.harvestDate })}</span>
							{/if}
						</div>
					</div>
					<div class="flex items-center gap-2">
						<span class="px-2 py-1 rounded text-xs font-medium {statusColors[p.plantation.status as PlantStatus]}">
							{t('status.' + p.plantation.status)}
						</span>
						<button class="text-xs text-blue-600 px-2 py-1 rounded hover:bg-blue-50" onclick={() => editPlantation(p)}>
							{t('plantations.edit')}
						</button>
						{#if nextStatus(p.plantation.status)}
							<form method="POST" action="?/updateStatus" use:enhance={handleStatusEnhance} class="inline">
								<input type="hidden" name="id" value={p.plantation.id} />
								<input type="hidden" name="status" value={nextStatus(p.plantation.status)!} />
								<button type="submit" class="text-xs bg-blue-600 text-white px-2 py-1 rounded">
									{t('plantations.moveTo', { status: t('status.' + nextStatus(p.plantation.status)!) })}
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
		{#if hasMore}
			<button onclick={showMore} class="w-full py-2 border rounded text-sm text-gray-600 hover:bg-gray-50">
				{t('plantations.showMore', { count: filteredSorted.length - visibleCount })}
			</button>
		{/if}
	{:else}
		<!-- Timeline view -->
		<!-- Timeline controls -->
			<div class="flex items-center justify-between gap-3">
				<div class="flex items-center gap-1">
				<button class="p-1 rounded border text-sm hover:bg-gray-100" onclick={() => timelineOffset -= 6} title={t('plantations.previous')}>◀</button>
				<button class="p-1 rounded border text-sm hover:bg-gray-100" onclick={() => timelineOffset = 0} title={t('plantations.today')}>{t('plantations.today')}</button>
				<button class="p-1 rounded border text-sm hover:bg-gray-100" onclick={() => timelineOffset += 6} title={t('plantations.next')}>▶</button>
				</div>
				<select bind:value={filterBed} class="border rounded px-2 py-1 text-sm">
					<option value="">{t('plantations.allBeds')}</option>
				{#each data.bedNames as name}
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
							<div class="flex-1 text-center text-xs font-medium border-l {isCurrent ? 'text-[var(--text-primary)] bg-[var(--bg-subtle)]' : 'text-gray-500'}">
								{monthLabel(m)}
							</div>
						{/each}
					</div>

					{#if data.plantations.length === 0}
						<p class="text-gray-400 text-center py-8 text-sm">{t('plantations.noDisplay')}</p>
					{:else}
						{#each bedGroups as [bedName, plantList] (bedName)}
							<div class="mb-4">
								<h3 class="text-sm font-semibold text-gray-700 mb-1">{bedName}</h3>
								{#each plantList as p (p.plantation.id)}
									{@const pf = firstPhoto(p.plantPhotos)}
									{@const style = barStyle(p)}
									<div class="relative h-7 mb-1 group">
										<div class="absolute inset-0 flex">
											<div class="w-32 shrink-0 flex items-center gap-1 pr-2 leading-7 truncate">
												{#if pf}
													<img src={pf} alt="" loading="lazy" class="w-5 h-5 object-cover rounded shrink-0" />
												{/if}
												<span class="text-xs text-gray-600 truncate">{p.plantation.plantName}</span>
											</div>
											{#each months as m}
												<div class="flex-1 border-l border-gray-100"></div>
											{/each}
										</div>
										{#if style}
											<div class="absolute h-5 top-1 rounded cursor-pointer transition-opacity group-hover:opacity-90" style="background: {barColor(p)}; opacity: 0.7; {style}"
												title="{t('calendar.title', { name: p.plantation.plantName || '', bed: p.bedName || '' })}
				{t('timeline.sowing', { date: p.plantation.sowingDate || '—' })}
{t('timeline.transplanting', { date: p.plantation.plantingDate || '—' })}
{t('timeline.harvest', { date: p.plantation.harvestDate || '—' })}
{p.plantation.variety ? t('calendar.variety', { name: p.plantation.variety }) : ''}">
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
				<span class="flex items-center gap-1"><span class="w-3 h-3 rounded bg-gray-400"></span> {t('plantations.legendPlanned')}</span>
				<span class="flex items-center gap-1"><span class="w-3 h-3 rounded bg-blue-500"></span> {t('plantations.legendSown')}</span>
				<span class="flex items-center gap-1"><span class="w-3 h-3 rounded bg-[var(--bar-fill)]"></span> {t('plantations.legendTransplanted')}</span>
				<span class="flex items-center gap-1"><span class="w-3 h-3 rounded bg-[var(--bar-fill)]"></span> {t('plantations.legendHarvested')}</span>
			</div>
	{/if}
</div>

<!-- New plantation dialog -->
<Modal open={showForm} onclose={closeForm} class="w-96 max-h-[80vh] overflow-y-auto">
	<form method="POST" action={editId ? '?/update' : '?/create'} use:enhance={handleFormEnhance}>
				{#if editId}
					<input type="hidden" name="id" value={editId} />
				{/if}
				<h2 class="text-lg font-bold mb-4">{editId ? t('plantations.editPlanting') : t('plantations.newPlanting')}</h2>
				<div class="space-y-3">
					<div>
					<label class="block text-sm text-gray-600">
						{t('plantations.bed')}
						<select name="gardenBedId" bind:value={formBedId} required class="w-full border rounded px-2 py-1">
							<option value="">{t('plantations.selectBed')}</option>
								{#each data.beds as bed}
									<option value={bed.id}>{bed.name}</option>
								{/each}
							</select>
						</label>
					</div>
					<div>
						<label class="block text-sm text-gray-600">
							{t('plantations.plant')}
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
							{t('plantations.plantName')}
							<input type="text" name="plantName" bind:value={formPlantName} required class="w-full border rounded px-2 py-1" />
						</label>
					</div>
					<div>
						<label class="block text-sm text-gray-600">
							{t('plantations.variety')}
							<input type="text" name="variety" bind:value={formVariety} class="w-full border rounded px-2 py-1" />
						</label>
					</div>
					<div class="grid grid-cols-3 gap-2">
						<div>
							<label class="block text-sm text-gray-600">
								{t('plantations.sowing')}
								<input type="date" name="sowingDate" bind:value={formSowing} class="w-full border rounded px-2 py-1 text-sm" />
							</label>
						</div>
						<div>
							<label class="block text-sm text-gray-600">
								{t('plantations.transplanting')}
								<input type="date" name="plantingDate" bind:value={formPlanting} class="w-full border rounded px-2 py-1 text-sm" />
							</label>
						</div>
						<div>
							<label class="block text-sm text-gray-600">
								{t('plantations.harvest')}
								<input type="date" name="harvestDate" bind:value={formHarvest} class="w-full border rounded px-2 py-1 text-sm" />
							</label>
						</div>
					</div>
					<div>
						<label class="block text-sm text-gray-600">
							{t('plantations.quantity')}
							<input type="number" name="quantity" bind:value={formQuantity} class="w-full border rounded px-2 py-1" />
						</label>
					</div>
					<div>
						<label class="block text-sm text-gray-600">
							{t('plantations.notes')}
							<textarea name="notes" bind:value={formNotes} class="w-full border rounded px-2 py-1"></textarea>
						</label>
					</div>
					<div class="flex gap-2 justify-end pt-2">
						<button type="button" class="px-4 py-2 border rounded" onclick={closeForm}>{t('plantations.cancel')}</button>
						<button type="submit" class="px-4 py-2 bg-[var(--btn-bg)] text-white rounded">{editId ? t('plantations.save') : t('plantations.create')}</button>
					</div>
				</div>
			</form>
</Modal>

<Modal open={!!confirmDeleteId} onclose={() => confirmDeleteId = null} class="w-80 shadow-xl">
	<form method="POST" action="?/delete" use:enhance={handleDeleteEnhance}>
		<input type="hidden" name="id" value={confirmDeleteId} />
		<h3 class="font-bold text-lg mb-2">{t('plantations.delete')}</h3>
		<p class="text-sm text-gray-600 mb-5">{t('plantations.deleteConfirm')}</p>
		<div class="flex justify-end gap-2">
			<button type="button" class="px-4 py-2 border rounded text-sm" onclick={() => confirmDeleteId = null}>{t('common.cancel')}</button>
			<button type="submit" class="px-4 py-2 bg-red-600 text-white rounded text-sm">{t('common.delete')}</button>
		</div>
	</form>
</Modal>
