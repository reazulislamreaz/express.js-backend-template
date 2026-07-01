import { Request, Response } from 'express';
import { usersService } from './users.service.js';
import { successResponse, paginatedResponse } from '@/shared/types/api.js';
import type { PaginationInput, UpdateUserInput } from './users.validation.js';

export class UsersController {
  async list(req: Request, res: Response): Promise<void> {
    const result = await usersService.list(req.query as unknown as PaginationInput);
    res.json(paginatedResponse(result.users, result.meta));
  }

  async getById(req: Request, res: Response): Promise<void> {
    const { id } = req.params as { id: string };
    const user = await usersService.getById(id, req.user!.sub, req.user!.role);
    res.json(successResponse(user));
  }

  async update(req: Request, res: Response): Promise<void> {
    const { id } = req.params as { id: string };
    const user = await usersService.update(
      id,
      req.body as UpdateUserInput,
      req.user!.sub,
      req.user!.role,
    );
    res.json(successResponse(user));
  }

  async getActivity(req: Request, res: Response): Promise<void> {
    const { id } = req.params as { id: string };
    const activities = await usersService.getActivity(id, req.user!.sub, req.user!.role);
    res.json(successResponse(activities));
  }
}

export const usersController = new UsersController();
