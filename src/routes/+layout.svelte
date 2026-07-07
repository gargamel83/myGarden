<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import Toast from '$lib/components/Toast.svelte';
	import LogPanel from '$lib/components/LogPanel.svelte';
	import NotificationBell from '$lib/components/NotificationBell.svelte';
	import ThemeSwitcher from '$lib/components/ThemeSwitcher.svelte';
	import { setToastHandler } from '$lib/toast.svelte';
	import { version } from '../../package.json';
	import { applyTheme, loadTheme } from '$lib/themes';
	let { children } = $props();

	let mobileOpen = $state(false);
	let showLogs = $state(false);
	let toastMsg = $state('');
	let toastType: 'success' | 'error' | 'info' = $state('success');
	let toastKey = $state(0);

	setToastHandler((msg, type = 'success') => {
		toastMsg = msg;
		toastType = type;
		toastKey++;
	});

	const links = [
		{ href: '/', label: 'Dashboard' },
		{ href: '/garden', label: 'Garden' },
		{ href: '/plantations', label: 'Plantings' },
		{ href: '/plants', label: 'Plants' }
	];

	$effect(() => {
		applyTheme(loadTheme());
	});
</script>

<svelte:head>
	<meta name="viewport" content="width=device-width, initial-scale=1" />
</svelte:head>

{#key toastKey}
	{#if toastMsg}
		<Toast message={toastMsg} type={toastType} onclose={() => toastMsg = ''} />
	{/if}
{/key}

<!-- Navigation -->
<nav class="bg-[var(--nav-bg)] text-white">
	<div class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
		<a href="/" class="font-bold text-lg">MonJardin <span class="text-[var(--nav-accent)] text-xs font-normal">v{version}</span></a>

		<div class="hidden md:flex items-center gap-1">
			{#each links as link}
				<a
					href={link.href}
					class="px-3 py-1.5 rounded text-sm transition-colors {$page.url.pathname === link.href ? 'bg-[var(--nav-active)] font-medium' : 'hover:bg-[var(--nav-hover)]'}"
				>
					{link.label}
				</a>
			{/each}
		</div>

		<div class="flex items-center gap-1">
			<ThemeSwitcher />
			<NotificationBell onnavigate={(url) => { goto(url); }} />
			<button
				class="p-1.5 rounded hover:bg-[var(--nav-hover)] text-sm"
				onclick={() => showLogs = true}
				aria-label="Logs"
				title="Logs"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
				</svg>
			</button>
			<button
				class="md:hidden p-1"
				onclick={() => mobileOpen = !mobileOpen}
				aria-label="Menu"
			>
				<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					{#if mobileOpen}
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					{:else}
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
					{/if}
				</svg>
			</button>
		</div>
	</div>

	{#if mobileOpen}
		<div class="md:hidden border-t border-[var(--nav-border)] px-4 py-2 space-y-1">
			{#each links as link}
				<a
					href={link.href}
					class="block px-3 py-2 rounded text-sm transition-colors {$page.url.pathname === link.href ? 'bg-[var(--nav-active)] font-medium' : 'hover:bg-[var(--nav-hover)]'}"
					onclick={() => mobileOpen = false}
				>
					{link.label}
				</a>
			{/each}
		</div>
	{/if}
</nav>

<div class="animate-fade-in">
	<main class="max-w-6xl mx-auto p-4">
		{@render children()}
	</main>
</div>

{#if showLogs}
	<LogPanel onclose={() => showLogs = false} />
{/if}
