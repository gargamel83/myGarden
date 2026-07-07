<script lang="ts">
	import { themes, saveTheme, applyTheme, loadTheme, type ThemeId } from '$lib/themes';

	let open = $state(false);
	let current = $state<ThemeId>(loadTheme());
	let showTooltip = $state(false);

	function select(id: ThemeId) {
		current = id;
		saveTheme(id);
		open = false;
	}

	function toggle() {
		open = !open;
	}

	const fullDesc: Record<ThemeId, string> = {
		teal: 'fresh and calm',
		green: 'vibrant',
		earth: 'warm soil tones',
		slate: 'clean and minimal'
	};
</script>

<div class="relative" role="none" onmouseenter={() => showTooltip = true} onmouseleave={() => showTooltip = false}>
	<button
		class="p-1.5 rounded hover:bg-white/20 text-sm"
		onclick={toggle}
		aria-label="Theme"
	>
		<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
		</svg>
	</button>

	{#if showTooltip && !open}
		<div class="absolute right-0 top-full mt-1 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50 pointer-events-none">
			{themes.find(t => t.id === current)?.label} — {fullDesc[current]}
		</div>
	{/if}

	{#if open}
		<div class="absolute right-0 top-full mt-1 bg-white text-gray-700 rounded-lg shadow-lg border py-1 min-w-[130px] z-50" role="dialog" aria-modal="true">
			{#each themes as theme}
				<button
					class="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-left hover:bg-gray-100 {current === theme.id ? 'font-medium' : ''}"
					title={theme.desc}
					onclick={() => select(theme.id)}
				>
					<span class="w-3 h-3 rounded-full shrink-0" style="background: {theme.color}"></span>
					{theme.label}
				</button>
			{/each}
		</div>
	{/if}
</div>
