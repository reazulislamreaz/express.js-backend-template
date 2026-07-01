import { Router } from 'express';
import authRoutes from '@/modules/auth/auth.routes.js';
import usersRoutes from '@/modules/users/users.routes.js';
import healthRoutes from '@/modules/health/health.routes.js';
import { csrfTokenHandler } from '@/middleware/index.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.get('/csrf-token', csrfTokenHandler);

export default router;
