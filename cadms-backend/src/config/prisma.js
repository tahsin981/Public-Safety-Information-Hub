const { PrismaClient } = require("@prisma/client");

const globalForPrisma = globalThis;
const prisma = globalForPrisma.__cadmsPrisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__cadmsPrisma = prisma;
}

module.exports = prisma;
