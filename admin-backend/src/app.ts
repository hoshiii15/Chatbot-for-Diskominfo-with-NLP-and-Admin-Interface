import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import path from 'path';

// Import routes
import authRoutes from './routes/auth';
import faqRoutes from './routes/faq';
import logsRoutes from './routes/logs';
import analyticsRoutes from './routes/analytics';
import healthRoutes from './routes/health';
import websiteRoutes from './routes/websites';
import dashboardRoutes from './routes/dashboard';
import chatbotRoutes from './routes/chatbot';
import environmentsRoutes from './routes/environments';
import systemRoutes from './routes/system';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { authMiddleware } from './middleware/auth';

// Import services
import { DatabaseService, LogWatcherService, HealthMonitorService } from './services';
import { SocketService } from './services/SocketService';

// Import utils
import { logger } from './utils/logger';
import { config } from './utils/config';

// Load environment variables
dotenv.config();

class App {
  public app: express.Application;
  public server: any;
  public io!: SocketIOServer;
  private databaseService!: DatabaseService;
  private logWatcherService!: LogWatcherService;
  private healthMonitorService!: HealthMonitorService;
  private socketService!: SocketService;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.setupSocket();
    this.initializeServices();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupSocket(): void {
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: config.cors.origin,
        credentials: config.cors.credentials,
      },
    });

    this.io.on('connection', (socket) => {
      logger.info(`Socket client connected: ${socket.id}`);
      
      socket.on('disconnect', () => {
        logger.info(`Socket client disconnected: ${socket.id}`);
      });
    });
  }

  private async initializeServices(): Promise<void> {
    try {
      // Initialize database
      this.databaseService = new DatabaseService();
      await this.databaseService.initialize();
      
      // Initialize socket service
      this.socketService = new SocketService(this.io);
      
      // Initialize log watcher
      this.logWatcherService = new LogWatcherService(this.socketService);
      await this.logWatcherService.initialize();
      
      // Initialize health monitor
      this.healthMonitorService = new HealthMonitorService(this.socketService);
      await this.healthMonitorService.initialize();
      
      logger.info('All services initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize services:', error);
      process.exit(1);
    }
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS
    this.app.use(cors({
      origin: config.cors.origin,
      credentials: config.cors.credentials,
    }));

    // Compression
    this.app.use(compression());

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.rateLimit.window,
      max: config.rateLimit.requests,
      message: {
        error: 'Too many requests from this IP, please try again later.',
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use('/api', limiter);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use(requestLogger);

    // Static files
    this.app.use('/static', express.static(path.join(__dirname, '../public')));
  }

  private setupRoutes(): void {
    // Health check (no auth required)
    this.app.use('/api/health', healthRoutes);

    // Authentication routes (no auth required)
    this.app.use('/api/auth', authRoutes);

    // Chatbot routes (no auth required - used by Python bot)
    this.app.use('/api/chatbot', chatbotRoutes);

  // FAQ routes: GET endpoints are public; mutating endpoints use `requireEditor` inside the route file
  this.app.use('/api/faq', faqRoutes);
    this.app.use('/api/logs', authMiddleware, logsRoutes);
    this.app.use('/api/analytics', authMiddleware, analyticsRoutes);
    this.app.use('/api/websites', authMiddleware, websiteRoutes);
  this.app.use('/api/environments', environmentsRoutes);
  // System management (restart) - requires auth
  this.app.use('/api/system', authMiddleware, systemRoutes);
  // Dashboard stats are read-only and should be available to the frontend
  // even when Authorization headers are not forwarded by proxies. Mount
  // the dashboard routes without the auth middleware so the client can
  // fetch stats reliably in demo/combined deployments.
  this.app.use('/api/dashboard', dashboardRoutes);

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        name: 'FAQ Chatbot Admin Backend',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
        endpoints: {
          health: '/api/health',
          auth: '/api/auth',
          faq: '/api/faq',
          logs: '/api/logs',
          analytics: '/api/analytics',
          websites: '/api/websites',
        },
      });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        timestamp: new Date().toISOString(),
      });
    });
  }

  private setupErrorHandling(): void {
    this.app.use(errorHandler);

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    // Handle unhandled rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      this.shutdown();
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
      this.shutdown();
    });
  }

  private async shutdown(): Promise<void> {
    try {
      logger.info('Starting graceful shutdown...');
      
      // Close server
      await new Promise<void>((resolve) => {
        this.server.close(() => {
          logger.info('HTTP server closed');
          resolve();
        });
      });

      // Close socket connections
      this.io.close();
      logger.info('Socket.IO server closed');

      // Stop services
      if (this.logWatcherService) {
        await this.logWatcherService.stop();
      }
      
      if (this.healthMonitorService) {
        await this.healthMonitorService.stop();
      }

      // Close database connection
      if (this.databaseService) {
        await this.databaseService.close();
      }

      logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  }

  public start(): void {
    const port = config.port;
    
    this.server.listen(port, () => {
      logger.info(`🚀 Admin Backend Server started on port ${port}`);
      logger.info(`📊 Environment: ${config.nodeEnv}`);
      logger.info(`🔗 Python Bot URL: ${config.pythonBot.url}`);
      logger.info(`💾 Database: ${config.database.dialect}`);
      logger.info(`📁 FAQ Data Path: ${config.files.faqDataPath}`);

      // Diagnostic: report resolved FAQ data path and file-backed FAQ counts
      try {
        const { getAbsolutePath } = require('./utils/config');
        const fs = require('fs');
        const path = require('path');
        const resolved = getAbsolutePath(config.files.faqDataPath);
        let stCount = 0;
        let ppCount = 0;
        try {
          const stPath = path.join(resolved, 'faq_stunting.json');
          const ppPath = path.join(resolved, 'faq_ppid.json');
          if (fs.existsSync(stPath)) {
            const st = JSON.parse(fs.readFileSync(stPath, 'utf8'));
            if (Array.isArray(st)) stCount = st.length;
            else if (st && Array.isArray(st.faqs)) stCount = st.faqs.length;
          }
          if (fs.existsSync(ppPath)) {
            const pp = JSON.parse(fs.readFileSync(ppPath, 'utf8'));
            if (Array.isArray(pp)) ppCount = pp.length;
            else if (pp && Array.isArray(pp.faqs)) ppCount = pp.faqs.length;
          }
        } catch (e) {
          // ignore
        }
        logger.info(`📁 Resolved FAQ data directory: ${resolved} (stunting: ${stCount}, ppid: ${ppCount})`);
      } catch (e) {
        // ignore
      }
    });
  }
}

// Create and start the application
const app = new App();
app.start();

export default app;
