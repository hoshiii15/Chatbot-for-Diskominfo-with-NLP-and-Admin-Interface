"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireEditor = exports.requireAdmin = exports.requireRole = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../utils/config");
const authMiddleware = async (req, res, next) => {
    try {
        const token = extractToken(req);
        if (!token) {
            res.status(401).json({
                success: false,
                error: 'Access token is required',
                timestamp: new Date().toISOString(),
            });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, config_1.config.jwt.secret);
        req.user = {
            id: decoded.id,
            username: decoded.username,
            email: decoded.email,
            role: decoded.role,
            created_at: new Date().toISOString(),
            is_active: true,
        };
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            res.status(401).json({
                success: false,
                error: 'Invalid access token',
                timestamp: new Date().toISOString(),
            });
            return;
        }
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json({
                success: false,
                error: 'Access token has expired',
                timestamp: new Date().toISOString(),
            });
            return;
        }
        res.status(500).json({
            success: false,
            error: 'Authentication error',
            timestamp: new Date().toISOString(),
        });
    }
};
exports.authMiddleware = authMiddleware;
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'Authentication required',
                timestamp: new Date().toISOString(),
            });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                error: 'Insufficient permissions',
                timestamp: new Date().toISOString(),
            });
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
exports.requireAdmin = (0, exports.requireRole)(['admin']);
exports.requireEditor = (0, exports.requireRole)(['admin', 'editor']);
function extractToken(req) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }
    if (req.query.token && typeof req.query.token === 'string') {
        return req.query.token;
    }
    return null;
}
//# sourceMappingURL=auth.js.map