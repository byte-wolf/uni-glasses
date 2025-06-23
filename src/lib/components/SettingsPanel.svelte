<script lang="ts">
	import type { PresetResponse } from '$lib/types';
	import Axis3d from '@lucide/svelte/icons/axis-3d';
	import Button from './Button.svelte';

	interface Props {
		preset: PresetResponse | null;
		onSave: (data: {
			name: string;
			textColor: string;
			backgroundColor: string;
			fontSize: number;
		}) => void;
		onCancel?: () => void;
	}

	let { preset, onSave, onCancel }: Props = $props();

	let name = $state(preset?.name || '');
	let textColor = $state(preset?.textColor || '#ffffff');
	let backgroundColor = $state(preset?.backgroundColor || '#1f2937');
	let fontSize = $state(preset?.fontSize || 48);

	$effect(() => {
		if (preset) {
			name = preset.name;
			textColor = preset.textColor;
			backgroundColor = preset.backgroundColor;
			fontSize = preset.fontSize || 48;
		}
	});

	function handleSave() {
		if (name.trim()) {
			onSave({
				name: name.trim(),
				textColor,
				backgroundColor,
				fontSize
			});
		}
	}

	function handleCancel() {
		if (preset) {
			name = preset.name;
			textColor = preset.textColor;
			backgroundColor = preset.backgroundColor;
			fontSize = preset.fontSize || 48;
		}
		onCancel?.();
	}
</script>

<div class="space-y-6">
	<div>
		<!-- 		<h2 class="text-primary-text mb-2 text-xl leading-5 font-semibold">Display Settings</h2>
 -->
		<div class="text-primary-text text-lg">Customize the appearance of your preset</div>
	</div>

	{#if preset}
		<div class="space-y-4">
			<!-- Preset Name -->
			<!-- <div>
				<label for="presetName" class="text-primary-text mb-2 block text-sm font-medium">
					Preset Name
				</label>
				<input
					id="presetName"
					type="text"
					bind:value={name}
					placeholder="Enter preset name..."
					class="border-primary/20 bg-background text-primary-text placeholder:text-primary-text/50 focus:border-primary focus:ring-primary/20 w-full rounded-xl border px-4 py-3 focus:ring-2"
				/>
			</div> -->

			<!-- Color Controls -->
			<label for="hiddenTextColor" class="text-primary-text mb-2 block text-sm font-medium">
				Text Color
			</label>
			<div class="relative">
				<Button
					variant="tertiary"
					class="flex w-full items-center gap-4"
					onclick={() => document.getElementById('hiddenTextColor')?.click()}
				>
					<div
						class="border-background-secondary/40 size-8 rounded-xl border-2"
						style="background-color: {textColor};"
					></div>
					<div>Press here to change text color</div>
				</Button>

				<input
					id="hiddenTextColor"
					type="color"
					bind:value={textColor}
					class="pointer-events-none absolute bottom-0 opacity-0"
				/>
			</div>

			<label for="hiddenBackgroundColor" class="text-primary-text mb-2 block text-sm font-medium">
				Background Color
			</label>
			<div class="relative">
				<Button
					variant="tertiary"
					class="flex w-full items-center gap-4"
					onclick={() => document.getElementById('hiddenBackgroundColor')?.click()}
				>
					<div
						class="border-background-secondary/40 size-8 rounded-xl border-2"
						style="background-color: {backgroundColor};"
					></div>
					<div>Press here to change background color</div>
				</Button>

				<input
					id="hiddenBackgroundColor"
					type="color"
					bind:value={backgroundColor}
					class="pointer-events-none absolute bottom-0 opacity-0"
				/>
			</div>

			<!-- Font Size Control -->
			<div>
				<label for="fontSize" class="text-primary-text mb-2 block text-sm font-medium">
					Font Size
				</label>
				<input
					id="fontSize"
					type="range"
					min="16"
					max="120"
					step="2"
					bind:value={fontSize}
					class="w-full cursor-pointer"
				/>
				<div class="text-primary-text/50 flex justify-between text-xs">
					<span>16px</span>
					<span class="font-medium">{fontSize}px</span>
					<span>120px</span>
				</div>
			</div>

			<!-- Preview -->
			<!-- <div>
				<div class="text-primary-text mb-2 block text-sm font-medium">Preview</div>
				<div
					class="border-primary/20 relative overflow-hidden rounded-lg border"
					style="background-color: {backgroundColor}; height: 120px;"
				>
					<div
						class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform font-semibold whitespace-nowrap"
						style="color: {textColor}; font-size: {fontSize / 2}px;"
					>
						Sample text preview
					</div>
				</div>
			</div> -->

			<a href="/app/settings/positional" class="w-full">
				<Button variant="tertiary" class="w-full">
					<div class="flex items-center gap-4">
						<Axis3d class="size-5" />
						Configure Text Position
					</div>
				</Button>
			</a>

			<!-- Action Buttons -->
			<div class="flex gap-3 pt-4">
				<Button variant="primary" class="flex-1" onclick={handleSave} disabled={!name.trim()}>
					Save Settings
				</Button>
				{#if onCancel}
					<Button variant="secondary" onclick={handleCancel}>Reset</Button>
				{/if}
			</div>
		</div>
	{:else}
		<div class="text-primary-text/70 py-8 text-center">
			No preset selected. Please select a preset to edit its settings.
		</div>
	{/if}
</div>
