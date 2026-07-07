import { Router } from 'express';
import { authController } from './auth.controller.js';
import { registerSchema, loginSchema, refreshTokenSchema } from './auth.validation.js';
import { validate, asyncHandler, authRateLimiter, authenticate } from '@/middleware/index.js';

const router = Router();

router.post(
  '/register',
  authRateLimiter,
  validate(registerSchema),
  asyncHandler(authController.register.bind(authController)),
);

router.post(
  '/login',
  authRateLimiter,
  validate(loginSchema),
  asyncHandler(authController.login.bind(authController)),
);

router.post(
  '/refresh',
  validate(refreshTokenSchema),
  asyncHandler(authController.refresh.bind(authController)),
);

router.post(
  '/logout',
  validate(refreshTokenSchema),
  asyncHandler(authController.logout.bind(authController)),
);

router.get('/me', authenticate, asyncHandler(authController.me.bind(authController)));

export default router;
