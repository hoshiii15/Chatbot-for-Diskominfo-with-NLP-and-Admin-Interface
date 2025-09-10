import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/websites
 * Get websites using the chatbot
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // TODO: Implement website monitoring
    const mockWebsites = [
      {
        id: '1',
        url: 'https://diskominfo.example.com',
        name: 'Diskominfo Website',
        status: 'active',
        last_ping: new Date().toISOString(),
        response_time: 250,
        total_requests: 1500,
        last_request: new Date().toISOString(),
      },
    ];

    res.json({
      success: true,
      data: mockWebsites,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error getting websites:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get websites',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
