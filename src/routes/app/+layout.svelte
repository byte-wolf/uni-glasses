<script>
	import WifiIcon from '@lucide/svelte/icons/wifi';
	import BatteryMediumIcon from '@lucide/svelte/icons/battery-medium';
</script>

<div class="bg-background flex h-screen w-screen flex-col justify-center p-4">
	<slot />

	<div
		class="text-primary flex items-center gap-4 rounded-3xl bg-white px-5 py-5 shadow-md shadow-neutral-300/50"
	>
		<div>
			<WifiIcon class="size-6" />
		</div>
		<div class="flex-1">
			<div class="text-lg leading-4 font-bold">UniGlasses Pro</div>
			<div>Connected, InfHS</div>
		</div>
		<div>
			<BatteryMediumIcon class="size-6" />
		</div>
	</div>
</div>
