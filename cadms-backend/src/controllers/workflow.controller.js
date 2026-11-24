const { z } = require("zod");
const {
  FileType, InvestigationStatus, CaseFlag, CrimeType, RiskLevel, EntityType, AuditAction
} = require("@prisma/client");
const prisma = require("../config/prisma");
const HttpError = require("../utils/httpError");
const { writeAudit } = require("../utils/audit");


async function addEvidence(req, res) {
  const b = z.object({
    complaint_id: z.string().uuid(),
    file_type: z.nativeEnum(FileType),
    file_path: z.string().trim().min(1).max(500)
  }).parse(req.body);

  // Find the complaint.
  const complaint = await prisma.complaint_submission.findUnique({
    where: { complaint_id: b.complaint_id }
  });

  if (!complaint) {
    throw new HttpError(404, "Complaint not found.");
  }

  // Ensure the user can access this complaint's station.
  await checkStationAccess(req, complaint.thana_code);

  // Create the evidence record.
  const data = await prisma.case_evidence.create({
    data: b
  });

  // Record the action in the audit log.
  await writeAudit({
    userId: req.user.user_id,
    entityType: EntityType.evidence,
    action: AuditAction.CREATE,
    details: `Added evidence ${data.evidence_id} to complaint ${b.complaint_id}.`
  });

  res.status(201).json({ success: true, data });
}



async function listEvidence(req, res) {
  // Get the logged-in officer's station.
  const stationCode = await getStationScope(req);

  // Build filters.
  const where = {
    ...(req.query.complaint_id
      ? { complaint_id: String(req.query.complaint_id) }
      : {}),

    ...(stationCode
      ? {
          complaint: {
            thana_code: stationCode
          }
        }
      : {})
  };

  const data = await prisma.case_evidence.findMany({
    where,
    orderBy: { uploadedAt: "desc" }
  });

  res.json({ success: true, data });
}


async function assignSI(req, res) {
  const b = z.object({
    complaint_id: z.string().uuid(),
    current_SI_id: z.string().min(1).max(50)
  }).parse(req.body);

  // Find the complaint and selected SI.
  const [complaint, officer] = await Promise.all([
    prisma.complaint_submission.findUnique({
      where: { complaint_id: b.complaint_id }
    }),
    prisma.thana_officer.findUnique({
      where: { employee_id: b.current_SI_id }
    })
  ]);

  if (!complaint) {
    throw new HttpError(404, "Complaint not found.");
  }

  if (!officer) {
    throw new HttpError(404, "Officer not found.");
  }

  // Ensure the logged-in user can access this complaint's station.
  await checkStationAccess(req, complaint.thana_code);

  // Validate the selected SI.
  if (officer.rank !== "SI") {
    throw new HttpError(400, "The selected officer must have rank SI.");
  }

  if (officer.thana_code !== complaint.thana_code) {
    throw new HttpError(400, "The SI must belong to the complaint's police station.");
  }

  // Create the assignment and investigation.
  const data = await prisma.$transaction(async (tx) => {
    const previous = await tx.sIAssignment.findFirst({
      where: { complaint_id: b.complaint_id },
      orderBy: { assignedAt: "desc" }
    });

    const assignment = await tx.sIAssignment.create({
      data: {
        complaint_id: b.complaint_id,
        current_SI_id: b.current_SI_id,
        previous_sI_id: previous?.current_SI_id || null
      }
    });

    await tx.crime_investigation.create({
      data: { assignment_id: assignment.assignment_id }
    });

    await tx.complaint_submission.update({
      where: { complaint_id: b.complaint_id },
      data: { submission_status: "SUBMITTED" }
    });

    return assignment;
  });

  // Record the assignment in the audit log.
  await writeAudit({
    userId: req.user.user_id,
    entityType: EntityType.case,
    action: AuditAction.ASSIGN,
    details: `Assigned complaint ${b.complaint_id} to SI ${b.current_SI_id}.`
  });

  res.status(201).json({
    success: true,
    message: "SI assigned and investigation opened.",
    data
  });
}


async function listAssignments(req, res) {
  // Get the logged-in officer's station.
  const stationCode = await getStationScope(req);

  // Build filters.
  const where = {
    ...(req.query.complaint_id
      ? { complaint_id: String(req.query.complaint_id) }
      : {}),

    ...(stationCode
      ? {
          complaint: {
            thana_code: stationCode
          }
        }
      : {})
  };

  const data = await prisma.sIAssignment.findMany({
    where,
    include: {
      complaint: true,
      current_officer: true,
      previous_officer: true,
      crime_investigations: true
    },
    orderBy: { assignedAt: "desc" }
  });

  res.json({ success: true, data });
}

