import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';
import { ChatLog, FAQ, Session, Analytics, User, Website } from '../models';
import { Op } from 'sequelize';
import os from 'os';
import fs from 'fs';
import path from 'path';
import { config, getAbsolutePath, getBotLogPath, getBackupPath } from '../utils/config';

const router = Router();

/**
 * GET /api/health
 * Get system health status
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      memory: {
        used: process.memoryUsage().heapUsed / 1024 / 1024, // MB
        total: process.memoryUsage().heapTotal / 1024 / 1024, // MB
        rss: process.memoryUsage().rss / 1024 / 1024, // MB
        external: process.memoryUsage().external / 1024 / 1024, // MB
      },
      system: {
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version,
        cpus: os.cpus().length,
        loadAverage: os.loadavg(),
        totalMemory: os.totalmem() / 1024 / 1024 / 1024, // GB
        freeMemory: os.freemem() / 1024 / 1024 / 1024, // GB
      },
      database: {
        status: 'unknown' as string,
        connections: 0,
        lastQuery: null as string | null
      },
      services: {
        chatbot: { status: 'unknown' as string, lastCheck: null as string | null },
        fileSystem: { status: 'unknown' as string, lastCheck: null as string | null },
        nlpProcessor: { status: 'unknown' as string, lastCheck: null as string | null }
      }
    };

    // Test database connection
    try {
      const testQuery = await ChatLog.findOne({ limit: 1 });
      healthData.database.status = 'healthy';
      healthData.database.lastQuery = new Date().toISOString();
    } catch (error) {
      healthData.database.status = 'unhealthy';
      healthData.status = 'degraded';
      logger.error('Database health check failed:', error);
    }

    // Test file system (use configured FAQ data path)
    try {
      const dataDir = getAbsolutePath(config.files.faqDataPath);
      await fs.promises.access(dataDir, fs.constants.R_OK | fs.constants.W_OK);
      healthData.services.fileSystem.status = 'healthy';
      healthData.services.fileSystem.lastCheck = new Date().toISOString();
    } catch (error) {
      healthData.services.fileSystem.status = 'unhealthy';
      healthData.status = 'degraded';
      logger.error('File system health check failed:', error);
    }

    // Check chatbot availability (placeholder)
    healthData.services.chatbot.status = 'healthy';
    healthData.services.chatbot.lastCheck = new Date().toISOString();

    // Check NLP processor (placeholder)
    healthData.services.nlpProcessor.status = 'healthy';
    healthData.services.nlpProcessor.lastCheck = new Date().toISOString();

    res.json({
      success: true,
      data: healthData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error getting health status:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get health status',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/health/stats
 * Get detailed system statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    // Get database statistics
    const [
      totalUsers,
      totalChatLogs,
      totalFAQs,
      totalSessions,
      totalAnalytics,
      totalWebsites
    ] = await Promise.all([
      User.count(),
      ChatLog.count(),
      FAQ.count(),
      Session.count(),
      Analytics.count(),
      Website.count()
    ]);

    // Get recent activity (last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const recentActivity = await ChatLog.count({
      where: {
        createdAt: {
          [Op.gte]: yesterday
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
        averageResponseTime: 150, // Placeholder
        successRate: 95, // Placeholder
        errorRate: 5 // Placeholder
      }
    };

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error getting health stats:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get health stats',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;

/**
 * Extra endpoints:
 * - GET /api/health/logs?source=bot|backend  -> returns tail of log file
 * - POST /api/health/restart                  -> request a restart (noop in dev)
 * - GET /api/health/settings                  -> return non-sensitive runtime settings
 */

// Serve logs (bot or backend)
router.get('/logs', async (req: Request, res: Response) => {
  try {
    const source = String(req.query.source || 'bot').toLowerCase();
    let filePath: string;
    if (source === 'backend') {
      filePath = getAbsolutePath('./logs/combined.log');
    } else {
      filePath = getBotLogPath();
    }

    const exists = await fs.promises.stat(filePath).catch(() => null);
    if (!exists) {
      return res.status(404).json({ success: false, error: 'Log file not found' });
    }

    // Return tail of the file (last ~50KB)
    const content = await fs.promises.readFile(filePath, 'utf8');
    const tail = content.length > 50000 ? content.slice(-50000) : content;
    res.type('text/plain').send(tail);
  } catch (error) {
    logger.error('Error reading logs:', error);
    res.status(500).json({ success: false, error: 'Failed to read logs' });
  }
});

// Restart request (no-op for safety in development)
router.post('/restart', async (req: Request, res: Response) => {
  try {
    logger.info('Restart requested via API', { source: 'ui' });
    // In production this could trigger a service manager or orchestrator hook.
    res.json({ success: true, message: 'Restart requested (noop in development)' });
  } catch (error) {
    logger.error('Failed to enqueue restart:', error);
    res.status(500).json({ success: false, error: 'Failed to request restart' });
  }
});

// Settings (non-sensitive)
router.get('/settings', async (req: Request, res: Response) => {
  try {
    const settings = {
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      faqDataPath: getAbsolutePath(config.files.faqDataPath),
      pythonBotUrl: config.pythonBot.url,
      backupPath: getBackupPath(),
    };
    res.json({ success: true, data: settings });
  } catch (error) {
    logger.error('Failed to return settings:', error);
    res.status(500).json({ success: false, error: 'Failed to get settings' });
  }
});
