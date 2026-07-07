import { Request, Response, NextFunction } from 'express';

const SUSPICIOUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
];

const SECRET_FIELDS = new Set(['password', 'refreshToken', 'accessToken', 'token']);

function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') {
    let sanitized = value;
    for (const pattern of SUSPICIOUS_PATTERNS) {
      sanitized = sanitized.replace(pattern, '');
    }
    return sanitized;
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, sanitizeValue(v)]),
    );
  }

  return value;
}

function sanitizeObject(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sanitizeObject);
  }

  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, val]) => [
        key,
        SECRET_FIELDS.has(key) ? val : sanitizeObject(val),
      ]),
    );
  }

  return sanitizeValue(value);
}

export function xssSanitize(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }

  if (req.query && typeof req.query === 'object') {
    Object.defineProperty(req, 'query', {
      value: sanitizeObject(req.query),
      writable: false,
      enumerable: true,
      configurable: true,
    });
  }

  next();
}