async function updateInvestigation(req, res) {
  // Validate the requested status.
  const b = z.object({
    investigation_status: z.nativeEnum(InvestigationStatus)
  }).parse(req.body);

  // Find the investigation and its assigned SI.
  const investigation = await prisma.crime_investigation.findUnique({
    where: { investigation_id: req.params.id },
    include: {
      assigned_officer: {
        include: {
          complaint: true,
          current_officer: true
        }
      }
    }
  });

  if (!investigation) {
    throw new HttpError(404, "Investigation not found.");
  }

  // ADMIN can update any investigation.
  // SI can update only investigations assigned to them.
  if (req.user.role === "SI") {
    const officer = await getRequestOfficer(req);

    if (investigation.assigned_officer.current_SI_id !== officer.employee_id) {
      throw new HttpError(403, "You can only update investigations assigned to you.");
    }

    // Ensure the investigation belongs to the SI's police station.
    await checkStationAccess(req, investigation.assigned_officer.complaint.thana_code);
  }

  // Update the investigation.
  const data = await prisma.crime_investigation.update({
    where: { investigation_id: req.params.id },
    data: {
      investigation_status: b.investigation_status
    },
    include: {
      assigned_officer: {
        include: {
          complaint: true,
          current_officer: true
        }
      }
    }
  });

  // Record the action in the audit log.
  await writeAudit({
    userId: req.user.user_id,
    entityType: EntityType.case,
    action: AuditAction.STATUS_CHANGE,
    details: `Investigation ${data.investigation_id} status changed to ${b.investigation_status}.`
  });

  res.json({ success: true, data });
}

async function listInvestigations(req, res) {
  // Get the logged-in officer's station.
  const stationCode = await getStationScope(req);

  // Build filters.
  const where = {
    ...(req.query.status
      ? { investigation_status: String(req.query.status) }
      : {}),

    ...(stationCode
      ? { assigned_officer: {
          complaint: {
            thana_code: stationCode
          }
        }}
      : {})
  };

  const data = await prisma.crime_investigation.findMany({
    where,
    include: {
      assigned_officer: {
        include: {
          complaint: true,
          current_officer: true
        }
      },
      case_reviews: true
    },
    orderBy: { createdAt: "desc" }
  });

  res.json({ success: true, data });
}

async function createReview(req, res) {
  const b = z.object({
    investigation_id: z.string().uuid(),
    oc_id: z.string().min(1).max(50),
    flag: z.nativeEnum(CaseFlag).default(CaseFlag.green)
  }).parse(req.body);
  const [investigation, officer] = await Promise.all([
    prisma.crime_investigation.findUnique({ where: { investigation_id: b.investigation_id } }),
    prisma.thana_officer.findUnique({ where: { employee_id: b.oc_id } })
  ]);
  if (!investigation) throw new HttpError(404, "Investigation not found.");
  if (!officer) throw new HttpError(404, "OC officer not found.");
  if (officer.rank !== "OC") throw new HttpError(400, "The reviewing officer must have rank OC.");
  const data = await prisma.case_review.create({
    data: { inves_id: b.investigation_id, oc_id: b.oc_id, flag: b.flag }
  });
  await writeAudit({ userId: req.user.user_id, entityType: EntityType.case, action: AuditAction.CREATE, details: `OC ${b.oc_id} reviewed investigation ${b.investigation_id} with flag ${b.flag}.` });
  res.status(201).json({ success: true, data });
}


async function listReviews(req, res) {
  // Get the logged-in officer's station.
  const stationCode = await getStationScope(req);

  // Build filters.
  const where = {
    ...(req.query.investigation_id
      ? { inves_id: String(req.query.investigation_id) }
      : {}),

    ...(stationCode
      ? {
          assignment: {
            assigned_officer: {
              complaint: {
                thana_code: stationCode
              }
            }
          }
        }
      : {})
  };

  const data = await prisma.case_review.findMany({
    where,
    include: {
      assignment: true,
      oc_officer: true
    },
    orderBy: { createdAt: "desc" }
  });

  res.json({ success: true, data });
}



async function createAnalysis(req, res) {
  const b = z.object({
    thana_code: z.string().min(1).max(20),
    crime_type: z.nativeEnum(CrimeType),
    period_start: z.coerce.date(),
    period_end: z.coerce.date(),
    risk_level: z.nativeEnum(RiskLevel)
  }).refine((v) => v.period_start <= v.period_end, {
    message: "period_start must be before or equal to period_end",
    path: ["period_end"]
  }).parse(req.body);

  // Ensure the analyst can access this station.
  await checkStationAccess(req, b.thana_code);

  // Create the crime analysis.
  const data = await prisma.crime_analysis.create({
    data: b
  });

  // Record the action in the audit log.
  await writeAudit({
    userId: req.user.user_id,
    entityType: EntityType.case,
    action: AuditAction.CREATE,
    details: `Recorded ${b.risk_level} risk analysis ${data.analysis_id}.`
  });

  res.status(201).json({
    success: true,
    data,
    note: "Risk level was supplied by an authorized analyst; this endpoint does not calculate risk automatically."
  });
}



