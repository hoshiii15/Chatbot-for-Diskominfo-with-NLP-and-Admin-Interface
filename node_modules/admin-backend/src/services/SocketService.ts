import { Server as SocketIOServer } from 'socket.io';
import { logger } from '../utils/logger';

export class SocketService {
  private io: SocketIOServer;
  private connectedClients: Set<string> = new Set();

  constructor(io: SocketIOServer) {
    this.io = io;
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      this.connectedClients.add(socket.id);
      
      logger.info(`Socket client connected: ${socket.id}`);
      
      // Send welcome message
      socket.emit('connected', {
        message: 'Connected to FAQ Admin Dashboard',
        timestamp: new Date().toISOString(),
      });

      // Handle authentication
      socket.on('authenticate', (data) => {
        // TODO: Implement socket authentication
        logger.info(`Socket authentication attempt: ${socket.id}`);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        this.connectedClients.delete(socket.id);
        logger.info(`Socket client disconnected: ${socket.id}`);
      });
    });
  }

  /**
   * Broadcast new chat interaction to all connected clients
   */
  broadcastNewChat(data: any): void {
    this.io.emit('new_chat', {
      type: 'new_question',
      data,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Broadcast system status update
   */
  broadcastSystemStatus(status: any): void {
    this.io.emit('system_status', {
      type: 'system_status',
      data: status,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Broadcast FAQ update
   */
  broadcastFAQUpdate(env: string, operation: string, faq: any): void {
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

  /**
   * Get number of connected clients
   */
  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  /**
   * Send message to specific socket
   */
  sendToSocket(socketId: string, event: string, data: any): void {
    this.io.to(socketId).emit(event, data);
  }

  /**
   * Broadcast to all connected clients
   */
  broadcast(event: string, data: any): void {
    this.io.emit(event, data);
  }
}
