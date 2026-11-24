import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCreateComplaint, useThanas } from '../api/hooks';
import { ApiError } from '../api/client';
import { Button, ErrorBox, Input, Select, Textarea } from '../components/ui';
import { complaintSchema, validate, type Errors } from '../lib/schemas';
import { CRIME_TYPES, label } from '../lib/types';

export default function NewComplaint() {
  const { data: thanas = [] } = useThanas();
  const create = useCreateComplaint();
  const [errors, setErrors] = useState<Errors>({});
  const [formErr, setFormErr] = useState('');
  const [done, setDone] = useState<string | null>(null);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const { value, errors } = validate(complaintSchema, Object.fromEntries(new FormData(form)));
    setErrors(errors); setFormErr('');
    if (!value) return;
    try {
      const r = await create.mutateAsync(value);
      setDone(r.data.complaint_id); form.reset();
    } catch (err) {
      if (err instanceof ApiError) {
        const s: Errors = {}; err.details?.forEach((d) => { if (d.field) s[d.field] ??= d.message; });
        setErrors(s); setFormErr(err.message);
      } else setFormErr('Could not submit. Please try again.');
    }
  };

  if (done)
    return (
      <motion.div className="container narrow" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
        <h1>Complaint submitted</h1>
        <p role="status">Reference: <code>{done}</code></p>
        <p>Keep this reference. You can follow its status in <Link to="/complaints">My complaints</Link>.</p>
        <Button onClick={() => setDone(null)}>Report another</Button>
      </motion.div>
    );

  return (
    <div className="container narrow">
      <h1>Report an incident</h1>
      <p className="muted">In immediate danger? Call 999 first.</p>
      <form onSubmit={submit} noValidate>
        <ErrorBox message={formErr} />
        <Select id="thana_code" name="thana_code" label="Police station" defaultValue="" error={errors.thana_code}>
          <option value="" disabled>Select a station…</option>
          {thanas.map((t) => <option key={t.geo_code} value={t.geo_code}>{t.thana_name}, {t.district}</option>)}
        </Select>
        <Select id="crime_type" name="crime_type" label="Incident type" defaultValue="" error={errors.crime_type}>
          <option value="" disabled>Select a type…</option>
          {CRIME_TYPES.map((c) => <option key={c} value={c}>{label(c)}</option>)}
        </Select>
        <Input id="area" name="area" label="Area or landmark" maxLength={150} error={errors.area} />
        <Textarea id="case_description" name="case_description" rows={6} label="What happened?" hint="Include time, place and people involved. 10 characters minimum." error={errors.case_description} />
        <Button type="submit" loading={create.isPending}>Submit complaint</Button>
      </form>
    </div>
  );
}
