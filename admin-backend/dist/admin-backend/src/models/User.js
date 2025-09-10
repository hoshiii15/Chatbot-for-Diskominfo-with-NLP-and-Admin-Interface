"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initUserModel = exports.User = void 0;
const sequelize_1 = require("sequelize");
class User extends sequelize_1.Model {
    getFullName() {
        return `${this.firstName || ''} ${this.lastName || ''}`.trim() || this.username;
    }
    toJSON() {
        const values = { ...this.get() };
        delete values.password;
        return values;
    }
}
exports.User = User;
const initUserModel = (sequelize) => {
    User.init({
        id: {
            type: sequelize_1.DataTypes.UUID,
            defaultValue: sequelize_1.DataTypes.UUIDV4,
            primaryKey: true,
        },
        username: {
            type: sequelize_1.DataTypes.STRING(50),
            allowNull: false,
            unique: true,
            validate: {
                len: [3, 50],
                isAlphanumeric: true,
            },
        },
        email: {
            type: sequelize_1.DataTypes.STRING(100),
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
            },
        },
        password: {
            type: sequelize_1.DataTypes.STRING(255),
            allowNull: false,
            validate: {
                len: [8, 255],
            },
        },
        firstName: {
            type: sequelize_1.DataTypes.STRING(50),
            allowNull: true,
            validate: {
                len: [1, 50],
            },
        },
        lastName: {
            type: sequelize_1.DataTypes.STRING(50),
            allowNull: true,
            validate: {
                len: [1, 50],
            },
        },
        role: {
            type: sequelize_1.DataTypes.ENUM('admin', 'moderator', 'user'),
            allowNull: false,
            defaultValue: 'user',
        },
        isActive: {
            type: sequelize_1.DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        lastLogin: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: true,
        },
    }, {
        sequelize,
        modelName: 'User',
        tableName: 'users',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['username'],
            },
            {
                unique: true,
                fields: ['email'],
            },
            {
                fields: ['role'],
            },
            {
                fields: ['isActive'],
            },
        ],
    });
    return User;
};
exports.initUserModel = initUserModel;
//# sourceMappingURL=User.js.map