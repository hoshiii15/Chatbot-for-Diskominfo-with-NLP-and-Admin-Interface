import express from 'express';
import { Server as SocketIOServer } from 'socket.io';
declare class App {
    app: express.Application;
    server: any;
    io: SocketIOServer;
    private databaseService;
    private logWatcherService;
    private healthMonitorService;
    private socketService;
    constructor();
    private setupSocket;
    private initializeServices;
    private setupMiddleware;
    private setupRoutes;
    private setupErrorHandling;
    private shutdown;
    start(): void;
}
declare const app: App;
export default app;
//# sourceMappingURL=app.d.ts.map