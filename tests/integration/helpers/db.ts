import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { prisma } from '@/lib/database/postgres.js';

export async function connectTestDatabase(): Promise<void> {
  await prisma.$connect();
  await prisma.$queryRaw`SELECT 1`;
}

export async function disconnectTestDatabase(): Promise<void> {
  await prisma.$disconnect();
}

export async function resetDatabase(): Promise<void> {
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
}

export async function createTestUser(options: {
  email: string;
  password: string;
  role?: Role;
  isActive?: boolean;
  firstName?: string;
  lastName?: string;
}) {
  const passwordHash = await bcrypt.hash(options.password, 4);

  return prisma.user.create({
    data: {
      email: options.email.toLowerCase(),
      passwordHash,
      firstName: options.firstName,
      lastName: options.lastName,
      role: options.role ?? Role.USER,
      isActive: options.isActive ?? true,
    },
  });
}
