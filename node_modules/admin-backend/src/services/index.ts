import { initializeDatabase, closeDatabase } from '../models';
import { seedDatabase } from '../models/seed';
import { logger } from '../utils/logger';
import { config } from '../utils/config';

export class DatabaseService {
  async initialize(): Promise<void> {
    try {
      await initializeDatabase();
      
      // Seed database with initial data in development (don't fail startup on seed errors)
      if (config.nodeEnv === 'development') {
        try {
          await seedDatabase();
        } catch (seedErr) {
          logger.error('Database seed failed (dev-safe), continuing startup:', seedErr instanceof Error ? seedErr.message : seedErr);
        }
      }
      
      logger.info('Database service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize database service:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    try {
      await closeDatabase();
      logger.info('Database service closed successfully');
    } catch (error) {
      logger.error('Failed to close database service:', error);
      throw error;
    }
  }
}

export class LogWatcherService {
  constructor(private socketService: any) {}

  async initialize(): Promise<void> {
    // TODO: Initialize log watching
  }

  async stop(): Promise<void> {
    // TODO: Stop log watching
  }
}

export class HealthMonitorService {
  constructor(private socketService: any) {}

  async initialize(): Promise<void> {
    // TODO: Initialize health monitoring
  }

  async stop(): Promise<void> {
    // TODO: Stop health monitoring
  }
}
