import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

export const config = {
  // Server configuration
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),

  // Database configuration
  database: {
    url: process.env.DATABASE_URL || 'sqlite:./database.sqlite',
    dialect: process.env.DATABASE_URL?.includes('postgresql') ? 'postgres' : 'sqlite',
  },

  // Python Bot configuration
  pythonBot: {
    url: process.env.PYTHON_BOT_URL || 'http://127.0.0.1:5000',
    timeout: parseInt(process.env.PYTHON_BOT_TIMEOUT || '30000', 10),
    healthTimeout: parseInt(process.env.PYTHON_BOT_HEALTH_TIMEOUT || '5000', 10),
  },

  // File paths
  files: {
    faqDataPath: process.env.FAQ_DATA_PATH || '../python-bot/data',
    faqStuntingFile: process.env.FAQ_STUNTING_FILE || 'faq_stunting.json',
    faqPpidFile: process.env.FAQ_PPID_FILE || 'faq_ppid.json',
    botLogFile: process.env.BOT_LOG_FILE || '../python-bot/bot.log',
    backupPath: process.env.BACKUP_PATH || './backups',
  },

  // Authentication
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
    expiry: process.env.JWT_EXPIRY || '24h',
  },
  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  },

  // Rate limiting
  rateLimit: {
    requests: parseInt(process.env.RATE_LIMIT_REQUESTS || '100', 10),
    window: parseInt(process.env.RATE_LIMIT_WINDOW || '900000', 10), // 15 minutes
  },

  // File upload
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB
    allowedTypes: (process.env.ALLOWED_FILE_TYPES || 'json').split(','),
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || './logs/admin-backend.log',
  },

  // Backup configuration
  backup: {
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10),
    autoBackupInterval: parseInt(process.env.AUTO_BACKUP_INTERVAL || '86400000', 10), // 24 hours
  },

  // CORS configuration
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: process.env.CORS_CREDENTIALS === 'true',
  },

  // Socket.IO
  socket: {
    corsOrigin: process.env.SOCKET_CORS_ORIGIN || 'http://localhost:3000',
  },

  // Health check
  health: {
    checkInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '60000', 10), // 1 minute
  },

  // Analytics
  analytics: {
    retentionDays: parseInt(process.env.ANALYTICS_RETENTION_DAYS || '90', 10),
    popularQuestionsLimit: parseInt(process.env.POPULAR_QUESTIONS_LIMIT || '10', 10),
  },
};

// Validate required configuration
export function validateConfig(): void {
  const required = [
    'JWT_SECRET',
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Warn about development defaults
  if (config.nodeEnv === 'production') {
    if (process.env.JWT_SECRET === 'your-super-secret-jwt-key-change-this-in-production') {
      throw new Error('JWT_SECRET must be changed in production');
    }
  }
}

// Get absolute paths for file operations
export function getAbsolutePath(relativePath: string): string {
  // Try multiple base directories to support running from source, compiled dist, or container
  const bases = [
    path.resolve(__dirname, '../../'), // normal layout
    path.resolve(process.cwd()), // when running from repo root
    path.join('/srv', 'admin-backend', 'dist'), // combined image layout
    path.join('/app'), // alternate container layout
  ];

  for (const base of bases) {
    try {
      const candidate = path.resolve(base, relativePath);
      if (fs.existsSync(candidate)) return candidate;
    } catch (_e) {
      // ignore and try next
    }
  }

  // fallback to original resolution
  return path.resolve(__dirname, '../../', relativePath);
}

export function getFaqFilePath(env: 'stunting' | 'ppid'): string {
  const filename = env === 'stunting' ? config.files.faqStuntingFile : config.files.faqPpidFile;
  return path.join(getAbsolutePath(config.files.faqDataPath), filename);
}

export function getBotLogPath(): string {
  return getAbsolutePath(config.files.botLogFile);
}

export function getBackupPath(): string {
  return getAbsolutePath(config.files.backupPath);
}
