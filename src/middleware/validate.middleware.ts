import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

type RequestSource = 'body' | 'query' | 'params';

export function validate(schema: ZodSchema, source: RequestSource = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      next(result.error);
      return;
    }

    if (source === 'query') {
      Object.defineProperty(req, 'query', {
        value: result.data,
        writable: false,
        enumerable: true,
        configurable: true,
      });
    } else {
      req[source] = result.data;
    }
    next();
  };
}
