import tailwindcss from '@tailwindcss/vite';
import devtoolsJson from 'vite-plugin-devtools-json';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { webSocketServer } from './src/lib/server/websocket';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit(), devtoolsJson(), webSocketServer]
});
