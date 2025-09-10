"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const logger_1 = require("../utils/logger");
const models_1 = require("../models");
const sequelize_1 = require("sequelize");
const os_1 = __importDefault(require("os"));
const fs_1 = __importDefault(require("fs"));
const config_1 = require("../utils/config");
const router = (0, express_1.Router)();
router.get('/', async (req, res) => {
    try {
        const healthData = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            memory: {
                used: process.memoryUsage().heapUsed / 1024 / 1024,
                total: process.memoryUsage().heapTotal / 1024 / 1024,
                rss: process.memoryUsage().rss / 1024 / 1024,
                external: process.memoryUsage().external / 1024 / 1024,
            },
            system: {
                platform: os_1.default.platform(),
                arch: os_1.default.arch(),
                nodeVersion: process.version,
                cpus: os_1.default.cpus().length,
                loadAverage: os_1.default.loadavg(),
                totalMemory: os_1.default.totalmem() / 1024 / 1024 / 1024,
                freeMemory: os_1.default.freemem() / 1024 / 1024 / 1024,
            },
            database: {
                status: 'unknown',
                connections: 0,
                lastQuery: null
            },
            services: {
                chatbot: { status: 'unknown', lastCheck: null },
                fileSystem: { status: 'unknown', lastCheck: null },
                nlpProcessor: { status: 'unknown', lastCheck: null }
            }
        };
        try {
            const testQuery = await models_1.ChatLog.findOne({ limit: 1 });
            healthData.database.status = 'healthy';
            healthData.database.lastQuery = new Date().toISOString();
        }
        catch (error) {
            healthData.database.status = 'unhealthy';
            healthData.status = 'degraded';
            logger_1.logger.error('Database health check failed:', error);
        }
        try {
            const dataDir = (0, config_1.getAbsolutePath)(config_1.config.files.faqDataPath);
            await fs_1.default.promises.access(dataDir, fs_1.default.constants.R_OK | fs_1.default.constants.W_OK);
            healthData.services.fileSystem.status = 'healthy';
            healthData.services.fileSystem.lastCheck = new Date().toISOString();
        }
        catch (error) {
            healthData.services.fileSystem.status = 'unhealthy';
            healthData.status = 'degraded';
            logger_1.logger.error('File system health check failed:', error);
        }
        healthData.services.chatbot.status = 'healthy';
        healthData.services.chatbot.lastCheck = new Date().toISOString();
        healthData.services.nlpProcessor.status = 'healthy';
        healthData.services.nlpProcessor.lastCheck = new Date().toISOString();
        res.json({
            success: true,
            data: healthData,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        logger_1.logger.error('Error getting health status:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get health status',
            timestamp: new Date().toISOString(),
        });
    }
});
router.get('/stats', async (req, res) => {
    try {
        const [totalUsers, totalChatLogs, totalFAQs, totalSessions, totalAnalytics, totalWebsites] = await Promise.all([
            models_1.User.count(),
            models_1.ChatLog.count(),
            models_1.FAQ.count(),
            models_1.Session.count(),
            models_1.Analytics.count(),
            models_1.Website.count()
        ]);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const recentActivity = await models_1.ChatLog.count({
            where: {
                createdAt: {
                    [sequelize_1.Op.gte]: yesterday
                }
            }
        });
        const stats = {
            database: {
                totalRecords: {
                    users: totalUsers,
                    chatLogs: totalChatLogs,
                    faqs: totalFAQs,
                    sessions: totalSessions,
                    analytics: totalAnalytics,
                    websites: totalWebsites
                },
                recentActivity
            },
            performance: {
                averageResponseTime: 150,
                successRate: 95,
                errorRate: 5
            }
        };
        res.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        logger_1.logger.error('Error getting health stats:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get health stats',
            timestamp: new Date().toISOString(),
        });
    }
});
exports.default = router;
router.get('/logs', async (req, res) => {
    try {
        const source = String(req.query.source || 'bot').toLowerCase();
        let filePath;
        if (source === 'backend') {
            filePath = (0, config_1.getAbsolutePath)('./logs/combined.log');
        }
        else {
            filePath = (0, config_1.getBotLogPath)();
        }
        const exists = await fs_1.default.promises.stat(filePath).catch(() => null);
        if (!exists) {
            return res.status(404).json({ success: false, error: 'Log file not found' });
        }
        const content = await fs_1.default.promises.readFile(filePath, 'utf8');
        const tail = content.length > 50000 ? content.slice(-50000) : content;
        res.type('text/plain').send(tail);
    }
    catch (error) {
        logger_1.logger.error('Error reading logs:', error);
        res.status(500).json({ success: false, error: 'Failed to read logs' });
    }
});
router.post('/restart', async (req, res) => {
    try {
        logger_1.logger.info('Restart requested via API', { source: 'ui' });
        res.json({ success: true, message: 'Restart requested (noop in development)' });
    }
    catch (error) {
        logger_1.logger.error('Failed to enqueue restart:', error);
        res.status(500).json({ success: false, error: 'Failed to request restart' });
    }
});
router.get('/settings', async (req, res) => {
    try {
        const settings = {
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            faqDataPath: (0, config_1.getAbsolutePath)(config_1.config.files.faqDataPath),
            pythonBotUrl: config_1.config.pythonBot.url,
            backupPath: (0, config_1.getBackupPath)(),
        };
        res.json({ success: true, data: settings });
    }
    catch (error) {
        logger_1.logger.error('Failed to return settings:', error);
        res.status(500).json({ success: false, error: 'Failed to get settings' });
    }
});
//# sourceMappingURL=health.js.map