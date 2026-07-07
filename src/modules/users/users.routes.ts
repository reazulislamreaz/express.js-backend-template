import { Router } from 'express';
import { usersController } from './users.controller.js';
import { paginationSchema, userIdParamSchema, updateUserSchema } from './users.validation.js';
import { validate, asyncHandler, authenticate, authorize } from '@/middleware/index.js';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  authorize('ADMIN'),
  validate(paginationSchema, 'query'),
  asyncHandler(usersController.list.bind(usersController)),
);

router.get(
  '/:id',
  validate(userIdParamSchema, 'params'),
  asyncHandler(usersController.getById.bind(usersController)),
);

router.patch(
  '/:id',
  validate(userIdParamSchema, 'params'),
  validate(updateUserSchema),
  asyncHandler(usersController.update.bind(usersController)),
);

router.get(
  '/:id/activity',
  validate(userIdParamSchema, 'params'),
  asyncHandler(usersController.getActivity.bind(usersController)),
);

export default router;
