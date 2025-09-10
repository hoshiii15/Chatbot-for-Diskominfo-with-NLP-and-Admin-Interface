export declare class DatabaseService {
    initialize(): Promise<void>;
    close(): Promise<void>;
}
export declare class LogWatcherService {
    private socketService;
    constructor(socketService: any);
    initialize(): Promise<void>;
    stop(): Promise<void>;
}
export declare class HealthMonitorService {
    private socketService;
    constructor(socketService: any);
    initialize(): Promise<void>;
    stop(): Promise<void>;
}
//# sourceMappingURL=index.d.ts.map