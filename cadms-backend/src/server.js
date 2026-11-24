require("dotenv").config();
const app = require("./app");
const prisma = require("./config/prisma");

const port = Number(process.env.PORT) || 5000;

async function start() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is missing.");
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be set and should contain at least 32 characters.");
  }
  await prisma.$connect();
  app.listen(port, () => console.log(`CADMS API listening on http://localhost:${port}`));
}

start().catch(async (error) => {
  console.error("Failed to start API:", error);
  await prisma.$disconnect();
  process.exit(1);
});

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
