const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const { getPool } = require('./config/db');
const { initChatSockets } = require('./sockets/chatSocket');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
    }
});

app.set('io', io);

initChatSockets(io);

// Connect to Database and start server
async function startServer() {
    try {
        await getPool();
        server.listen(PORT, '0.0.0.0', () => {
            console.log(`====================================================`);
            console.log(` Astrologer Platform API Server running on port ${PORT}`);
            console.log(` URL: http://127.0.0.1:${PORT}`);
            console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(` Upload Proxy: ${process.env.UPLOAD_SERVICE_URL}`);
            console.log(` Socket.IO: initialized`);
            console.log(`====================================================`);
        });
    } catch (err) {
        console.error('Fatal error starting server:', err);
        process.exit(1);
    }
}

startServer();
