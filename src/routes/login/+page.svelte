<script lang="ts">
	import { enhance } from '$app/forms';
	import { localeStore, t } from '$lib/i18n';
	let _locale = $localeStore;
	let { form } = $props();
</script>

<div class="max-w-sm mx-auto mt-20">
	<h1 class="text-2xl font-bold text-center mb-6">{t('login.title')}</h1>
	<form method="POST" action="?/login" use:enhance class="space-y-4">
		{#if form?.error}
			<p class="text-red-600 text-sm">{form.error}</p>
		{/if}
		<input
			type="password"
			name="password"
			placeholder={t('login.password')}
			required
			class="w-full border rounded px-3 py-2"
		/>
		<button class="w-full bg-[var(--btn-bg)] text-white py-2 rounded hover:bg-[var(--btn-hover)]">
			{t('login.submit')}
		</button>
	</form>
</div>
