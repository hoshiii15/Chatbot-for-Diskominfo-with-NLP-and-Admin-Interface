"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initChatLogModel = exports.ChatLog = void 0;
const sequelize_1 = require("sequelize");
class ChatLog extends sequelize_1.Model {
    isHighConfidence() {
        return this.confidence >= 0.8;
    }
    getFormattedTime() {
        return this.createdAt.toLocaleString();
    }
}
exports.ChatLog = ChatLog;
const initChatLogModel = (sequelize) => {
    ChatLog.init({
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true,
        },
        sessionId: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'sessions',
                key: 'id',
            },
        },
        question: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: false,
            validate: {
                len: [1, 5000],
            },
        },
        answer: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: false,
            validate: {
                len: [1, 10000],
            },
        },
        confidence: {
            type: sequelize_1.DataTypes.FLOAT,
            allowNull: false,
            validate: {
                min: 0.0,
                max: 1.0,
            },
        },
        category: {
            type: sequelize_1.DataTypes.STRING(100),
            allowNull: true,
        },
        environment: {
            type: sequelize_1.DataTypes.ENUM('stunting', 'ppid'),
            allowNull: false,
        },
        status: {
            type: sequelize_1.DataTypes.ENUM('success', 'error', 'no_answer'),
            allowNull: false,
            defaultValue: 'success',
        },
        responseTime: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 0,
            },
        },
        userAgent: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
        },
        ipAddress: {
            type: sequelize_1.DataTypes.STRING(45),
            allowNull: true,
        },
        metadata: {
            type: sequelize_1.DataTypes.JSON,
            allowNull: true,
        },
    }, {
        sequelize,
        modelName: 'ChatLog',
        tableName: 'chat_logs',
        timestamps: true,
        indexes: [
            {
                fields: ['sessionId'],
            },
            {
                fields: ['environment'],
            },
            {
                fields: ['status'],
            },
            {
                fields: ['confidence'],
            },
            {
                fields: ['category'],
            },
            {
                fields: ['createdAt'],
            },
            {
                fields: ['environment', 'createdAt'],
            },
        ],
    });
    return ChatLog;
};
exports.initChatLogModel = initChatLogModel;
//# sourceMappingURL=ChatLog.js.map