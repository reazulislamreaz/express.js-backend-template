import type { User, Role } from '@prisma/client';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface SafeUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: Role;
  isActive: boolean;
  createdAt: Date;
}

export function toSafeUser(user: User): SafeUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}

export interface AuthResponse {
  user: SafeUser;
  tokens: AuthTokens;
}
