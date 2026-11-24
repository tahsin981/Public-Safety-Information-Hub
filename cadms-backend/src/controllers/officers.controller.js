const { z } = require("zod");
const { OfficerRank } = require("@prisma/client");
const prisma = require("../config/prisma");
const HttpError = require("../utils/httpError");
const { writeAudit } = require("../utils/audit");

const input = z.object({
  employee_id: z.string().trim().min(1).max(50),
  first_name: z.string().trim().min(1).max(50),
  last_name: z.string().trim().max(50).nullable().optional(),
  phone_number: z.string().trim().min(7).max(20),
  thana_code: z.string().trim().min(1).max(20),
  rank: z.nativeEnum(OfficerRank)
});
async function list(req, res) {
  const data = await prisma.thana_officer.findMany({
    where: req.query.thana_code ? { thana_code: String(req.query.thana_code) } : undefined,
    include: { thana_info: true, user: { select: { user_id: true, user_name: true, email: true, role: true } } },
    orderBy: { assignedAt: "desc" }
  });
  res.json({ success: true, data });
}
async function getById(req, res) {
  const data = await prisma.thana_officer.findUnique({ where: { employee_id: req.params.id }, include: { thana_info: true, user: true } });
  if (!data) throw new HttpError(404, "Officer not found.");
  if (data.user) delete data.user.password_hash;
  res.json({ success: true, data });
}
async function create(req, res) {
  const b = input.parse(req.body);
  const data = await prisma.thana_officer.create({ data: b, include: { thana_info: true } });
  await writeAudit({ userId: req.user.user_id, entityType: "user", action: "CREATE", details: `Created officer ${data.employee_id}.` });
  res.status(201).json({ success: true, data });
}
async function update(req, res) {
  const b = input.omit({ employee_id: true }).partial().strict().refine((x) => Object.keys(x).length > 0, "Provide at least one field.").parse(req.body);
  const data = await prisma.thana_officer.update({ where: { employee_id: req.params.id }, data: b, include: { thana_info: true } });
  await writeAudit({ userId: req.user.user_id, entityType: "user", action: "UPDATE", details: `Updated officer ${data.employee_id}.` });
  res.json({ success: true, data });
}
async function remove(req, res) {
  await prisma.thana_officer.delete({ where: { employee_id: req.params.id } });
  await writeAudit({ userId: req.user.user_id, entityType: "user", action: "DELETE", details: `Deleted officer ${req.params.id}.` });
  res.json({ success: true, message: "Officer deleted." });
}
module.exports = { list, getById, create, update, remove };
