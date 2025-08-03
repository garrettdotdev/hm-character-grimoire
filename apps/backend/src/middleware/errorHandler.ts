import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, true, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 409, true, 'CONFLICT_ERROR', details);
    this.name = 'ConflictError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 404, true, 'NOT_FOUND_ERROR', details);
    this.name = 'NotFoundError';
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
    const response: any = {
      error: error.message,
      code: error.code,
    };

    if (error.details) {
      response.details = error.details;
    }

    return res.status(error.statusCode).json(response);
  }

  // Handle Prisma errors
  if (error.constructor.name === 'PrismaClientKnownRequestError') {
    return handlePrismaError(error as any, res);
  }

  // Handle specific database errors (for non-Prisma databases)
  if (error.message.includes('UNIQUE constraint failed')) {
    const field = extractFieldFromUniqueError(error.message);
    return res.status(409).json({
      error: 'Resource already exists',
      code: 'UNIQUE_CONSTRAINT_VIOLATION',
      details: { field, message: `A resource with this ${field} already exists` },
    });
  }

  if (error.message.includes('FOREIGN KEY constraint failed')) {
    return res.status(400).json({
      error: 'Invalid reference to related resource',
      code: 'FOREIGN_KEY_CONSTRAINT_VIOLATION',
    });
  }

  // Default error response
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_SERVER_ERROR',
  });
}

function handlePrismaError(error: any, res: Response) {
  const { code, meta } = error;

  switch (code) {
    case 'P2002': // Unique constraint violation
      const field = meta?.target?.[0] || 'field';
      const fieldName = field === 'name' ? 'name' : field;
      return res.status(409).json({
        error: `A spell with this ${fieldName} already exists`,
        code: 'UNIQUE_CONSTRAINT_VIOLATION',
        details: {
          field: fieldName,
          constraint: meta?.target,
          message: `The ${fieldName} must be unique`,
        },
      });

    case 'P2003': // Foreign key constraint violation
      return res.status(400).json({
        error: 'Invalid reference to related resource',
        code: 'FOREIGN_KEY_CONSTRAINT_VIOLATION',
        details: {
          field: meta?.field_name,
          message: 'The referenced resource does not exist',
        },
      });

    case 'P2025': // Record not found
      return res.status(404).json({
        error: 'Resource not found',
        code: 'NOT_FOUND',
        details: {
          message: 'The requested resource could not be found',
        },
      });

    default:
      return res.status(500).json({
        error: 'Database operation failed',
        code: 'DATABASE_ERROR',
        details: {
          prismaCode: code,
          message: error.message,
        },
      });
  }
}

function extractFieldFromUniqueError(errorMessage: string): string {
  // Extract field name from SQLite UNIQUE constraint error
  const match = errorMessage.match(/UNIQUE constraint failed: \w+\.(\w+)/);
  return match?.[1] || 'field';
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
