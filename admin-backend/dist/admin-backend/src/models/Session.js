"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSessionModel = exports.Session = void 0;
const sequelize_1 = require("sequelize");
class Session extends sequelize_1.Model {
    getDuration() {
        const end = this.endTime || new Date();
        return end.getTime() - this.startTime.getTime();
    }
    getDurationInMinutes() {
        return Math.round(this.getDuration() / (1000 * 60));
    }
    isLongSession() {
        return this.getDurationInMinutes() > 30;
    }
}
exports.Session = Session;
const initSessionModel = (sequelize) => {
    Session.init({
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true,
        },
        userId: {
            type: sequelize_1.DataTypes.STRING(100),
            allowNull: true,
        },
        userAgent: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
        },
        ipAddress: {
            type: sequelize_1.DataTypes.STRING(45),
            allowNull: true,
        },
        environment: {
            type: sequelize_1.DataTypes.ENUM('stunting', 'ppid'),
            allowNull: false,
        },
        isActive: {
            type: sequelize_1.DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        startTime: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize_1.DataTypes.NOW,
        },
        endTime: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: true,
        },
        totalQuestions: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: {
                min: 0,
            },
        },
        averageConfidence: {
            type: sequelize_1.DataTypes.FLOAT,
            allowNull: true,
            validate: {
                min: 0.0,
                max: 1.0,
            },
        },
        metadata: {
            type: sequelize_1.DataTypes.JSON,
            allowNull: true,
        },
    }, {
        sequelize,
        modelName: 'Session',
        tableName: 'sessions',
        timestamps: true,
        indexes: [
            {
                fields: ['userId'],
            },
            {
                fields: ['environment'],
            },
            {
                fields: ['isActive'],
            },
            {
                fields: ['startTime'],
            },
            {
                fields: ['environment', 'startTime'],
            },
        ],
    });
    return Session;
};
exports.initSessionModel = initSessionModel;
//# sourceMappingURL=Session.js.map