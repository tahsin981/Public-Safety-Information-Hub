import { useState, type FormEvent } from 'react';
import { useRemoveStation, useSaveStation, useThanas } from '../api/hooks';
import { AdminTabs } from '../components/AdminTabs';
import { Button, ErrorBox, Input, Modal, Spinner } from '../components/ui';
import { serverFormError, stationSchema, validate, type Errors } from '../lib/schemas';
import type { Thana } from '../lib/types';

function StationDialog({ station, onClose }: { station: Thana | null; onClose: () => void }) {
  const save = useSaveStation();
  const [errors, setErrors] = useState<Errors>({});
  const [formErr, setFormErr] = useState('');
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { value, errors } = validate(stationSchema, Object.fromEntries(new FormData(e.currentTarget)));
    setErrors(errors); setFormErr('');
    if (!value) return;
    const { geo_code, latitude, longitude, ...rest } = value;
    const body = { ...rest, latitude: latitude === '' ? null : Number(latitude), longitude: longitude === '' ? null : Number(longitude) };
    try { await save.mutateAsync(station ? { id: station.geo_code, body } : { body: { geo_code, ...body } }); onClose(); }
    catch (x) { const r = serverFormError(x, 'Could not save the station.'); setErrors(r.errors); setFormErr(r.message); }
  };
  const d = station;
  return (
    <Modal title={d ? `Edit ${d.thana_name}` : 'Add station'} onClose={onClose}>
      <ErrorBox message={formErr} />
      <form onSubmit={submit} noValidate>
        <Input id="geo_code" name="geo_code" label="Station code" defaultValue={d?.geo_code} readOnly={!!d} hint={d ? 'The code cannot be changed.' : 'For example CTG-001'} error={errors.geo_code} />
        <Input id="thana_name" name="thana_name" label="Station name" defaultValue={d?.thana_name} error={errors.thana_name} />
        <Input id="district" name="district" label="District" defaultValue={d?.district} error={errors.district} />
        <Input id="thana_email" name="thana_email" type="email" label="Station email" defaultValue={d?.thana_email} error={errors.thana_email} />
        <Input id="tel_no" name="tel_no" type="tel" label="Telephone" defaultValue={d?.tel_no} error={errors.tel_no} />
        <Input id="latitude" name="latitude" inputMode="decimal" label="Latitude (optional)" defaultValue={d?.latitude ?? ''} error={errors.latitude} />
        <Input id="longitude" name="longitude" inputMode="decimal" label="Longitude (optional)" defaultValue={d?.longitude ?? ''} hint="Needed for the public map." error={errors.longitude} />
        <Button type="submit" loading={save.isPending}>{d ? 'Save changes' : 'Create station'}</Button>
      </form>
    </Modal>
  );
}

export default function AdminStations() {
  const { data = [], isLoading, error } = useThanas();
  const del = useRemoveStation();
  const [editing, setEditing] = useState<Thana | 'new' | null>(null);
  return (
    <div className="container section">
      <AdminTabs />
      <div className="row"><Button onClick={() => setEditing('new')}>Add station</Button></div>
      <ErrorBox message={error?.message || del.error?.message} />
      {isLoading ? <Spinner /> : (
        <div className="scroll">
          <table>
            <caption className="sr">Police stations</caption>
            <thead><tr><th>Code</th><th>Name</th><th>District</th><th>Contact</th><th>Map</th><th><span className="sr">Actions</span></th></tr></thead>
            <tbody>
              {data.map((t) => (
                <tr key={t.geo_code}>
                  <td>{t.geo_code}</td><td>{t.thana_name}</td><td>{t.district}</td><td>{t.tel_no}<br />{t.thana_email}</td>
                  <td>{t.latitude != null && t.longitude != null ? 'Pinned' : <span className="muted">No coordinates</span>}</td>
                  <td><div className="cell">
                    <Button variant="ghost" onClick={() => setEditing(t)}>Edit</Button>
                    <Button variant="danger" loading={del.isPending && del.variables === t.geo_code}
                      onClick={() => confirm(`Delete ${t.thana_name}? Stations with officers or complaints cannot be deleted.`) && del.mutate(t.geo_code)}>Delete</Button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editing && <StationDialog station={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
