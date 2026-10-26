<script lang="ts">
	import { onMount } from 'svelte';
	import { getBedPoints, pointsToPath, summarizePlan, centerLabel } from '$lib/plan-print';
	import { t } from '$lib/i18n';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const summary = $derived(summarizePlan(data.beds));

	function printPlan() {
		window.print();
	}

	onMount(() => {
		// Slight delay to ensure SVG is laid out before offering print
	});
</script>

<div class="print-page">
	<div class="print-actions no-print flex items-center justify-between mb-6">
		<div class="flex items-center gap-2">
			<a href="/garden" class="px-3 py-1.5 rounded border text-sm hover:bg-gray-100">← {t('print.backToGarden')}</a>
			<h1 class="text-xl font-bold">{t('print.title')}</h1>
		</div>
		<button class="px-3 py-1.5 rounded bg-[var(--btn-bg)] text-white text-sm" onclick={printPlan}>🖨 {t('print.print')}</button>
	</div>

	<div class="print-meta mb-4 text-sm text-gray-600">
		<div>{t('print.date')}: {new Date(data.printedAt).toLocaleDateString()}</div>
		{#if data.user?.username}<div>{t('print.user')}: {data.user.username}</div>{/if}
	</div>

	{#if summary.viewBox && summary.pixelBeds.length > 0}
		<div class="plan-svg-container mb-6">
			<svg viewBox="{summary.viewBox.x} {summary.viewBox.y} {summary.viewBox.width} {summary.viewBox.height}" class="plan-svg">
				{#each summary.pixelBeds as bed}
					{@const points = getBedPoints(bed)}
					<path d={pointsToPath(points)} fill={bed.color || '#14b8a6'} fill-opacity="0.25" stroke={bed.color || '#14b8a6'} stroke-width="2" />
					{@const label = centerLabel(points)}
					{#if label}
						<text x={label.x} y={label.y} text-anchor="middle" dominant-baseline="middle" class="plan-label">
							<tspan x={label.x} dy="-0.2em">{bed.name}</tspan>
							{#if bed.zone}
								<tspan x={label.x} dy="1.2em" class="plan-label-zone">{bed.zone}</tspan>
							{/if}
						</text>
					{/if}
				{/each}
			</svg>
		</div>
	{:else if summary.pixelBeds.length === 0}
		<p class="text-sm text-gray-500 mb-6">{t('garden.noBeds') || 'No beds.'}</p>
	{/if}

	{#if summary.geoBeds.length > 0}
		<div class="mb-6">
			<h2 class="font-bold mb-2">{t('print.geoBeds')}</h2>
			<ul class="text-sm space-y-1">
				{#each summary.geoBeds as bed}
					<li>• {bed.name} {#if bed.zone}- {bed.zone}{/if}</li>
				{/each}
			</ul>
		</div>
	{/if}

	<h2 class="font-bold mb-2">{t('print.legend')}</h2>
	<div class="overflow-x-auto">
		<table class="w-full text-sm border-collapse">
			<thead>
				<tr class="border-b">
					<th class="text-left py-2 pr-4">{t('print.bed')}</th>
					<th class="text-left py-2 pr-4">{t('print.zone')}</th>
					<th class="text-left py-2 pr-4">{t('print.area')}</th>
					<th class="text-left py-2 pr-4">{t('print.exposure')}</th>
					<th class="text-left py-2 pr-4">{t('print.soil')}</th>
					<th class="text-left py-2">{t('print.plantings')}</th>
				</tr>
			</thead>
			<tbody>
				{#each data.beds as bed}
					<tr class="border-b">
						<td class="py-2 pr-4 font-medium">{bed.name}</td>
						<td class="py-2 pr-4">{bed.zone || '-'}</td>
						<td class="py-2 pr-4">{bed.length && bed.width ? (bed.length * bed.width).toFixed(1) + ' m²' : (bed.length || bed.width ? (bed.length || bed.width) + ' m' : '-')}</td>
						<td class="py-2 pr-4">{bed.sunExposure || '-'}</td>
						<td class="py-2 pr-4">{bed.soilType || '-'}</td>
						<td class="py-2">
							{#if data.plantingsByBed[bed.id]?.length}
								{data.plantingsByBed[bed.id].map(p => p.plantName + (p.variety ? ' (' + p.variety + ')' : '')).join(', ')}
							{:else}
								<span class="text-gray-400">{t('print.noPlantings')}</span>
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<style>
	.plan-svg-container {
		border: 1px solid #e5e7eb;
		padding: 12px;
		background: white;
	}
	.plan-svg {
		width: 100%;
		height: auto;
		max-height: 420px;
		display: block;
	}
	.plan-label {
		font-size: 10px;
		fill: #374151;
	}
	.plan-label-zone {
		font-size: 8px;
		fill: #6b7280;
	}
</style>
