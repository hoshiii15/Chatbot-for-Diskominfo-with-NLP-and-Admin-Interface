import { Router, Request, Response } from 'express';
import { requireEditor } from '../middleware/auth';
import { logger } from '../utils/logger';
import { ChatLog, Session } from '../models';
import { Op } from 'sequelize';

const router = Router();

/**
 * GET /api/logs
 * Get chat logs with filtering options
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { 
      environment, 
      startDate, 
      endDate, 
      page = 1, 
      limit = 50,
      sessionId,
      search,
      // new frontend-friendly params
      preview,
      range,
      month
    } = req.query;
    
    const whereClause: any = {};
    
    if (environment && environment !== 'all') {
      whereClause.environment = environment as string;
    }
    
    // Support startDate/endDate if provided explicitly
    if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.between]: [new Date(startDate as string), new Date(endDate as string)]
      };
    }

    // Support `range` param used by the frontend modal for quick selects
    // range values: '1day', '1week', '1month', 'pickmonth'
    if (!whereClause.createdAt && range) {
      const now = new Date();
      let start: Date | null = null;
      let end = new Date();

      if (range === '1day') {
        start = new Date();
        start.setDate(now.getDate() - 1);
      } else if (range === '1week') {
        start = new Date();
        start.setDate(now.getDate() - 7);
      } else if (range === '1month') {
        start = new Date();
        start.setMonth(now.getMonth() - 1);
      } else if (range === 'pickmonth' && month) {
        // month expected in YYYY-MM format
        const [y, m] = (month as string).split('-').map(Number);
        if (!Number.isNaN(y) && !Number.isNaN(m)) {
          start = new Date(y, m - 1, 1);
          end = new Date(y, m, 1);
        }
      }

      if (start) {
        whereClause.createdAt = {
          [Op.between]: [start, end]
        };
      }
    }
    
    if (sessionId) {
      whereClause.sessionId = sessionId as string;
    }
    
    if (search) {
      whereClause[Op.or] = [
        { question: { [Op.like]: `%${search}%` } },
        { answer: { [Op.like]: `%${search}%` } }
      ];
    }

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    const { count, rows: logs } = await ChatLog.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit as string),
      offset
    });
    
    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: count,
          totalPages: Math.ceil(count / parseInt(limit as string))
        }
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error getting chat logs:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get chat logs',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/logs/stats
 * Get chat log statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const { environment } = req.query;
    
    const envFilter = environment && environment !== 'all' ? { environment: environment as string } : {};
    
    // Get total logs
    const totalLogs = await ChatLog.count({
      where: envFilter
    });
    
    // Get logs from last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const recentLogs = await ChatLog.count({
      where: {
        ...envFilter,
        createdAt: {
          [Op.gte]: yesterday
        }
      }
    });
    
    // Get unique sessions
    const uniqueSessions = await ChatLog.count({
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
  } catch (error) {
    logger.error('Error getting chat log stats:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get chat log stats',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;

/**
 * POST /api/logs/delete
 * Delete chat logs by range (same params as GET range)
 */
router.post('/delete', requireEditor, async (req: Request, res: Response) => {
  try {
    const { range, month, startDate, endDate, environment } = req.body || req.query || {};

    const whereClause: any = {};
    if (environment && environment !== 'all') whereClause.environment = environment as string;

    if (startDate && endDate) {
      whereClause.createdAt = { [Op.between]: [new Date(startDate as string), new Date(endDate as string)] };
    }

    if (!whereClause.createdAt && range) {
      const now = new Date();
      let start: Date | null = null;
      let end = new Date();

      if (range === '1day') {
        start = new Date();
        start.setDate(now.getDate() - 1);
      } else if (range === '1week') {
        start = new Date();
        start.setDate(now.getDate() - 7);
      } else if (range === '1month') {
        start = new Date();
        start.setMonth(now.getMonth() - 1);
      } else if (range === 'pickmonth' && month) {
        const [y, m] = (month as string).split('-').map(Number);
        if (!Number.isNaN(y) && !Number.isNaN(m)) {
          start = new Date(y, m - 1, 1);
          end = new Date(y, m, 1);
        }
      }

      if (start) {
        whereClause.createdAt = { [Op.between]: [start, end] };
      }
    }

    // If no createdAt filter provided, avoid accidental full-delete; require explicit flag in body
    if (!whereClause.createdAt) {
      return res.status(400).json({ success: false, error: 'No range specified for delete' });
    }

    const deleted = await ChatLog.destroy({ where: whereClause });

    res.json({ success: true, deleted, timestamp: new Date().toISOString() });
  } catch (error) {
    logger.error('Error deleting logs:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed to delete logs' });
  }
});

/**
 * POST /api/logs/deleteAll
 * Completely remove all chat logs (protected)
 */
router.post('/deleteAll', requireEditor, async (req: Request, res: Response) => {
  try {
    const deleted = await ChatLog.destroy({ where: {} });
    res.json({ success: true, deleted, timestamp: new Date().toISOString() });
  } catch (error) {
    logger.error('Error deleting all logs:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed to delete all logs' });
  }
});
