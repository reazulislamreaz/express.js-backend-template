import { Request, Response } from 'express';
import { authService } from './auth.service.js';
import { authRepository } from './auth.repository.js';
import { toSafeUser } from './auth.types.js';
import { successResponse } from '@/shared/types/api.js';
import { NotFoundError } from '@/shared/errors/index.js';
import type { RegisterInput, LoginInput, RefreshTokenInput } from './auth.validation.js';

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    const result = await authService.register(req.body as RegisterInput);
    res.status(201).json(successResponse(result));
  }

  async login(req: Request, res: Response): Promise<void> {
    const result = await authService.login(req.body as LoginInput);
    res.json(successResponse(result));
  }

  async refresh(req: Request, res: Response): Promise<void> {
    const { refreshToken } = req.body as RefreshTokenInput;
    const result = await authService.refresh(refreshToken);
    res.json(successResponse(result));
  }

  async logout(req: Request, res: Response): Promise<void> {
    const { refreshToken } = req.body as RefreshTokenInput;
    await authService.logout(refreshToken);
    res.json(successResponse({ message: 'Logged out successfully' }));
  }

  async me(req: Request, res: Response): Promise<void> {
    const user = await authRepository.findById(req.user!.sub);
    if (!user) {
      throw new NotFoundError('User');
    }
    res.json(successResponse(toSafeUser(user)));
  }
}

export const authController = new AuthController();
