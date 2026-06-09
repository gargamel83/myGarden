<script lang="ts">
	import { goto } from '$app/navigation';

	let { data } = $props();
	let stats = $derived(data.stats);
	let active = $derived(data.active);
	let recentActivity = $derived(data.recentActivity);
	let sowingAlerts = $derived(data.sowingAlerts);
	let harvestAlerts = $derived(data.harvestAlerts);
	let rotationAlerts = $derived(data.rotationAlerts);

	const statusLabels: Record<string, string> = {
		planned: 'Planifié', sown: 'Semé', planted: 'Repiqué',
		harvested: 'Récolté', cancelled: 'Annulé'
	};
	const statusColors: Record<string, string> = {
		planned: 'bg-gray-200 text-gray-700', sown: 'bg-blue-100 text-blue-700',
		planted: 'bg-green-100 text-green-700', harvested: 'bg-amber-100 text-amber-700',
		cancelled: 'bg-red-100 text-red-700'
	};

	function daysText(days: number): string {
		if (days === 0) return 'Aujourd\'hui';
		if (days < 0) return `Il y a ${-days} jour${-days > 1 ? 's' : ''}`;
		return `Dans ${days} jour${days > 1 ? 's' : ''}`;
	}
</script>

<div class="space-y-8">
	<h1 class="text-2xl font-bold">Dashboard</h1>

	<!-- Stats cards -->
	<div class="grid grid-cols-2 md:grid-cols-5 gap-3">
		<a href="/garden" class="block bg-green-50 border border-green-200 rounded-lg p-4 text-center hover:bg-green-100">
			<p class="text-3xl font-bold text-green-700">{stats.bedCount}</p>
			<p class="text-xs text-gray-600 mt-1">Bandes</p>
		</a>
		<a href="/plantations" class="block bg-blue-50 border border-blue-200 rounded-lg p-4 text-center hover:bg-blue-100">
			<p class="text-3xl font-bold text-blue-700">{stats.activeCount}</p>
			<p class="text-xs text-gray-600 mt-1">En culture</p>
		</a>
		<a href="/plantations" class="block bg-amber-50 border border-amber-200 rounded-lg p-4 text-center hover:bg-amber-100">
			<p class="text-3xl font-bold text-amber-700">{stats.plannedCount}</p>
			<p class="text-xs text-gray-600 mt-1">Planifiés</p>
		</a>
		<a href="/plantations" class="block bg-purple-50 border border-purple-200 rounded-lg p-4 text-center hover:bg-purple-100">
			<p class="text-3xl font-bold text-purple-700">{stats.harvestedCount}</p>
			<p class="text-xs text-gray-600 mt-1">Récoltés</p>
		</a>
		<a href="/plants" class="block bg-gray-50 border border-gray-200 rounded-lg p-4 text-center hover:bg-gray-100">
			<p class="text-3xl font-bold text-gray-700">{stats.plantCount}</p>
			<p class="text-xs text-gray-600 mt-1">Fiches plantes</p>
		</a>
	</div>

	<div class="grid gap-6 md:grid-cols-2">
		<!-- Alertes semis -->
		{#if sowingAlerts.length > 0}
			<div class="border rounded-lg p-4">
				<a href="/plantations" class="font-bold text-lg mb-2 text-blue-700 block hover:underline">🌱 Semis à venir</a>
				<div class="space-y-2">
					{#each sowingAlerts as a}
						<a href="/plants/{a.plant?.id || ''}" class="flex justify-between text-sm hover:bg-blue-50 -mx-2 px-2 py-1 rounded">
							<div>
								<span class="font-medium">{a.plant?.commonName || a.plantation.plantName}</span>
								{#if a.plant?.sowingStart}
									<span class="text-gray-400 ml-1">(dès {a.plant.sowingStart})</span>
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
				<a href="/plantations" class="font-bold text-lg mb-2 text-amber-700 block hover:underline">🧑‍🌾 Récoltes imminentes</a>
				<div class="space-y-2">
					{#each harvestAlerts as a}
						<a href="/plants/{a.plant?.id || ''}" class="flex justify-between text-sm hover:bg-amber-50 -mx-2 px-2 py-1 rounded">
							<div>
								<span class="font-medium">{a.plant?.commonName || a.plantation.plantName}</span>
								{#if a.plant?.harvestStart}
									<span class="text-gray-400 ml-1">(dès {a.plant.harvestStart})</span>
								{/if}
							</div>
							<span class="text-amber-600">{daysText(a.daysLeft)}</span>
						</a>
					{/each}
				</div>
			</div>
		{/if}
	</div>

	<!-- Alertes rotation -->
	{#if rotationAlerts.length > 0}
		<a href="/garden" class="block border-l-4 border-red-500 bg-red-50 px-4 py-3 hover:bg-red-100">
			<h2 class="font-bold text-sm text-red-700">⚠️ Alertes rotation</h2>
			{#each rotationAlerts as a}
				<p class="text-xs text-gray-600 mt-1">{a.message}</p>
			{/each}
		</a>
	{/if}

	<!-- Plantations actives -->
	{#if active.length > 0}
		<div>
			<a href="/plantations" class="font-bold text-lg mb-3 block hover:underline">En cours</a>
			<div class="grid gap-2">
				{#each active as p}
					<a href="/plantations" class="border rounded p-3 flex items-center justify-between text-sm hover:bg-gray-50">
						<div>
							<span class="font-medium">{p.plantName}</span>
							{#if p.sowingDate}
								<span class="text-gray-400 ml-2">Semis: {p.sowingDate}</span>
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
			<h2 class="font-bold text-lg mb-3">Activité récente</h2>
			<div class="space-y-1 text-sm">
				{#each recentActivity as a}
					<a href="/plantations" class="flex gap-2 text-gray-600 hover:bg-gray-50 -mx-2 px-2 py-1 rounded">
						<span class="px-1.5 py-0.5 rounded text-xs font-medium {statusColors[a.status]}">
							{statusLabels[a.status]}
						</span>
						<span>{a.plantName}</span>
						{#if a.sowingDate}
							<span class="text-gray-400">semis {a.sowingDate}</span>
						{/if}
					</a>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Empty state -->
	{#if stats.bedCount === 0}
		<div class="text-center py-12">
			<p class="text-gray-500">Bienvenue dans MonJardin !</p>
			<div class="flex justify-center gap-3 mt-4">
				<a href="/garden" class="bg-green-600 text-white px-6 py-2 rounded-lg">Ajouter des bandes</a>
				<a href="/plants" class="bg-blue-600 text-white px-6 py-2 rounded-lg">Explorer les plantes</a>
			</div>
		</div>
	{/if}
</div>
