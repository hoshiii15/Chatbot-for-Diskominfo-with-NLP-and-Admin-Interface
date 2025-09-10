"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initWebsiteModel = exports.Website = void 0;
const sequelize_1 = require("sequelize");
class Website extends sequelize_1.Model {
    isOnline() {
        return this.status === 'online';
    }
    needsCheck() {
        if (!this.lastChecked)
            return true;
        const now = new Date();
        const lastCheck = new Date(this.lastChecked);
        const diffMinutes = (now.getTime() - lastCheck.getTime()) / (1000 * 60);
        return diffMinutes > 5;
    }
    getDisplayUrl() {
        try {
            const urlObj = new URL(this.url);
            return urlObj.hostname;
        }
        catch {
            return this.url;
        }
    }
}
exports.Website = Website;
const initWebsiteModel = (sequelize) => {
    Website.init({
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: sequelize_1.DataTypes.STRING(100),
            allowNull: false,
            validate: {
                len: [1, 100],
            },
        },
        url: {
            type: sequelize_1.DataTypes.STRING(500),
            allowNull: false,
            validate: {
                isUrl: true,
            },
        },
        environment: {
            type: sequelize_1.DataTypes.ENUM('stunting', 'ppid'),
            allowNull: false,
        },
        description: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
        },
        isActive: {
            type: sequelize_1.DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        apiKey: {
            type: sequelize_1.DataTypes.STRING(255),
            allowNull: true,
        },
        settings: {
            type: sequelize_1.DataTypes.JSON,
            allowNull: false,
            defaultValue: {},
        },
        lastChecked: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: true,
        },
        status: {
            type: sequelize_1.DataTypes.ENUM('online', 'offline', 'error'),
            allowNull: false,
            defaultValue: 'offline',
        },
        responseTime: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: true,
            validate: {
                min: 0,
            },
        },
        createdBy: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        updatedBy: {
            type: sequelize_1.DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        metadata: {
            type: sequelize_1.DataTypes.JSON,
            allowNull: true,
        },
    }, {
        sequelize,
        modelName: 'Website',
        tableName: 'websites',
        timestamps: true,
        indexes: [
            {
                fields: ['environment'],
            },
            {
                fields: ['isActive'],
            },
            {
                fields: ['status'],
            },
            {
                fields: ['environment', 'isActive'],
            },
        ],
    });
    return Website;
};
exports.initWebsiteModel = initWebsiteModel;
//# sourceMappingURL=Website.js.map