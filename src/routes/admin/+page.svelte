<script lang="ts">
	import { io } from 'socket.io-client';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	const socket = io();

	let currentText = $state('');
	let newText = $state('');
	let isSaving = $state(false);
	let saveStatus = $state('');
	let lastUpdated = $state('');

	async function loadCurrentText() {
		try {
			const response = await fetch('/api/text');
			const data = await response.json();
			currentText = data.content || '';
			newText = currentText;
			lastUpdated = data.updatedAt ? new Date(data.updatedAt).toLocaleString() : '';
		} catch (error) {
			console.error('Failed to load current text:', error);
			saveStatus = 'Failed to load current text';
		}
	}

	async function updateText() {
		if (isSaving || newText.trim() === '') return;

		isSaving = true;
		saveStatus = 'Saving...';

		try {
			socket.emit('text-update', newText.trim());

			const response = await fetch('/api/text', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ content: newText.trim() })
			});

			if (response.ok) {
				const data = await response.json();
				currentText = data.content;
				lastUpdated = new Date(data.updatedAt).toLocaleString();
				saveStatus = 'Text updated successfully!';
				setTimeout(() => (saveStatus = ''), 3000);
			} else {
				throw new Error('Failed to update text');
			}
		} catch (error) {
			console.error('Failed to update text:', error);
			saveStatus = 'Failed to update text. Please try again.';
		} finally {
			isSaving = false;
		}
	}

	onMount(() => {
		loadCurrentText();
	});

	function handleKeyDown(event: KeyboardEvent) {
		if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
			updateText();
		}
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
	<!-- Header -->
	<header class="border-b border-gray-200 bg-white p-4 shadow-sm">
		<div class="mx-auto flex max-w-6xl items-center justify-between">
			<h1 class="text-2xl font-bold text-gray-800">Admin Panel</h1>
			<div class="flex items-center gap-4">
				<span class="text-sm text-gray-600">
					{lastUpdated ? `Last updated: ${lastUpdated}` : ''}
				</span>
				<button
					onclick={() => goto('/')}
					class="text-gray-600 transition-colors hover:text-gray-800"
				>
					← Back to Home
				</button>
			</div>
		</div>
	</header>

	<!-- Main Content -->
	<main class="mx-auto max-w-4xl p-6">
		<div class="rounded-xl bg-white p-8 shadow-lg">
			<div class="mb-6">
				<h2 class="mb-2 text-xl font-semibold text-gray-800">Display Text Management</h2>
				<p class="text-gray-600">
					Update the text that customers see on their display screens. Changes are pushed instantly
					via WebSocket.
				</p>
			</div>

			<!-- Current Text Display -->
			<div class="mb-6">
				<label class="mb-2 block text-sm font-medium text-gray-700">Current Display Text:</label>
				<div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
					<div class="text-lg font-medium text-gray-800">
						{currentText || 'No text set'}
					</div>
				</div>
			</div>

			<!-- Text Editor -->
			<div class="mb-6">
				<label for="newText" class="mb-2 block text-sm font-medium text-gray-700">
					New Display Text:
				</label>
				<textarea
					id="newText"
					bind:value={newText}
					onkeydown={handleKeyDown}
					placeholder="Enter the text to display to customers..."
					class="h-32 w-full resize-none rounded-lg border border-gray-300 p-4 focus:border-green-500 focus:ring-2 focus:ring-green-500"
					disabled={isSaving}
				></textarea>
				<div class="mt-2 text-sm text-gray-500">
					Tip: Press Ctrl+Enter (Cmd+Enter on Mac) to quickly save
				</div>
			</div>

			<!-- Action Buttons -->
			<div class="mb-4 flex gap-3">
				<button
					onclick={updateText}
					disabled={isSaving || newText.trim() === '' || newText.trim() === currentText}
					class="flex-1 rounded-lg bg-green-600 px-6 py-3 font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
				>
					{isSaving ? 'Updating...' : 'Update Display Text'}
				</button>

				<button
					onclick={() => {
						newText = currentText;
						saveStatus = '';
					}}
					disabled={isSaving}
					class="rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
				>
					Reset
				</button>
			</div>

			<!-- Status Message -->
			{#if saveStatus}
				<div
					class="rounded-lg p-4 {saveStatus.includes('success')
						? 'border border-green-200 bg-green-50 text-green-700'
						: saveStatus.includes('Failed')
							? 'border border-red-200 bg-red-50 text-red-700'
							: 'border border-blue-200 bg-blue-50 text-blue-700'}"
				>
					{saveStatus}
				</div>
			{/if}
		</div>

		<!-- Quick Actions -->
		<div class="mt-8 grid gap-6 md:grid-cols-2">
			<div class="rounded-lg bg-white p-6 shadow">
				<h3 class="mb-3 text-lg font-semibold text-gray-800">Quick Actions</h3>
				<div class="space-y-3">
					<button
						onclick={() => goto('/view')}
						class="w-full rounded-lg border border-gray-200 p-3 text-left transition-colors hover:bg-gray-50"
					>
						<div class="font-medium text-gray-800">Preview Customer View</div>
						<div class="text-sm text-gray-600">See how customers view the display</div>
					</button>
				</div>
			</div>

			<div class="rounded-lg bg-white p-6 shadow">
				<h3 class="mb-3 text-lg font-semibold text-gray-800">System Info</h3>
				<div class="space-y-2 text-sm">
					<div class="flex justify-between">
						<span class="text-gray-600">Status:</span>
						<span class="font-medium text-green-600">Active</span>
					</div>
					<div class="flex justify-between">
						<span class="text-gray-600">Connection:</span>
						<span class="font-medium text-green-600">WebSocket Ready</span>
					</div>
				</div>
			</div>
		</div>
	</main>
</div>
