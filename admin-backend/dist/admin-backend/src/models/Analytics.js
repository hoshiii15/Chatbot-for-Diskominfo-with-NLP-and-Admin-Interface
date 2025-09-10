"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initAnalyticsModel = exports.Analytics = void 0;
const sequelize_1 = require("sequelize");
class Analytics extends sequelize_1.Model {
    getFormattedDate() {
        return new Date(this.date).toLocaleDateString();
    }
    getAverageQuestionsPerSession() {
        return this.totalSessions > 0 ? this.totalQuestions / this.totalSessions : 0;
    }
    isHighActivity() {
        return this.totalQuestions > 100;
    }
}
exports.Analytics = Analytics;
const initAnalyticsModel = (sequelize) => {
    Analytics.init({
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true,
        },
        date: {
            type: sequelize_1.DataTypes.DATEONLY,
            allowNull: false,
            validate: {
                isDate: true,
            },
        },
        environment: {
            type: sequelize_1.DataTypes.ENUM('stunting', 'ppid'),
            allowNull: false,
        },
        totalQuestions: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: {
                min: 0,
            },
        },
        totalSessions: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: {
                min: 0,
            },
        },
        averageConfidence: {
            type: sequelize_1.DataTypes.FLOAT,
            allowNull: false,
            defaultValue: 0.0,
            validate: {
                min: 0.0,
                max: 1.0,
            },
        },
        averageResponseTime: {
            type: sequelize_1.DataTypes.FLOAT,
            allowNull: false,
            defaultValue: 0.0,
            validate: {
                min: 0.0,
            },
        },
        uniqueUsers: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: {
                min: 0,
            },
        },
        popularQuestions: {
            type: sequelize_1.DataTypes.JSON,
            allowNull: false,
            defaultValue: [],
        },
        categoryDistribution: {
            type: sequelize_1.DataTypes.JSON,
            allowNull: false,
            defaultValue: [],
        },
        confidenceDistribution: {
            type: sequelize_1.DataTypes.JSON,
            allowNull: false,
            defaultValue: [],
        },
        hourlyDistribution: {
            type: sequelize_1.DataTypes.JSON,
            allowNull: false,
            defaultValue: [],
        },
        metadata: {
            type: sequelize_1.DataTypes.JSON,
            allowNull: true,
        },
    }, {
        sequelize,
        modelName: 'Analytics',
        tableName: 'analytics',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['date', 'environment'],
            },
            {
                fields: ['environment'],
            },
            {
                fields: ['date'],
            },
            {
                fields: ['totalQuestions'],
            },
        ],
    });
    return Analytics;
};
exports.initAnalyticsModel = initAnalyticsModel;
//# sourceMappingURL=Analytics.js.map