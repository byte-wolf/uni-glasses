import type { HttpServer, ViteDevServer } from 'vite';
import { Server, type Socket } from 'socket.io';
import type { DisplayData } from '$lib/types';

const webSocketServer = {
	name: 'webSocketServer',
	configureServer(server: ViteDevServer) {
		injectSocketIO(server.httpServer);
	}
};

function injectSocketIO(server: HttpServer | null) {
	if (!server) return;

	const io = new Server(server);

	io.on('connection', (socket) => {
		// Note: Power state sync is now handled by the admin/view screens
		// fetching current state from the database via the API endpoints

		socket.on('text-update', (data: DisplayData) => {
			io.emit('text-update', data);
		});

		socket.on('toggle-power', (data: { isPoweredOn: boolean }) => {
			io.emit('toggle-power', data);
		});

		socket.on('reset-power', (data: { isPoweredOn: boolean }) => {
			io.emit('reset-power', data);
		});
	});

	console.log('SocketIO injected');
}

export { webSocketServer };
