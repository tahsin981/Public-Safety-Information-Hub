const bcrypt = require("bcryptjs");
const { z } = require("zod");
const prisma = require("../config/prisma");
const HttpError = require("../utils/httpError");
const { writeAudit } = require("../utils/audit");
const { Role } = require("@prisma/client");

async function list(req, res) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const [data, total] = await Promise.all([
    prisma.user.findMany({
      skip: (page - 1) * limit, take: limit, orderBy: { createdAt: "desc" },
      select: { user_id: true, employee_code: true, user_name: true, email: true, role: true, phone_number: true, createdAt: true, updatedAt: true }
    }),
    prisma.user.count()
  ]);
  res.json({ success: true, data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}

async function getById(req, res) {
  const user = await prisma.user.findUnique({
    where: { user_id: req.params.id },
    select: { user_id: true, employee_code: true, user_name: true, email: true, role: true, phone_number: true, createdAt: true, updatedAt: true }
  });
  if (!user) throw new HttpError(404, "User not found.");
  res.json({ success: true, data: user });
}

async function create(req, res) {
  const body = z.object({
    user_name: z.string().trim().min(2).max(100),
    email: z.string().email().max(150),
    phone_number: z.string().min(7).max(20),
    password: z.string().min(10).max(72),
    role: z.nativeEnum(Role).default(Role.COMMON),
    employee_code: z.string().max(50).nullable().optional()
  }).parse(req.body);

  const password_hash = await bcrypt.hash(body.password, 12);
  const user = await prisma.user.create({
    data: {
      user_name: body.user_name,
      email: body.email.toLowerCase(),
      phone_number: body.phone_number,
      password_hash,
      role: body.role,
      employee_code: body.employee_code || null
    },
    select: { user_id: true, employee_code: true, user_name: true, email: true, role: true, phone_number: true, createdAt: true }
  });
  await writeAudit({ userId: req.user.user_id, entityType: "user", action: "CREATE", details: `Created user ${user.user_id}.` });
  res.status(201).json({ success: true, data: user });
}

async function update(req, res) {
  const body = z.object({
    user_name: z.string().trim().min(2).max(100).optional(),
    email: z.string().email().max(150).optional(),
    phone_number: z.string().min(7).max(20).optional(),
    role: z.nativeEnum(Role).optional(),
    employee_code: z.string().max(50).nullable().optional()
  }).strict().refine((obj) => Object.keys(obj).length > 0, "Provide at least one field.").parse(req.body);

  const user = await prisma.user.update({
    where: { user_id: req.params.id },
    data: { ...body, ...(body.email ? { email: body.email.toLowerCase() } : {}) },
    select: { user_id: true, employee_code: true, user_name: true, email: true, role: true, phone_number: true, createdAt: true, updatedAt: true }
  });
  await writeAudit({ userId: req.user.user_id, entityType: "user", action: "UPDATE", details: `Updated user ${user.user_id}.` });
  res.json({ success: true, data: user });
}

async function remove(req, res) {
  if (req.params.id === req.user.user_id) throw new HttpError(400, "You cannot delete your own account through this endpoint.");
  await prisma.user.delete({ where: { user_id: req.params.id } });
  await writeAudit({ userId: req.user.user_id, entityType: "user", action: "DELETE", details: `Deleted user ${req.params.id}.` });
  res.json({ success: true, message: "User deleted." });
}

module.exports = { list, getById, create, update, remove };
