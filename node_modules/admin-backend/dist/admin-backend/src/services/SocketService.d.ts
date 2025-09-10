import { Server as SocketIOServer } from 'socket.io';
export declare class SocketService {
    private io;
    private connectedClients;
    constructor(io: SocketIOServer);
    private setupEventHandlers;
    broadcastNewChat(data: any): void;
    broadcastSystemStatus(status: any): void;
    broadcastFAQUpdate(env: string, operation: string, faq: any): void;
    getConnectedClientsCount(): number;
    sendToSocket(socketId: string, event: string, data: any): void;
    broadcast(event: string, data: any): void;
}
//# sourceMappingURL=SocketService.d.ts.map