const prisma = require("../config/prisma");

async function writeAudit({ userId, entityType, action, details }) {
  // Audit_log.UserId is required by the supplied data model.
  if (!userId) return;
  try {
    await prisma.audit_log.create({
      data: {
        UserId: userId,
        entity_type: entityType,
        action,
        details: String(details).slice(0, 5000)
      }
    });
  } catch (error) {
    // Do not silently hide audit failures in development logs.
    console.error("Audit log write failed:", error.message);
  }
}
module.exports = { writeAudit };
