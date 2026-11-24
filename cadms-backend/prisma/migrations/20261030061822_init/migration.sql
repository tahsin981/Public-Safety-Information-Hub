-- CreateEnum
CREATE TYPE "Role" AS ENUM ('DUTYOFFICER', 'SI', 'CRIMEANALYST', 'ADMIN', 'COMMON', 'OC');

-- CreateEnum
CREATE TYPE "OfficerRank" AS ENUM ('DUTYOFFICER', 'SI', 'CRIMEANALYST', 'ADMIN', 'OC', 'SP');

-- CreateEnum
CREATE TYPE "CrimeType" AS ENUM ('theft', 'domestic_violence', 'cyber_crime', 'fraud', 'extortion', 'drug_offense', 'smuggling', 'vandalism', 'public_disorder', 'corruption', 'others');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'SUBMITTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "FileType" AS ENUM ('document', 'video', 'audio', 'image');

-- CreateEnum
CREATE TYPE "InvestigationStatus" AS ENUM ('under_investigation', 'solved');

-- CreateEnum
CREATE TYPE "CaseFlag" AS ENUM ('red', 'green');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('complaint', 'case', 'evidence', 'user');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'ASSIGN', 'UNASSIGN', 'STATUS_CHANGE');

-- CreateTable
CREATE TABLE "User" (
    "user_id" UUID NOT NULL,
    "employee_code" VARCHAR(50),
    "user_name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "password_hash" CHAR(60) NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'COMMON',
    "phone_number" VARCHAR(20) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "Thana_info" (
    "geo_code" VARCHAR(20) NOT NULL,
    "thana_name" VARCHAR(100) NOT NULL,
    "district" VARCHAR(100) NOT NULL,
    "thana_email" VARCHAR(150) NOT NULL,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "tel_no" VARCHAR(20) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Thana_info_pkey" PRIMARY KEY ("geo_code")
);

-- CreateTable
CREATE TABLE "Thana_officer" (
    "employee_id" VARCHAR(50) NOT NULL,
    "first_name" VARCHAR(50) NOT NULL,
    "last_name" VARCHAR(50),
    "phone_number" VARCHAR(20) NOT NULL,
    "thana_code" VARCHAR(20) NOT NULL,
    "rank" "OfficerRank" NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Thana_officer_pkey" PRIMARY KEY ("employee_id")
);

-- CreateTable
CREATE TABLE "Complaint_submission" (
    "complaint_id" UUID NOT NULL,
    "login_id" UUID NOT NULL,
    "thana_code" VARCHAR(20) NOT NULL,
    "area" VARCHAR(150) NOT NULL,
    "crime_type" "CrimeType" NOT NULL,
    "case_description" TEXT NOT NULL,
    "submission_status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Complaint_submission_pkey" PRIMARY KEY ("complaint_id")
);

-- CreateTable
CREATE TABLE "Case_evidence" (
    "evidence_id" UUID NOT NULL,
    "complaint_id" UUID NOT NULL,
    "file_type" "FileType" NOT NULL,
    "file_path" VARCHAR(500) NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Case_evidence_pkey" PRIMARY KEY ("evidence_id")
);

-- CreateTable
CREATE TABLE "SIAssignment" (
    "assignment_id" UUID NOT NULL,
    "previous_sI_id" VARCHAR(50),
    "current_SI_id" VARCHAR(50) NOT NULL,
    "complaint_id" UUID NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SIAssignment_pkey" PRIMARY KEY ("assignment_id")
);

-- CreateTable
CREATE TABLE "Crime_investigation" (
    "investigation_id" UUID NOT NULL,
    "assignment_id" UUID NOT NULL,
    "investigation_status" "InvestigationStatus" NOT NULL DEFAULT 'under_investigation',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Crime_investigation_pkey" PRIMARY KEY ("investigation_id")
);

-- CreateTable
CREATE TABLE "Case_review" (
    "review_id" UUID NOT NULL,
    "inves_id" UUID NOT NULL,
    "oc_id" VARCHAR(50) NOT NULL,
    "flag" "CaseFlag" NOT NULL DEFAULT 'green',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Case_review_pkey" PRIMARY KEY ("review_id")
);

-- CreateTable
CREATE TABLE "Crime_analysis" (
    "analysis_id" UUID NOT NULL,
    "thana_code" VARCHAR(20) NOT NULL,
    "crime_type" "CrimeType" NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "risk_level" "RiskLevel" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Crime_analysis_pkey" PRIMARY KEY ("analysis_id")
);

-- CreateTable
CREATE TABLE "Audit_log" (
    "log_id" UUID NOT NULL,
    "UserId" UUID NOT NULL,
    "entity_type" "EntityType" NOT NULL,
    "action" "AuditAction" NOT NULL,
    "details" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Audit_log_pkey" PRIMARY KEY ("log_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_employee_code_key" ON "User"("employee_code");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_number_key" ON "User"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "Thana_info_district_key" ON "Thana_info"("district");

-- CreateIndex
CREATE UNIQUE INDEX "Thana_info_thana_email_key" ON "Thana_info"("thana_email");

-- CreateIndex
CREATE UNIQUE INDEX "Thana_officer_phone_number_key" ON "Thana_officer"("phone_number");

-- CreateIndex
CREATE INDEX "Audit_log_UserId_createdAt_idx" ON "Audit_log"("UserId", "createdAt");

-- CreateIndex
CREATE INDEX "Audit_log_entity_type_action_createdAt_idx" ON "Audit_log"("entity_type", "action", "createdAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_employee_code_fkey" FOREIGN KEY ("employee_code") REFERENCES "Thana_officer"("employee_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Thana_officer" ADD CONSTRAINT "Thana_officer_thana_code_fkey" FOREIGN KEY ("thana_code") REFERENCES "Thana_info"("geo_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint_submission" ADD CONSTRAINT "Complaint_submission_login_id_fkey" FOREIGN KEY ("login_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint_submission" ADD CONSTRAINT "Complaint_submission_thana_code_fkey" FOREIGN KEY ("thana_code") REFERENCES "Thana_info"("geo_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case_evidence" ADD CONSTRAINT "Case_evidence_complaint_id_fkey" FOREIGN KEY ("complaint_id") REFERENCES "Complaint_submission"("complaint_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SIAssignment" ADD CONSTRAINT "SIAssignment_previous_sI_id_fkey" FOREIGN KEY ("previous_sI_id") REFERENCES "Thana_officer"("employee_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SIAssignment" ADD CONSTRAINT "SIAssignment_current_SI_id_fkey" FOREIGN KEY ("current_SI_id") REFERENCES "Thana_officer"("employee_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SIAssignment" ADD CONSTRAINT "SIAssignment_complaint_id_fkey" FOREIGN KEY ("complaint_id") REFERENCES "Complaint_submission"("complaint_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Crime_investigation" ADD CONSTRAINT "Crime_investigation_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "SIAssignment"("assignment_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case_review" ADD CONSTRAINT "Case_review_inves_id_fkey" FOREIGN KEY ("inves_id") REFERENCES "Crime_investigation"("investigation_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case_review" ADD CONSTRAINT "Case_review_oc_id_fkey" FOREIGN KEY ("oc_id") REFERENCES "Thana_officer"("employee_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Crime_analysis" ADD CONSTRAINT "Crime_analysis_thana_code_fkey" FOREIGN KEY ("thana_code") REFERENCES "Thana_info"("geo_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Audit_log" ADD CONSTRAINT "Audit_log_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
