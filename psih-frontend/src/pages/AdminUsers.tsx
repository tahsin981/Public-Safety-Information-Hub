import { useState, type FormEvent } from 'react';
import { useAdminUsers, useAllOfficers, useRemoveUser, useSaveUser } from '../api/hooks';
import { useAuth } from '../auth/AuthContext';
import { AdminTabs } from '../components/AdminTabs';
import { Button, ErrorBox, Input, Modal, Pill, Select, Spinner } from '../components/ui';
import { rankMatchesRole, serverFormError, userCreateSchema, userEditSchema, validate, type Errors } from '../lib/schemas';
import { officerName, ROLES, type AdminUser } from '../lib/types';

function UserDialog({ target, onClose }: { target: AdminUser | null; onClose: () => void }) {
  const { data: officers = [] } = useAllOfficers();
  const save = useSaveUser();
  const [errors, setErrors] = useState<Errors>({});
  const [formErr, setFormErr] = useState('');
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { value, errors } = validate(target ? userEditSchema : userCreateSchema, Object.fromEntries(new FormData(e.currentTarget)));
    const next: Errors = { ...errors };
    if (value) {
      const linked = officers.find((o) => o.employee_id === value.employee_code);
      if (!rankMatchesRole(value.role, linked?.rank)) next.employee_code = `This officer's rank is ${linked?.rank}; the role must match it or staff access is refused.`;
    }
    setErrors(next); setFormErr('');
    if (!value || Object.keys(next).length) return;
    const body = { ...value, employee_code: value.employee_code || null };
    try { await save.mutateAsync(target ? { id: target.user_id, body } : { body }); onClose(); }
    catch (x) { const r = serverFormError(x, 'Could not save the user.'); setErrors(r.errors); setFormErr(r.message); }
  };
  const d = target;
  return (
    <Modal title={d ? `Edit ${d.user_name}` : 'Add user'} onClose={onClose}>
      <ErrorBox message={formErr} />
      <form onSubmit={submit} noValidate>
        <Input id="user_name" name="user_name" label="Full name" defaultValue={d?.user_name} error={errors.user_name} />
        <Input id="email" name="email" type="email" label="Email" defaultValue={d?.email} error={errors.email} />
        <Input id="phone_number" name="phone_number" type="tel" label="Phone" defaultValue={d?.phone_number} error={errors.phone_number} />
        {!d && <Input id="password" name="password" type="password" label="Temporary password" autoComplete="new-password" hint="At least 10 characters." error={errors.password} />}
        <Select id="role" name="role" label="Role" defaultValue={d?.role ?? 'COMMON'} error={errors.role}>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </Select>
        <Select id="employee_code" name="employee_code" label="Linked officer" defaultValue={d?.employee_code ?? ''} hint="Required for DUTYOFFICER, SI, OC and CRIMEANALYST accounts. Role must equal the officer's rank." error={errors.employee_code}>
          <option value="">None</option>
          {officers.map((o) => <option key={o.employee_id} value={o.employee_id}>{officerName(o)} · {o.rank}</option>)}
        </Select>
        <Button type="submit" loading={save.isPending}>{d ? 'Save changes' : 'Create user'}</Button>
      </form>
    </Modal>
  );
}

export default function AdminUsers() {
  const { user: me } = useAuth();
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useAdminUsers(page);
  const del = useRemoveUser();
  const [editing, setEditing] = useState<AdminUser | 'new' | null>(null);
  const pg = data?.pagination;
  const needsLink = (u: AdminUser) => u.role !== 'COMMON' && u.role !== 'ADMIN' && !u.employee_code;
  return (
    <div className="container section">
      <AdminTabs />
      <div className="row"><Button onClick={() => setEditing('new')}>Add user</Button></div>
      <ErrorBox message={error?.message || del.error?.message} />
      {isLoading ? <Spinner /> : (
        <div className="scroll">
          <table>
            <caption className="sr">User accounts</caption>
            <thead><tr><th>User</th><th>Role</th><th>Officer link</th><th><span className="sr">Actions</span></th></tr></thead>
            <tbody>
              {data?.data.map((u) => (
                <tr key={u.user_id}>
                  <td>{u.user_name}<br /><span className="muted">{u.email}</span></td><td>{u.role}</td>
                  <td>{u.employee_code ?? (needsLink(u) ? <Pill tone="warn">Needs officer link</Pill> : <span className="muted">—</span>)}</td>
                  <td><div className="cell">
                    <Button variant="ghost" onClick={() => setEditing(u)}>Edit</Button>
                    {u.user_id !== me?.user_id && (
                      <Button variant="danger" loading={del.isPending && del.variables === u.user_id}
                        onClick={() => confirm(`Delete ${u.user_name}? Users with complaints or audit history cannot be deleted.`) && del.mutate(u.user_id)}>Delete</Button>
                    )}
                  </div></td>
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
      {editing && <UserDialog target={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
