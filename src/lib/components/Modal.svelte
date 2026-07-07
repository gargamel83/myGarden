<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		open = false,
		onclose,
		class: className = '',
		children
	}: {
		open?: boolean
		onclose: () => void
		class?: string
		children: Snippet
	} = $props();
</script>

{#if open}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
		class:pointer-events-none={!open}
		onkeydown={(e) => e.key === 'Escape' && onclose()}
		onclick={(e) => { if (e.target === e.currentTarget) onclose(); }}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div class="bg-white rounded-lg p-6 {className}" onclick={(e) => e.stopPropagation()} role="none">
			{@render children()}
		</div>
	</div>
{/if}
