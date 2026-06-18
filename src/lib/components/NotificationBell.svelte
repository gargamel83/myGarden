<script lang="ts">
	interface AppNotification {
		id: number;
		type: string;
		message: string;
		link: string | null;
		isRead: boolean;
		createdAt: string;
	}

	let { onnavigate }: { onnavigate?: (url: string) => void } = $props();

	let notifications = $state<AppNotification[]>([]);
	let unreadCount = $state(0);
	let open = $state(false);

	function fetchNotifications() {
		fetch('/api/notifications')
			.then(r => r.json())
			.then(data => {
				notifications = data.notifications || [];
				unreadCount = data.unreadCount || 0;
			})
			.catch(() => {});
	}

	function markAsRead(id: number) {
		fetch(`/api/notifications/${id}/read`, { method: 'POST' }).catch(() => {});
		notifications = notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
		unreadCount = Math.max(0, unreadCount - 1);
	}

	function markAllAsRead() {
		fetch('/api/notifications/read-all', { method: 'POST' }).catch(() => {});
		notifications = notifications.map(n => ({ ...n, isRead: true }));
		unreadCount = 0;
	}

	function handleClick(n: AppNotification) {
		if (!n.isRead) markAsRead(n.id);
		if (n.link) {
			onnavigate?.(n.link);
		}
		open = false;
	}

	$effect(() => {
		fetchNotifications();
		const interval = setInterval(fetchNotifications, 30000);
		return () => clearInterval(interval);
	});

	function closeDropdown() {
		open = false;
	}

	const typeIcons: Record<string, string> = {
		sowing: '🌱',
		harvest: '🧑‍🌾',
		rotation: '🔄',
		stale: '⏰'
	};
</script>

<div class="relative" role="none">
	<button
		class="relative p-2 rounded hover:bg-gray-100 text-lg leading-none"
		onclick={() => open = !open}
		aria-label="Notifications"
	>
		🔔
		{#if unreadCount > 0}
			<span class="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
				{unreadCount > 9 ? '9+' : unreadCount}
			</span>
		{/if}
	</button>

	{#if open}
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div class="fixed inset-0 z-40" onclick={closeDropdown} onkeydown={(e) => e.key === 'Escape' && closeDropdown()} role="none"></div>
		<div class="absolute right-0 top-full mt-1 z-50 w-80 bg-white border rounded-lg shadow-xl max-h-96 flex flex-col">
			<div class="flex items-center justify-between p-3 border-b shrink-0">
				<h3 class="font-bold text-sm">Notifications</h3>
				{#if unreadCount > 0}
					<button class="text-xs text-blue-600 hover:underline" onclick={markAllAsRead}>Mark all read</button>
				{/if}
			</div>
			<div class="overflow-y-auto flex-1">
				{#if notifications.length === 0}
					<p class="text-gray-400 text-xs text-center py-6">No notifications</p>
				{:else}
					{#each notifications as n (n.id)}
						<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
						<button
							class="w-full text-left flex items-start gap-2 px-3 py-2 hover:bg-gray-50 border-b border-gray-50 {n.isRead ? 'opacity-50' : ''}"
							onclick={() => handleClick(n)}
							onkeydown={(e) => e.key === 'Enter' && handleClick(n)}
						>
							<span class="text-base shrink-0 mt-0.5">{typeIcons[n.type] || '📌'}</span>
							<div class="min-w-0 flex-1">
								<p class="text-xs text-gray-700 line-clamp-2">{n.message}</p>
								<p class="text-[10px] text-gray-400 mt-0.5">{new Date(n.createdAt).toLocaleDateString()}</p>
							</div>
							{#if !n.isRead}
								<span class="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1.5"></span>
							{/if}
						</button>
					{/each}
				{/if}
			</div>
			<a href="/" class="block text-center text-xs text-blue-600 hover:underline py-2 border-t shrink-0" onclick={() => open = false}>
				Go to dashboard
			</a>
		</div>
	{/if}
</div>
