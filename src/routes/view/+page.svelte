<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { io } from 'socket.io-client';
	import type { DisplayData } from '$lib/types';

	const socket = io();

	let displayText = $state('Connecting...');
	let textColor = $state('#ffffff');
	let backgroundColor = $state('#1f2937');
	let connectionStatus = $state('connecting');
	let reconnectAttempts = $state(0);
	let maxReconnectAttempts = 5;

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
				}
			})
			.catch((error) => {
				console.error('Failed to load initial text:', error);
				displayText = 'Failed to load content';
			});
	}

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
	<main class="flex flex-1 items-center justify-center p-8">
		<div class="max-w-4xl text-center">
			<div class="px-8 py-2 shadow-2xl" style="background-color: {backgroundColor};">
				<div
					class="text-4xl leading-tight font-bold md:text-6xl lg:text-7xl"
					style="color: {textColor};"
				>
					{displayText}
				</div>
			</div>
		</div>
	</main>

	<!-- Footer -->
	<footer class="border-t border-gray-700 bg-gray-800 p-4">
		<div class="mx-auto max-w-6xl text-center text-sm text-gray-400">
			Displaying real-time content • Updates automatically when changed by administrators
		</div>
	</footer>
</div>
