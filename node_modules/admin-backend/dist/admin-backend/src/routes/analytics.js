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
async function readFileFaqsRaw(env) {
    try {
        const repoRoot = path_1.default.resolve(__dirname, '../../../');
        const p = env === 'stunting' ? path_1.default.join(repoRoot, 'python-bot', 'data', 'faq_stunting.json') : path_1.default.join(repoRoot, 'python-bot', 'data', 'faq_ppid.json');
        const raw = await fs_1.promises.readFile(p, 'utf-8');
        const parsed = JSON.parse(raw);
        if (env === 'stunting')
            return Array.isArray(parsed.faqs) ? parsed.faqs : [];
        return Array.isArray(parsed) ? parsed : [];
    }
    catch (e) {
        return [];
    }
}
const router = (0, express_1.Router)();
router.get('/', async (req, res) => {
    try {
        const { startDate, endDate, environment } = req.query;
        const whereClause = {};
        if (startDate && endDate) {
            whereClause.date = {
                [sequelize_1.Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }
        if (environment && environment !== 'all') {
            whereClause.environment = environment;
        }
        const analytics = await models_1.Analytics.findAll({ where: whereClause, order: [['date', 'DESC']], limit: 100, raw: true });
        const chatWhere = {};
        if (environment && environment !== 'all')
            chatWhere.environment = environment;
        if (startDate && endDate) {
            chatWhere.createdAt = {
                [sequelize_1.Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }
        const totalInteractions = await models_1.ChatLog.count({ where: chatWhere });
        const sessionWhere = {};
        if (environment && environment !== 'all')
            sessionWhere.environment = environment;
        if (startDate && endDate) {
            sessionWhere.startTime = {
                [sequelize_1.Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }
        const totalSessions = await models_1.Session.count({ where: sessionWhere });
        const avgRes = await models_1.ChatLog.findAll({ attributes: [[models_1.ChatLog.sequelize.fn('AVG', models_1.ChatLog.sequelize.col('confidence')), 'avgConfidence']], where: chatWhere, raw: true });
        const averageConfidence = avgRes && avgRes[0] && (Number(avgRes[0].avgConfidence) || 0);
        const popular = await models_1.ChatLog.findAll({
            attributes: [
                'question',
                [models_1.ChatLog.sequelize.fn('COUNT', models_1.ChatLog.sequelize.col('id')), 'count'],
                [models_1.ChatLog.sequelize.fn('AVG', models_1.ChatLog.sequelize.col('confidence')), 'avg_confidence']
            ],
            where: chatWhere,
            group: ['question'],
            order: [[models_1.ChatLog.sequelize.fn('COUNT', models_1.ChatLog.sequelize.col('id')), 'DESC']],
            limit: 10,
            raw: true
        });
        const popular_questions = (popular || []).map((p) => ({ question: p.question, count: Number(p.count), avg_confidence: Number(p.avg_confidence || 0) }));
        const categories = await models_1.ChatLog.findAll({
            attributes: [
                'category',
                [models_1.ChatLog.sequelize.fn('COUNT', models_1.ChatLog.sequelize.col('id')), 'count']
            ],
            where: { ...chatWhere, category: { [sequelize_1.Op.ne]: '' } },
            group: ['category'],
            raw: true
        });
        const totalForPercent = totalInteractions || 1;
        const category_distribution = (categories || []).map((c) => ({ category: c.category, count: Number(c.count), percentage: Math.round((Number(c.count) / totalForPercent) * 100) }));
        const buckets = [0, 0.2, 0.4, 0.6, 0.8, 1.0];
        const confidence_distribution = [];
        for (let i = 0; i < buckets.length - 1; i++) {
            const low = buckets[i];
            const high = buckets[i + 1];
            const whereForBucket = { ...chatWhere };
            if (i < buckets.length - 2) {
                whereForBucket.confidence = { [sequelize_1.Op.gte]: low, [sequelize_1.Op.lt]: high };
            }
            else {
                whereForBucket.confidence = { [sequelize_1.Op.gte]: low, [sequelize_1.Op.lte]: high };
            }
            const cnt = await models_1.ChatLog.count({ where: whereForBucket });
            confidence_distribution.push({ range: `${(low * 100).toFixed(0)}-${(high * 100).toFixed(0)}%`, count: cnt, percentage: Math.round((cnt / totalForPercent) * 100) });
        }
        let daily_stats = [];
        if (analytics && analytics.length > 0) {
            daily_stats = analytics.map((a) => ({ date: a.date, questions: a.totalQuestions || 0, avg_confidence: a.averageConfidence || 0 }));
        }
        else {
            const daily = await models_1.ChatLog.findAll({
                attributes: [[models_1.ChatLog.sequelize.fn('DATE', models_1.ChatLog.sequelize.col('createdAt')), 'date'], [models_1.ChatLog.sequelize.fn('COUNT', models_1.ChatLog.sequelize.col('id')), 'questions'], [models_1.ChatLog.sequelize.fn('AVG', models_1.ChatLog.sequelize.col('confidence')), 'avg_confidence']],
                where: chatWhere,
                group: [models_1.ChatLog.sequelize.fn('DATE', models_1.ChatLog.sequelize.col('createdAt'))],
                order: [[models_1.ChatLog.sequelize.fn('DATE', models_1.ChatLog.sequelize.col('createdAt')), 'DESC']],
                raw: true
            });
            daily_stats = (daily || []).map((d) => ({ date: d.date, questions: Number(d.questions || 0), avg_confidence: Number(d.avg_confidence || 0) }));
        }
        const envDist = await models_1.ChatLog.findAll({ attributes: ['environment', [models_1.ChatLog.sequelize.fn('COUNT', models_1.ChatLog.sequelize.col('id')), 'count']], where: chatWhere, group: ['environment'], raw: true });
        const env_distribution = (envDist || []).map((e) => ({ env: e.environment, count: Number(e.count), percentage: Math.round((Number(e.count) / totalForPercent) * 100) }));
        res.json({
            success: true,
            data: {
                total_questions: totalInteractions,
                total_sessions: totalSessions,
                average_confidence: averageConfidence,
                popular_questions,
                category_distribution,
                confidence_distribution,
                daily_stats,
                env_distribution
            },
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        logger_1.logger.error('Error getting analytics:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get analytics',
            timestamp: new Date().toISOString(),
        });
    }
});
router.get('/overview', async (req, res) => {
    try {
        const { environment } = req.query;
        const environmentFilter = environment && environment !== 'all' ? { environment: environment } : {};
        const totalUsers = await models_1.Session.count();
        const totalInteractions = await models_1.ChatLog.count({
            where: environmentFilter
        });
        let totalFAQs = 0;
        try {
            const stuntingFile = await readFileFaqsRaw('stunting');
            const ppidFile = await readFileFaqsRaw('ppid');
            if (stuntingFile.length > 0 || ppidFile.length > 0) {
                totalFAQs = (environment && environment !== 'all')
                    ? (environment === 'stunting' ? stuntingFile.length : ppidFile.length)
                    : (stuntingFile.length + ppidFile.length);
            }
            else {
                totalFAQs = await models_1.FAQ.count({ where: environmentFilter });
            }
        }
        catch (e) {
            totalFAQs = await models_1.FAQ.count({ where: environmentFilter });
        }
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentActivity = await models_1.Analytics.findAll({
            where: {
                date: {
                    [sequelize_1.Op.gte]: sevenDaysAgo
                },
                ...environmentFilter
            },
            order: [['date', 'ASC']]
        });
        const topFAQs = await models_1.FAQ.findAll({
            where: environmentFilter,
            order: [['views', 'DESC']],
            limit: 5
        });
        res.json({
            success: true,
            data: {
                metrics: {
                    totalUsers,
                    totalInteractions,
                    totalFAQs,
                    avgResponseTime: 150
                },
                recentActivity,
                topFAQs
            },
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        logger_1.logger.error('Error getting analytics overview:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get analytics overview',
            timestamp: new Date().toISOString(),
        });
    }
});
router.post('/track', async (req, res) => {
    try {
        const { environment, metric, value, metadata } = req.body;
        if (!environment || !metric) {
            return res.status(400).json({
                success: false,
                error: 'Environment and metric are required',
                timestamp: new Date().toISOString(),
            });
        }
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const [analytics, created] = await models_1.Analytics.findOrCreate({
            where: {
                environment,
                date: todayStr
            },
            defaults: {
                environment,
                date: todayStr,
                totalQuestions: 0,
                totalSessions: 0,
                averageConfidence: 0,
                averageResponseTime: 0,
                uniqueUsers: 0,
                popularQuestions: [],
                categoryDistribution: [],
                confidenceDistribution: [],
                hourlyDistribution: [],
                metadata: {}
            }
        });
        if (metric === 'interaction') {
            await analytics.update({
                totalQuestions: analytics.totalQuestions + 1
            });
        }
        else if (metric === 'responseTime' && value) {
            const newAvg = (analytics.averageResponseTime * analytics.totalQuestions + value) / (analytics.totalQuestions + 1);
            await analytics.update({
                averageResponseTime: newAvg
            });
        }
        res.json({
            success: true,
            message: 'Analytics tracked successfully',
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        logger_1.logger.error('Error tracking analytics:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to track analytics',
            timestamp: new Date().toISOString(),
        });
    }
});
exports.default = router;
//# sourceMappingURL=analytics.js.map