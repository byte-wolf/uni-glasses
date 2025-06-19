<script lang="ts">
	import { goto } from '$app/navigation';
</script>

<svelte:head>
	<title>Display System</title>
</svelte:head>

<div
	class="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4"
>
	<div class="w-full max-w-2xl rounded-xl bg-white p-8 shadow-lg">
		<div class="mb-8 text-center">
			<h1 class="mb-4 text-4xl font-bold text-gray-800">Uni Glasses Display System</h1>
			<p class="text-lg text-gray-600">Real-time text display management system</p>
		</div>

		<div class="grid gap-6 md:grid-cols-2">
			<!-- Customer View -->
			<div class="rounded-lg bg-blue-50 p-6 text-center">
				<div
					class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100"
				>
					<svg class="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
						/>
					</svg>
				</div>
				<h2 class="mb-3 text-xl font-semibold text-gray-800">Customer View</h2>
				<p class="mb-4 text-gray-600">Connect to view real-time text updates</p>
				<button
					onclick={() => goto('/view')}
					class="w-full rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
				>
					Go to Display
				</button>
			</div>

			<!-- Admin Panel -->
			<div class="rounded-lg bg-green-50 p-6 text-center">
				<div
					class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100"
				>
					<svg class="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
						/>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
						/>
					</svg>
				</div>
				<h2 class="mb-3 text-xl font-semibold text-gray-800">Admin Panel</h2>
				<p class="mb-4 text-gray-600">Manage and update display content</p>
				<button
					onclick={() => goto('/admin')}
					class="w-full rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
				>
					Go to Admin
				</button>
			</div>
		</div>

		<div class="mt-8 text-center">
			<p class="text-sm text-gray-500">Select your role to access the appropriate interface</p>
		</div>
	</div>
</div>
