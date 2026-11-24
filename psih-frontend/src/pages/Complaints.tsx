import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useComplaints, useUpdateStatus, useWithdraw } from '../api/hooks';
import { Button, ErrorBox, Select, Spinner, StatusBadge } from '../components/ui';
import { AssignDialog } from '../components/AssignDialog';
import { ASSIGN_ROLES, label, STAFF_ROLES, STATUS_EDIT_ROLES, type Complaint, type SubmissionStatus } from '../lib/types';

export default function Complaints() {
  const { user } = useAuth();
  const staff = !!user && STAFF_ROLES.includes(user.role);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const { data, isLoading, error, isFetching } = useComplaints(page, status, staff);
  const update = useUpdateStatus();
  const withdraw = useWithdraw();
  const canEdit = !!user && STATUS_EDIT_ROLES.includes(user.role);
  const canAssign = !!user && ASSIGN_ROLES.includes(user.role);
  const [assigning, setAssigning] = useState<Complaint | null>(null);
  const rows = data?.data ?? [];
  const pg = data?.pagination;

  return (
    <div className="container section">
      <h1>{staff ? 'Complaints' : 'My complaints'}</h1>
      <div className="row">
        <Select id="f" label="Filter by status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All</option>
          {['PENDING', 'SUBMITTED', 'REJECTED'].map((s) => <option key={s} value={s}>{label(s.toLowerCase())}</option>)}
        </Select>
        {isFetching && !isLoading && <span className="muted" role="status">Refreshing…</span>}
      </div>
      <ErrorBox message={error?.message || update.error?.message || withdraw.error?.message} />
      {isLoading ? <Spinner /> : rows.length === 0 ? <p>No complaints found.</p> : (
        <div className="scroll">
          <table>
            <caption className="sr">Complaints</caption>
            <thead><tr><th>Date</th><th>Type</th><th>Station</th><th>Area</th><th>Status</th><th><span className="sr">Actions</span></th></tr></thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.complaint_id}>
                  <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td>{label(c.crime_type)}</td>
                  <td>{c.thana_info?.thana_name ?? c.thana_code}</td>
                  <td><Link to={`/complaints/${c.complaint_id}`}>{c.area}</Link></td>
                  <td><StatusBadge status={c.submission_status} /></td>
                  <td>
                    <div className="cell">
                    {canAssign && <Button variant="ghost" onClick={() => setAssigning(c)}>{(c._count?.si_assignments ?? 0) > 0 ? 'Reassign SI' : 'Assign SI'}</Button>}
                    {canEdit ? (
                      <Select id={`s-${c.complaint_id}`} label="" aria-label={`Set status for complaint in ${c.area}`}
                        value={c.submission_status} disabled={update.isPending}
                        onChange={(e) => update.mutate({ id: c.complaint_id, status: e.target.value as SubmissionStatus })}>
                        {['PENDING', 'SUBMITTED', 'REJECTED'].map((s) => <option key={s} value={s}>{label(s.toLowerCase())}</option>)}
                      </Select>
                    ) : user?.role === 'COMMON' && c.submission_status === 'PENDING' ? (
                      <Button variant="danger" loading={withdraw.isPending && withdraw.variables === c.complaint_id}
                        onClick={() => confirm('Withdraw this complaint? This cannot be undone.') && withdraw.mutate(c.complaint_id)}>Withdraw</Button>
                    ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {pg && pg.pages > 1 && (
        <nav className="row" aria-label="Pagination">
          <Button variant="ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span>Page {pg.page} of {pg.pages}</span>
          <Button variant="ghost" disabled={page >= pg.pages} onClick={() => setPage(page + 1)}>Next</Button>
        </nav>
      )}
      {assigning && <AssignDialog complaint={assigning} onClose={() => setAssigning(null)} />}
    </div>
  );
}
