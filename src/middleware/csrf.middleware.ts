import { doubleCsrf } from 'csrf-csrf';
import { Request, Response } from 'express';
import { env } from '@/config/env.js';

const isProduction = env.NODE_ENV === 'production';

const { generateCsrfToken, doubleCsrfProtection } = doubleCsrf({
  getSecret: () => env.CSRF_SECRET ?? 'csrf-secret-not-configured',
  getSessionIdentifier: (req) => req.cookies?.['session-id'] ?? req.ip ?? 'anonymous',
  cookieName: isProduction ? '__Host-csrf' : 'csrf-token',
  cookieOptions: {
    httpOnly: true,
    sameSite: 'strict',
    secure: isProduction,
    path: '/',
  },
});

export function csrfProtection(req: Request, res: Response, next: () => void): void {
  if (!env.CSRF_ENABLED) {
    next();
    return;
  }

  doubleCsrfProtection(req, res, next);
}

export function csrfTokenHandler(req: Request, res: Response): void {
  if (!env.CSRF_ENABLED) {
    res.status(404).json({
      success: false,
      error: { message: 'CSRF protection is disabled', code: 'CSRF_DISABLED' },
    });
    return;
  }

  const token = generateCsrfToken(req, res);
  res.json({ success: true, data: { csrfToken: token } });
}
