import { Request, Response, NextFunction } from 'express';
import { env } from '@/config/env.js';
import { UnauthorizedError, ForbiddenError } from '@/shared/errors/index.js';
import type { Role } from '@prisma/client';
import { extractBearerToken, verifyJwt } from '@/shared/types/jwt.js';

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const token = extractBearerToken(req.headers.authorization);

  if (!token) {
    next(new UnauthorizedError('Missing or invalid authorization header'));
    return;
  }

  try {
    req.user = verifyJwt(token, env.JWT_SECRET);
    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired token'));
  }
}

export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError());
      return;
    }

    if (roles.length > 0 && !roles.includes(req.user.role)) {
      next(new ForbiddenError('Insufficient permissions'));
      return;
    }

    next();
  };
}
