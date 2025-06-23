import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

import { handler } from '../build/handler';

const port = 3000;
const app = express();
const server = createServer(app);

const io = new Server(server);

io.on('connection', (socket) => {
	socket.on('text-update', (data: any) => {
		io.emit('text-update', data);
	});

	socket.on('toggle-power', (data: any) => {
		io.emit('toggle-power', data);
	});
});

app.use(handler);

server.listen(port, () => {
	console.log(`Server is running on port ${port}`);
});
