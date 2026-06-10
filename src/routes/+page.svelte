<script lang="ts">
	import { STATUS_LABELS, STATUS_COLORS } from '$lib/types';

	let { data } = $props();
	let stats = $derived(data.stats);
	let active = $derived(data.active);
	let recentActivity = $derived(data.recentActivity);
	let sowingAlerts = $derived(data.sowingAlerts);
	let harvestAlerts = $derived(data.harvestAlerts);
	let rotationAlerts = $derived(data.rotationAlerts);
	let topCrops = $derived(data.topCrops || []);
	let occupationByMonth = $derived(data.occupationByMonth || []);

	const statusLabels = STATUS_LABELS;
	const statusColors = STATUS_COLORS;

	function daysText(days: number): string {
		if (days === 0) return 'Today';
		if (days < 0) return `${-days} day${-days > 1 ? 's' : ''} ago`;
		return `In ${days} day${days > 1 ? 's' : ''}`;
	}
</script>

<div class="space-y-8">
	<h1 class="text-2xl font-bold">Dashboard</h1>

	<!-- Stats cards -->
	<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
		<a href="/garden" class="block bg-green-50 border border-green-200 rounded-lg p-4 text-center hover:bg-green-100">
			<p class="text-3xl font-bold text-green-700">{stats.bedCount}</p>
			<p class="text-xs text-gray-600 mt-1">Beds</p>
			{#if stats.totalArea > 0}
				<p class="text-[10px] text-gray-400 mt-0.5">{stats.totalArea} m²</p>
			{/if}
		</a>
		<a href="/plantations" class="block bg-blue-50 border border-blue-200 rounded-lg p-4 text-center hover:bg-blue-100">
			<p class="text-3xl font-bold text-blue-700">{stats.activeCount}</p>
			<p class="text-xs text-gray-600 mt-1">Active</p>
		</a>
		<a href="/plantations" class="block bg-amber-50 border border-amber-200 rounded-lg p-4 text-center hover:bg-amber-100">
			<p class="text-3xl font-bold text-amber-700">{stats.plannedCount}</p>
			<p class="text-xs text-gray-600 mt-1">Planned</p>
		</a>
		<a href="/plantations" class="block bg-purple-50 border border-purple-200 rounded-lg p-4 text-center hover:bg-purple-100">
			<p class="text-3xl font-bold text-purple-700">{stats.harvestedCount}</p>
			<p class="text-xs text-gray-600 mt-1">Harvested</p>
		</a>
	</div>

	<div class="grid gap-6 md:grid-cols-2">
		<!-- Alertes semis -->
		{#if sowingAlerts.length > 0}
			<div class="border rounded-lg p-4">
				<a href="/plantations" class="font-bold text-lg mb-2 text-blue-700 block hover:underline">🌱 Upcoming sowings</a>
				<div class="space-y-2">
					{#each sowingAlerts as a}
						<a href="/plants/{a.plant?.id || ''}" class="flex justify-between text-sm hover:bg-blue-50 -mx-2 px-2 py-1 rounded">
							<div>
								<span class="font-medium">{a.plant?.commonName || a.plantation.plantName}</span>
								{#if a.plant?.sowingStart}
									<span class="text-gray-400 ml-1">(from {a.plant.sowingStart})</span>
								{/if}
							</div>
							<span class="text-blue-600">{daysText(a.daysLeft)}</span>
						</a>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Alertes récolte -->
		{#if harvestAlerts.length > 0}
			<div class="border rounded-lg p-4">
				<a href="/plantations" class="font-bold text-lg mb-2 text-amber-700 block hover:underline">🧑‍🌾 Upcoming harvests</a>
				<div class="space-y-2">
					{#each harvestAlerts as a}
						<a href="/plants/{a.plant?.id || ''}" class="flex justify-between text-sm hover:bg-amber-50 -mx-2 px-2 py-1 rounded">
							<div>
								<span class="font-medium">{a.plant?.commonName || a.plantation.plantName}</span>
								{#if a.plant?.harvestStart}
									<span class="text-gray-400 ml-1">(from {a.plant.harvestStart})</span>
								{/if}
							</div>
							<span class="text-amber-600">{daysText(a.daysLeft)}</span>
						</a>
					{/each}
				</div>
			</div>
		{/if}
	</div>

	<!-- Top cultures -->
	{#if data.topCrops && data.topCrops.length > 0}
		<div class="border rounded-lg p-4">
			<h2 class="font-bold text-lg mb-3">Top crops</h2>
			<div class="space-y-2">
				{#each data.topCrops as crop}
					<div class="flex items-center gap-2">
						<span class="text-sm flex-1">{crop.name}</span>
						<div class="flex-1 bg-gray-100 rounded h-4">
							<div class="bg-green-500 rounded h-4" style="width: {Math.min(crop.count / Math.max(...data.topCrops.map(c => c.count)) * 100, 100)}%"></div>
						</div>
						<span class="text-xs text-gray-500 w-6 text-right">{crop.count}</span>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Occupation mensuelle -->
	{#if data.occupationByMonth}
		<div class="border rounded-lg p-4">
			<h2 class="font-bold text-lg mb-3">Monthly occupancy</h2>
			<div class="flex items-end gap-1 h-24">
				{#each data.occupationByMonth as count, i}
					{@const max = Math.max(1, ...data.occupationByMonth)}
					<div class="flex-1 flex flex-col items-center">
						<div class="w-full bg-blue-200 rounded-t" style="height: {(count / max) * 100}%"></div>
						<span class="text-[10px] text-gray-500 mt-1">{['J','F','M','A','M','J','J','A','S','O','N','D'][i]}</span>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Alertes rotation -->
	{#if rotationAlerts.length > 0}
		<a href="/garden" class="block border-l-4 border-red-500 bg-red-50 px-4 py-3 hover:bg-red-100">
			<h2 class="font-bold text-sm text-red-700">⚠️ Rotation alerts</h2>
			{#each rotationAlerts as a}
				<p class="text-xs text-gray-600 mt-1">{a.message}</p>
			{/each}
		</a>
	{/if}

	<!-- Plantations actives -->
	{#if active.length > 0}
		<div>
			<a href="/plantations" class="font-bold text-lg mb-3 block hover:underline">In progress</a>
			<div class="grid gap-2">
				{#each active as p}
					<a href="/plantations" class="border rounded p-3 flex items-center justify-between text-sm hover:bg-gray-50">
						<div>
							<span class="font-medium">{p.plantName}</span>
							{#if p.sowingDate}
								<span class="text-gray-400 ml-2">Sowing: {p.sowingDate}</span>
							{/if}
						</div>
						<span class="px-2 py-0.5 rounded text-xs font-medium {statusColors[p.status]}">
							{statusLabels[p.status]}
						</span>
					</a>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Activité récente -->
	{#if recentActivity.length > 0}
		<div>
			<h2 class="font-bold text-lg mb-3">Recent activity</h2>
			<div class="space-y-1 text-sm">
				{#each recentActivity as a}
					<a href="/plantations" class="flex gap-2 text-gray-600 hover:bg-gray-50 -mx-2 px-2 py-1 rounded">
						<span class="px-1.5 py-0.5 rounded text-xs font-medium {statusColors[a.status]}">
							{statusLabels[a.status]}
						</span>
						<span>{a.plantName}</span>
						{#if a.sowingDate}
							<span class="text-gray-400">sown {a.sowingDate}</span>
						{/if}
					</a>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Empty state -->
	{#if stats.bedCount === 0}
		<div class="text-center py-12">
			<p class="text-gray-500">Welcome to My Garden!</p>
			<div class="flex justify-center gap-3 mt-4">
				<a href="/garden" class="bg-green-600 text-white px-6 py-2 rounded-lg">Add beds</a>
				<a href="/plants" class="bg-blue-600 text-white px-6 py-2 rounded-lg">Explore plants</a>
			</div>
		</div>
	{/if}
</div>
