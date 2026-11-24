import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useInvestigations, useUpdateInvestigation } from '../api/hooks';
import { Button, ErrorBox, Pill, Select, Spinner } from '../components/ui';
import { ReviewDialog } from '../components/ReviewDialog';
import { INVESTIGATION_EDIT_ROLES, label, officerName, REVIEW_ROLES, type Investigation, type InvestigationStatus } from '../lib/types';

const latestFlag = (i: Investigation) =>
  [...i.case_reviews].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))[0]?.flag;

export default function Investigations() {
  const { user } = useAuth();
  const [status, setStatus] = useState('');
  const [reviewing, setReviewing] = useState<Investigation | null>(null);
  const { data = [], isLoading, error } = useInvestigations(status);
  const update = useUpdateInvestigation();
  const canReview = !!user && REVIEW_ROLES.includes(user.role);
  // SIs can only update their own cases (backend enforces it); hide the control elsewhere.
  const canEdit = (i: Investigation) =>
    !!user && INVESTIGATION_EDIT_ROLES.includes(user.role) &&
    (user.role !== 'SI' || user.employee_code === i.assigned_officer.current_SI_id);

  return (
    <div className="container section">
      <h1>Investigations</h1>
      <div className="row">
        <Select id="f" label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All</option><option value="under_investigation">Under investigation</option><option value="solved">Solved</option>
        </Select>
      </div>
      <ErrorBox message={error?.message || update.error?.message} />
      {isLoading ? <Spinner /> : data.length === 0 ? <p>No investigations yet. Assign a Sub-Inspector from the complaints list to open one.</p> : (
        <div className="scroll">
          <table>
            <caption className="sr">Investigations</caption>
            <thead><tr><th>Complaint</th><th>Sub-Inspector</th><th>Status</th><th>OC flag</th><th><span className="sr">Actions</span></th></tr></thead>
            <tbody>
              {data.map((i) => {
                const c = i.assigned_officer.complaint, flag = latestFlag(i);
                return (
                  <tr key={i.investigation_id}>
                    <td><Link to={`/complaints/${c.complaint_id}`}>{c.area}</Link><br /><span className="muted">{label(c.crime_type)}</span></td>
                    <td>{officerName(i.assigned_officer.current_officer)}</td>
                    <td><Pill tone={i.investigation_status === 'solved' ? 'ok' : 'info'}>{label(i.investigation_status)}</Pill></td>
                    <td>{flag ? <Pill tone={flag === 'red' ? 'bad' : 'ok'}>{label(flag)}</Pill> : <span className="muted">Not reviewed</span>}</td>
                    <td><div className="cell">
                      {canEdit(i) && (
                        <Select id={`s-${i.investigation_id}`} label="" aria-label={`Set investigation status for ${c.area}`}
                          value={i.investigation_status} disabled={update.isPending}
                          onChange={(e) => update.mutate({ id: i.investigation_id, status: e.target.value as InvestigationStatus })}>
                          <option value="under_investigation">Under investigation</option><option value="solved">Solved</option>
                        </Select>
                      )}
                      {canReview && <Button variant="ghost" onClick={() => setReviewing(i)}>Review</Button>}
                    </div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {reviewing && <ReviewDialog investigation={reviewing} onClose={() => setReviewing(null)} />}
    </div>
  );
}
