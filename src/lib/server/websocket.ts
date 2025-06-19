import type { ViteDevServer } from 'vite';
import { Server, type Socket } from 'socket.io';

let io: Server;

const webSocketServer = {
    name: 'webSocketServer',
    configureServer(server: ViteDevServer) {
        if (!server.httpServer) return;

        io = new Server(server.httpServer);

        io.on('connection', (socket) => {
            console.log('user connected');
            // Send initial text
            broadcastText(socket);

            socket.on('disconnect', () => {
                console.log('user disconnected');
            });
        });
    }
};

export { webSocketServer, broadcastText };
