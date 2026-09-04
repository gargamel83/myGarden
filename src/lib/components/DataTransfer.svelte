<script lang="ts">
	import { toast } from '$lib/toast.svelte';
	import { invalidate } from '$app/navigation';
	import { localeStore, t } from '$lib/i18n';
	let _locale = $localeStore;

	let open = $state(false);
	let importing = $state(false);
	let fileInput = $state<HTMLInputElement | null>(null);

	function exportData() {
		window.location.href = '/api/export';
		open = false;
	}

	function exportICS() {
		window.location.href = '/api/export/ics';
		open = false;
	}

	async function onFileChange(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		importing = true;
		try {
			const text = await file.text();
			const res = await fetch('/api/import', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: text
			});
			if (!res.ok) {
				const err = await res.json().catch(() => null);
				throw new Error(err?.message || 'Import failed');
			}
			const data = await res.json();
			toast(t('nav.importSuccess', {
				beds: data.beds, plantations: data.plantations, photos: data.photos, favorites: data.favorites
			}));
			await invalidate('app:garden');
			await invalidate('app:plantations');
			await invalidate('app:plants');
			await invalidate('app:dashboard');
			open = false;
		} catch (err) {
			toast(err instanceof Error ? err.message : t('nav.importFailed'), 'error');
		} finally {
			importing = false;
			if (fileInput) fileInput.value = '';
		}
	}
</script>

<div class="relative" role="none">
	<button
		onclick={() => open = !open}
		class="p-1.5 rounded hover:bg-[var(--nav-hover)] text-sm"
		aria-label={t('nav.dataTransfer')}
		title={t('nav.dataTransfer')}
	>
		<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
		</svg>
	</button>

	{#if open}
		<div class="absolute right-0 top-full mt-1 bg-white text-gray-700 rounded-lg shadow-lg border py-1 min-w-[180px] z-50" role="dialog" aria-modal="true">
			<button
				class="block w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100"
				onclick={exportData}
			>
				{t('nav.exportData')}
			</button>
			<button
				class="block w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100"
				onclick={exportICS}
			>
				{t('nav.exportICS')}
			</button>
			<label class="block w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 cursor-pointer">
				{importing ? t('nav.importing') : t('nav.importData')}
				<input
					bind:this={fileInput}
					type="file"
					accept="application/json,.json"
					class="hidden"
					onchange={onFileChange}
				/>
			</label>
		</div>
	{/if}
</div>
