<script lang="ts">
	let { images, startIndex = 0, onclose }: {
		images: string[]
		startIndex?: number
		onclose: () => void
	} = $props();

	// svelte-ignore state_referenced_locally
	let current = $state(startIndex);

	function prev() { if (current > 0) current--; }
	function next() { if (current < images.length - 1) current++; }

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onclose();
		if (e.key === 'ArrowLeft') prev();
		if (e.key === 'ArrowRight') next();
	}

	$effect(() => {
		document.addEventListener('keydown', onKeydown);
		return () => document.removeEventListener('keydown', onKeydown);
	});
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onclick={onclose} role="presentation">
	<div class="relative max-w-[90vw] max-h-[90vh]" onclick={(e) => e.stopPropagation()} role="presentation">
		{#if images.length > 1}
			<button class="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full w-10 h-10 flex items-center justify-center text-lg hover:bg-white z-10 {current === 0 ? 'opacity-30 cursor-not-allowed' : ''}" onclick={prev} disabled={current === 0}>◀</button>
			<button class="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full w-10 h-10 flex items-center justify-center text-lg hover:bg-white z-10 {current === images.length - 1 ? 'opacity-30 cursor-not-allowed' : ''}" onclick={next} disabled={current === images.length - 1}>▶</button>
		{/if}
		<button class="absolute top-2 right-2 bg-white/80 rounded-full w-8 h-8 flex items-center justify-center text-sm hover:bg-white z-10" onclick={onclose}>✕</button>
		<img src={images[current]} alt="" class="max-w-full max-h-[90vh] object-contain rounded" />
		{#if images.length > 1}
			<p class="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1 rounded-full">{current + 1} / {images.length}</p>
		{/if}
	</div>
</div>
