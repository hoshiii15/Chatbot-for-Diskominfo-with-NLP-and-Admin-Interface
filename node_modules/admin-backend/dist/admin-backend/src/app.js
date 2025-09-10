"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const auth_1 = __importDefault(require("./routes/auth"));
const faq_1 = __importDefault(require("./routes/faq"));
const logs_1 = __importDefault(require("./routes/logs"));
const analytics_1 = __importDefault(require("./routes/analytics"));
const health_1 = __importDefault(require("./routes/health"));
const websites_1 = __importDefault(require("./routes/websites"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
const chatbot_1 = __importDefault(require("./routes/chatbot"));
const errorHandler_1 = require("./middleware/errorHandler");
const requestLogger_1 = require("./middleware/requestLogger");
const auth_2 = require("./middleware/auth");
const services_1 = require("./services");
const SocketService_1 = require("./services/SocketService");
const logger_1 = require("./utils/logger");
const config_1 = require("./utils/config");
dotenv_1.default.config();
class App {
    constructor() {
        this.app = (0, express_1.default)();
        this.server = (0, http_1.createServer)(this.app);
        this.setupSocket();
        this.initializeServices();
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }
    setupSocket() {
        this.io = new socket_io_1.Server(this.server, {
            cors: {
                origin: config_1.config.cors.origin,
                credentials: config_1.config.cors.credentials,
            },
        });
        this.io.on('connection', (socket) => {
            logger_1.logger.info(`Socket client connected: ${socket.id}`);
            socket.on('disconnect', () => {
                logger_1.logger.info(`Socket client disconnected: ${socket.id}`);
            });
        });
    }
    async initializeServices() {
        try {
            this.databaseService = new services_1.DatabaseService();
            await this.databaseService.initialize();
            this.socketService = new SocketService_1.SocketService(this.io);
            this.logWatcherService = new services_1.LogWatcherService(this.socketService);
            await this.logWatcherService.initialize();
            this.healthMonitorService = new services_1.HealthMonitorService(this.socketService);
            await this.healthMonitorService.initialize();
            logger_1.logger.info('All services initialized successfully');
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize services:', error);
            process.exit(1);
        }
    }
    setupMiddleware() {
        this.app.use((0, helmet_1.default)({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"],
                },
            },
        }));
        this.app.use((0, cors_1.default)({
            origin: config_1.config.cors.origin,
            credentials: config_1.config.cors.credentials,
        }));
        this.app.use((0, compression_1.default)());
        const limiter = (0, express_rate_limit_1.default)({
            windowMs: config_1.config.rateLimit.window,
            max: config_1.config.rateLimit.requests,
            message: {
                error: 'Too many requests from this IP, please try again later.',
            },
            standardHeaders: true,
            legacyHeaders: false,
        });
        this.app.use('/api', limiter);
        this.app.use(express_1.default.json({ limit: '10mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
        this.app.use(requestLogger_1.requestLogger);
        this.app.use('/static', express_1.default.static(path_1.default.join(__dirname, '../public')));
    }
    setupRoutes() {
        this.app.use('/api/health', health_1.default);
        this.app.use('/api/auth', auth_1.default);
        this.app.use('/api/chatbot', chatbot_1.default);
        this.app.use('/api/faq', faq_1.default);
        this.app.use('/api/logs', auth_2.authMiddleware, logs_1.default);
        this.app.use('/api/analytics', auth_2.authMiddleware, analytics_1.default);
        this.app.use('/api/websites', auth_2.authMiddleware, websites_1.default);
        this.app.use('/api/dashboard', auth_2.authMiddleware, dashboard_1.default);
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
        this.app.use('*', (req, res) => {
            res.status(404).json({
                success: false,
                error: 'Endpoint not found',
                timestamp: new Date().toISOString(),
            });
        });
    }
    setupErrorHandling() {
        this.app.use(errorHandler_1.errorHandler);
        process.on('uncaughtException', (error) => {
            logger_1.logger.error('Uncaught Exception:', error);
            process.exit(1);
        });
        process.on('unhandledRejection', (reason, promise) => {
            logger_1.logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
            process.exit(1);
        });
        process.on('SIGTERM', () => {
            logger_1.logger.info('SIGTERM received, shutting down gracefully');
            this.shutdown();
        });
        process.on('SIGINT', () => {
            logger_1.logger.info('SIGINT received, shutting down gracefully');
            this.shutdown();
        });
    }
    async shutdown() {
        try {
            logger_1.logger.info('Starting graceful shutdown...');
            await new Promise((resolve) => {
                this.server.close(() => {
                    logger_1.logger.info('HTTP server closed');
                    resolve();
                });
            });
            this.io.close();
            logger_1.logger.info('Socket.IO server closed');
            if (this.logWatcherService) {
                await this.logWatcherService.stop();
            }
            if (this.healthMonitorService) {
                await this.healthMonitorService.stop();
            }
            if (this.databaseService) {
                await this.databaseService.close();
            }
            logger_1.logger.info('Graceful shutdown completed');
            process.exit(0);
        }
        catch (error) {
            logger_1.logger.error('Error during shutdown:', error);
            process.exit(1);
        }
    }
    start() {
        const port = config_1.config.port;
        this.server.listen(port, () => {
            logger_1.logger.info(`🚀 Admin Backend Server started on port ${port}`);
            logger_1.logger.info(`📊 Environment: ${config_1.config.nodeEnv}`);
            logger_1.logger.info(`🔗 Python Bot URL: ${config_1.config.pythonBot.url}`);
            logger_1.logger.info(`💾 Database: ${config_1.config.database.dialect}`);
            logger_1.logger.info(`📁 FAQ Data Path: ${config_1.config.files.faqDataPath}`);
        });
    }
}
const app = new App();
app.start();
exports.default = app;
//# sourceMappingURL=app.js.map