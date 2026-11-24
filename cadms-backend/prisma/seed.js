require("dotenv").config();
const bcrypt = require("bcryptjs");
const { PrismaClient, Role } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const name = process.env.SEED_ADMIN_NAME;
  const email = process.env.SEED_ADMIN_EMAIL;
  const phone = process.env.SEED_ADMIN_PHONE;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!name || !email || !phone || !password) {
    throw new Error("Set SEED_ADMIN_NAME, SEED_ADMIN_EMAIL, SEED_ADMIN_PHONE, and SEED_ADMIN_PASSWORD before seeding.");
  }
  if (password.length < 12) {
    throw new Error("Seed admin password must be at least 12 characters.");
  }

  const password_hash = await bcrypt.hash(password, 12);
  await prisma.user.upsert({
    where: { email },
    update: { user_name: name, phone_number: phone, password_hash, role: Role.ADMIN },
    create: { user_name: name, email, phone_number: phone, password_hash, role: Role.ADMIN }
  });

  console.log(`Bootstrap admin ensured: ${email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
