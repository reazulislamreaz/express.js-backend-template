import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_ADMIN_EMAIL = 'admin@example.com';
const DEFAULT_ADMIN_PASSWORD = 'AdminPass123';
const MIN_PASSWORD_LENGTH = 8;
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
const DEFAULT_BCRYPT_ROUNDS = 12;

function getAdminCredentials() {
  const isProduction = process.env.NODE_ENV === 'production';
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase() || DEFAULT_ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;
  const firstName = process.env.ADMIN_FIRST_NAME?.trim() || 'System';
  const lastName = process.env.ADMIN_LAST_NAME?.trim() || 'Admin';
  const bcryptRounds = Number(process.env.BCRYPT_ROUNDS ?? DEFAULT_BCRYPT_ROUNDS);

  if (isProduction && (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD)) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD are required when seeding in production');
  }

  if (!email.includes('@')) {
    throw new Error('ADMIN_EMAIL must be a valid email address');
  }

  if (password.length < MIN_PASSWORD_LENGTH || !PASSWORD_PATTERN.test(password)) {
    throw new Error(
      'ADMIN_PASSWORD must be at least 8 characters and contain uppercase, lowercase, and a number',
    );
  }

  if (!Number.isInteger(bcryptRounds) || bcryptRounds < 10 || bcryptRounds > 15) {
    throw new Error('BCRYPT_ROUNDS must be an integer between 10 and 15');
  }

  return { email, password, firstName, lastName, bcryptRounds };
}

async function main() {
  const { email, password, firstName, lastName, bcryptRounds } = getAdminCredentials();
  const passwordHash = await bcrypt.hash(password, bcryptRounds);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      firstName,
      lastName,
      role: Role.ADMIN,
      isActive: true,
    },
    create: {
      email,
      passwordHash,
      firstName,
      lastName,
      role: Role.ADMIN,
      isActive: true,
    },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
    },
  });

  console.info(`Admin user ready: ${admin.email} (${admin.role}, active=${admin.isActive})`);
}

main()
  .catch((err) => {
    console.error('Failed to seed admin user');
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
