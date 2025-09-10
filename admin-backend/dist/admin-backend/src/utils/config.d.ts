export declare const config: {
    nodeEnv: string;
    port: number;
    database: {
        url: string;
        dialect: string;
    };
    pythonBot: {
        url: string;
        timeout: number;
        healthTimeout: number;
    };
    files: {
        faqDataPath: string;
        faqStuntingFile: string;
        faqPpidFile: string;
        botLogFile: string;
        backupPath: string;
    };
    jwt: {
        secret: string;
        expiry: string;
    };
    bcrypt: {
        rounds: number;
    };
    rateLimit: {
        requests: number;
        window: number;
    };
    upload: {
        maxFileSize: number;
        allowedTypes: string[];
    };
    logging: {
        level: string;
        file: string;
    };
    backup: {
        retentionDays: number;
        autoBackupInterval: number;
    };
    cors: {
        origin: string;
        credentials: boolean;
    };
    socket: {
        corsOrigin: string;
    };
    health: {
        checkInterval: number;
    };
    analytics: {
        retentionDays: number;
        popularQuestionsLimit: number;
    };
};
export declare function validateConfig(): void;
export declare function getAbsolutePath(relativePath: string): string;
export declare function getFaqFilePath(env: 'stunting' | 'ppid'): string;
export declare function getBotLogPath(): string;
export declare function getBackupPath(): string;
//# sourceMappingURL=config.d.ts.map