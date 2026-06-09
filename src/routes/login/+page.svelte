<script lang="ts">
	let error = $state('');
</script>

<div class="max-w-sm mx-auto mt-20">
	<h1 class="text-2xl font-bold text-center mb-6">Connexion</h1>
	<form method="POST" action="?/login" class="space-y-4">
		{#if error}
			<p class="text-red-600 text-sm">{error}</p>
		{/if}
		<input
			type="password"
			name="password"
			placeholder="Mot de passe"
			required
			class="w-full border rounded px-3 py-2"
		/>
		<button class="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">
			Se connecter
		</button>
	</form>
</div>
