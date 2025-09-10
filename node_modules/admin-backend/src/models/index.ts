import { Sequelize } from 'sequelize';
import { config } from '../utils/config';
import { logger } from '../utils/logger';

// Import model initializers
import { initUserModel, User } from './User';
import { initChatLogModel, ChatLog } from './ChatLog';
import { initSessionModel, Session } from './Session';
import { initFAQModel, FAQ } from './FAQ';
import { initAnalyticsModel, Analytics } from './Analytics';
import { initWebsiteModel, Website } from './Website';

// Export model classes
export { User, ChatLog, Session, FAQ, Analytics, Website };

// Export model attributes interfaces
export type { UserAttributes, UserCreationAttributes } from './User';
export type { ChatLogAttributes, ChatLogCreationAttributes } from './ChatLog';
export type { SessionAttributes, SessionCreationAttributes } from './Session';
export type { FAQAttributes, FAQCreationAttributes } from './FAQ';
export type { AnalyticsAttributes, AnalyticsCreationAttributes } from './Analytics';
export type { WebsiteAttributes, WebsiteCreationAttributes } from './Website';

// Database connection instance
let sequelize: Sequelize;

// Initialize database connection
export const initializeDatabase = async (): Promise<Sequelize> => {
  try {
    // Create Sequelize instance based on configuration
    if (config.database.dialect === 'postgres') {
      sequelize = new Sequelize(config.database.url, {
        dialect: 'postgres',
        logging: config.nodeEnv === 'development' ? logger.debug.bind(logger) : false,
        pool: {
          max: 10,
          min: 0,
          acquire: 30000,
          idle: 10000,
        },
        define: {
          timestamps: true,
          underscored: false,
          paranoid: false,
        },
      });
    } else {
      // SQLite configuration
      const dbPath = config.database.url.replace('sqlite:', '');
      sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: dbPath,
        logging: config.nodeEnv === 'development' ? logger.debug.bind(logger) : false,
        define: {
          timestamps: true,
          underscored: false,
          paranoid: false,
        },
      });
    }

    // Test the connection
    await sequelize.authenticate();
    logger.info('Database connection established successfully');

    // Initialize all models
    initUserModel(sequelize);
    initChatLogModel(sequelize);
    initSessionModel(sequelize);
    initFAQModel(sequelize);
    initAnalyticsModel(sequelize);
    initWebsiteModel(sequelize);

    // Define model associations
    defineAssociations();

    // Sync database (create tables if they don't exist)
    // Avoid automatic schema alterations to prevent backup/insert issues on local SQLite
    try {
      await sequelize.sync({
        force: false, // Set to true only for development reset
        alter: false,
      });
      logger.info('Database models synchronized successfully');
    } catch (syncErr) {
      // Log but don't crash the whole process; developer can inspect logs and run migrations manually
      logger.error('Database sync failed, continuing startup (dev-safe):', syncErr instanceof Error ? syncErr.message : syncErr);
    }

    return sequelize;
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
    throw error;
  }
};

// Define model associations
const defineAssociations = (): void => {
  // ChatLog belongs to Session
  ChatLog.belongsTo(Session, {
    foreignKey: 'sessionId',
    as: 'session',
  });

  // Session has many ChatLogs
  Session.hasMany(ChatLog, {
    foreignKey: 'sessionId',
    as: 'chatLogs',
  });

  // FAQ belongs to User (createdBy)
  FAQ.belongsTo(User, {
    foreignKey: 'createdBy',
    as: 'creator',
  });

  // FAQ belongs to User (updatedBy)
  FAQ.belongsTo(User, {
    foreignKey: 'updatedBy',
    as: 'updater',
  });

  // User has many FAQs (created)
  User.hasMany(FAQ, {
    foreignKey: 'createdBy',
    as: 'createdFAQs',
  });

  // User has many FAQs (updated)
  User.hasMany(FAQ, {
    foreignKey: 'updatedBy',
    as: 'updatedFAQs',
  });

  // Website belongs to User (createdBy)
  Website.belongsTo(User, {
    foreignKey: 'createdBy',
    as: 'creator',
  });

  // Website belongs to User (updatedBy)
  Website.belongsTo(User, {
    foreignKey: 'updatedBy',
    as: 'updater',
  });

  // User has many Websites (created)
  User.hasMany(Website, {
    foreignKey: 'createdBy',
    as: 'createdWebsites',
  });

  // User has many Websites (updated)
  User.hasMany(Website, {
    foreignKey: 'updatedBy',
    as: 'updatedWebsites',
  });
};

// Get database instance
export const getDatabase = (): Sequelize => {
  if (!sequelize) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return sequelize;
};

// Close database connection
export const closeDatabase = async (): Promise<void> => {
  if (sequelize) {
    await sequelize.close();
    logger.info('Database connection closed');
  }
};

// Database health check
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    if (!sequelize) return false;
    await sequelize.authenticate();
    return true;
  } catch (error) {
    logger.error('Database health check failed:', error);
    return false;
  }
};

// Export sequelize instance
export { sequelize };
