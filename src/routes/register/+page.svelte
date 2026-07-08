<script lang="ts">
	import { enhance } from '$app/forms';
	import { localeStore, t } from '$lib/i18n';
	let _locale = $localeStore;
	let { form } = $props();
</script>

<div class="max-w-sm mx-auto mt-20">
	<h1 class="text-2xl font-bold text-center mb-6">{t('register.title')}</h1>
	<form method="POST" action="?/register" use:enhance class="space-y-4">
		{#if form?.error}
			<p class="text-red-600 text-sm">{form.error}</p>
		{/if}
		<input
			type="text"
			name="username"
			placeholder={t('register.username')}
			required
			minlength="3"
			autocomplete="username"
			class="w-full border rounded px-3 py-2"
		/>
		<input
			type="password"
			name="password"
			placeholder={t('register.password')}
			required
			minlength="6"
			autocomplete="new-password"
			class="w-full border rounded px-3 py-2"
		/>
		<input
			type="password"
			name="confirm"
			placeholder={t('register.confirm')}
			required
			autocomplete="new-password"
			class="w-full border rounded px-3 py-2"
		/>
		<button class="w-full bg-[var(--btn-bg)] text-white py-2 rounded hover:bg-[var(--btn-hover)]">
			{t('register.submit')}
		</button>
	</form>
	<p class="text-center text-sm text-gray-500 mt-4">
		<a href="/login" class="text-blue-600 hover:underline">{t('register.login')}</a>
	</p>
</div>
