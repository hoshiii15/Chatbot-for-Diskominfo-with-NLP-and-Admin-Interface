"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const logger_1 = require("../utils/logger");
const models_1 = require("../models");
const sequelize_1 = require("sequelize");
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const router = (0, express_1.Router)();
router.get('/stats', async (req, res) => {
    try {
        const [totalQuestions, totalFAQs, totalSessions, totalUsers] = await Promise.all([
            models_1.ChatLog.count(),
            models_1.FAQ.count(),
            models_1.Session.count(),
            models_1.User.count()
        ]);
        const repoRoot = path_1.default.resolve(__dirname, '../../../');
        const stuntingPath = path_1.default.join(repoRoot, 'python-bot', 'data', 'faq_stunting.json');
        const ppidPath = path_1.default.join(repoRoot, 'python-bot', 'data', 'faq_ppid.json');
        let fileFaqs = [];
        try {
            const stRaw = await fs_1.promises.readFile(stuntingPath, 'utf-8');
            const stJson = JSON.parse(stRaw);
            if (stJson && Array.isArray(stJson.faqs))
                fileFaqs = fileFaqs.concat(stJson.faqs);
        }
        catch (e) {
        }
        try {
            const pRaw = await fs_1.promises.readFile(ppidPath, 'utf-8');
            const pJson = JSON.parse(pRaw);
            if (Array.isArray(pJson))
                fileFaqs = fileFaqs.concat(pJson);
        }
        catch (e) {
        }
        const effectiveTotalFAQs = fileFaqs.length > 0 ? fileFaqs.length : totalFAQs;
        let effectiveTotalQuestions = 0;
        if (fileFaqs.length > 0) {
            effectiveTotalQuestions = fileFaqs.reduce((sum, f) => {
                if (Array.isArray(f.questions))
                    return sum + f.questions.length;
                if (typeof f.question === 'string' && f.question.trim().length > 0)
                    return sum + 1;
                return sum;
            }, 0);
        }
        else {
            effectiveTotalQuestions = totalQuestions;
        }
        const activeSessions = await models_1.Session.count({ where: { isActive: true } });
        let systemHealth = 'Healthy';
        try {
            await models_1.ChatLog.findOne({ limit: 1 });
        }
        catch (error) {
            systemHealth = 'Unhealthy';
            logger_1.logger.error('Database health check failed:', error);
        }
        const stats = {
            totalQuestions: effectiveTotalQuestions,
            totalFAQs: effectiveTotalFAQs,
            activeUsers: activeSessions,
            systemHealth,
            totalSessions,
            totalUsers
        };
        res.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        logger_1.logger.error('Error getting dashboard stats:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get dashboard stats',
            timestamp: new Date().toISOString(),
        });
    }
});
router.get('/overview', async (req, res) => {
    try {
        const [totalQuestions, totalFAQs, totalSessions, totalUsers, totalAnalytics] = await Promise.all([
            models_1.ChatLog.count(),
            models_1.FAQ.count(),
            models_1.Session.count(),
            models_1.User.count(),
            models_1.Analytics.count()
        ]);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentQuestions = await models_1.ChatLog.count({
            where: {
                createdAt: {
                    [sequelize_1.Op.gte]: sevenDaysAgo
                }
            }
        });
        const envDistribution = await models_1.ChatLog.findAll({
            attributes: [
                'environment',
                [models_1.ChatLog.sequelize.fn('COUNT', models_1.ChatLog.sequelize.col('id')), 'count']
            ],
            group: ['environment'],
            raw: true
        });
        const topCategories = await models_1.ChatLog.findAll({
            attributes: [
                'category',
                [models_1.ChatLog.sequelize.fn('COUNT', models_1.ChatLog.sequelize.col('id')), 'count']
            ],
            where: {
                category: {
                    [sequelize_1.Op.ne]: ''
                }
            },
            group: ['category'],
            order: [[models_1.ChatLog.sequelize.fn('COUNT', models_1.ChatLog.sequelize.col('id')), 'DESC']],
            limit: 5,
            raw: true
        });
        const overview = {
            stats: {
                totalQuestions,
                totalFAQs,
                totalSessions,
                totalUsers,
                totalAnalytics,
                recentQuestions
            },
            distributions: {
                environment: envDistribution,
                categories: topCategories
            },
            systemHealth: {
                status: 'healthy',
                uptime: process.uptime(),
                memory: process.memoryUsage()
            }
        };
        res.json({
            success: true,
            data: overview,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        logger_1.logger.error('Error getting dashboard overview:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get dashboard overview',
            timestamp: new Date().toISOString(),
        });
    }
});
exports.default = router;
//# sourceMappingURL=dashboard.js.map