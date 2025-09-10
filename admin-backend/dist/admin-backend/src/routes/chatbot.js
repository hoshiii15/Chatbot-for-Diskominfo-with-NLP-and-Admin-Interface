"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const logger_1 = require("../utils/logger");
const models_1 = require("../models");
const router = (0, express_1.Router)();
router.post('/log', async (req, res) => {
    try {
        const { sessionId, question, answer, confidence, category, environment, userAgent, ipAddress } = req.body;
        const incomingSessionId = String(sessionId).trim();
        let session = await models_1.Session.findByPk(incomingSessionId);
        if (!session) {
            session = models_1.Session.build({
                userAgent: userAgent || '',
                ipAddress: ipAddress || '',
                environment: environment || 'ppid',
                isActive: true,
                startTime: new Date(),
                totalQuestions: 1
            });
            session.id = incomingSessionId;
            await session.save();
            logger_1.logger.info('Created session for incoming sessionId', { sessionId: session.id, environment });
        }
        else {
            await session.update({
                isActive: true,
                totalQuestions: (session.totalQuestions || 0) + 1
            });
        }
        const chatLog = await models_1.ChatLog.create({
            sessionId: session.id,
            question,
            answer,
            confidence: confidence || 0,
            category: category || 'general',
            environment: environment || 'ppid',
            status: 'success',
            responseTime: 500
        });
        logger_1.logger.info('Chat interaction logged', {
            sessionId,
            question: question.substring(0, 100),
            category,
            confidence,
            environment
        });
        res.json({
            success: true,
            data: {
                logId: chatLog.id,
                sessionId: session.id
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error logging chat interaction:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to log chat interaction'
        });
    }
});
router.post('/session/start', async (req, res) => {
    try {
        const { userAgent, ipAddress, environment } = req.body;
        const session = await models_1.Session.create({
            isActive: true,
            startTime: new Date(),
            environment: environment || 'ppid',
            userAgent: userAgent || '',
            ipAddress: ipAddress || '',
            totalQuestions: 0
        });
        logger_1.logger.info('New chat session started', {
            sessionId: session.id,
            environment,
            ipAddress
        });
        res.json({
            success: true,
            data: {
                sessionId: session.id
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error starting chat session:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to start chat session'
        });
    }
});
router.post('/session/end', async (req, res) => {
    try {
        const { sessionId } = req.body;
        if (!sessionId) {
            return res.status(400).json({
                success: false,
                error: 'Session ID is required'
            });
        }
        const session = await models_1.Session.findOne({ where: { id: sessionId } });
        if (session) {
            await session.update({
                isActive: false,
                endTime: new Date()
            });
            logger_1.logger.info('Chat session ended', { sessionId });
        }
        res.json({
            success: true,
            message: 'Session ended successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error ending chat session:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to end chat session'
        });
    }
});
exports.default = router;
//# sourceMappingURL=chatbot.js.map