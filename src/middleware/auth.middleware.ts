import { Request, Response, NextFunction } from 'express';
import { env } from '@/config/env.js';
import { prisma } from '@/lib/database/index.js';
import { UnauthorizedError, ForbiddenError } from '@/shared/errors/index.js';
import type { Role } from '@prisma/client';
import { extractBearerToken, verifyJwt } from '@/shared/types/jwt.js';
import type { JwtPayload } from '@/shared/types/jwt.js';

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const token = extractBearerToken(req.headers.authorization);

  if (!token) {
    next(new UnauthorizedError('Missing or invalid authorization header'));
    return;
  }

  let payload: JwtPayload;
  try {
    payload = verifyJwt(token, env.JWT_SECRET);
  } catch {
    next(new UnauthorizedError('Invalid or expired token'));
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
    },
  });

  if (!user?.isActive) {
    next(new UnauthorizedError('Account is inactive or no longer exists'));
    return;
  }

  req.user = {
    sub: user.id,
    email: user.email,
    role: user.role,
  };
  next();
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
