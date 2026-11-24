import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { Button, ErrorBox, Input } from '../components/ui';
import { registerSchema, validate, type Errors } from '../lib/schemas';

export default function Register() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [errors, setErrors] = useState<Errors>({});
  const [formErr, setFormErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { value, errors } = validate(registerSchema, Object.fromEntries(new FormData(e.currentTarget)));
    setErrors(errors); setFormErr('');
    if (!value) return;
    setBusy(true);
    try {
      await api('/auth/register', { method: 'POST', body: value });
      await login(value.email, value.password);
      nav('/complaints/new', { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        const server: Errors = {};
        err.details?.forEach((d) => { if (typeof d === 'object' && d.field) server[d.field] ??= d.message; });
        setErrors(server);
        setFormErr(err.status === 409 ? 'That email or phone number is already registered.' : err.message);
      } else setFormErr('Registration failed.');
    } finally { setBusy(false); }
  };

  return (
    <div className="container narrow">
      <h1>Create your account</h1>
      <form onSubmit={submit} noValidate>
        <ErrorBox message={formErr} />
        <Input id="user_name" name="user_name" label="Full name" autoComplete="name" error={errors.user_name} />
        <Input id="email" name="email" type="email" label="Email" autoComplete="email" error={errors.email} />
        <Input id="phone_number" name="phone_number" type="tel" label="Phone number" autoComplete="tel" error={errors.phone_number} />
        <Input id="password" name="password" type="password" label="Password" autoComplete="new-password" hint="At least 10 characters." error={errors.password} />
        <Button type="submit" loading={busy}>Create account</Button>
      </form>
      <p>Already registered? <Link to="/login">Sign in</Link></p>
    </div>
  );
}
