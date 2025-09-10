import { Router, Request, Response } from 'express';
import { requireEditor } from '../middleware/auth';
import { logger } from '../utils/logger';
import { Analytics, ChatLog, FAQ, Session } from '../models';
import { Op } from 'sequelize';
import { promises as fs } from 'fs';
import path from 'path';

// Helper: read raw file-backed FAQ arrays for counting
async function readFileFaqsRaw(env: 'stunting' | 'ppid'): Promise<any[]> {
  try {
    const repoRoot = path.resolve(__dirname, '../../../');
    const p = env === 'stunting' ? path.join(repoRoot, 'python-bot', 'data', 'faq_stunting.json') : path.join(repoRoot, 'python-bot', 'data', 'faq_ppid.json');
    const raw = await fs.readFile(p, 'utf-8');
    const parsed = JSON.parse(raw);
    if (env === 'stunting') return Array.isArray(parsed.faqs) ? parsed.faqs : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

const router = Router();
// NOTE: analytics route improved to aggregate ChatLog when Analytics rows are missing

/**
 * GET /api/analytics
 * Get analytics overview
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, environment } = req.query;
    
    const whereClause: any = {};
    
    if (startDate && endDate) {
      whereClause.date = {
        [Op.between]: [new Date(startDate as string), new Date(endDate as string)]
      };
    }
    
    if (environment && environment !== 'all') {
      whereClause.environment = environment;
    }

    const analytics = await Analytics.findAll({ where: whereClause, order: [['date', 'DESC']], limit: 100, raw: true });

    // Build a consistent where clause for ChatLog / Session queries using provided filters
    const chatWhere: any = {};
    if (environment && environment !== 'all') chatWhere.environment = environment as string;
    if (startDate && endDate) {
      chatWhere.createdAt = {
        [Op.between]: [new Date(startDate as string), new Date(endDate as string)]
      };
    }

    // total questions (interactions)
    const totalInteractions = await ChatLog.count({ where: chatWhere });

    // total sessions (count of sessions)
    const sessionWhere: any = {};
    if (environment && environment !== 'all') sessionWhere.environment = environment as string;
    if (startDate && endDate) {
      sessionWhere.startTime = {
        [Op.between]: [new Date(startDate as string), new Date(endDate as string)]
      };
    }
    const totalSessions = await Session.count({ where: sessionWhere });

    // average confidence across chat logs (0.0 - 1.0)
    const avgRes = await ChatLog.findAll({ attributes: [[ChatLog.sequelize!.fn('AVG', ChatLog.sequelize!.col('confidence')), 'avgConfidence']], where: chatWhere, raw: true });
    const averageConfidence = avgRes && avgRes[0] && (Number((avgRes[0] as any).avgConfidence) || 0);

    // popular questions (top by count)
    const popular = await ChatLog.findAll({
      attributes: [
        'question',
        [ChatLog.sequelize!.fn('COUNT', ChatLog.sequelize!.col('id')), 'count'],
        [ChatLog.sequelize!.fn('AVG', ChatLog.sequelize!.col('confidence')), 'avg_confidence']
      ],
      where: chatWhere,
      group: ['question'],
      order: [[ChatLog.sequelize!.fn('COUNT', ChatLog.sequelize!.col('id')), 'DESC']],
      limit: 10,
      raw: true
    });

    const popular_questions = (popular || []).map((p: any) => ({ question: p.question, count: Number(p.count), avg_confidence: Number(p.avg_confidence || 0) }));

    // category distribution
    const categories = await ChatLog.findAll({
      attributes: [
        'category',
        [ChatLog.sequelize!.fn('COUNT', ChatLog.sequelize!.col('id')), 'count']
      ],
      where: { ...chatWhere, category: { [Op.ne]: '' } },
      group: ['category'],
      raw: true
    });
    const totalForPercent = totalInteractions || 1;
    const category_distribution = (categories || []).map((c: any) => ({ category: c.category, count: Number(c.count), percentage: Math.round((Number(c.count) / totalForPercent) * 100) }));

    // confidence distribution buckets
    const buckets = [0, 0.2, 0.4, 0.6, 0.8, 1.0];
    const confidence_distribution: Array<{ range: string; count: number; percentage: number }> = [];
    for (let i = 0; i < buckets.length - 1; i++) {
      const low = buckets[i];
      const high = buckets[i + 1];
      const whereForBucket: any = { ...chatWhere };
      if (i < buckets.length - 2) {
        whereForBucket.confidence = { [Op.gte]: low, [Op.lt]: high };
      } else {
        // last bucket includes the upper bound
        whereForBucket.confidence = { [Op.gte]: low, [Op.lte]: high };
      }
      const cnt = await ChatLog.count({ where: whereForBucket });
      confidence_distribution.push({ range: `${(low * 100).toFixed(0)}-${(high * 100).toFixed(0)}%`, count: cnt, percentage: Math.round((cnt / totalForPercent) * 100) });
    }

    // daily stats: prefer Analytics table rows, fallback to aggregating ChatLog by date when Analytics rows are missing
    let daily_stats: Array<{ date: string; questions: number; avg_confidence: number }> = [];
    if (analytics && analytics.length > 0) {
      daily_stats = analytics.map((a: any) => ({ date: a.date, questions: a.totalQuestions || 0, avg_confidence: a.averageConfidence || 0 }));
    } else {
      // aggregate ChatLog by DATE(createdAt)
      const daily = await ChatLog.findAll({
        attributes: [[ChatLog.sequelize!.fn('DATE', ChatLog.sequelize!.col('createdAt')), 'date'], [ChatLog.sequelize!.fn('COUNT', ChatLog.sequelize!.col('id')), 'questions'], [ChatLog.sequelize!.fn('AVG', ChatLog.sequelize!.col('confidence')), 'avg_confidence']],
        where: chatWhere,
        group: [ChatLog.sequelize!.fn('DATE', ChatLog.sequelize!.col('createdAt'))],
        order: [[ChatLog.sequelize!.fn('DATE', ChatLog.sequelize!.col('createdAt')), 'DESC']],
        raw: true
      });
      daily_stats = (daily || []).map((d: any) => ({ date: d.date, questions: Number(d.questions || 0), avg_confidence: Number(d.avg_confidence || 0) }));
    }

    // environment distribution
  const envDist = await ChatLog.findAll({ attributes: ['environment', [ChatLog.sequelize!.fn('COUNT', ChatLog.sequelize!.col('id')), 'count']], where: chatWhere, group: ['environment'], raw: true });
  const env_distribution = (envDist || []).map((e: any) => ({ env: e.environment, count: Number(e.count), percentage: Math.round((Number(e.count) / totalForPercent) * 100) }));

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
  } catch (error) {
    logger.error('Error getting analytics:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get analytics',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/analytics/overview
 * Get analytics overview with metrics
 */
router.get('/overview', async (req: Request, res: Response) => {
  try {
    const { environment } = req.query;
    
    const environmentFilter = environment && environment !== 'all' ? { environment: environment as string } : {};
    
    // Get counts
    const totalUsers = await Session.count();
    
    const totalInteractions = await ChatLog.count({
      where: environmentFilter
    });
    
    // Prefer file-backed FAQ counts when JSON files exist
    let totalFAQs = 0;
    try {
      const stuntingFile = await readFileFaqsRaw('stunting');
      const ppidFile = await readFileFaqsRaw('ppid');
      if (stuntingFile.length > 0 || ppidFile.length > 0) {
        totalFAQs = (environment && environment !== 'all')
          ? (environment === 'stunting' ? stuntingFile.length : ppidFile.length)
          : (stuntingFile.length + ppidFile.length);
      } else {
        totalFAQs = await FAQ.count({ where: environmentFilter });
      }
    } catch (e) {
      totalFAQs = await FAQ.count({ where: environmentFilter });
    }
    
    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentActivity = await Analytics.findAll({
      where: {
        date: {
          [Op.gte]: sevenDaysAgo
        },
        ...environmentFilter
      },
      order: [['date', 'ASC']]
    });
    
    // Get top FAQs by views
    const topFAQs = await FAQ.findAll({
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
          avgResponseTime: 150 // ms - placeholder
        },
        recentActivity,
        topFAQs
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error getting analytics overview:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get analytics overview',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * POST /api/analytics/track
 * Track analytics event
 */
router.post('/track', async (req: Request, res: Response) => {
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
    const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Find or create analytics record for today
    const [analytics, created] = await Analytics.findOrCreate({
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
    
    // Update the metric
    if (metric === 'interaction') {
      await analytics.update({
        totalQuestions: analytics.totalQuestions + 1
      });
    } else if (metric === 'responseTime' && value) {
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
  } catch (error) {
    logger.error('Error tracking analytics:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to track analytics',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
