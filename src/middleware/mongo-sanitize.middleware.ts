import { Request, Response, NextFunction } from 'express';

const PROHIBITED_KEY_PATTERN = /^\$|\./;

function sanitizeMongoKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sanitizeMongoKeys);
  }

  if (value !== null && typeof value === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      const safeKey = PROHIBITED_KEY_PATTERN.test(key) ? key.replace(/^\$/, '_').replace(/\./g, '_') : key;
      sanitized[safeKey] = sanitizeMongoKeys(val);
    }
    return sanitized;
  }

  return value;
}

export function mongoSanitize(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeMongoKeys(req.body);
  }

  if (req.params && typeof req.params === 'object') {
    for (const [key, value] of Object.entries(req.params)) {
      if (typeof value === 'string' && PROHIBITED_KEY_PATTERN.test(value)) {
        req.params[key] = value.replace(/^\$/, '_').replace(/\./g, '_');
      }
    }
  }

  next();
}
