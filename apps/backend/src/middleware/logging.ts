import { Request, Response, NextFunction } from 'express';

export interface LoggingOptions {
  includeBody?: boolean;
  includeQuery?: boolean;
  includeHeaders?: boolean;
  excludePaths?: string[];
}

export function requestLogger(options: LoggingOptions = {}) {
  const {
    includeBody = false,
    includeQuery = true,
    includeHeaders = false,
    excludePaths = ['/api/health']
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    
    // Skip logging for excluded paths
    if (excludePaths.some(path => req.path.startsWith(path))) {
      return next();
    }

    // Log request
    const logData: any = {
      method: req.method,
      url: req.url,
      path: req.path,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString(),
    };

    if (includeQuery && Object.keys(req.query).length > 0) {
      logData.query = req.query;
    }

    if (includeBody && req.body && Object.keys(req.body).length > 0) {
      // Don't log sensitive data
      const sanitizedBody = { ...req.body };
      if (sanitizedBody.password) sanitizedBody.password = '[REDACTED]';
      if (sanitizedBody.token) sanitizedBody.token = '[REDACTED]';
      logData.body = sanitizedBody;
    }

    if (includeHeaders) {
      logData.headers = req.headers;
    }

    console.log(`[REQUEST] ${JSON.stringify(logData)}`);

    // Log response
    const originalSend = res.send;
    res.send = function(body) {
      const duration = Date.now() - start;
      console.log(`[RESPONSE] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
      return originalSend.call(this, body);
    };

    next();
  };
}

export function errorLogger() {
  return (error: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(`[ERROR] ${req.method} ${req.path}:`, {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      ip: req.ip || req.connection.remoteAddress,
    });
    next(error);
  };
}
