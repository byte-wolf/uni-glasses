<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { io } from 'socket.io-client';
	import type { PresetResponse } from '$lib/types';
	import { PresetSelector, Button } from '$lib/components';

	let presets = $state<PresetResponse[]>([]);
	let activePreset = $state<PresetResponse | null>(null);
	let isLoading = $state(true);
	let currentText = $state('');

	const socket = io();

	async function loadPresets() {
		try {
			const response = await fetch('/api/presets');
			const data = await response.json();
			presets = data;
			activePreset = data.find((p: PresetResponse) => p.isActive) || null;
		} catch (error) {
			console.error('Failed to load presets:', error);
		} finally {
			isLoading = false;
		}
	}

	async function loadCurrentText() {
		try {
			const response = await fetch('/api/text');
			const data = await response.json();
			currentText = data.content || '';
		} catch (error) {
			console.error('Failed to load current text:', error);
		}
	}

	async function activatePreset(preset: PresetResponse) {
		try {
			const response = await fetch('/api/presets/activate', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ presetId: preset.id })
			});

			if (response.ok) {
				const data = await response.json();
				activePreset = data;
				await loadPresets();

				// Emit WebSocket update with current text and new styling
				socket.emit('text-update', {
					content: currentText,
					textColor: data.textColor,
					backgroundColor: data.backgroundColor,
					fontSize: data.fontSize || 48,
					textAlign: data.textAlign || 'center'
				});
			}
		} catch (error) {
			console.error('Failed to activate preset:', error);
		}
	}

	onMount(() => {
		loadPresets();
		loadCurrentText();
	});

	onDestroy(() => {
		socket.disconnect();
	});
</script>

<div class="text-primary-text flex flex-1 flex-col justify-center gap-8">
	<div>
		<h1 class="text-3xl font-semibold">InfHS</h1>
		<div class="text-lg">Lecture</div>
	</div>

	<div class="bg-background-secondary text-primary rounded-3xl p-4">
		<div class="py-8">
			<div class="text-center text-5xl font-semibold">1h 12m</div>
			<div class="text-center">Current duration</div>
		</div>

		<Button variant="secondary" class="w-full">Exit Lecture</Button>
	</div>

	<div>
		{#if isLoading}
			<div class="text-primary-text/70 py-8 text-center">Loading presets...</div>
		{:else}
			<PresetSelector {presets} {activePreset} onPresetSelect={activatePreset} />

			{#if activePreset}
				<div class="mt-4">
					<a href="/app/settings">
						<Button variant="secondary" class="w-full">Configure Preset</Button>
					</a>
				</div>
			{/if}
		{/if}
	</div>
</div>
