const { z } = require("zod");
const { CrimeType, SubmissionStatus, EntityType, AuditAction } = require("@prisma/client");
const prisma = require("../config/prisma");
const HttpError = require("../utils/httpError");
const { writeAudit } = require("../utils/audit");

const createSchema = z.object({
  thana_code: z.string().trim().min(1).max(20),
  area: z.string().trim().min(1).max(150),
  crime_type: z.nativeEnum(CrimeType),
  case_description: z.string().trim().min(10).max(10000)
});
async function list(req, res) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const where = {};
  if (req.query.status) where.submission_status = SubmissionStatus[String(req.query.status)];
  if (req.query.crime_type) where.crime_type = CrimeType[String(req.query.crime_type)];
  if (req.query.thana_code) where.thana_code = String(req.query.thana_code);
  if (req.user.role === "COMMON") where.login_id = req.user.user_id;
  const [data, total] = await Promise.all([
    prisma.complaint_submission.findMany({
      where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: "desc" },
      include: {
        thana_info: { select: { geo_code: true, thana_name: true, district: true } },
        user: { select: { user_id: true, user_name: true, email: true } },
        _count: { select: { case_evidences: true, si_assignments: true } }
      }
    }),
    prisma.complaint_submission.count({ where })
  ]);
  res.json({ success: true, data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}
async function getById(req, res) {
  const data = await prisma.complaint_submission.findUnique({
    where: { complaint_id: req.params.id },
    include: {
      thana_info: true,
      user: { select: { user_id: true, user_name: true, email: true, phone_number: true } },
      case_evidences: true,
      si_assignments: { include: { current_officer: true, previous_officer: true, crime_investigations: { include: { case_reviews: true } } } }
    }
  });
  if (!data) throw new HttpError(404, "Complaint not found.");
  if (req.user.role === "COMMON" && data.login_id !== req.user.user_id) throw new HttpError(403, "You can only view your own complaints.");
  res.json({ success: true, data });
}
async function create(req, res) {
  const b = createSchema.parse(req.body);
  const data = await prisma.complaint_submission.create({
    data: { ...b, login_id: req.user.user_id },
    include: { thana_info: { select: { geo_code: true, thana_name: true, district: true } } }
  });
  await writeAudit({ userId: req.user.user_id, entityType: EntityType.complaint, action: AuditAction.CREATE, details: `Submitted complaint ${data.complaint_id}.` });
  res.status(201).json({ success: true, message: "Complaint submitted.", data });
}
async function updateStatus(req, res) {
  const b = z.object({ submission_status: z.nativeEnum(SubmissionStatus) }).parse(req.body);
  const data = await prisma.complaint_submission.update({
    where: { complaint_id: req.params.id },
    data: { submission_status: b.submission_status }
  });
  await writeAudit({ userId: req.user.user_id, entityType: EntityType.complaint, action: AuditAction.STATUS_CHANGE, details: `Complaint ${data.complaint_id} status changed to ${data.submission_status}.` });
  res.json({ success: true, data });
}
async function remove(req, res) {
  const existing = await prisma.complaint_submission.findUnique({ where: { complaint_id: req.params.id } });
  if (!existing) throw new HttpError(404, "Complaint not found.");
  if (req.user.role === "COMMON" && existing.login_id !== req.user.user_id) throw new HttpError(403, "You can only delete your own complaints.");
  if (req.user.role === "COMMON" && existing.submission_status !== "PENDING") throw new HttpError(403, "Only pending complaints can be withdrawn by their submitter.");
  await prisma.complaint_submission.delete({ where: { complaint_id: req.params.id } });
  await writeAudit({ userId: req.user.user_id, entityType: EntityType.complaint, action: AuditAction.DELETE, details: `Deleted complaint ${req.params.id}.` });
  res.json({ success: true, message: "Complaint deleted." });
}
module.exports = { list, getById, create, updateStatus, remove };
