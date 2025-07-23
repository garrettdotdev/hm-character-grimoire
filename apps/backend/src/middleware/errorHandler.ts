import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error:', error);

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      error: error.message,
    });
  }

  // Handle specific database errors
  if (error.message.includes('UNIQUE constraint failed')) {
    return res.status(409).json({
      error: 'Resource already exists',
    });
  }

  if (error.message.includes('FOREIGN KEY constraint failed')) {
    return res.status(400).json({
      error: 'Invalid reference to related resource',
    });
  }

  // Default error response
  res.status(500).json({
    error: 'Internal server error',
  });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: `Route ${req.method} ${req.path} not found`,
  });
}

export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
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
