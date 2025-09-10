"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initFAQModel = exports.FAQ = void 0;
const sequelize_1 = require("sequelize");
class FAQ extends sequelize_1.Model {
    incrementViews() {
        this.views += 1;
        this.lastUsed = new Date();
    }
    isPopular() {
        return this.views > 100;
    }
    getKeywordString() {
        return this.keywords?.join(', ') || '';
    }
}
exports.FAQ = FAQ;
const initFAQModel = (sequelize) => {
    FAQ.init({
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true,
        },
        question: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: false,
            validate: {
                len: [1, 1000],
            },
        },
        answer: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: false,
            validate: {
                len: [1, 5000],
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
        keywords: {
            type: sequelize_1.DataTypes.JSON,
            allowNull: true,
            defaultValue: [],
        },
        isActive: {
            type: sequelize_1.DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        priority: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: {
                min: 0,
                max: 100,
            },
        },
        views: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: {
                min: 0,
            },
        },
        lastUsed: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: true,
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
        modelName: 'FAQ',
        tableName: 'faqs',
        timestamps: true,
        indexes: [
            {
                fields: ['environment'],
            },
            {
                fields: ['category'],
            },
            {
                fields: ['isActive'],
            },
            {
                fields: ['priority'],
            },
            {
                fields: ['views'],
            },
            {
                fields: ['environment', 'isActive'],
            },
            {
                fields: ['environment', 'category'],
            },
        ],
    });
    return FAQ;
};
exports.initFAQModel = initFAQModel;
//# sourceMappingURL=FAQ.js.map