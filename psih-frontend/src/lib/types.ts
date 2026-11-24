export type Role = 'DUTYOFFICER' | 'SI' | 'CRIMEANALYST' | 'ADMIN' | 'COMMON' | 'OC';
export const CRIME_TYPES = [
  'theft', 'domestic_violence', 'cyber_crime', 'fraud', 'extortion', 'drug_offense',
  'smuggling', 'vandalism', 'public_disorder', 'corruption', 'others',
] as const;
export type CrimeType = (typeof CRIME_TYPES)[number];
export type SubmissionStatus = 'PENDING' | 'SUBMITTED' | 'REJECTED';

export interface User {
  user_id: string; user_name: string; email: string; role: Role;
  employee_code?: string | null; phone_number: string;
}
export interface Thana {
  geo_code: string; thana_name: string; district: string; thana_email: string; tel_no: string;
  latitude: string | number | null; longitude: string | number | null; // Prisma Decimal arrives as string
}
export interface Complaint {
  complaint_id: string; thana_code: string; area: string; crime_type: CrimeType;
  case_description: string; submission_status: SubmissionStatus; createdAt: string;
  thana_info?: Pick<Thana, 'geo_code' | 'thana_name' | 'district'>;
  user?: { user_name: string; email: string };
  _count?: { case_evidences: number; si_assignments: number };
}
export interface AuditLog {
  log_id: string; entity_type: string; action: string; details: string; createdAt: string;
  user: { user_name: string; email: string; role: Role };
}
export interface Pagination { page: number; limit: number; total: number; pages: number }
export interface Envelope<T> { success: boolean; message?: string; data: T; pagination?: Pagination }
export interface DashboardStats {
  totalComplaints: number; pendingComplaints: number; submittedComplaints: number;
  rejectedComplaints: number; openInvestigations: number; solvedInvestigations: number;
  totalUsers: number; totalStations: number; totalOfficers: number;
}

export const STAFF_ROLES: Role[] = ['ADMIN', 'DUTYOFFICER', 'OC', 'SI', 'CRIMEANALYST'];
export const DASHBOARD_ROLES: Role[] = ['ADMIN', 'DUTYOFFICER', 'OC', 'CRIMEANALYST'];
export const STATUS_EDIT_ROLES: Role[] = ['ADMIN', 'DUTYOFFICER', 'OC'];
export const label = (s: string) => s.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

export type OfficerRank = 'DUTYOFFICER' | 'SI' | 'CRIMEANALYST' | 'ADMIN' | 'OC' | 'SP';
export type InvestigationStatus = 'under_investigation' | 'solved';
export type CaseFlag = 'red' | 'green';
export type RiskLevel = 'low' | 'medium' | 'high';
export const FILE_TYPES = ['document', 'video', 'audio', 'image'] as const;
export type FileType = (typeof FILE_TYPES)[number];

export interface Officer {
  employee_id: string; first_name: string; last_name?: string | null;
  phone_number: string; thana_code: string; rank: OfficerRank;
  thana_info?: Thana; user?: { user_id: string; user_name: string; email: string; role: Role } | null;
}
export interface AdminUser extends User { createdAt: string }
export const ROLES: Role[] = ['COMMON', 'DUTYOFFICER', 'SI', 'OC', 'CRIMEANALYST', 'ADMIN'];
export const OFFICER_RANKS: OfficerRank[] = ['DUTYOFFICER', 'SI', 'OC', 'CRIMEANALYST', 'ADMIN', 'SP'];
export interface Review { review_id: string; inves_id: string; oc_id: string; flag: CaseFlag; createdAt: string }
export interface Investigation {
  investigation_id: string; assignment_id: string; investigation_status: InvestigationStatus; createdAt: string;
  assigned_officer: { current_SI_id: string; complaint: Complaint; current_officer: Officer };
  case_reviews: Review[];
}
export interface Evidence { evidence_id: string; complaint_id: string; file_type: FileType; file_path: string; uploadedAt: string }
export interface Assignment {
  assignment_id: string; current_SI_id: string; previous_sI_id: string | null; assignedAt: string;
  current_officer: Officer; previous_officer: Officer | null;
  crime_investigations: (Pick<Investigation, 'investigation_id' | 'investigation_status'> & { case_reviews: Review[] })[];
}
export interface ComplaintDetail extends Complaint {
  case_evidences: Evidence[]; si_assignments: Assignment[];
  user?: { user_name: string; email: string; phone_number?: string };
}
export interface Analysis {
  analysis_id: string; thana_code: string; crime_type: CrimeType; period_start: string; period_end: string;
  risk_level: RiskLevel; thana_info?: Thana;
}

// Mirrors allowRoles() in the backend routes.
export const ASSIGN_ROLES: Role[] = ['ADMIN', 'DUTYOFFICER', 'OC'];
export const INVESTIGATION_ROLES: Role[] = ['ADMIN', 'DUTYOFFICER', 'SI', 'OC'];
export const INVESTIGATION_EDIT_ROLES: Role[] = ['ADMIN', 'SI', 'OC'];
export const REVIEW_ROLES: Role[] = ['ADMIN', 'OC'];
export const EVIDENCE_ADD_ROLES: Role[] = ['ADMIN', 'DUTYOFFICER', 'SI'];
export const ANALYSIS_ROLES: Role[] = ['ADMIN', 'CRIMEANALYST', 'OC'];
export const ANALYSIS_WRITE_ROLES: Role[] = ['ADMIN', 'CRIMEANALYST'];
export const officerName = (o: Pick<Officer, 'first_name' | 'last_name' | 'employee_id'>) =>
  `${o.first_name}${o.last_name ? ' ' + o.last_name : ''} (${o.employee_id})`;
