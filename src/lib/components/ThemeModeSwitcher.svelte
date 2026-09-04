<script lang="ts">
	import { applyThemeMode, loadThemeMode, saveThemeMode, type ThemeMode } from '$lib/themes';
	import { localeStore, t } from '$lib/i18n';
	let _locale = $localeStore;

	let mode = $state<ThemeMode>(loadThemeMode());

	$effect(() => {
		applyThemeMode(mode);
	});

	function toggle() {
		mode = mode === 'dark' ? 'light' : 'dark';
		saveThemeMode(mode);
	}

	const dark = $derived(mode === 'dark');
</script>

<button
	class="p-1.5 rounded hover:bg-[var(--nav-hover)] text-sm"
	onclick={toggle}
	aria-label={dark ? t('theme.lightMode') : t('theme.darkMode')}
	title={dark ? t('theme.lightMode') : t('theme.darkMode')}
>
	{#if dark}
		<!-- sun icon -->
		<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
			<circle cx="12" cy="12" r="4" />
			<path stroke-linecap="round" d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4 1.4-1.4" />
		</svg>
	{:else}
		<!-- moon icon -->
		<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
		</svg>
	{/if}
</button>
