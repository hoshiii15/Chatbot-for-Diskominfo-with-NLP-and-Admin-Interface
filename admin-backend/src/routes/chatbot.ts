import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';
import { ChatLog, Session, User } from '../models';

const router = Router();

/**
 * POST /api/chatbot/log
 * Log chatbot interactions from Python bot
 */
router.post('/log', async (req: Request, res: Response) => {
  try {
  // record server receive time to compute processing time as fallback
  const _handlerStart = Date.now();
    const {
      sessionId,
      question,
      answer,
      confidence,
      category,
      environment,
      userAgent,
      ipAddress
    } = req.body;
    // Find or create session using the provided sessionId.
    // Trim incoming sessionId to avoid accidental whitespace mismatches.
    const incomingSessionId = String(sessionId).trim();
    let session = await Session.findByPk(incomingSessionId);
    if (!session) {
      // Build session explicitly and assign provided ID to satisfy TS types.
      session = Session.build({
        userAgent: userAgent || '',
        ipAddress: ipAddress || '',
        environment: (environment as any) || 'ppid',
        isActive: true,
        startTime: new Date(),
        totalQuestions: 1
      });
      session.id = incomingSessionId;
      await session.save();
      logger.info('Created session for incoming sessionId', { sessionId: session.id, environment });
    } else {
      // Update session activity
      await session.update({
        isActive: true,
        totalQuestions: (session.totalQuestions || 0) + 1
      });
    }

    // Determine responseTime: prefer explicit value from bot, else compute from provided timestamps, else use server processing time
    let responseTimeValue: number | null = null;
    try {
      const rt = req.body?.responseTime;
      if (typeof rt === 'number' && !Number.isNaN(rt) && rt >= 0) {
        responseTimeValue = Math.max(0, Math.round(rt));
      } else if (typeof rt === 'string' && !Number.isNaN(Number(rt))) {
        responseTimeValue = Math.max(0, Math.round(Number(rt)));
      } else if (req.body?.startTimestamp && req.body?.endTimestamp) {
        const s = new Date(req.body.startTimestamp).getTime();
        const e = new Date(req.body.endTimestamp).getTime();
        if (!Number.isNaN(s) && !Number.isNaN(e) && e >= s) {
          responseTimeValue = Math.max(0, Math.round(e - s));
        }
      }
    } catch (e) {
      // keep default
    }
    // If we still don't have a responseTime from client/timestamps, use server processing time
    if (responseTimeValue === null) {
      responseTimeValue = Math.max(0, Date.now() - _handlerStart);
    }

    const confNum = typeof confidence === 'number' ? confidence : (typeof confidence === 'string' && !Number.isNaN(Number(confidence)) ? Number(confidence) : 0);

    // persist all chat logs, but mark low-confidence in metadata
    const metadata: any = { lowConfidence: confNum < 0.5 };

    // Use the canonical session.id (ensures it exists and matches the FK)
    const chatLog = await ChatLog.create({
      sessionId: session.id,
      question,
      answer,
      confidence: confNum,
      category: category || 'general',
      environment: (environment as any) || 'ppid',
      status: 'success',
      responseTime: responseTimeValue,
      metadata
    });

    logger.info('Chat interaction logged', {
      sessionId: session.id,
      question: question?.substring ? question.substring(0, 100) : question,
      category,
      confidence: confNum,
      environment,
      responseTime: responseTimeValue,
      lowConfidence: metadata.lowConfidence
    });

    res.json({
      success: true,
      data: {
        logId: chatLog.id,
        sessionId: session.id,
        responseTime: responseTimeValue,
        lowConfidence: metadata.lowConfidence
      }
    });

  } catch (error) {
    logger.error('Error logging chat interaction:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to log chat interaction'
    });
  }
});

/**
 * POST /api/chatbot/session/start
 * Start a new chatbot session
 */
router.post('/session/start', async (req: Request, res: Response) => {
  try {
    const { userAgent, ipAddress, environment } = req.body;

    const session = await Session.create({
      isActive: true,
      startTime: new Date(),
      environment: environment || 'ppid',
      userAgent: userAgent || '',
      ipAddress: ipAddress || '',
      totalQuestions: 0
    });

    logger.info('New chat session started', {
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

  } catch (error) {
    logger.error('Error starting chat session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start chat session'
    });
  }
});

/**
 * POST /api/chatbot/session/end
 * End a chatbot session
 */
router.post('/session/end', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
    }

    const session = await Session.findOne({ where: { id: sessionId } });
    if (session) {
      await session.update({
        isActive: false,
        endTime: new Date()
      });

      logger.info('Chat session ended', { sessionId });
    }

    res.json({
      success: true,
      message: 'Session ended successfully'
    });

  } catch (error) {
    logger.error('Error ending chat session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to end chat session'
    });
  }
});

export default router;
