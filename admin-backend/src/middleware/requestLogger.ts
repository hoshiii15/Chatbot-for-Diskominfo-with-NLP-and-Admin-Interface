import { Request, Response, NextFunction } from 'express';
import { expressLogger } from '../utils/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();

  // Log request details
  expressLogger.info('Incoming request', {
    method: req.method,
    url: req.url,
    ip: (req as any).ip,
    userAgent: (req as any).get && (req as any).get('User-Agent'),
    contentLength: (req as any).get && (req as any).get('Content-Length'),
    contentType: (req as any).get && (req as any).get('Content-Type'),
    timestamp: new Date().toISOString(),
  });

  // Override res.end to log response details
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any): Response {
    const responseTime = Date.now() - startTime;
    
    expressLogger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime,
      contentLength: (res as any).get && (res as any).get('Content-Length'),
      timestamp: new Date().toISOString(),
    });

    return originalEnd.call(this, chunk, encoding);
  };

  next();
};
