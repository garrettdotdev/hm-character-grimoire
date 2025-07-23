import { Request, Response, NextFunction } from 'express';

export interface SecurityOptions {
  enableCSP?: boolean;
  enableHSTS?: boolean;
  enableXFrameOptions?: boolean;
  enableXContentTypeOptions?: boolean;
  enableReferrerPolicy?: boolean;
}

export function securityHeaders(options: SecurityOptions = {}) {
  const {
    enableCSP = true,
    enableHSTS = true,
    enableXFrameOptions = true,
    enableXContentTypeOptions = true,
    enableReferrerPolicy = true,
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    // Content Security Policy
    if (enableCSP) {
      res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self';"
      );
    }

    // HTTP Strict Transport Security
    if (enableHSTS) {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    // X-Frame-Options
    if (enableXFrameOptions) {
      res.setHeader('X-Frame-Options', 'DENY');
    }

    // X-Content-Type-Options
    if (enableXContentTypeOptions) {
      res.setHeader('X-Content-Type-Options', 'nosniff');
    }

    // Referrer Policy
    if (enableReferrerPolicy) {
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    }

    // X-XSS-Protection (legacy but still useful)
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Remove X-Powered-By header
    res.removeHeader('X-Powered-By');

    next();
  };
}

export function rateLimiter(options: { windowMs?: number; maxRequests?: number } = {}) {
  const { windowMs = 15 * 60 * 1000, maxRequests = 100 } = options; // 15 minutes, 100 requests
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const clientId = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    
    const clientData = requests.get(clientId);
    
    if (!clientData || now > clientData.resetTime) {
      // Reset or initialize
      requests.set(clientId, {
        count: 1,
        resetTime: now + windowMs,
      });
      return next();
    }
    
    if (clientData.count >= maxRequests) {
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil((clientData.resetTime - now) / 1000),
      });
    }
    
    clientData.count++;
    next();
  };
}
