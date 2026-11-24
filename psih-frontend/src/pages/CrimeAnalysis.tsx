import { useState, type FormEvent } from 'react';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { useAnalyses, useCreateAnalysis, useThanas } from '../api/hooks';
import { Button, ErrorBox, Input, Pill, Select, Spinner } from '../components/ui';
import { analysisSchema, validate, type Errors } from '../lib/schemas';
import { ANALYSIS_WRITE_ROLES, CRIME_TYPES, label, type RiskLevel } from '../lib/types';

const TONE: Record<RiskLevel, 'ok' | 'warn' | 'bad'> = { low: 'ok', medium: 'warn', high: 'bad' };

export default function CrimeAnalysis() {
  const { user } = useAuth();
  const { data = [], isLoading, error } = useAnalyses();
  const { data: thanas = [] } = useThanas();
  const create = useCreateAnalysis();
  const [errors, setErrors] = useState<Errors>({});
  const [formErr, setFormErr] = useState('');
  const canWrite = !!user && ANALYSIS_WRITE_ROLES.includes(user.role);
  const count = (r: RiskLevel) => data.filter((a) => a.risk_level === r).length;

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const { value, errors } = validate(analysisSchema, Object.fromEntries(new FormData(form)));
    setErrors(errors); setFormErr('');
    if (!value) return;
    try {
      await create.mutateAsync({
        ...value, period_start: `${value.period_start}T00:00:00.000Z`, period_end: `${value.period_end}T23:59:59.000Z`,
      });
      form.reset();
    } catch (x) {
      if (x instanceof ApiError) {
        const s: Errors = {}; x.details?.forEach((d) => { if (d.field) s[d.field] ??= d.message; });
        setErrors(s); setFormErr(x.message);
      } else setFormErr('Could not save the analysis.');
    }
  };

  return (
    <div className="container section">
      <h1>Crime risk analysis</h1>
      <p className="muted">Risk levels are entered by analysts; the system does not calculate them automatically.</p>
      <ErrorBox message={error?.message} />
      <ul className="tiles" aria-label="Analyses by risk level">
        {(['high', 'medium', 'low'] as RiskLevel[]).map((r) => <li key={r} className="tile"><span className="num">{count(r)}</span><span>{label(r)} risk</span></li>)}
      </ul>
      {canWrite && (
        <form onSubmit={submit} noValidate style={{ maxWidth: 520 }}>
          <h2>Record an analysis</h2>
          <ErrorBox message={formErr} />
          <Select id="thana_code" name="thana_code" label="Police station" defaultValue="" error={errors.thana_code}>
            <option value="" disabled>Select a station…</option>
            {thanas.map((t) => <option key={t.geo_code} value={t.geo_code}>{t.thana_name}, {t.district}</option>)}
          </Select>
          <Select id="crime_type" name="crime_type" label="Crime type" defaultValue="" error={errors.crime_type}>
            <option value="" disabled>Select a type…</option>
            {CRIME_TYPES.map((c) => <option key={c} value={c}>{label(c)}</option>)}
          </Select>
          <Input id="period_start" name="period_start" type="date" label="Period start" error={errors.period_start} />
          <Input id="period_end" name="period_end" type="date" label="Period end" error={errors.period_end} />
          <Select id="risk_level" name="risk_level" label="Risk level" defaultValue="" error={errors.risk_level}>
            <option value="" disabled>Select a level…</option>
            {(['low', 'medium', 'high'] as RiskLevel[]).map((r) => <option key={r} value={r}>{label(r)}</option>)}
          </Select>
          <Button type="submit" loading={create.isPending}>Save analysis</Button>
        </form>
      )}
      <h2 style={{ marginTop: 28 }}>Recorded analyses</h2>
      {isLoading ? <Spinner /> : data.length === 0 ? <p>No analyses recorded yet.</p> : (
        <div className="scroll">
          <table>
            <caption className="sr">Crime risk analyses</caption>
            <thead><tr><th>Period</th><th>Station</th><th>Crime type</th><th>Risk</th></tr></thead>
            <tbody>
              {data.map((a) => (
                <tr key={a.analysis_id}>
                  <td>{new Date(a.period_start).toLocaleDateString()} – {new Date(a.period_end).toLocaleDateString()}</td>
                  <td>{a.thana_info?.thana_name ?? a.thana_code}</td><td>{label(a.crime_type)}</td>
                  <td><Pill tone={TONE[a.risk_level]}>{label(a.risk_level)}</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
