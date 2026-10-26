<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { shiftMonth } from '$lib/season';
	import { localeStore, t } from '$lib/i18n';
	import type { PageData } from './$types';
	let _locale = $localeStore;

	let { data }: { data: PageData } = $props();

	const monthLabelsArr = $derived((t('monthLabels') as unknown as string[]) || []);
	const monthLabel = $derived((monthLabelsArr[data.month - 1] || String(data.month)) + ' ' + data.year);

	function changeMonth(delta: number) {
		const next = shiftMonth(data.month, data.year, delta);
		goto(`?month=${next.month}&year=${next.year}`, { replaceState: false, noScroll: true });
	}

	function goToday() {
		const now = new Date();
		goto(`?month=${now.getMonth() + 1}&year=${now.getFullYear()}`, { replaceState: false, noScroll: true });
	}

	const totalPlantings = $derived(data.plan.sowing.length + data.plan.transplanting.length + data.plan.harvest.length);
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold">{t('season.title')}</h1>
		<div class="flex items-center gap-2">
			<button class="px-2 py-1 rounded border text-sm hover:bg-gray-100" onclick={() => changeMonth(-1)}>◀</button>
			<div class="text-sm font-medium min-w-[140px] text-center">{monthLabel}</div>
			<button class="px-2 py-1 rounded border text-sm hover:bg-gray-100" onclick={() => changeMonth(1)}>▶</button>
			<button class="px-2 py-1 rounded border text-sm hover:bg-gray-100" onclick={goToday}>{t('season.today')}</button>
		</div>
	</div>

	<!-- Derived from plantations -->
	<div class="border rounded-lg p-4">
		<h2 class="font-bold mb-3">{t('season.plantings')} <span class="text-sm font-normal text-gray-500">({totalPlantings})</span></h2>

		<div class="grid md:grid-cols-3 gap-4">
			<div>
				<h3 class="text-sm font-medium mb-2">🌱 {t('season.sowing')}</h3>
				{#if data.plan.sowing.length === 0}
					<p class="text-xs text-gray-500">{t('season.plantationsEmpty')}</p>
				{:else}
					<ul class="space-y-1">
						{#each data.plan.sowing as entry}
							<li class="text-sm flex justify-between gap-2">
								<a href="/plantations" class="hover:underline">{entry.plantName}</a>
								<span class="text-xs text-gray-500">{entry.bedName || ''}</span>
							</li>
						{/each}
					</ul>
				{/if}
			</div>

			<div>
				<h3 class="text-sm font-medium mb-2">🌿 {t('season.transplanting')}</h3>
				{#if data.plan.transplanting.length === 0}
					<p class="text-xs text-gray-500">{t('season.plantationsEmpty')}</p>
				{:else}
					<ul class="space-y-1">
						{#each data.plan.transplanting as entry}
							<li class="text-sm flex justify-between gap-2">
								<a href="/plantations" class="hover:underline">{entry.plantName}</a>
								<span class="text-xs text-gray-500">{entry.bedName || ''}</span>
							</li>
						{/each}
					</ul>
				{/if}
			</div>

			<div>
				<h3 class="text-sm font-medium mb-2">🧺 {t('season.harvest')}</h3>
				{#if data.plan.harvest.length === 0}
					<p class="text-xs text-gray-500">{t('season.plantationsEmpty')}</p>
				{:else}
					<ul class="space-y-1">
						{#each data.plan.harvest as entry}
							<li class="text-sm flex justify-between gap-2">
								<a href="/plantations" class="hover:underline">{entry.plantName}</a>
								<span class="text-xs text-gray-500">{entry.bedName || ''}</span>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		</div>
	</div>

	<!-- Manual tasks -->
	<div class="border rounded-lg p-4">
		<h2 class="font-bold mb-3">{t('season.manualTasks')}</h2>

		<form method="POST" action="?/addTask" use:enhance class="flex flex-wrap items-end gap-2 mb-4">
			<input type="hidden" name="month" value={data.month} />
			<input type="hidden" name="year" value={data.year} />
			<label class="flex flex-col gap-1 text-sm">
				<span>{t('season.taskTitle')}</span>
				<input name="title" class="border rounded px-2 py-1" required />
			</label>
			<label class="flex flex-col gap-1 text-sm">
				<span>{t('season.bedOptional')}</span>
				<select name="gardenBedId" class="border rounded px-2 py-1">
					<option value="">{t('season.selectBed')}</option>
					{#each data.beds as bed}
						<option value={bed.id}>{bed.name}</option>
					{/each}
				</select>
			</label>
			<button class="px-3 py-1.5 rounded bg-[var(--btn-bg)] text-white text-sm">{t('season.addTask')}</button>
		</form>

		{#if data.tasks.length === 0}
			<p class="text-sm text-gray-500">{t('season.noTask')}</p>
		{:else}
			<ul class="space-y-2">
				{#each data.tasks as task}
					<li class="flex items-center justify-between gap-3 border rounded px-3 py-2">
						<div class="flex items-center gap-2">
							<form method="POST" action="?/toggleTask" use:enhance>
								<input type="hidden" name="id" value={task.id} />
								<button class="text-sm" title={t('season.done')}>
									{task.done ? '☑' : '☐'}
								</button>
							</form>
							<span class="text-sm {task.done ? 'line-through text-gray-400' : ''}">{task.title}</span>
							{#if task.gardenBedId}
								{#each data.beds as bed}
									{#if bed.id === task.gardenBedId}
										<span class="text-xs text-gray-500">[{bed.name}]</span>
									{/if}
								{/each}
							{/if}
						</div>
						<form method="POST" action="?/deleteTask" use:enhance>
							<input type="hidden" name="id" value={task.id} />
							<button class="text-xs text-red-600 hover:underline">{t('season.delete')}</button>
						</form>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</div>
