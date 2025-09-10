"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketService = void 0;
const logger_1 = require("../utils/logger");
class SocketService {
    constructor(io) {
        this.connectedClients = new Set();
        this.io = io;
        this.setupEventHandlers();
    }
    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            this.connectedClients.add(socket.id);
            logger_1.logger.info(`Socket client connected: ${socket.id}`);
            socket.emit('connected', {
                message: 'Connected to FAQ Admin Dashboard',
                timestamp: new Date().toISOString(),
            });
            socket.on('authenticate', (data) => {
                logger_1.logger.info(`Socket authentication attempt: ${socket.id}`);
            });
            socket.on('disconnect', () => {
                this.connectedClients.delete(socket.id);
                logger_1.logger.info(`Socket client disconnected: ${socket.id}`);
            });
        });
    }
    broadcastNewChat(data) {
        this.io.emit('new_chat', {
            type: 'new_question',
            data,
            timestamp: new Date().toISOString(),
        });
    }
    broadcastSystemStatus(status) {
        this.io.emit('system_status', {
            type: 'system_status',
            data: status,
            timestamp: new Date().toISOString(),
        });
    }
    broadcastFAQUpdate(env, operation, faq) {
        this.io.emit('faq_updated', {
            type: 'faq_updated',
            data: {
                env,
                operation,
                faq,
            },
            timestamp: new Date().toISOString(),
        });
    }
    getConnectedClientsCount() {
        return this.connectedClients.size;
    }
    sendToSocket(socketId, event, data) {
        this.io.to(socketId).emit(event, data);
    }
    broadcast(event, data) {
        this.io.emit(event, data);
    }
}
exports.SocketService = SocketService;
//# sourceMappingURL=SocketService.js.map