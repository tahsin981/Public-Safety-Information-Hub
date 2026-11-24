import { useState, type FormEvent } from 'react';
import { useAllOfficers, useRemoveOfficer, useSaveOfficer, useThanas } from '../api/hooks';
import { AdminTabs } from '../components/AdminTabs';
import { Button, ErrorBox, Input, Modal, Pill, Select, Spinner } from '../components/ui';
import { officerSchema, serverFormError, validate, type Errors } from '../lib/schemas';
import { OFFICER_RANKS, officerName, type Officer } from '../lib/types';

function OfficerDialog({ officer, onClose }: { officer: Officer | null; onClose: () => void }) {
  const { data: thanas = [] } = useThanas();
  const save = useSaveOfficer();
  const [errors, setErrors] = useState<Errors>({});
  const [formErr, setFormErr] = useState('');
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { value, errors } = validate(officerSchema, Object.fromEntries(new FormData(e.currentTarget)));
    setErrors(errors); setFormErr('');
    if (!value) return;
    const { employee_id, last_name, ...rest } = value;
    const body = { ...rest, last_name: last_name === '' ? null : last_name };
    try { await save.mutateAsync(officer ? { id: officer.employee_id, body } : { body: { employee_id, ...body } }); onClose(); }
    catch (x) { const r = serverFormError(x, 'Could not save the officer.'); setErrors(r.errors); setFormErr(r.message); }
  };
  const d = officer;
  return (
    <Modal title={d ? `Edit ${d.first_name}` : 'Add officer'} onClose={onClose}>
      <ErrorBox message={formErr} />
      <form onSubmit={submit} noValidate>
        <Input id="employee_id" name="employee_id" label="Employee ID" defaultValue={d?.employee_id} readOnly={!!d} hint={d ? 'The ID cannot be changed.' : undefined} error={errors.employee_id} />
        <Input id="first_name" name="first_name" label="First name" defaultValue={d?.first_name} error={errors.first_name} />
        <Input id="last_name" name="last_name" label="Last name (optional)" defaultValue={d?.last_name ?? ''} error={errors.last_name} />
        <Input id="phone_number" name="phone_number" type="tel" label="Phone" defaultValue={d?.phone_number} error={errors.phone_number} />
        <Select id="thana_code" name="thana_code" label="Station" defaultValue={d?.thana_code ?? ''} error={errors.thana_code}>
          <option value="" disabled>Select a station…</option>
          {thanas.map((t) => <option key={t.geo_code} value={t.geo_code}>{t.thana_name}, {t.district}</option>)}
        </Select>
        <Select id="rank" name="rank" label="Rank" defaultValue={d?.rank ?? ''} error={errors.rank}>
          <option value="" disabled>Select a rank…</option>
          {OFFICER_RANKS.map((r) => <option key={r} value={r}>{r}</option>)}
        </Select>
        <Button type="submit" loading={save.isPending}>{d ? 'Save changes' : 'Create officer'}</Button>
      </form>
    </Modal>
  );
}

export default function AdminOfficers() {
  const { data = [], isLoading, error } = useAllOfficers();
  const del = useRemoveOfficer();
  const [editing, setEditing] = useState<Officer | 'new' | null>(null);
  return (
    <div className="container section">
      <AdminTabs />
      <p className="muted">Creating an officer does not create a login. Link one on the Users page.</p>
      <div className="row"><Button onClick={() => setEditing('new')}>Add officer</Button></div>
      <ErrorBox message={error?.message || del.error?.message} />
      {isLoading ? <Spinner /> : data.length === 0 ? <p>No officers yet. Add a station first, then its officers.</p> : (
        <div className="scroll">
          <table>
            <caption className="sr">Officers</caption>
            <thead><tr><th>Officer</th><th>Rank</th><th>Station</th><th>Login account</th><th><span className="sr">Actions</span></th></tr></thead>
            <tbody>
              {data.map((o) => (
                <tr key={o.employee_id}>
                  <td>{officerName(o)}<br /><span className="muted">{o.phone_number}</span></td><td>{o.rank}</td>
                  <td>{o.thana_info?.thana_name ?? o.thana_code}</td>
                  <td>{o.user ? <>{o.user.email} <Pill tone="ok">Linked</Pill></> : <Pill tone="warn">Not linked</Pill>}</td>
                  <td><div className="cell">
                    <Button variant="ghost" onClick={() => setEditing(o)}>Edit</Button>
                    <Button variant="danger" loading={del.isPending && del.variables === o.employee_id}
                      onClick={() => confirm(`Delete ${o.first_name}? Their login stays but loses the officer link.`) && del.mutate(o.employee_id)}>Delete</Button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editing && <OfficerDialog officer={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
