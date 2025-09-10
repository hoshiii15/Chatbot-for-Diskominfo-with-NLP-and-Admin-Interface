"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sequelize = exports.checkDatabaseHealth = exports.closeDatabase = exports.getDatabase = exports.initializeDatabase = exports.Website = exports.Analytics = exports.FAQ = exports.Session = exports.ChatLog = exports.User = void 0;
const sequelize_1 = require("sequelize");
const config_1 = require("../utils/config");
const logger_1 = require("../utils/logger");
const User_1 = require("./User");
Object.defineProperty(exports, "User", { enumerable: true, get: function () { return User_1.User; } });
const ChatLog_1 = require("./ChatLog");
Object.defineProperty(exports, "ChatLog", { enumerable: true, get: function () { return ChatLog_1.ChatLog; } });
const Session_1 = require("./Session");
Object.defineProperty(exports, "Session", { enumerable: true, get: function () { return Session_1.Session; } });
const FAQ_1 = require("./FAQ");
Object.defineProperty(exports, "FAQ", { enumerable: true, get: function () { return FAQ_1.FAQ; } });
const Analytics_1 = require("./Analytics");
Object.defineProperty(exports, "Analytics", { enumerable: true, get: function () { return Analytics_1.Analytics; } });
const Website_1 = require("./Website");
Object.defineProperty(exports, "Website", { enumerable: true, get: function () { return Website_1.Website; } });
let sequelize;
const initializeDatabase = async () => {
    try {
        if (config_1.config.database.dialect === 'postgres') {
            exports.sequelize = sequelize = new sequelize_1.Sequelize(config_1.config.database.url, {
                dialect: 'postgres',
                logging: config_1.config.nodeEnv === 'development' ? logger_1.logger.debug.bind(logger_1.logger) : false,
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
        }
        else {
            const dbPath = config_1.config.database.url.replace('sqlite:', '');
            exports.sequelize = sequelize = new sequelize_1.Sequelize({
                dialect: 'sqlite',
                storage: dbPath,
                logging: config_1.config.nodeEnv === 'development' ? logger_1.logger.debug.bind(logger_1.logger) : false,
                define: {
                    timestamps: true,
                    underscored: false,
                    paranoid: false,
                },
            });
        }
        await sequelize.authenticate();
        logger_1.logger.info('Database connection established successfully');
        (0, User_1.initUserModel)(sequelize);
        (0, ChatLog_1.initChatLogModel)(sequelize);
        (0, Session_1.initSessionModel)(sequelize);
        (0, FAQ_1.initFAQModel)(sequelize);
        (0, Analytics_1.initAnalyticsModel)(sequelize);
        (0, Website_1.initWebsiteModel)(sequelize);
        defineAssociations();
        try {
            await sequelize.sync({
                force: false,
                alter: false,
            });
            logger_1.logger.info('Database models synchronized successfully');
        }
        catch (syncErr) {
            logger_1.logger.error('Database sync failed, continuing startup (dev-safe):', syncErr instanceof Error ? syncErr.message : syncErr);
        }
        return sequelize;
    }
    catch (error) {
        logger_1.logger.error('Unable to connect to the database:', error);
        throw error;
    }
};
exports.initializeDatabase = initializeDatabase;
const defineAssociations = () => {
    ChatLog_1.ChatLog.belongsTo(Session_1.Session, {
        foreignKey: 'sessionId',
        as: 'session',
    });
    Session_1.Session.hasMany(ChatLog_1.ChatLog, {
        foreignKey: 'sessionId',
        as: 'chatLogs',
    });
    FAQ_1.FAQ.belongsTo(User_1.User, {
        foreignKey: 'createdBy',
        as: 'creator',
    });
    FAQ_1.FAQ.belongsTo(User_1.User, {
        foreignKey: 'updatedBy',
        as: 'updater',
    });
    User_1.User.hasMany(FAQ_1.FAQ, {
        foreignKey: 'createdBy',
        as: 'createdFAQs',
    });
    User_1.User.hasMany(FAQ_1.FAQ, {
        foreignKey: 'updatedBy',
        as: 'updatedFAQs',
    });
    Website_1.Website.belongsTo(User_1.User, {
        foreignKey: 'createdBy',
        as: 'creator',
    });
    Website_1.Website.belongsTo(User_1.User, {
        foreignKey: 'updatedBy',
        as: 'updater',
    });
    User_1.User.hasMany(Website_1.Website, {
        foreignKey: 'createdBy',
        as: 'createdWebsites',
    });
    User_1.User.hasMany(Website_1.Website, {
        foreignKey: 'updatedBy',
        as: 'updatedWebsites',
    });
};
const getDatabase = () => {
    if (!sequelize) {
        throw new Error('Database not initialized. Call initializeDatabase() first.');
    }
    return sequelize;
};
exports.getDatabase = getDatabase;
const closeDatabase = async () => {
    if (sequelize) {
        await sequelize.close();
        logger_1.logger.info('Database connection closed');
    }
};
exports.closeDatabase = closeDatabase;
const checkDatabaseHealth = async () => {
    try {
        if (!sequelize)
            return false;
        await sequelize.authenticate();
        return true;
    }
    catch (error) {
        logger_1.logger.error('Database health check failed:', error);
        return false;
    }
};
exports.checkDatabaseHealth = checkDatabaseHealth;
//# sourceMappingURL=index.js.map