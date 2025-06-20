<script lang="ts">
	import type { PresetResponse } from '$lib/types';
	import Button from './Button.svelte';

	interface Props {
		presets: PresetResponse[];
		activePreset: PresetResponse | null;
		onPresetSelect: (preset: PresetResponse) => void;
	}

	let { presets, activePreset, onPresetSelect }: Props = $props();
</script>

<div class="space-y-4">
	<div class="text-primary-text text-lg font-semibold">Change text settings</div>

	<div class="space-y-3">
		{#each presets as preset (preset.id)}
			<button
				class="bg-background-secondary hover:bg-background-secondary/80 w-full rounded-2xl p-4 text-left transition-all {activePreset?.id ===
				preset.id
					? 'ring-primary ring-2'
					: ''}"
				onclick={() => onPresetSelect(preset)}
			>
				<div class="flex items-center justify-between">
					<div>
						<div class="text-primary-text font-semibold">{preset.name}</div>
						<div class="mt-1 flex items-center gap-2">
							<div class="text-primary-text/70 flex items-center gap-1 text-sm">
								<div
									class="border-primary-text/30 h-3 w-3 rounded-full border"
									style="background-color: {preset.textColor};"
								></div>
								Text
							</div>
							<div class="text-primary-text/70 flex items-center gap-1 text-sm">
								<div
									class="border-primary-text/30 h-3 w-3 rounded-full border"
									style="background-color: {preset.backgroundColor};"
								></div>
								Background
							</div>
						</div>
					</div>
					{#if activePreset?.id === preset.id}
						<div class="bg-primary rounded-full px-2 py-1 text-xs text-white">Active</div>
					{/if}
				</div>
			</button>
		{/each}
	</div>

	{#if presets.length === 0}
		<div class="text-primary-text/70 py-8 text-center">No presets available</div>
	{/if}
</div>
