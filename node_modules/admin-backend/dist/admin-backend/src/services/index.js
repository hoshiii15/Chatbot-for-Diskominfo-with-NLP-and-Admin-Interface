"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthMonitorService = exports.LogWatcherService = exports.DatabaseService = void 0;
const models_1 = require("../models");
const seed_1 = require("../models/seed");
const logger_1 = require("../utils/logger");
const config_1 = require("../utils/config");
class DatabaseService {
    async initialize() {
        try {
            await (0, models_1.initializeDatabase)();
            if (config_1.config.nodeEnv === 'development') {
                try {
                    await (0, seed_1.seedDatabase)();
                }
                catch (seedErr) {
                    logger_1.logger.error('Database seed failed (dev-safe), continuing startup:', seedErr instanceof Error ? seedErr.message : seedErr);
                }
            }
            logger_1.logger.info('Database service initialized successfully');
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize database service:', error);
            throw error;
        }
    }
    async close() {
        try {
            await (0, models_1.closeDatabase)();
            logger_1.logger.info('Database service closed successfully');
        }
        catch (error) {
            logger_1.logger.error('Failed to close database service:', error);
            throw error;
        }
    }
}
exports.DatabaseService = DatabaseService;
class LogWatcherService {
    constructor(socketService) {
        this.socketService = socketService;
    }
    async initialize() {
    }
    async stop() {
    }
}
exports.LogWatcherService = LogWatcherService;
class HealthMonitorService {
    constructor(socketService) {
        this.socketService = socketService;
    }
    async initialize() {
    }
    async stop() {
    }
}
exports.HealthMonitorService = HealthMonitorService;
//# sourceMappingURL=index.js.map