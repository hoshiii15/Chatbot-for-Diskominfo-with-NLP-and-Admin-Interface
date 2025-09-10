"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.validateConfig = validateConfig;
exports.getAbsolutePath = getAbsolutePath;
exports.getFaqFilePath = getFaqFilePath;
exports.getBotLogPath = getBotLogPath;
exports.getBackupPath = getBackupPath;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
exports.config = {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3001', 10),
    database: {
        url: process.env.DATABASE_URL || 'sqlite:./database.sqlite',
        dialect: process.env.DATABASE_URL?.includes('postgresql') ? 'postgres' : 'sqlite',
    },
    pythonBot: {
        url: process.env.PYTHON_BOT_URL || 'http://127.0.0.1:5000',
        timeout: parseInt(process.env.PYTHON_BOT_TIMEOUT || '30000', 10),
        healthTimeout: parseInt(process.env.PYTHON_BOT_HEALTH_TIMEOUT || '5000', 10),
    },
    files: {
        faqDataPath: process.env.FAQ_DATA_PATH || '../python-bot/data',
        faqStuntingFile: process.env.FAQ_STUNTING_FILE || 'faq_stunting.json',
        faqPpidFile: process.env.FAQ_PPID_FILE || 'faq_ppid.json',
        botLogFile: process.env.BOT_LOG_FILE || '../python-bot/bot.log',
        backupPath: process.env.BACKUP_PATH || './backups',
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
        expiry: process.env.JWT_EXPIRY || '24h',
    },
    bcrypt: {
        rounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
    },
    rateLimit: {
        requests: parseInt(process.env.RATE_LIMIT_REQUESTS || '100', 10),
        window: parseInt(process.env.RATE_LIMIT_WINDOW || '900000', 10),
    },
    upload: {
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10),
        allowedTypes: (process.env.ALLOWED_FILE_TYPES || 'json').split(','),
    },
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        file: process.env.LOG_FILE || './logs/admin-backend.log',
    },
    backup: {
        retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10),
        autoBackupInterval: parseInt(process.env.AUTO_BACKUP_INTERVAL || '86400000', 10),
    },
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        credentials: process.env.CORS_CREDENTIALS === 'true',
    },
    socket: {
        corsOrigin: process.env.SOCKET_CORS_ORIGIN || 'http://localhost:3000',
    },
    health: {
        checkInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '60000', 10),
    },
    analytics: {
        retentionDays: parseInt(process.env.ANALYTICS_RETENTION_DAYS || '90', 10),
        popularQuestionsLimit: parseInt(process.env.POPULAR_QUESTIONS_LIMIT || '10', 10),
    },
};
function validateConfig() {
    const required = [
        'JWT_SECRET',
    ];
    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
    if (exports.config.nodeEnv === 'production') {
        if (process.env.JWT_SECRET === 'your-super-secret-jwt-key-change-this-in-production') {
            throw new Error('JWT_SECRET must be changed in production');
        }
    }
}
function getAbsolutePath(relativePath) {
    return path_1.default.resolve(__dirname, '../../', relativePath);
}
function getFaqFilePath(env) {
    const filename = env === 'stunting' ? exports.config.files.faqStuntingFile : exports.config.files.faqPpidFile;
    return path_1.default.join(getAbsolutePath(exports.config.files.faqDataPath), filename);
}
function getBotLogPath() {
    return getAbsolutePath(exports.config.files.botLogFile);
}
function getBackupPath() {
    return getAbsolutePath(exports.config.files.backupPath);
}
//# sourceMappingURL=config.js.map