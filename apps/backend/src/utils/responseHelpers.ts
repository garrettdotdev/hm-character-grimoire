import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  meta?: {
    count?: number;
    total?: number;
    page?: number;
    limit?: number;
  };
}

export class ResponseHelper {
  static success<T>(res: Response, data: T, message?: string, statusCode: number = 200): Response {
    const response: ApiResponse<T> = {
      success: true,
      data,
      message,
    };
    return res.status(statusCode).json(response);
  }

  static created<T>(res: Response, data: T, message?: string): Response {
    return this.success(res, data, message, 201);
  }

  static noContent(res: Response, message?: string): Response {
    const response: ApiResponse = {
      success: true,
      message,
    };
    return res.status(204).json(response);
  }

  static error(res: Response, error: string, statusCode: number = 500): Response {
    const response: ApiResponse = {
      success: false,
      error,
    };
    return res.status(statusCode).json(response);
  }

  static badRequest(res: Response, error: string): Response {
    return this.error(res, error, 400);
  }

  static notFound(res: Response, error: string = 'Resource not found'): Response {
    return this.error(res, error, 404);
  }

  static conflict(res: Response, error: string): Response {
    return this.error(res, error, 409);
  }

  static list<T>(res: Response, items: T[], message?: string, meta?: ApiResponse['meta']): Response {
    const response: ApiResponse<T[]> = {
      success: true,
      data: items,
      message,
      meta: {
        count: items.length,
        ...meta,
      },
    };
    return res.status(200).json(response);
  }
}
