import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis;

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['error', 'warn'],
    // Disable prepared statements to avoid conflicts in development
    datasources: {
      db: {
        url: `${process.env.DATABASE_URL}?pgbouncer=true&connect_timeout=10`,
      },
    },
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;