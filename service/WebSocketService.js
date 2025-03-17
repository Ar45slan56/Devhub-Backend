class WebSocketService {
    constructor() {
        this.io = null;
        this.connections = new Map();
    }

    /**
     * Initialize WebSocket server
     * @param {Object} server - HTTP server instance
     */
    initialize(server) {
        const io = require('socket.io')(server, {
            cors: {
                origin: process.env.CLIENT_URL || 'http://localhost:3000',
                methods: ['GET', 'POST'],
                credentials: true
            }
        });

        this.io = io;

        io.on('connection', (socket) => {
            console.log(`New client connected: ${socket.id}`);

            // Handle user authentication
            socket.on('authenticate', (userData) => {
                if (userData && userData.userId) {
                    this.connections.set(userData.userId, socket.id);
                    socket.userId = userData.userId;
                    socket.join(`user:${userData.userId}`);
                    console.log(`User ${userData.userId} authenticated`);
                }
            });

            // Handle disconnection
            socket.on('disconnect', () => {
                if (socket.userId) {
                    this.connections.delete(socket.userId);
                    console.log(`User ${socket.userId} disconnected`);
                }
                console.log(`Client disconnected: ${socket.id}`);
            });
        });

        return io;
    }

    /**
     * Send notification to specific user
     * @param {string} userId - User ID
     * @param {Object} notification - Notification data
     */
    sendNotification(userId, notification) {
        if (this.io && userId) {
            this.io.to(`user:${userId}`).emit('notification', notification);
        }
    }

    /**
     * Broadcast message to all connected clients
     * @param {string} event - Event name
     * @param {Object} data - Event data
     */
    broadcast(event, data) {
        if (this.io) {
            this.io.emit(event, data);
        }
    }

    /**
     * Check if user is online
     * @param {string} userId - User ID
     * @returns {boolean} True if user is online
     */
    isUserOnline(userId) {
        return this.connections.has(userId);
    }
}

module.exports = new WebSocketService(); 