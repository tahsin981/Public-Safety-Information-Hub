import { useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { useAddEvidence, useComplaint } from '../api/hooks';
import { Button, ErrorBox, Input, Pill, Select, Spinner, StatusBadge } from '../components/ui';
import { evidenceSchema, validate, type Errors } from '../lib/schemas';
import { EVIDENCE_ADD_ROLES, FILE_TYPES, label, officerName } from '../lib/types';

export default function ComplaintDetail() {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const { data: c, isLoading, error } = useComplaint(id);
  const add = useAddEvidence();
  const [errors, setErrors] = useState<Errors>({});
  const [formErr, setFormErr] = useState('');
  const canAdd = !!user && EVIDENCE_ADD_ROLES.includes(user.role);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const { value, errors } = validate(evidenceSchema, Object.fromEntries(new FormData(form)));
    setErrors(errors); setFormErr('');
    if (!value) return;
    try { await add.mutateAsync({ complaint_id: id, ...value }); form.reset(); }
    catch (x) { setFormErr(x instanceof ApiError ? x.message : 'Could not add evidence.'); }
  };

  if (isLoading) return <div className="container section"><Spinner /></div>;
  if (error || !c) return <div className="container section"><ErrorBox message={error?.message ?? 'Complaint not found.'} /><Link to="/complaints">Back to complaints</Link></div>;

  return (
    <div className="container section">
      <p><Link to="/complaints">← Complaints</Link></p>
      <h1>{label(c.crime_type)} · {c.area}</h1>
      <dl className="facts">
        <dt>Status</dt><dd><StatusBadge status={c.submission_status} /></dd>
        <dt>Station</dt><dd>{c.thana_info?.thana_name ?? c.thana_code}{c.thana_info ? `, ${c.thana_info.district}` : ''}</dd>
        <dt>Submitted</dt><dd>{new Date(c.createdAt).toLocaleString()}</dd>
        {c.user && <><dt>Complainant</dt><dd>{c.user.user_name} · {c.user.email}</dd></>}
        <dt>Reference</dt><dd><code>{c.complaint_id}</code></dd>
      </dl>
      <h2>Description</h2>
      <p className="prewrap">{c.case_description}</p>

      <h2>Investigation</h2>
      {c.si_assignments.length === 0 ? <p className="muted">No Sub-Inspector assigned yet.</p> : (
        <ol className="timeline">
          {c.si_assignments.map((a) => (
            <li key={a.assignment_id} className="card">
              <strong>{officerName(a.current_officer)}</strong> <span className="muted">assigned {new Date(a.assignedAt).toLocaleString()}</span>
              {a.previous_officer && <div className="muted">Previously: {officerName(a.previous_officer)}</div>}
              {a.crime_investigations.map((inv) => (
                <div key={inv.investigation_id} className="cell">
                  <Pill tone={inv.investigation_status === 'solved' ? 'ok' : 'info'}>{label(inv.investigation_status)}</Pill>
                  {inv.case_reviews.map((r) => <Pill key={r.review_id} tone={r.flag === 'red' ? 'bad' : 'ok'}>OC review: {label(r.flag)}</Pill>)}
                </div>
              ))}
            </li>
          ))}
        </ol>
      )}

      <h2>Evidence</h2>
      <p className="muted">The system stores a reference to each file, not the file itself.</p>
      {c.case_evidences.length === 0 ? <p>No evidence recorded.</p> : (
        <ul className="cards">
          {c.case_evidences.map((ev) => (
            <li key={ev.evidence_id} className="card">
              <Pill tone="info">{label(ev.file_type)}</Pill> <span className="prewrap">{ev.file_path}</span>
              <div className="muted">{new Date(ev.uploadedAt).toLocaleString()}</div>
            </li>
          ))}
        </ul>
      )}
      {canAdd && (
        <form onSubmit={submit} noValidate style={{ maxWidth: 520, marginTop: 20 }}>
          <h3>Add evidence reference</h3>
          <ErrorBox message={formErr} />
          <Select id="file_type" name="file_type" label="File type" defaultValue="" error={errors.file_type}>
            <option value="" disabled>Select a type…</option>
            {FILE_TYPES.map((t) => <option key={t} value={t}>{label(t)}</option>)}
          </Select>
          <Input id="file_path" name="file_path" label="Storage reference" maxLength={500} hint="For example an evidence-locker ID or private storage path." error={errors.file_path} />
          <Button type="submit" loading={add.isPending}>Add evidence</Button>
        </form>
      )}
    </div>
  );
}