async function listAnalyses(req, res) {
  // Get the logged-in officer's station.
  const stationCode = await getStationScope(req);

  // Build filters.
  const where = {
    ...(req.query.thana_code
      ? { thana_code: String(req.query.thana_code) }
      : {}),

    ...(req.query.crime_type
      ? { crime_type: String(req.query.crime_type) }
      : {}),

    ...(stationCode
      ? { thana_code: stationCode }
      : {})
  };

  const data = await prisma.crime_analysis.findMany({
    where,
    include: { thana_info: true },
    orderBy: { period_start: "desc" }
  });

  res.json({ success: true, data });
}



async function dashboard(req, res) {
  // Get the logged-in officer's station.
  const stationCode = await getStationScope(req);

  // Build station-specific filters.
  const complaintScope = stationCode
    ? { thana_code: stationCode }
    : {};

  const investigationScope = stationCode
    ? {
        assigned_officer: {
          is: {
            complaint: {
              is: {
                thana_code: stationCode
              }
            }
          }
        }
      }
    : {};

  const officerScope = stationCode
    ? { thana_code: stationCode }
    : {};

  const userScope = stationCode
    ? {
        thana_officer: {
          is: {
            thana_code: stationCode
          }
        }
      }
    : {};

  const stationFilter = stationCode
    ? { geo_code: stationCode }
    : {};

  // Calculate dashboard statistics.
  const [
    totalComplaints,
    pendingComplaints,
    submittedComplaints,
    rejectedComplaints,
    openInvestigations,
    solvedInvestigations,
    totalUsers,
    totalStations,
    totalOfficers
  ] = await Promise.all([
    prisma.complaint_submission.count({
      where: complaintScope
    }),

    prisma.complaint_submission.count({
      where: {
        ...complaintScope,
        submission_status: "PENDING"
      }
    }),

    prisma.complaint_submission.count({
      where: {
        ...complaintScope,
        submission_status: "SUBMITTED"
      }
    }),

    prisma.complaint_submission.count({
      where: {
        ...complaintScope,
        submission_status: "REJECTED"
      }
    }),

    prisma.crime_investigation.count({
      where: {
        ...investigationScope,
        investigation_status: "under_investigation"
      }
    }),

    prisma.crime_investigation.count({
      where: {
        ...investigationScope,
        investigation_status: "solved"
      }
    }),

    prisma.user.count({
      where: userScope
    }),

    prisma.thana_info.count({
      where: stationFilter
    }),

    prisma.thana_officer.count({
      where: officerScope
    })
  ]);

  res.json({
    success: true,
    data: {
      totalComplaints,
      pendingComplaints,
      submittedComplaints,
      rejectedComplaints,
      openInvestigations,
      solvedInvestigations,
      totalUsers,
      totalStations,
      totalOfficers
    }
  });
}


async function listAuditLogs(req, res) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const [data, total] = await Promise.all([
    prisma.audit_log.findMany({
      skip: (page - 1) * limit, take: limit,
      where: req.query.user_id ? { UserId: String(req.query.user_id) } : undefined,
      include: { user: { select: { user_id: true, user_name: true, email: true, role: true } } },
      orderBy: { createdAt: "desc" }
    }),
    prisma.audit_log.count({ where: req.query.user_id ? { UserId: String(req.query.user_id) } : undefined })
  ]);
  res.json({ success: true, data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}
// Get the officer record linked to the logged-in account.
async function getRequestOfficer(req) {
  if (!req.user.employee_code) {
    throw new HttpError(403, "Your account is not linked to a police officer.");
  }

  const officer = await prisma.thana_officer.findUnique({
    where: { employee_id: req.user.employee_code }
  });

  if (!officer) {
    throw new HttpError(403, "Your linked police officer record was not found.");
  }

  // Ensure the account role matches its linked officer rank.
  if (officer.rank !== req.user.role) {
    throw new HttpError(403, "Your account role does not match your officer rank.");
  }

  return officer;
}

// Check whether the logged-in user can access a particular station.
async function checkStationAccess(req, thanaCode) {
  if (req.user.role === "ADMIN") return null;

  const officer = await getRequestOfficer(req);

  if (officer.thana_code !== thanaCode) {
    throw new HttpError(403, "You cannot access records from another police station.");
  }

  return officer;
}

// Build the station filter used by list and dashboard endpoints.
async function getStationScope(req) {
  if (req.user.role === "ADMIN") return null;

  const officer = await getRequestOfficer(req);
  return officer.thana_code;
}

module.exports = {
  addEvidence, listEvidence, assignSI, listAssignments, updateInvestigation,
  listInvestigations, createReview, listReviews, createAnalysis, listAnalyses,
  dashboard, listAuditLogs
};
