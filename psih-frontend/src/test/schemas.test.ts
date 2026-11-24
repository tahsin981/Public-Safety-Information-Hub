import { complaintSchema, registerSchema, validate } from '../lib/schemas';

describe('complaintSchema', () => {
  it('rejects short descriptions and missing station', () => {
    const { errors } = validate(complaintSchema, { thana_code: '', area: 'x', crime_type: 'theft', case_description: 'short' });
    expect(errors.thana_code).toBeTruthy();
    expect(errors.case_description).toMatch(/10 characters/);
  });
  it('accepts a valid complaint', () => {
    const { value } = validate(complaintSchema, { thana_code: 'CTG-001', area: 'GEC', crime_type: 'theft', case_description: 'Phone stolen near the market.' });
    expect(value?.crime_type).toBe('theft');
  });
});
describe('registerSchema', () => {
  it('enforces the backend 10-character password minimum', () => {
    const { errors } = validate(registerSchema, { user_name: 'Ana', email: 'a@b.co', phone_number: '01700000000', password: 'short' });
    expect(errors.password).toMatch(/10/);
  });
});

import { analysisSchema, evidenceSchema } from '../lib/schemas';
describe('analysisSchema', () => {
  const base = { thana_code: 'CTG-001', crime_type: 'theft', risk_level: 'medium' };
  it('rejects an end date before the start date', () => {
    const { errors } = validate(analysisSchema, { ...base, period_start: '2026-02-01', period_end: '2026-01-01' });
    expect(errors.period_end).toMatch(/on or after/);
  });
  it('accepts a valid period', () => {
    expect(validate(analysisSchema, { ...base, period_start: '2026-01-01', period_end: '2026-01-31' }).value).toBeTruthy();
  });
});
describe('evidenceSchema', () => {
  it('requires a type and a reference', () => {
    const { errors } = validate(evidenceSchema, { file_type: '', file_path: '  ' });
    expect(errors.file_type).toBeTruthy(); expect(errors.file_path).toBeTruthy();
  });
});

import { officerSchema, rankMatchesRole, stationSchema, userCreateSchema } from '../lib/schemas';
describe('admin schemas', () => {
  const st = { geo_code: 'CTG-001', thana_name: 'Kotwali', district: 'Chattogram', thana_email: 'k@x.bd', tel_no: '0312345', latitude: '', longitude: '' };
  it('allows empty coordinates but rejects out-of-range ones', () => {
    expect(validate(stationSchema, st).value).toBeTruthy();
    expect(validate(stationSchema, { ...st, latitude: '123' }).errors.latitude).toMatch(/between -90 and 90/);
  });
  it('requires a rank and station for officers', () => {
    const { errors } = validate(officerSchema, { employee_id: 'E1', first_name: 'A', last_name: '', phone_number: '01700000000', thana_code: '', rank: '' });
    expect(errors.thana_code).toBeTruthy(); expect(errors.rank).toBeTruthy();
  });
  it('requires a password for new users', () => {
    const { errors } = validate(userCreateSchema, { user_name: 'Ana', email: 'a@b.co', phone_number: '01700000000', role: 'SI', employee_code: '', password: 'x' });
    expect(errors.password).toBeTruthy();
  });
  it('only accepts a linked officer whose rank equals the role', () => {
    expect(rankMatchesRole('SI', 'SI')).toBe(true);
    expect(rankMatchesRole('SI', 'OC')).toBe(false);
    expect(rankMatchesRole('SI', undefined)).toBe(true);
  });
});
