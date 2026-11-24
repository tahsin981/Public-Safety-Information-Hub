const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const prisma = require("../config/prisma");
const HttpError = require("../utils/httpError");
const { writeAudit } = require("../utils/audit");
const { Role } = require("@prisma/client");

function issueToken(user) {
  return jwt.sign(
    { role: user.role },
    process.env.JWT_SECRET,
    { subject: user.user_id, expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
  );
}

async function register(req, res) {
  const body = z.object({
    user_name: z.string().trim().min(2).max(100),
    email: z.string().trim().email().max(150),
    phone_number: z.string().trim().min(7).max(20),
    password: z.string().min(10).max(72)
  }).parse(req.body);

  const password_hash = await bcrypt.hash(body.password, 12);
  const user = await prisma.user.create({
    data: {
      user_name: body.user_name,
      email: body.email.toLowerCase(),
      phone_number: body.phone_number,
      password_hash,
      role: Role.COMMON
    },
    select: { user_id: true, user_name: true, email: true, phone_number: true, role: true, createdAt: true }
  });

  res.status(201).json({ success: true, message: "Account created.", data: user });
}

async function login(req, res) {
  const body = z.object({
    email: z.string().trim().email(),
    password: z.string().min(1).max(72)
  }).parse(req.body);

  const user = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
  if (!user || !(await bcrypt.compare(body.password, user.password_hash))) {
    throw new HttpError(401, "Invalid email or password.");
  }

  await writeAudit({
    userId: user.user_id,
    entityType: "user",
    action: "LOGIN",
    details: "User logged in successfully."
  });

  const { password_hash, ...safeUser } = user;
  res.json({ success: true, message: "Login successful.", data: { user: safeUser, token: issueToken(user) } });
}

async function me(req, res) {
  res.json({ success: true, data: req.user });
}

async function logout(req, res) {
  await writeAudit({
    userId: req.user.user_id,
    entityType: "user",
    action: "LOGOUT",
    details: "User logged out. JWT remains valid until expiry; client should discard it."
  });
  res.json({ success: true, message: "Logout recorded. Discard the token on the client." });
}

module.exports = { register, login, me, logout };
