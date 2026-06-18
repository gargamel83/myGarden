<script lang="ts">
	import { LOG_LEVELS } from '$lib/types';
	import type { LogLevel } from '$lib/types';

	interface LogEntry {
		timestamp: string;
		level: LogLevel;
		message: string;
		data?: unknown;
	}

	let { onclose }: { onclose: () => void } = $props();

	let logs = $state<LogEntry[]>([]);
	let filterLevel = $state<LogLevel | 'ALL'>('ALL');
	let autoScroll = $state(true);

	function fetchLogs() {
		const params = filterLevel === 'ALL' ? '' : `?level=${filterLevel}`;
		fetch(`/api/log${params}`)
			.then(r => r.json())
			.then(data => {
				logs = data;
				if (autoScroll) {
					requestAnimationFrame(() => {
						const el = document.getElementById('log-scroll');
						if (el) el.scrollTop = el.scrollHeight;
					});
				}
			})
			.catch(() => {});
	}

	$effect(() => {
		fetchLogs();
		const interval = setInterval(fetchLogs, 2000);
		return () => clearInterval(interval);
	});

	const levelColors: Record<string, string> = {
		TRACE: 'text-gray-400',
		DEBUG: 'text-blue-500',
		INFO: 'text-green-600',
		WARN: 'text-amber-600',
		ERROR: 'text-red-600'
	};

	const levelBg: Record<string, string> = {
		TRACE: 'bg-gray-100',
		DEBUG: 'bg-blue-50',
		INFO: 'bg-green-50',
		WARN: 'bg-amber-50',
		ERROR: 'bg-red-50'
	};
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onclick={(e) => { if (e.target === e.currentTarget) onclose(); }} onkeydown={(e) => e.key === 'Escape' && onclose()} role="dialog" aria-modal="true" tabindex="-1">
	<div class="bg-white rounded-lg shadow-xl w-[800px] max-w-[95vw] h-[80vh] flex flex-col" role="none">
		<!-- Header -->
		<div class="flex items-center justify-between p-4 border-b shrink-0">
			<h2 class="font-bold text-lg">Logs</h2>
			<button class="text-gray-400 hover:text-gray-600 text-xl leading-none" onclick={onclose} aria-label="Close">&times;</button>
		</div>

		<!-- Filter bar -->
		<div class="flex items-center gap-1 px-4 py-2 border-b shrink-0 overflow-x-auto">
			<button
				class="px-2 py-1 rounded text-xs font-medium {filterLevel === 'ALL' ? 'bg-gray-800 text-white' : 'bg-gray-200 hover:bg-gray-300'}"
				onclick={() => filterLevel = 'ALL'}
			>ALL</button>
			{#each LOG_LEVELS as level}
				<button
					class="px-2 py-1 rounded text-xs font-medium {filterLevel === level ? 'bg-gray-800 text-white' : 'bg-gray-200 hover:bg-gray-300'}"
					onclick={() => filterLevel = level}
				>{level}</button>
			{/each}
			<div class="ml-auto flex items-center gap-2 text-xs text-gray-500">
				<label class="flex items-center gap-1 cursor-pointer">
					<input type="checkbox" bind:checked={autoScroll} class="accent-gray-800" />
					Auto-scroll
				</label>
				<button class="text-blue-600 hover:underline" onclick={fetchLogs}>Refresh</button>
			</div>
		</div>

		<!-- Log entries -->
		<div id="log-scroll" class="flex-1 overflow-y-auto p-2 space-y-0.5 font-mono text-xs">
			{#if logs.length === 0}
				<p class="text-gray-400 text-center py-8">No logs at this level.</p>
			{:else}
				{#each logs as entry, i (entry.timestamp + entry.level + entry.message)}
					{@const color = levelColors[entry.level] || 'text-gray-600'}
					{@const bg = levelBg[entry.level] || ''}
					<div class="flex gap-2 px-2 py-1 rounded {bg} hover:bg-gray-100">
						<span class="shrink-0 w-12 {color} font-bold">{entry.level}</span>
						<span class="shrink-0 text-gray-400 w-20">{entry.timestamp.slice(11, 19)}</span>
						<span class="flex-1 break-all">{entry.message}</span>
						{#if entry.data !== undefined}
							<span class="text-gray-400 shrink-0 max-w-[200px] truncate" title={JSON.stringify(entry.data)}>{JSON.stringify(entry.data)}</span>
						{/if}
					</div>
				{/each}
			{/if}
		</div>
	</div>
</div>
