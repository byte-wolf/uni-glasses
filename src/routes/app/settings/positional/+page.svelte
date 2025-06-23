<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { io } from 'socket.io-client';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import type { PresetResponse, PresetData } from '$lib/types';
	import { Button } from '$lib/components';

	let activePreset = $state<PresetResponse | null>(null);
	let isLoading = $state(true);
	let saveStatus = $state('');
	let currentText = $state('');
	let textPositionX = $state(0);
	let textPositionY = $state(0);

	const socket = io();

	async function loadActivePreset() {
		try {
			const response = await fetch('/api/presets');
			const data = await response.json();
			activePreset = data.find((p: PresetResponse) => p.isActive) || null;
			if (activePreset) {
				textPositionX = activePreset.textPosition?.x || 0;
				textPositionY = activePreset.textPosition?.y || 0;
			}
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

	async function savePositionalSettings() {
		if (!activePreset) return;

		try {
			const presetData: PresetData = {
				name: activePreset.name,
				textColor: activePreset.textColor,
				backgroundColor: activePreset.backgroundColor,
				fontSize: activePreset.fontSize || 48,
				textPosition: { x: textPositionX, y: textPositionY },
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
				saveStatus = 'Position settings saved successfully!';
				setTimeout(() => (saveStatus = ''), 3000);

				// Emit WebSocket update with current text and new positioning
				socket.emit('text-update', {
					content: currentText,
					textColor: updatedPreset.textColor,
					backgroundColor: updatedPreset.backgroundColor,
					fontSize: updatedPreset.fontSize || 48,
					textPosition: updatedPreset.textPosition || { x: 0, y: 0 }
				});
			}
		} catch (error) {
			console.error('Failed to save position settings:', error);
			saveStatus = 'Failed to save position settings';
			setTimeout(() => (saveStatus = ''), 3000);
		}
	}

	function resetPosition() {
		textPositionX = 0;
		textPositionY = 0;
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
		<a href="/app/settings" class="mb-4 inline-block">
			<ArrowLeftIcon class="text-primary-text hover:text-primary size-8 transition-colors" />
		</a>
		<h1 class="text-3xl font-semibold">Text Position</h1>
		<div class="text-primary-text/70 text-lg">Adjust where text appears on the display</div>
	</div>

	{#if isLoading}
		<div class="text-primary-text/70 py-8 text-center">Loading position settings...</div>
	{:else if activePreset}
		<div class="space-y-6">
			<!-- Text Position Controls -->
			<div class="space-y-4">
				<label class="text-primary-text mb-2 block text-lg font-medium"> Position Controls </label>
				<div class="space-y-4">
					<!-- X Position (Horizontal) -->
					<div>
						<label for="textPositionX" class="text-primary-text mb-2 block text-sm font-medium">
							Horizontal Position
						</label>
						<input
							id="textPositionX"
							type="range"
							min="-50"
							max="50"
							step="1"
							bind:value={textPositionX}
							class="w-full cursor-pointer"
						/>
						<div class="text-primary-text/50 flex justify-between text-xs">
							<span>Left</span>
							<span class="font-medium">{textPositionX}%</span>
							<span>Right</span>
						</div>
					</div>

					<!-- Y Position (Vertical) -->
					<div>
						<label for="textPositionY" class="text-primary-text mb-2 block text-sm font-medium">
							Vertical Position
						</label>
						<input
							id="textPositionY"
							type="range"
							min="-50"
							max="50"
							step="1"
							bind:value={textPositionY}
							class="w-full cursor-pointer"
						/>
						<div class="text-primary-text/50 flex justify-between text-xs">
							<span>Up</span>
							<span class="font-medium">{textPositionY}%</span>
							<span>Down</span>
						</div>
					</div>
				</div>
			</div>

			<!-- Preview -->
			<div>
				<div class="text-primary-text mb-2 block text-sm font-medium">Preview</div>
				<div
					class="border-primary/20 relative overflow-hidden rounded-lg border"
					style="background-color: {activePreset.backgroundColor}; height: 200px;"
				>
					<div
						class="absolute font-semibold whitespace-nowrap"
						style="color: {activePreset.textColor}; font-size: {(activePreset.fontSize || 48) /
							2}px; left: 50%; top: 50%; transform: translate(calc(-50% + {textPositionX}%), calc(-50% + {textPositionY}%));"
					>
						{currentText || 'Sample text preview'}
					</div>
				</div>
			</div>

			<!-- Action Buttons -->
			<div class="flex gap-3">
				<Button variant="primary" class="flex-1" onclick={savePositionalSettings}>
					Save Position
				</Button>
				<Button variant="tertiary" onclick={resetPosition}>Reset to Center</Button>
			</div>
		</div>
	{:else}
		<div class="text-primary-text/70 py-8 text-center">
			No active preset found. Please activate a preset to adjust its position settings.
		</div>
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
