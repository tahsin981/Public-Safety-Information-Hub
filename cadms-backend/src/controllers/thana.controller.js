const { z } = require("zod");
const prisma = require("../config/prisma");
const HttpError = require("../utils/httpError");
const { writeAudit } = require("../utils/audit");

const stationInput = z.object({
  geo_code: z.string().trim().min(1).max(20),
  thana_name: z.string().trim().min(2).max(100),
  district: z.string().trim().min(2).max(100),
  thana_email: z.string().email().max(150),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  tel_no: z.string().trim().min(5).max(20)
});

async function list(req, res) {
  const data = await prisma.thana_info.findMany({
    include: { _count: { select: { thana_officers: true, complaint_submissions: true } } },
    orderBy: { thana_name: "asc" }
  });
  res.json({ success: true, data });
}
async function getById(req, res) {
  const data = await prisma.thana_info.findUnique({
    where: { geo_code: req.params.id },
    include: { thana_officers: true, _count: { select: { complaint_submissions: true } } }
  });
  if (!data) throw new HttpError(404, "Police station not found.");
  res.json({ success: true, data });
}
async function create(req, res) {
  const b = stationInput.parse(req.body);
  const data = await prisma.thana_info.create({ data: {
    ...b,
    latitude: b.latitude == null ? null : b.latitude,
    longitude: b.longitude == null ? null : b.longitude
  }});
  await writeAudit({ userId: req.user.user_id, entityType: "case", action: "CREATE", details: `Created police station ${data.geo_code}.` });
  res.status(201).json({ success: true, data });
}
async function update(req, res) {
  const b = stationInput.partial().omit({ geo_code: true }).strict().refine((x) => Object.keys(x).length > 0, "Provide at least one field.").parse(req.body);
  const data = await prisma.thana_info.update({ where: { geo_code: req.params.id }, data: b });
  await writeAudit({ userId: req.user.user_id, entityType: "case", action: "UPDATE", details: `Updated police station ${data.geo_code}.` });
  res.json({ success: true, data });
}
async function remove(req, res) {
  await prisma.thana_info.delete({ where: { geo_code: req.params.id } });
  await writeAudit({ userId: req.user.user_id, entityType: "case", action: "DELETE", details: `Deleted police station ${req.params.id}.` });
  res.json({ success: true, message: "Police station deleted." });
}
module.exports = { list, getById, create, update, remove };
