<script lang="ts">
	import { setLocale } from '$lib/i18n';
	import type { Locale } from '$lib/i18n';

	let open = $state(false);
	let current = $state<Locale>('en');

	$effect(() => {
		if (typeof localStorage !== 'undefined') {
			const stored = localStorage.getItem('monjardin-locale');
			if (stored === 'en' || stored === 'fr') {
				current = stored;
			}
		}
	});

	function select(locale: Locale) {
		console.log('[LocaleSwitcher] select', locale);
		current = locale;
		console.log('[LocaleSwitcher] current set to', current);
		setLocale(locale);
		console.log('[LocaleSwitcher] setLocale done');
		open = false;
	}
</script>

<div class="relative" role="none">
	<button
		onclick={() => open = !open}
		class="flex items-center gap-1 px-2 py-1 rounded text-sm font-medium
		       text-white/80 hover:text-white hover:bg-white/10 transition-colors"
		aria-label="Switch language"
	>
		{current === 'en' ? 'EN' : 'FR'}
	</button>

	{#if open}
		<div
			class="absolute right-0 mt-1 z-50 min-w-[80px] rounded-lg shadow-lg border
			       bg-white border-gray-200 py-1"
		>
			<button
				onclick={() => select('en')}
				class="block w-full text-left px-3 py-1.5 text-sm transition-colors
				       text-gray-700 hover:bg-gray-100"
				class:font-bold={current === 'en'}
			>EN</button>
			<button
				onclick={() => select('fr')}
				class="block w-full text-left px-3 py-1.5 text-sm transition-colors
				       text-gray-700 hover:bg-gray-100"
				class:font-bold={current === 'fr'}
			>FR</button>
		</div>
	{/if}
</div>
