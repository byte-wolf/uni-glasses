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

        socket.on('text-update', (data: DisplayData) => {
            io.emit('text-update', data);
        });
    });

    console.log('SocketIO injected');
}

export { webSocketServer };
