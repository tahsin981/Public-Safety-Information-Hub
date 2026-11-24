import { useState, type FormEvent } from 'react';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { useCreateReview, useOfficers } from '../api/hooks';
import { Button, ErrorBox, Modal, Select } from './ui';
import { officerName, type CaseFlag, type Investigation } from '../lib/types';

// Backend rule: the reviewing officer must have rank OC. OCs review as themselves (their linked
// employee code); ADMINs pick an OC from the station.
export function ReviewDialog({ investigation, onClose }: { investigation: Investigation; onClose: () => void }) {
  const { user } = useAuth();
  const complaint = investigation.assigned_officer.complaint;
  const isAdmin = user?.role === 'ADMIN';
  const { data: officers = [] } = useOfficers(isAdmin ? complaint.thana_code : '');
  const ocs = officers.filter((o) => o.rank === 'OC');
  const create = useCreateReview();
  const [err, setErr] = useState('');
  const ownId = user?.employee_code ?? '';

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const oc_id = isAdmin ? String(fd.get('oc') ?? '') : ownId;
    if (!oc_id) return setErr(isAdmin ? 'Choose the reviewing OC.' : 'Your account is not linked to an officer record.');
    try {
      await create.mutateAsync({ investigation_id: investigation.investigation_id, oc_id, flag: fd.get('flag') as CaseFlag });
      onClose();
    } catch (x) { setErr(x instanceof ApiError ? x.message : 'Review failed.'); }
  };

  return (
    <Modal title="Record OC review" onClose={onClose}>
      <p className="muted">{complaint.area}</p>
      <ErrorBox message={err} />
      <form onSubmit={submit} noValidate>
        {isAdmin && (
          <Select id="oc" name="oc" label="Reviewing OC" defaultValue="">
            <option value="" disabled>Select an OC…</option>
            {ocs.map((o) => <option key={o.employee_id} value={o.employee_id}>{officerName(o)}</option>)}
          </Select>
        )}
        <Select id="flag" name="flag" label="Flag" defaultValue="green">
          <option value="green">Green</option>
          <option value="red">Red (flag for attention)</option>
        </Select>
        <Button type="submit" loading={create.isPending}>Save review</Button>
      </form>
    </Modal>
  );
}
