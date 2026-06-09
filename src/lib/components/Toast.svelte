<script lang="ts">
	import { onMount } from 'svelte';

	let { message = '', type = 'success', duration = 3000, onclose }: {
		message?: string
		type?: 'success' | 'error' | 'info'
		duration?: number
		onclose?: () => void
	} = $props();

	let visible = $state(true);

	onMount(() => {
		const timer = setTimeout(() => {
			visible = false;
			setTimeout(() => onclose?.(), 300);
		}, duration);
		return () => clearTimeout(timer);
	});

	const colors: Record<string, string> = {
		success: 'bg-green-600',
		error: 'bg-red-600',
		info: 'bg-blue-600'
	};
</script>

{#if visible}
	<div class="fixed bottom-4 right-4 z-50 {colors[type]} text-white px-4 py-2.5 rounded-lg shadow-lg text-sm transition-opacity duration-300 animate-fade-in">
		{message}
	</div>
{/if}
