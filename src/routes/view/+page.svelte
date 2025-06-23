<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { io } from 'socket.io-client';
	import type { DisplayData } from '$lib/types';

	const socket = io();

	let displayText = $state('Connecting...');
	let textColor = $state('#ffffff');
	let backgroundColor = $state('#1f2937');
	let fontSize = $state(48);
	let textPosition = $state({ x: 0, y: 0 });
	let isPoweredOn = $state(false);
	let connectionStatus = $state('connecting');
	let reconnectAttempts = $state(0);
	let maxReconnectAttempts = 5;
	let textElement = $state<HTMLDivElement>();

	function connectWebSocket() {
		try {
			// Create WebSocket connection

			socket.on('connect', () => {
				console.log('WebSocket connected');
				connectionStatus = 'connected';
				reconnectAttempts = 0;
			});

			socket.on('text-update', (data: DisplayData) => {
				displayText = data.content;
				textColor = data.textColor;
				backgroundColor = data.backgroundColor;
				fontSize = data.fontSize || 48;
				textPosition = data.textPosition || { x: 0, y: 0 };
				isPoweredOn = data.isPoweredOn !== undefined ? data.isPoweredOn : true;
				console.log('textPosition', textPosition);
			});

			socket.on('toggle-power', (data: { isPoweredOn: boolean }) => {
				isPoweredOn = data.isPoweredOn;
			});

			socket.on('disconnect', () => {
				console.log('WebSocket disconnected');
				connectionStatus = 'disconnected';

				// Attempt to reconnect
				if (reconnectAttempts < maxReconnectAttempts) {
					reconnectAttempts++;
					setTimeout(() => {
						connectionStatus = 'reconnecting';
						connectWebSocket();
					}, 2000 * reconnectAttempts);
				} else {
					connectionStatus = 'failed';
				}
			});

			socket.on('error', (error) => {
				console.error('WebSocket error:', error);
				connectionStatus = 'error';
			});
		} catch (error) {
			console.error('Failed to create WebSocket connection:', error);
			connectionStatus = 'error';
		}
	}

	function loadInitialText() {
		// Load initial text from the server
		fetch('/api/text')
			.then((response) => response.json())
			.then((data) => {
				if (data.content) {
					displayText = data.content;
					textColor = data.textColor || '#ffffff';
					backgroundColor = data.backgroundColor || '#1f2937';
					fontSize = data.fontSize || 48;
					textPosition = data.textPosition || { x: 0, y: 0 };
					isPoweredOn = data.isPoweredOn !== undefined ? data.isPoweredOn : true;
				}
			})
			.catch((error) => {
				console.error('Failed to load initial text:', error);
				displayText = 'Failed to load content';
			});
	}

	// Calculate safe position that keeps text within bounds
	function getSafePosition() {
		if (!textElement) return { x: 50, y: 50 };

		const container = textElement.parentElement;
		if (!container) return { x: 50, y: 50 };

		const containerRect = container.getBoundingClientRect();
		const textRect = textElement.getBoundingClientRect();

		// Calculate the maximum position as percentage, accounting for centering
		// Since we use transform: translate(-50%, -50%), we need to consider
		// that the element extends 50% of its size in each direction from the position point
		const halfWidthPercent = (textRect.width / 2 / containerRect.width) * 100;
		const halfHeightPercent = (textRect.height / 2 / containerRect.height) * 100;

		const minX = halfWidthPercent;
		const maxX = 100 - halfWidthPercent;
		const minY = halfHeightPercent;
		const maxY = 100 - halfHeightPercent;

		// Convert textPosition (-50 to +50) to percentage (0 to 100)
		const targetX = textPosition.x + 50;
		const targetY = textPosition.y + 50;

		// Clamp to safe bounds
		const safeX = Math.max(minX, Math.min(maxX, targetX));
		const safeY = Math.max(minY, Math.min(maxY, targetY));

		return { x: safeX, y: safeY };
	}

	$effect(() => {
		// Reactive effect to update position when textPosition or text content changes
		if (textElement) {
			const safePos = getSafePosition();
			textElement.style.left = `${safePos.x}%`;
			textElement.style.top = `${safePos.y}%`;
		}
	});

	onMount(() => {
		loadInitialText();
		connectWebSocket();
	});

	onDestroy(() => {
		socket.disconnect();
	});

	function getStatusColor() {
		switch (connectionStatus) {
			case 'connected':
				return 'text-green-600';
			case 'connecting':
			case 'reconnecting':
				return 'text-yellow-600';
			case 'disconnected':
			case 'error':
			case 'failed':
				return 'text-red-600';
			default:
				return 'text-gray-600';
		}
	}

	function getStatusText() {
		switch (connectionStatus) {
			case 'connected':
				return 'Connected';
			case 'connecting':
				return 'Connecting...';
			case 'reconnecting':
				return `Reconnecting... (${reconnectAttempts}/${maxReconnectAttempts})`;
			case 'disconnected':
				return 'Disconnected';
			case 'error':
				return 'Connection Error';
			case 'failed':
				return 'Connection Failed';
			default:
				return 'Unknown';
		}
	}
</script>

<div class="flex min-h-screen flex-col bg-gray-900 text-white">
	<!-- Header -->
	<header class="border-b border-gray-700 bg-gray-800 p-4">
		<div class="mx-auto flex max-w-6xl items-center justify-between">
			<h1 class="text-xl font-semibold">Customer Display</h1>
			<div class="flex items-center gap-4">
				<div class="flex items-center gap-2">
					<div
						class="h-2 w-2 rounded-full {connectionStatus === 'connected'
							? 'bg-green-500'
							: connectionStatus === 'connecting' || connectionStatus === 'reconnecting'
								? 'bg-yellow-500'
								: 'bg-red-500'}"
					></div>
					<span class="text-sm {getStatusColor()}">{getStatusText()}</span>
				</div>
				<button onclick={() => goto('/')} class="text-gray-400 transition-colors hover:text-white">
					← Back
				</button>
			</div>
		</div>
	</header>

	<!-- Main Display Area -->
	<main class="relative flex-1 overflow-hidden">
		{#if isPoweredOn}
			<div
				bind:this={textElement}
				class="absolute"
				style="left: 50%; top: 50%; transform: translate(-50%, -50%);"
			>
				<div class="px-8 py-2 shadow-2xl" style="background-color: {backgroundColor};">
					<div
						class="leading-tight font-bold whitespace-nowrap"
						style="color: {textColor}; font-size: {fontSize}px;"
					>
						{displayText}
					</div>
				</div>
			</div>
		{/if}
	</main>
</div>
