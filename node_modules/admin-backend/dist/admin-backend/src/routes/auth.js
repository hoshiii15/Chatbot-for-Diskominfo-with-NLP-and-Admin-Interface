"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const config_1 = require("../utils/config");
const logger_1 = require("../utils/logger");
const models_1 = require("../models");
const router = (0, express_1.Router)();
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                error: 'Username and password are required',
                timestamp: new Date().toISOString(),
            });
        }
        const user = await models_1.User.findOne({
            where: {
                username: username,
                isActive: true
            }
        });
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials',
                timestamp: new Date().toISOString(),
            });
        }
        const isValidPassword = await bcryptjs_1.default.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials',
                timestamp: new Date().toISOString(),
            });
        }
        await user.update({ lastLogin: new Date() });
        const payload = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
        };
        const token = jsonwebtoken_1.default.sign(payload, config_1.config.jwt.secret, {
            expiresIn: config_1.config.jwt.expiry
        });
        logger_1.logger.info('User logged in successfully', {
            username: user.username,
            ip: req.ip,
        });
        res.json({
            success: true,
            data: {
                token,
                user: user.toJSON(),
            },
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        logger_1.logger.error('Login failed:', error);
        return res.status(500).json({
            success: false,
            error: 'Login failed',
            timestamp: new Date().toISOString(),
        });
    }
});
router.post('/logout', (req, res) => {
    res.json({
        success: true,
        message: 'Logged out successfully',
        timestamp: new Date().toISOString(),
    });
});
router.post('/verify', (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({
                success: false,
                error: 'Token is required',
                timestamp: new Date().toISOString(),
            });
        }
        const decoded = jsonwebtoken_1.default.verify(token, config_1.config.jwt.secret);
        res.json({
            success: true,
            data: {
                valid: true,
                user: {
                    id: decoded.id,
                    username: decoded.username,
                    email: decoded.email,
                    role: decoded.role,
                },
            },
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            return res.status(401).json({
                success: false,
                error: 'Invalid token',
                timestamp: new Date().toISOString(),
            });
        }
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            return res.status(401).json({
                success: false,
                error: 'Token expired',
                timestamp: new Date().toISOString(),
            });
        }
        return res.status(500).json({
            success: false,
            error: 'Token verification failed',
            timestamp: new Date().toISOString(),
        });
    }
});
router.post('/change-password', async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                error: 'Current password and new password are required',
                timestamp: new Date().toISOString(),
            });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'New password must be at least 6 characters long',
                timestamp: new Date().toISOString(),
            });
        }
        res.json({
            success: true,
            message: 'Password changed successfully',
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        logger_1.logger.error('Password change failed:', error);
        return res.status(500).json({
            success: false,
            error: 'Password change failed',
            timestamp: new Date().toISOString(),
        });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map