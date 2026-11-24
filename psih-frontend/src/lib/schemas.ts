import { z } from 'zod';
import { ApiError } from '../api/client';
import { CRIME_TYPES, FILE_TYPES, OFFICER_RANKS, ROLES } from './types';

// Mirrors cadms-backend validators so users see errors before a round trip.
export const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
});
export const registerSchema = z.object({
  user_name: z.string().trim().min(2, 'Name must be at least 2 characters.').max(100),
  email: z.string().trim().email('Enter a valid email address.').max(150),
  phone_number: z.string().trim().min(7, 'Phone must be at least 7 characters.').max(20),
  password: z.string().min(10, 'Password must be at least 10 characters.').max(72, 'Password must be 72 characters or fewer.'),
});
export const complaintSchema = z.object({
  thana_code: z.string().trim().min(1, 'Choose a police station.'),
  area: z.string().trim().min(1, 'Describe the area or landmark.').max(150, 'Keep this under 150 characters.'),
  crime_type: z.enum(CRIME_TYPES, { errorMap: () => ({ message: 'Choose an incident type.' }) }),
  case_description: z.string().trim().min(10, 'Please give at least 10 characters of detail.').max(10000),
});

export const evidenceSchema = z.object({
  file_type: z.enum(FILE_TYPES, { errorMap: () => ({ message: 'Choose a file type.' }) }),
  file_path: z.string().trim().min(1, 'Enter the storage reference.').max(500, 'Keep this under 500 characters.'),
});
export const analysisSchema = z.object({
  thana_code: z.string().min(1, 'Choose a police station.'),
  crime_type: z.enum(CRIME_TYPES, { errorMap: () => ({ message: 'Choose a crime type.' }) }),
  period_start: z.string().min(1, 'Choose a start date.'),
  period_end: z.string().min(1, 'Choose an end date.'),
  risk_level: z.enum(['low', 'medium', 'high'], { errorMap: () => ({ message: 'Choose a risk level.' }) }),
}).refine((v) => !v.period_start || !v.period_end || v.period_start <= v.period_end, {
  message: 'End date must be on or after the start date.', path: ['period_end'],
});

export type Errors = Record<string, string>;
export function validate<T>(schema: z.ZodType<T>, data: unknown): { value?: T; errors: Errors } {
  const r = schema.safeParse(data);
  if (r.success) return { value: r.data, errors: {} };
  const errors: Errors = {};
  for (const i of r.error.issues) errors[i.path.join('.')] ??= i.message;
  return { errors };
}

// ---- Admin forms (mirror the backend's users / officers / thanas validators) ----
const coord = (min: number, max: number, name: string) =>
  z.string().trim().refine((v) => v === '' || (!Number.isNaN(Number(v)) && Number(v) >= min && Number(v) <= max),
    `${name} must be a number between ${min} and ${max}.`);
export const stationSchema = z.object({
  geo_code: z.string().trim().min(1, 'Enter a station code.').max(20, 'Max 20 characters.'),
  thana_name: z.string().trim().min(2, 'At least 2 characters.').max(100),
  district: z.string().trim().min(2, 'At least 2 characters.').max(100),
  thana_email: z.string().trim().email('Enter a valid email address.').max(150),
  tel_no: z.string().trim().min(5, 'At least 5 characters.').max(20),
  latitude: coord(-90, 90, 'Latitude'),
  longitude: coord(-180, 180, 'Longitude'),
});
export const officerSchema = z.object({
  employee_id: z.string().trim().min(1, 'Enter an employee ID.').max(50),
  first_name: z.string().trim().min(1, 'Enter a first name.').max(50),
  last_name: z.string().trim().max(50),
  phone_number: z.string().trim().min(7, 'At least 7 characters.').max(20),
  thana_code: z.string().min(1, 'Choose a station.'),
  rank: z.enum(OFFICER_RANKS as [string, ...string[]], { errorMap: () => ({ message: 'Choose a rank.' }) }),
});
export const userEditSchema = registerSchema.omit({ password: true }).extend({
  role: z.enum(ROLES as [string, ...string[]], { errorMap: () => ({ message: 'Choose a role.' }) }),
  employee_code: z.string(),
});
export const userCreateSchema = userEditSchema.extend({ password: registerSchema.shape.password });

// Staff access only works when the account role equals the linked officer's rank.
export const rankMatchesRole = (role: string, rank?: string) => !rank || rank === role;

export function serverFormError(err: unknown, fallback: string): { errors: Errors; message: string } {
  if (!(err instanceof ApiError)) return { errors: {}, message: fallback };
  const errors: Errors = {};
  err.details?.forEach((d) => { if (typeof d === 'object' && d.field) errors[d.field] ??= d.message; });
  return { errors, message: err.message };
}
