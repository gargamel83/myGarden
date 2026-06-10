<script lang="ts">
	import { enhance } from '$app/forms';
	let { form } = $props();
</script>

<div class="max-w-sm mx-auto mt-20">
	<h1 class="text-2xl font-bold text-center mb-6">Log in</h1>
	<form method="POST" action="?/login" use:enhance class="space-y-4">
		{#if form?.error}
			<p class="text-red-600 text-sm">{form.error}</p>
		{/if}
		<input
			type="password"
			name="password"
			placeholder="Password"
			required
			class="w-full border rounded px-3 py-2"
		/>
		<button class="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">
			Log in
		</button>
	</form>
</div>
