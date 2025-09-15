"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.expressLogger = exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const util_1 = __importDefault(require("util"));
const logsDir = path_1.default.join(__dirname, '../../logs');
if (!fs_1.default.existsSync(logsDir)) {
    fs_1.default.mkdirSync(logsDir, { recursive: true });
}
const consoleFormat = winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
        try {
            msg += ` ${util_1.default.inspect(meta, { depth: 4, colors: false, compact: true })}`;
        }
        catch (e) {
            msg += ` ${String(meta)}`;
        }
    }
    return msg;
}));
const fileFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json());
exports.logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: fileFormat,
    defaultMeta: { service: 'admin-backend' },
    transports: [
        new winston_1.default.transports.File({
            filename: path_1.default.join(logsDir, 'error.log'),
            level: 'error',
            maxsize: 5242880,
            maxFiles: 5,
        }),
        new winston_1.default.transports.File({
            filename: path_1.default.join(logsDir, 'combined.log'),
            maxsize: 5242880,
            maxFiles: 5,
        }),
    ],
    exceptionHandlers: [
        new winston_1.default.transports.File({
            filename: path_1.default.join(logsDir, 'exceptions.log'),
        }),
    ],
    rejectionHandlers: [
        new winston_1.default.transports.File({
            filename: path_1.default.join(logsDir, 'rejections.log'),
        }),
    ],
});
if (process.env.NODE_ENV !== 'production') {
    exports.logger.add(new winston_1.default.transports.Console({
        format: consoleFormat,
    }));
}
if (process.env.NODE_ENV === 'production') {
    exports.logger.add(new winston_1.default.transports.Console({
        level: 'warn',
        format: winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} [${level.toUpperCase()}]: ${message}`;
        })),
    }));
}
exports.expressLogger = winston_1.default.createLogger({
    level: 'info',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.json()),
    transports: [
        new winston_1.default.transports.File({
            filename: path_1.default.join(logsDir, 'requests.log'),
            maxsize: 5242880,
            maxFiles: 5,
        }),
    ],
});
exports.default = exports.logger;
//# sourceMappingURL=logger.js.map