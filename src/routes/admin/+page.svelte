<script lang="ts">
	import { io } from 'socket.io-client';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import type { DisplayData, PresetData, PresetResponse } from '$lib/types';

	const socket = io();

	let currentText = $state('');
	let currentTextColor = $state('#ffffff');
	let currentBackgroundColor = $state('#1f2937');
	let currentFontSize = $state(48);
	let currentTextPosition = $state({ x: 0, y: 0 });
	let newText = $state('');
	let newTextColor = $state('#ffffff');
	let newBackgroundColor = $state('#1f2937');
	let newFontSize = $state(48);
	let newTextPosition = $state({ x: 0, y: 0 });
	let isSaving = $state(false);
	let saveStatus = $state('');
	let lastUpdated = $state('');

	// Preset management
	let presets = $state<PresetResponse[]>([]);
	let activePreset = $state<PresetResponse | null>(null);
	let selectedPresetId = $state<number | null>(null);
	let isCreatingPreset = $state(false);
	let newPresetName = $state('');
	let editingPreset = $state<PresetResponse | null>(null);

	// Display settings (for editing active preset)
	let displaySettingsName = $state('');

	async function loadCurrentText() {
		try {
			const response = await fetch('/api/text');
			const data = await response.json();
			currentText = data.content || '';
			currentTextColor = data.textColor || '#ffffff';
			currentBackgroundColor = data.backgroundColor || '#1f2937';
			currentFontSize = data.fontSize || 48;
			currentTextPosition = data.textPosition || { x: 0, y: 0 };
			newText = currentText;
			newTextColor = currentTextColor;
			newBackgroundColor = currentBackgroundColor;
			newFontSize = currentFontSize;
			newTextPosition = { ...currentTextPosition };
			lastUpdated = data.updatedAt ? new Date(data.updatedAt).toLocaleString() : '';
		} catch (error) {
			console.error('Failed to load current text:', error);
			saveStatus = 'Failed to load current text';
		}
	}

	async function loadPresets() {
		try {
			const response = await fetch('/api/presets');
			const data = await response.json();
			presets = data;
			activePreset = data.find((p: PresetResponse) => p.isActive) || null;
			selectedPresetId = activePreset?.id || null;

			console.log('data', data);

			// Update display settings with active preset values
			if (activePreset) {
				displaySettingsName = activePreset.name;
				newTextColor = activePreset.textColor;
				newBackgroundColor = activePreset.backgroundColor;
				newFontSize = activePreset.fontSize || 48;
				newTextPosition = activePreset.textPosition || { x: 0, y: 0 };
			}
		} catch (error) {
			console.error('Failed to load presets:', error);
		}
	}

	async function updateText() {
		if (isSaving || newText.trim() === '') return;

		isSaving = true;
		saveStatus = 'Saving...';

		try {
			const updateData: DisplayData = {
				content: newText.trim(),
				textColor: newTextColor,
				backgroundColor: newBackgroundColor,
				fontSize: newFontSize,
				textPosition: newTextPosition
			};

			socket.emit('text-update', updateData);

			const response = await fetch('/api/text', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(updateData)
			});

			if (response.ok) {
				const data = await response.json();
				currentText = data.content;
				currentTextColor = data.textColor;
				currentBackgroundColor = data.backgroundColor;
				currentFontSize = data.fontSize || 48;
				currentTextPosition = data.textPosition || { x: 0, y: 0 };
				lastUpdated = new Date(data.updatedAt).toLocaleString();
				saveStatus = 'Text updated successfully!';
				setTimeout(() => (saveStatus = ''), 3000);

				// Reload presets to get updated data
				await loadPresets();

				// If this is the active preset, update current display colors and emit WebSocket update
				if (data.isActive) {
					currentTextColor = data.textColor;
					currentBackgroundColor = data.backgroundColor;
					currentFontSize = data.fontSize || 48;
					currentTextPosition = data.textPosition || { x: 0, y: 0 };
					newTextColor = data.textColor;
					newBackgroundColor = data.backgroundColor;
					newFontSize = data.fontSize || 48;
					newTextPosition = { ...(data.textPosition || { x: 0, y: 0 }) };
					lastUpdated = new Date(data.updatedAt).toLocaleString();

					// Emit WebSocket update with current text and new styling
					socket.emit('text-update', {
						content: currentText,
						textColor: data.textColor,
						backgroundColor: data.backgroundColor,
						fontSize: data.fontSize || 48,
						textPosition: data.textPosition || { x: 0, y: 0 }
					});
				}
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

	async function activatePreset(presetId: number) {
		try {
			const response = await fetch('/api/presets/activate', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ presetId })
			});

			if (response.ok) {
				const data = await response.json();
				activePreset = data;
				selectedPresetId = presetId;

				// Update current display colors (text content stays the same)
				currentTextColor = data.textColor;
				currentBackgroundColor = data.backgroundColor;
				currentFontSize = data.fontSize || 48;
				currentTextPosition = data.textPosition || { x: 0, y: 0 };
				newTextColor = data.textColor;
				newBackgroundColor = data.backgroundColor;
				newFontSize = data.fontSize || 48;
				newTextPosition = { ...(data.textPosition || { x: 0, y: 0 }) };
				displaySettingsName = data.name;
				lastUpdated = new Date(data.updatedAt).toLocaleString();

				// Emit socket update
				socket.emit('text-update', {
					content: currentText,
					textColor: data.textColor,
					backgroundColor: data.backgroundColor,
					fontSize: data.fontSize || 48,
					textPosition: data.textPosition || { x: 0, y: 0 }
				});

				saveStatus = `Preset "${data.name}" activated!`;
				setTimeout(() => (saveStatus = ''), 3000);

				// Reload presets
				await loadPresets();
			}
		} catch (error) {
			console.error('Failed to activate preset:', error);
			saveStatus = 'Failed to activate preset';
		}
	}

	async function cyclePreset(direction: 'next' | 'prev') {
		if (presets.length === 0) return;

		const currentIndex = presets.findIndex((p) => p.id === activePreset?.id);
		let nextIndex: number;

		if (direction === 'next') {
			nextIndex = currentIndex === -1 || currentIndex === presets.length - 1 ? 0 : currentIndex + 1;
		} else {
			nextIndex = currentIndex === -1 || currentIndex === 0 ? presets.length - 1 : currentIndex - 1;
		}

		await activatePreset(presets[nextIndex].id);
	}

	function openCreatePresetModal() {
		isCreatingPreset = true;
		newPresetName = '';
		// Set default colors for new preset
		newTextColor = '#ffffff';
		newBackgroundColor = '#1f2937';
		newFontSize = 48;
		newTextPosition = { x: 0, y: 0 };
	}

	function openEditPresetModal(preset: PresetResponse) {
		// This function is no longer needed since editing is done in display settings
		// Keeping it for compatibility but it doesn't do anything
	}

	function startEditingDisplaySettings() {
		// This function is no longer needed since settings are always visible
	}

	async function saveDisplaySettings() {
		if (!activePreset || !displaySettingsName.trim()) return;

		try {
			const presetData: PresetData = {
				name: displaySettingsName.trim(),
				textColor: newTextColor,
				backgroundColor: newBackgroundColor,
				fontSize: newFontSize,
				textPosition: newTextPosition,
				isActive: true // Keep it active since we're editing the active preset
			};

			const response = await fetch(`/api/presets/${activePreset.id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(presetData)
			});

			if (response.ok) {
				const data = await response.json();
				saveStatus = `Display settings updated successfully!`;
				setTimeout(() => (saveStatus = ''), 3000);

				// Update current display colors
				currentTextColor = data.textColor;
				currentBackgroundColor = data.backgroundColor;
				currentFontSize = data.fontSize || 48;

				currentTextPosition = data.textPosition || { x: 0, y: 0 };
				lastUpdated = new Date(data.updatedAt).toLocaleString();

				// Emit WebSocket update with current text and new styling
				socket.emit('text-update', {
					content: currentText,
					textColor: data.textColor,
					backgroundColor: data.backgroundColor,
					fontSize: data.fontSize || 48,
					textPosition: data.textPosition || { x: 0, y: 0 }
				});

				// Reload presets
				await loadPresets();
			}
		} catch (error) {
			console.error('Failed to save display settings:', error);
			saveStatus = 'Failed to save display settings';
		}
	}

	function cancelDisplaySettingsEdit() {
		// Reset to current active preset values
		if (activePreset) {
			displaySettingsName = activePreset.name;
			newTextColor = activePreset.textColor;
			newBackgroundColor = activePreset.backgroundColor;
			newFontSize = activePreset.fontSize || 48;
			newTextPosition = { ...(activePreset.textPosition || { x: 0, y: 0 }) };
		}
	}

	async function savePreset() {
		if (!newPresetName.trim()) return;

		try {
			const presetData: PresetData = {
				name: newPresetName.trim(),
				textColor: newTextColor,
				backgroundColor: newBackgroundColor,
				fontSize: newFontSize,
				textPosition: newTextPosition,
				isActive: isCreatingPreset
			};

			const response = await fetch('/api/presets', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(presetData)
			});

			if (response.ok) {
				const data = await response.json();
				isCreatingPreset = false;
				saveStatus = `Preset "${data.name}" created successfully!`;
				setTimeout(() => (saveStatus = ''), 3000);

				// Reload presets
				await loadPresets();

				// If this is the active preset, update current display colors and emit WebSocket update
				if (data.isActive) {
					currentTextColor = data.textColor;
					currentBackgroundColor = data.backgroundColor;
					currentFontSize = data.fontSize || 48;
					currentTextPosition = data.textPosition || { x: 0, y: 0 };
					newTextColor = data.textColor;
					newBackgroundColor = data.backgroundColor;
					newFontSize = data.fontSize || 48;
					newTextPosition = { ...(data.textPosition || { x: 0, y: 0 }) };
					lastUpdated = new Date(data.updatedAt).toLocaleString();

					// Emit WebSocket update with current text and new styling
					socket.emit('text-update', {
						content: currentText,
						textColor: data.textColor,
						backgroundColor: data.backgroundColor,
						fontSize: data.fontSize || 48,
						textPosition: data.textPosition || { x: 0, y: 0 }
					});
				}
			}
		} catch (error) {
			console.error('Failed to save preset:', error);
			saveStatus = 'Failed to save preset';
		}
	}

	async function deletePreset(presetId: number) {
		if (!confirm('Are you sure you want to delete this preset?')) return;

		try {
			const response = await fetch(`/api/presets/${presetId}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				saveStatus = 'Preset deleted successfully!';
				setTimeout(() => (saveStatus = ''), 3000);
				await loadPresets();
			}
		} catch (error) {
			console.error('Failed to delete preset:', error);
			saveStatus = 'Failed to delete preset';
		}
	}

	onMount(() => {
		loadCurrentText();
		loadPresets();
	});

	function handleKeyDown(event: KeyboardEvent) {
		if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
			updateText();
		}
	}

	function hasChanges() {
		return (
			newText.trim() !== currentText ||
			newTextColor !== currentTextColor ||
			newBackgroundColor !== currentBackgroundColor ||
			newFontSize !== currentFontSize ||
			newTextPosition.x !== currentTextPosition.x ||
			newTextPosition.y !== currentTextPosition.y
		);
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
	<!-- Header -->
	<header class="border-b border-gray-200 bg-white p-4 shadow-sm">
		<div class="mx-auto flex max-w-6xl items-center justify-between">
			<h1 class="text-2xl font-bold text-gray-800">Wizard of Oz</h1>
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
	<main class="mx-auto max-w-6xl p-6">
		<div class="grid gap-6 lg:grid-cols-3">
			<!-- Preset Management Panel -->
			<div class="lg:col-span-1">
				<div class="rounded-xl bg-white p-6 shadow-lg">
					<div class="mb-6">
						<h2 class="mb-2 text-xl font-semibold text-gray-800">Preset Management</h2>
						<p class="text-sm text-gray-600">
							Manage display presets and quickly switch between them.
						</p>
					</div>

					<!-- Active Preset Display -->
					{#if activePreset}
						<div class="mb-4">
							<label class="mb-2 block text-sm font-medium text-gray-700">Active Preset:</label>
							<div class="rounded-lg border border-green-200 bg-green-50 p-3">
								<div class="font-medium text-green-800">
									{activePreset.name}
								</div>
								<div class="flex items-center gap-2 text-sm text-green-600">
									Text: <div
										class="inline-block size-4 rounded border border-neutral-500"
										style={`background-color: ${activePreset.textColor};`}
									></div>
									| Background:
									<div
										class="inline-block size-4 rounded border border-neutral-500"
										style={`background-color: ${activePreset.backgroundColor};`}
									></div>
								</div>
							</div>
						</div>
					{/if}

					<!-- Preset Cycling -->
					{#if presets.length > 1}
						<div class="mb-4">
							<label class="mb-2 block text-sm font-medium text-gray-700">Quick Switch:</label>
							<div class="flex gap-2">
								<button
									onclick={() => cyclePreset('prev')}
									class="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
								>
									← Previous
								</button>
								<button
									onclick={() => cyclePreset('next')}
									class="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
								>
									Next →
								</button>
							</div>
						</div>
					{/if}

					<!-- Preset List -->
					<div class="mb-4">
						<label class="mb-2 block text-sm font-medium text-gray-700">All Presets:</label>
						<div class="max-h-64 space-y-2 overflow-y-auto">
							{#each presets as preset}
								<div
									class="flex items-center justify-between rounded-lg border border-gray-200 p-3 {preset.isActive
										? 'border-green-300 bg-green-50'
										: 'bg-white'}"
								>
									<div class="flex-1">
										<div class="font-medium text-gray-800">{preset.name}</div>
										<div class="truncate text-sm text-gray-600">
											<div class="flex items-center gap-2 text-sm text-green-600">
												Text: <div
													class="inline-block size-4 rounded border border-neutral-500"
													style={`background-color: ${preset.textColor};`}
												></div>
												| Background:
												<div
													class="inline-block size-4 rounded border border-neutral-500"
													style={`background-color: ${preset.backgroundColor};`}
												></div>
											</div>
										</div>
									</div>
									<div class="flex gap-1">
										{#if !preset.isActive}
											<button
												onclick={() => activatePreset(preset.id)}
												class="rounded px-2 py-1 text-xs font-medium text-green-600 hover:bg-green-100"
											>
												Activate
											</button>
										{/if}
										{#if presets.length > 1}
											<button
												onclick={() => deletePreset(preset.id)}
												class="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
											>
												Delete
											</button>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					</div>

					<!-- Create New Preset -->
					{#if isCreatingPreset}
						<div class="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
							<h4 class="mb-3 font-medium text-gray-800">Create New Preset</h4>
							<div class="mb-3">
								<label for="newPresetName" class="mb-1 block text-sm font-medium text-gray-700">
									Preset Name:
								</label>
								<input
									id="newPresetName"
									type="text"
									bind:value={newPresetName}
									placeholder="Enter preset name..."
									class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:ring-2 focus:ring-green-500"
								/>
							</div>
							<div class="mb-3 grid gap-2 md:grid-cols-2">
								<div>
									<label class="mb-1 block text-sm font-medium text-gray-700">Text Color:</label>
									<div class="flex items-center gap-2">
										<input
											type="color"
											bind:value={newTextColor}
											class="h-8 w-10 cursor-pointer rounded border border-gray-300"
										/>
										<input
											type="text"
											bind:value={newTextColor}
											class="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
										/>
									</div>
								</div>
								<div>
									<label class="mb-1 block text-sm font-medium text-gray-700"
										>Background Color:</label
									>
									<div class="flex items-center gap-2">
										<input
											type="color"
											bind:value={newBackgroundColor}
											class="h-8 w-10 cursor-pointer rounded border border-gray-300"
										/>
										<input
											type="text"
											bind:value={newBackgroundColor}
											class="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
										/>
									</div>
								</div>
							</div>
							<div class="mb-3">
								<label class="mb-1 block text-sm font-medium text-gray-700">Font Size (px):</label>
								<input
									type="range"
									min="16"
									max="120"
									step="2"
									bind:value={newFontSize}
									class="w-full cursor-pointer"
								/>
								<div class="flex justify-between text-xs text-gray-500">
									<span>16px</span>
									<span>{newFontSize}px</span>
									<span>120px</span>
								</div>
							</div>
							<!-- Text Position Controls -->
							<div class="mb-3 grid gap-2 md:grid-cols-2">
								<div>
									<label class="mb-1 block text-sm font-medium text-gray-700"
										>Horizontal Position:</label
									>
									<input
										type="range"
										min="-50"
										max="50"
										step="1"
										bind:value={newTextPosition.x}
										class="w-full cursor-pointer"
									/>
									<div class="flex justify-between text-xs text-gray-500">
										<span>Left</span>
										<span class="font-medium">{newTextPosition.x}%</span>
										<span>Right</span>
									</div>
								</div>
								<div>
									<label class="mb-1 block text-sm font-medium text-gray-700"
										>Vertical Position:</label
									>
									<input
										type="range"
										min="-50"
										max="50"
										step="1"
										bind:value={newTextPosition.y}
										class="w-full cursor-pointer"
									/>
									<div class="flex justify-between text-xs text-gray-500">
										<span>Up</span>
										<span class="font-medium">{newTextPosition.y}%</span>
										<span>Down</span>
									</div>
								</div>
							</div>
							<div class="mb-3">
								<button
									onclick={() => {
										newTextPosition.x = 0;
										newTextPosition.y = 0;
									}}
									class="rounded-lg border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
								>
									Reset to Center
								</button>
							</div>
							<div class="flex gap-2">
								<button
									onclick={savePreset}
									disabled={!newPresetName.trim()}
									class="flex-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
								>
									Create Preset
								</button>
								<button
									onclick={() => (isCreatingPreset = false)}
									class="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
								>
									Cancel
								</button>
							</div>
						</div>
					{:else}
						<button
							onclick={openCreatePresetModal}
							class="w-full rounded-lg bg-green-600 px-4 py-2 font-medium text-white transition-colors hover:bg-green-700"
						>
							+ Create New Preset
						</button>
					{/if}
				</div>
			</div>

			<!-- Text Editor Panel -->
			<div class="lg:col-span-2">
				<div class="space-y-6">
					<!-- Text Editor -->
					<div class="rounded-xl bg-white p-6 shadow-lg">
						<div class="mb-6">
							<h2 class="mb-2 text-xl font-semibold text-gray-800">Display Text Editor</h2>
							<p class="text-gray-600">
								Edit the text content that customers see on their display screens.
							</p>
						</div>

						<!-- Current Text Display -->
						<div class="mb-6">
							<label class="mb-2 block text-sm font-medium text-gray-700">Current Display:</label>
							<div
								class="relative overflow-hidden rounded-lg border border-gray-200 p-4"
								style="background-color: {currentBackgroundColor}; height: 120px;"
							>
								<div
									class="absolute font-medium"
									style="color: {currentTextColor}; font-size: {Math.min(
										currentFontSize / 2,
										24
									)}px; left: 50%; top: 50%; transform: translate(calc(-50% + {currentTextPosition.x}%), calc(-50% + {currentTextPosition.y}%));"
								>
									{currentText || 'No text set'}
								</div>
							</div>
							<div class="mt-1 text-xs text-gray-500">
								Position: ({currentTextPosition.x}%, {currentTextPosition.y}%)
							</div>
						</div>

						<!-- Text Editor -->
						<div class="mb-6">
							<label for="newText" class="mb-2 block text-sm font-medium text-gray-700">
								Display Text:
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

						<!-- Preview -->
						<div class="mb-6">
							<label class="mb-2 block text-sm font-medium text-gray-700">Preview:</label>
							<div
								class="relative overflow-hidden rounded-lg border border-gray-200 p-4"
								style="background-color: {currentBackgroundColor}; height: 120px;"
							>
								<div
									class="absolute font-medium"
									style="color: {currentTextColor}; font-size: {Math.min(
										currentFontSize / 2,
										24
									)}px; left: 50%; top: 50%; transform: translate(calc(-50% + {currentTextPosition.x}%), calc(-50% + {currentTextPosition.y}%));"
								>
									{newText || 'Enter text above to see preview'}
								</div>
							</div>
							<div class="mt-1 text-xs text-gray-500">
								Current position: ({currentTextPosition.x}%, {currentTextPosition.y}%)
							</div>
						</div>

						<!-- Action Buttons -->
						<div class="mb-4 flex gap-3">
							<button
								onclick={updateText}
								disabled={isSaving || newText.trim() === '' || !hasChanges()}
								class="flex-1 rounded-lg bg-green-600 px-6 py-3 font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
							>
								{isSaving ? 'Updating...' : 'Update Text'}
							</button>

							<button
								onclick={() => {
									newText = currentText;
									newTextColor = currentTextColor;
									newBackgroundColor = currentBackgroundColor;
									newFontSize = currentFontSize;
									newTextPosition = currentTextPosition;
									saveStatus = '';
								}}
								disabled={isSaving}
								class="rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
							>
								Reset
							</button>
						</div>
					</div>

					<!-- Display Settings -->
					<div class="rounded-xl bg-white p-6 shadow-lg">
						<div class="mb-6">
							<h2 class="mb-2 text-xl font-semibold text-gray-800">Display Settings</h2>
							<p class="text-gray-600">
								Edit the colors and styling of the current display preset.
							</p>
						</div>

						{#if activePreset}
							<!-- Preset Name -->
							<div class="mb-4">
								<label
									for="displaySettingsName"
									class="mb-2 block text-sm font-medium text-gray-700"
								>
									Preset Name:
								</label>
								<input
									id="displaySettingsName"
									type="text"
									bind:value={displaySettingsName}
									placeholder="Enter preset name..."
									class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:ring-2 focus:ring-green-500"
								/>
							</div>

							<!-- Color Controls -->
							<div class="mb-6 grid gap-4 md:grid-cols-2">
								<div>
									<label
										for="settingsTextColor"
										class="mb-2 block text-sm font-medium text-gray-700"
									>
										Text Color:
									</label>
									<div class="flex items-center gap-3">
										<input
											id="settingsTextColor"
											type="color"
											bind:value={newTextColor}
											class="h-10 w-16 cursor-pointer rounded-lg border border-gray-300"
										/>
										<input
											type="text"
											bind:value={newTextColor}
											pattern="^#[0-9A-Fa-f]{6}$"
											placeholder="#ffffff"
											class="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:ring-2 focus:ring-green-500"
										/>
									</div>
								</div>

								<div>
									<label
										for="settingsBackgroundColor"
										class="mb-2 block text-sm font-medium text-gray-700"
									>
										Background Color:
									</label>
									<div class="flex items-center gap-3">
										<input
											id="settingsBackgroundColor"
											type="color"
											bind:value={newBackgroundColor}
											class="h-10 w-16 cursor-pointer rounded-lg border border-gray-300"
										/>
										<input
											type="text"
											bind:value={newBackgroundColor}
											pattern="^#[0-9A-Fa-f]{6}$"
											placeholder="#1f2937"
											class="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:ring-2 focus:ring-green-500"
										/>
									</div>
								</div>
							</div>

							<!-- Font Size Control -->
							<div class="mb-6">
								<label for="settingsFontSize" class="mb-2 block text-sm font-medium text-gray-700">
									Font Size:
								</label>
								<input
									id="settingsFontSize"
									type="range"
									min="16"
									max="120"
									step="2"
									bind:value={newFontSize}
									class="w-full cursor-pointer"
								/>
								<div class="flex justify-between text-xs text-gray-500">
									<span>16px</span>
									<span class="font-medium">{newFontSize}px</span>
									<span>120px</span>
								</div>
							</div>

							<!-- Text Position Controls -->
							<div class="mb-6">
								<label class="mb-2 block text-sm font-medium text-gray-700">Text Position:</label>
								<div class="grid gap-4 md:grid-cols-2">
									<div>
										<label for="settingsTextPositionX" class="mb-1 block text-xs text-gray-600">
											Horizontal Position:
										</label>
										<input
											id="settingsTextPositionX"
											type="range"
											min="-50"
											max="50"
											step="1"
											bind:value={newTextPosition.x}
											class="w-full cursor-pointer"
										/>
										<div class="flex justify-between text-xs text-gray-500">
											<span>Left</span>
											<span class="font-medium">{newTextPosition.x}%</span>
											<span>Right</span>
										</div>
									</div>
									<div>
										<label for="settingsTextPositionY" class="mb-1 block text-xs text-gray-600">
											Vertical Position:
										</label>
										<input
											id="settingsTextPositionY"
											type="range"
											min="-50"
											max="50"
											step="1"
											bind:value={newTextPosition.y}
											class="w-full cursor-pointer"
										/>
										<div class="flex justify-between text-xs text-gray-500">
											<span>Up</span>
											<span class="font-medium">{newTextPosition.y}%</span>
											<span>Down</span>
										</div>
									</div>
								</div>
								<div class="mt-3">
									<button
										onclick={() => {
											newTextPosition.x = 0;
											newTextPosition.y = 0;
										}}
										class="rounded-lg border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
									>
										Reset to Center
									</button>
								</div>
							</div>

							<!-- Settings Preview -->
							<div class="mb-6">
								<label class="mb-2 block text-sm font-medium text-gray-700">Preview:</label>
								<div
									class="relative overflow-hidden rounded-lg border border-gray-200 p-4"
									style="background-color: {newBackgroundColor}; height: 100px;"
								>
									<div
										class="absolute font-medium"
										style="color: {newTextColor}; font-size: {Math.min(
											newFontSize / 2,
											24
										)}px; left: 50%; top: 50%; transform: translate(calc(-50% + {newTextPosition.x}%), calc(-50% + {newTextPosition.y}%));"
									>
										{currentText || 'Sample text preview'}
									</div>
								</div>
								<div class="mt-1 text-xs text-gray-500">
									Position: ({newTextPosition.x}%, {newTextPosition.y}%)
								</div>
							</div>

							<!-- Settings Action Buttons -->
							<div class="flex gap-3">
								<button
									onclick={saveDisplaySettings}
									disabled={!displaySettingsName.trim()}
									class="flex-1 rounded-lg bg-green-600 px-6 py-3 font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
								>
									Save Settings
								</button>
								<button
									onclick={cancelDisplaySettingsEdit}
									class="rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50"
								>
									Reset
								</button>
							</div>
						{:else}
							<div class="text-center text-gray-500">
								No active preset. Please create or activate a preset first.
							</div>
						{/if}
					</div>
				</div>

				<!-- Status Message -->
				{#if saveStatus}
					<div
						class="mt-6 rounded-lg p-4 {saveStatus.includes('success') ||
						saveStatus.includes('activated') ||
						saveStatus.includes('created') ||
						saveStatus.includes('updated')
							? 'border border-green-200 bg-green-50 text-green-700'
							: saveStatus.includes('Failed')
								? 'border border-red-200 bg-red-50 text-red-700'
								: 'border border-blue-200 bg-blue-50 text-blue-700'}"
					>
						{saveStatus}
					</div>
				{/if}
			</div>
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
					<div class="flex justify-between">
						<span class="text-gray-600">Presets:</span>
						<span class="font-medium text-gray-800">{presets.length}</span>
					</div>
				</div>
			</div>
		</div>
	</main>
</div>
