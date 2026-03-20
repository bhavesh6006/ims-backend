let io = null;

const initSocket = (server) => {
    const { Server } = require('socket.io');

    // Allow origins from environment variable, fallback to localhost
    const allowedOrigins = process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
        : ['http://localhost:5173', 'http://localhost:3001'];

    io = new Server(server, {
        cors: {
            origin: allowedOrigins,
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        console.log(`[Socket.IO] Client connected: ${socket.id}`);

        // Client joins a work order room
        socket.on('join:workOrder', (workOrderId) => {
            if (workOrderId) {
                socket.join(`wo:${workOrderId}`);
                console.log(`[Socket.IO] ${socket.id} joined room wo:${workOrderId}`);
            }
        });

        // Client leaves a work order room
        socket.on('leave:workOrder', (workOrderId) => {
            if (workOrderId) {
                socket.leave(`wo:${workOrderId}`);
                console.log(`[Socket.IO] ${socket.id} left room wo:${workOrderId}`);
            }
        });

        socket.on('disconnect', () => {
            console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error('Socket.IO not initialized. Call initSocket(server) first.');
    }
    return io;
};

/**
 * Emit to specific work order rooms + broadcast globally for work order list refresh
 */
const emitToWorkOrders = (eventName, workOrderIds, data) => {
    if (!io) return;
    // Emit to each affected work order room
    for (const woId of workOrderIds) {
        io.to(`wo:${woId}`).emit(eventName, data);
    }
    // Also emit globally for work order list refresh (lightweight)
    io.emit(`${eventName}:listRefresh`, {
        affectedWorkOrderIds: workOrderIds,
        timestamp: data.timestamp
    });
};

module.exports = { initSocket, getIO, emitToWorkOrders };
