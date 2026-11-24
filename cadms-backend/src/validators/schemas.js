const { z } = require("zod");
const { Role, CrimeType, SubmissionStatus, FileType, OfficerRank,
  InvestigationStatus, CaseFlag, RiskLevel, EntityType, AuditAction } = require("@prisma/client");

const uuid = z.string().uuid();
const email = z.string().trim().email().max(150);
const phone = z.string().trim().min(7).max(20);
const nonEmpty = (max = 500) => z.string().trim().min(1).max(max);

const registerSchema = z.object({
  body: z.object({
    user_name: nonEmpty(100),
    email,
    phone_number: phone,
    password: z.string().min(10).max(72)
  }),
  params: z.object({}),
  query: z.object({})
});

const loginSchema = z.object({
  body: z.object({
    email,
    password: z.string().min(1).max(72)
  }),
  params: z.object({}),
  query: z.object({})
});

const complaintSchema = z.object({
  body: z.object({
    thana_code: nonEmpty(20),
    area: nonEmpty(150),
    crime_type: z.nativeEnum(CrimeType),
    case_description: z.string().trim().min(10).max(10000)
  }),
  params: z.object({}),
  query: z.object({})
});

const idParamSchema = z.object({
  body: z.any().optional(),
  params: z.object({ id: z.string().min(1) }),
  query: z.object({})
});

const enums = { Role, CrimeType, SubmissionStatus, FileType, OfficerRank,
  InvestigationStatus, CaseFlag, RiskLevel, EntityType, AuditAction };
module.exports = { registerSchema, loginSchema, complaintSchema, idParamSchema, enums };
