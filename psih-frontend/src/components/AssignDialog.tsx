import { useState, type FormEvent } from 'react';
import { ApiError } from '../api/client';
import { useAssignSI, useOfficers } from '../api/hooks';
import { Button, ErrorBox, Modal, Select, Spinner } from './ui';
import { officerName, type Complaint } from '../lib/types';

// Backend rules: officer must have rank SI and belong to the complaint's station.
// Assigning opens an investigation and moves the complaint to SUBMITTED.
export function AssignDialog({ complaint, onClose }: { complaint: Complaint; onClose: () => void }) {
  const { data: officers = [], isLoading } = useOfficers(complaint.thana_code);
  const sis = officers.filter((o) => o.rank === 'SI');
  const assign = useAssignSI();
  const [err, setErr] = useState('');
  const reassign = (complaint._count?.si_assignments ?? 0) > 0;

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const si = String(new FormData(e.currentTarget).get('si') ?? '');
    if (!si) return setErr('Choose a Sub-Inspector.');
    try { await assign.mutateAsync({ complaint_id: complaint.complaint_id, current_SI_id: si }); onClose(); }
    catch (x) { setErr(x instanceof ApiError ? x.message : 'Assignment failed.'); }
  };

  return (
    <Modal title={reassign ? 'Reassign Sub-Inspector' : 'Assign Sub-Inspector'} onClose={onClose}>
      <p className="muted">{complaint.area} · assigning opens a new investigation.</p>
      <ErrorBox message={err} />
      {isLoading ? <Spinner /> : sis.length === 0 ? (
        <p role="status">No Sub-Inspectors are registered at this station yet.</p>
      ) : (
        <form onSubmit={submit} noValidate>
          <Select id="si" name="si" label="Sub-Inspector" defaultValue="">
            <option value="" disabled>Select an officer…</option>
            {sis.map((o) => <option key={o.employee_id} value={o.employee_id}>{officerName(o)}</option>)}
          </Select>
          <Button type="submit" loading={assign.isPending}>{reassign ? 'Reassign' : 'Assign'}</Button>
        </form>
      )}
    </Modal>
  );
}
