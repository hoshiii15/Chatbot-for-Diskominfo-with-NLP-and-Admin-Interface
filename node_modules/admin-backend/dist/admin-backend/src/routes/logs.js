"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const logger_1 = require("../utils/logger");
const models_1 = require("../models");
const sequelize_1 = require("sequelize");
const router = (0, express_1.Router)();
router.get('/', async (req, res) => {
    try {
        const { environment, startDate, endDate, page = 1, limit = 50, sessionId, search } = req.query;
        const whereClause = {};
        if (environment && environment !== 'all') {
            whereClause.environment = environment;
        }
        if (startDate && endDate) {
            whereClause.createdAt = {
                [sequelize_1.Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }
        if (sessionId) {
            whereClause.sessionId = sessionId;
        }
        if (search) {
            whereClause[sequelize_1.Op.or] = [
                { question: { [sequelize_1.Op.like]: `%${search}%` } },
                { answer: { [sequelize_1.Op.like]: `%${search}%` } }
            ];
        }
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const { count, rows: logs } = await models_1.ChatLog.findAndCountAll({
            where: whereClause,
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset
        });
        res.json({
            success: true,
            data: {
                logs,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: count,
                    totalPages: Math.ceil(count / parseInt(limit))
                }
            },
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        logger_1.logger.error('Error getting chat logs:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get chat logs',
            timestamp: new Date().toISOString(),
        });
    }
});
router.get('/stats', async (req, res) => {
    try {
        const { environment } = req.query;
        const envFilter = environment && environment !== 'all' ? { environment: environment } : {};
        const totalLogs = await models_1.ChatLog.count({
            where: envFilter
        });
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const recentLogs = await models_1.ChatLog.count({
            where: {
                ...envFilter,
                createdAt: {
                    [sequelize_1.Op.gte]: yesterday
                }
            }
        });
        const uniqueSessions = await models_1.ChatLog.count({
            where: envFilter,
            distinct: true,
            col: 'sessionId'
        });
        res.json({
            success: true,
            data: {
                totalLogs,
                recentLogs,
                uniqueSessions
            },
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        logger_1.logger.error('Error getting chat log stats:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get chat log stats',
            timestamp: new Date().toISOString(),
        });
    }
});
exports.default = router;
//# sourceMappingURL=logs.js.map