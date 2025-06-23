<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { io } from 'socket.io-client';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import type { PresetResponse, PresetData } from '$lib/types';
	import { SettingsPanel } from '$lib/components';

	let activePreset = $state<PresetResponse | null>(null);
	let isLoading = $state(true);
	let saveStatus = $state('');
	let currentText = $state('');

	const socket = io();

	async function loadActivePreset() {
		try {
			const response = await fetch('/api/presets');
			const data = await response.json();
			activePreset = data.find((p: PresetResponse) => p.isActive) || null;
		} catch (error) {
			console.error('Failed to load active preset:', error);
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

	async function saveSettings(data: {
		name: string;
		textColor: string;
		backgroundColor: string;
		fontSize: number;
	}) {
		if (!activePreset) return;

		try {
			const presetData: PresetData = {
				name: data.name,
				textColor: data.textColor,
				backgroundColor: data.backgroundColor,
				fontSize: data.fontSize || 48,
				textPosition: activePreset.textPosition, // Keep existing position
				isActive: true
			};

			const response = await fetch(`/api/presets/${activePreset.id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(presetData)
			});

			if (response.ok) {
				const updatedPreset = await response.json();
				activePreset = updatedPreset;
				saveStatus = 'Settings saved successfully!';
				setTimeout(() => (saveStatus = ''), 3000);

				// Emit WebSocket update with current text and new styling
				socket.emit('text-update', {
					content: currentText,
					textColor: updatedPreset.textColor,
					backgroundColor: updatedPreset.backgroundColor,
					fontSize: updatedPreset.fontSize || 48,
					textPosition: updatedPreset.textPosition || { x: 0, y: 0 }
				});
			}
		} catch (error) {
			console.error('Failed to save settings:', error);
			saveStatus = 'Failed to save settings';
			setTimeout(() => (saveStatus = ''), 3000);
		}
	}

	onMount(() => {
		loadActivePreset();
		loadCurrentText();
	});

	onDestroy(() => {
		socket.disconnect();
	});
</script>

<div class="text-primary-text flex flex-1 flex-col gap-8">
	<div>
		<a href="/app" class="mb-4 inline-block">
			<ArrowLeftIcon class="text-primary-text hover:text-primary size-8 transition-colors" />
		</a>
		<h1 class="text-3xl font-semibold">{activePreset?.name || 'Settings'}</h1>
		<div class="text-primary-text/70 text-lg">Adjust text settings</div>
	</div>

	{#if isLoading}
		<div class="text-primary-text/70 py-8 text-center">Loading settings...</div>
	{:else}
		<SettingsPanel preset={activePreset} onSave={saveSettings} />
	{/if}

	{#if saveStatus}
		<div
			class="rounded-lg p-4 {saveStatus.includes('success')
				? 'border border-green-200 bg-green-50 text-green-700'
				: 'border border-red-200 bg-red-50 text-red-700'}"
		>
			{saveStatus}
		</div>
	{/if}
</div>
