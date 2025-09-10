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
      search 
    } = req.query;
    
    const whereClause: any = {};
    
    if (environment && environment !== 'all') {
      whereClause.environment = environment as string;
    }
    
    if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.between]: [new Date(startDate as string), new Date(endDate as string)]
      };
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
