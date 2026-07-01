import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  API_PREFIX: z.string().default('/api/v1'),
  APP_NAME: z.string().default('express-template'),

  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),

  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  TRUST_PROXY: z.coerce.number().int().min(0).default(1),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),

  CSRF_ENABLED: z
    .string()
    .transform((v) => v === 'true')
    .default('false'),
  CSRF_SECRET: z.string().min(32).optional(),

  DATABASE_URL: z.string().url(),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/express_template'),
  MONGODB_ENABLED: z
    .string()
    .transform((v) => v === 'true')
    .default('true'),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  LOG_PRETTY: z
    .string()
    .transform((v) => v === 'true')
    .default('true'),
});

export type Env = z.infer<typeof envSchema>;

function parseEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Environment validation failed:\n${formatted}`);
  }

  if (result.data.CSRF_ENABLED && !result.data.CSRF_SECRET) {
    throw new Error('CSRF_SECRET is required when CSRF_ENABLED=true');
  }

  return result.data;
}

export const env = parseEnv();

export const corsOrigins = env.CORS_ORIGINS.split(',').map((origin) => origin.trim());
