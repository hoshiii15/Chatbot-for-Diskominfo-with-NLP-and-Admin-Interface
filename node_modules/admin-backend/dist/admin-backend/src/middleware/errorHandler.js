"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const logger_1 = require("../utils/logger");
const errorHandler = (err, req, res, next) => {
    logger_1.logger.error('Error occurred:', {
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
    });
    let status = err.status || 500;
    let message = err.message || 'Internal Server Error';
    if (err.name === 'ValidationError') {
        status = 400;
        message = 'Validation Error';
    }
    else if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
        status = 401;
        message = 'Unauthorized';
    }
    else if (err.name === 'ForbiddenError') {
        status = 403;
        message = 'Forbidden';
    }
    else if (err.name === 'NotFoundError') {
        status = 404;
        message = 'Not Found';
    }
    else if (err.code === 'ENOENT') {
        status = 404;
        message = 'File not found';
    }
    else if (err.code === 'EACCES') {
        status = 403;
        message = 'Permission denied';
    }
    if (process.env.NODE_ENV === 'production' && status === 500) {
        message = 'Internal Server Error';
    }
    res.status(status).json({
        success: false,
        error: message,
        timestamp: new Date().toISOString(),
        ...(process.env.NODE_ENV === 'development' && {
            stack: err.stack,
            details: err,
        }),
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map