import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { MongoServerError } from 'mongodb';
import { AppError } from '@/shared/errors/index.js';
import { logger } from '@/lib/logger.js';
import { env } from '@/config/env.js';

interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    const body: ErrorResponse = {
      success: false,
      error: {
        message: err.message,
        code: err.code,
        ...(err.details !== undefined && { details: err.details }),
      },
    };
    res.status(err.statusCode).json(body);
    return;
  }

  if (err instanceof ZodError) {
    res.status(422).json({
      success: false,
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: err.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      },
    } satisfies ErrorResponse);
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json({
        success: false,
        error: {
          message: 'A record with this value already exists',
          code: 'DUPLICATE_ENTRY',
        },
      } satisfies ErrorResponse);
      return;
    }
  }

  if (err instanceof MongoServerError && err.code === 11000) {
    res.status(409).json({
      success: false,
      error: {
        message: 'A record with this value already exists',
        code: 'DUPLICATE_ENTRY',
      },
    } satisfies ErrorResponse);
    return;
  }

  logger.error({ err }, 'Unhandled error');

  res.status(500).json({
    success: false,
    error: {
      message: env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
      code: 'INTERNAL_ERROR',
    },
  } satisfies ErrorResponse);
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found',
      code: 'ROUTE_NOT_FOUND',
    },
  });
}
