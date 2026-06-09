<script lang="ts">
	let { title = 'Confirmer', message = '', confirmLabel = 'Supprimer', onconfirm, oncancel }: {
		title?: string
		message?: string
		confirmLabel?: string
		onconfirm: () => void
		oncancel: () => void
	} = $props();
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onclick={oncancel} role="presentation">
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div class="bg-white rounded-lg p-6 w-80 shadow-xl" onclick={(e) => e.stopPropagation()} role="presentation">
		<h3 class="font-bold text-lg mb-2">{title}</h3>
		<p class="text-sm text-gray-600 mb-5">{message}</p>
		<div class="flex justify-end gap-2">
			<button class="px-4 py-2 border rounded text-sm" onclick={oncancel}>Annuler</button>
			<button class="px-4 py-2 bg-red-600 text-white rounded text-sm" onclick={onconfirm}>{confirmLabel}</button>
		</div>
	</div>
</div>
