import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';
import { ChatLog, FAQ, Session, Analytics, User } from '../models';
import { loadFaqsFromFiles } from '../controllers/faqController';
import { Op } from 'sequelize';
import { promises as fs } from 'fs';
import path from 'path';

const router = Router();

/**
 * GET /api/dashboard/stats
 * Get dashboard overview statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    // Get counts from database
    const [
      totalQuestions,
      totalFAQs,
      totalSessions,
      totalUsers
    ] = await Promise.all([
      ChatLog.count(),
      FAQ.count(),
      Session.count(),
      User.count()
    ]);

    // Load file-backed FAQs (if present) using shared loader so counting matches FAQ endpoints
    let fileFaqs: any[] = [];
    try {
      fileFaqs = await loadFaqsFromFiles();
    } catch (e) {
      // ignore - fallback to DB counts below
    }

    // If file-backed FAQs exist, prefer them as the source of truth for totals
    const effectiveTotalFAQs = fileFaqs.length > 0 ? fileFaqs.length : totalFAQs;

    // Compute totalQuestions as the number of question variants across file FAQs when present,
    // otherwise fall back to chat logs count (questions asked)
    let effectiveTotalQuestions = 0;
    if (fileFaqs.length > 0) {
      effectiveTotalQuestions = fileFaqs.reduce((sum: number, f: any) => {
        if (Array.isArray(f.questions)) return sum + f.questions.length;
        if (typeof f.question === 'string' && f.question.trim().length > 0) return sum + 1;
        return sum;
      }, 0);
    } else {
      effectiveTotalQuestions = totalQuestions;
    }

  // Get active sessions: count sessions marked as isActive=true (better represents active users)
  const activeSessions = await Session.count({ where: { isActive: true } });

    // Get system health status
    let systemHealth = 'Healthy';
    try {
      // Test database connection
      await ChatLog.findOne({ limit: 1 });
    } catch (error) {
      systemHealth = 'Unhealthy';
      logger.error('Database health check failed:', error);
    }

  const stats = {
      totalQuestions: effectiveTotalQuestions,
      totalFAQs: effectiveTotalFAQs,
      activeUsers: activeSessions,
      systemHealth,
      totalSessions,
      totalUsers
    };

  // Debug log to help troubleshooting frontend mismatches
  logger.info('Dashboard stats computed', { stats, fileFaqsCount: fileFaqs.length, dbCounts: { totalQuestions, totalFAQs, totalSessions, totalUsers } });

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error getting dashboard stats:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get dashboard stats',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/dashboard/overview
 * Get comprehensive dashboard overview
 */
router.get('/overview', async (req: Request, res: Response) => {
  try {
    const [
      totalQuestions,
      totalFAQs,
      totalSessions,
      totalUsers,
      totalAnalytics
    ] = await Promise.all([
      ChatLog.count(),
      FAQ.count(),
      Session.count(),
      User.count(),
      Analytics.count()
    ]);

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentQuestions = await ChatLog.count({
      where: {
        createdAt: {
          [Op.gte]: sevenDaysAgo
        }
      }
    });

    // Get environment distribution
    const envDistribution = await ChatLog.findAll({
      attributes: [
        'environment',
        [ChatLog.sequelize!.fn('COUNT', ChatLog.sequelize!.col('id')), 'count']
      ],
      group: ['environment'],
      raw: true
    });

    // Get top categories
    const topCategories = await ChatLog.findAll({
      attributes: [
        'category',
        [ChatLog.sequelize!.fn('COUNT', ChatLog.sequelize!.col('id')), 'count']
      ],
      where: {
        category: {
          [Op.ne]: ''
        }
      },
      group: ['category'],
      order: [[ChatLog.sequelize!.fn('COUNT', ChatLog.sequelize!.col('id')), 'DESC']],
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
  } catch (error) {
    logger.error('Error getting dashboard overview:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get dashboard overview',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
