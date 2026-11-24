import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Button, ErrorBox, Input } from '../components/ui';
import { loginSchema, validate, type Errors } from '../lib/schemas';
import { ApiError } from '../api/client';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/';
  const [errors, setErrors] = useState<Errors>({});
  const [formErr, setFormErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.currentTarget));
    const { value, errors } = validate(loginSchema, fd);
    setErrors(errors); setFormErr('');
    if (!value) return;
    setBusy(true);
    try { await login(value.email, value.password); nav(from, { replace: true }); }
    catch (err) { setFormErr(err instanceof ApiError ? err.message : 'Sign-in failed.'); }
    finally { setBusy(false); }
  };

  return (
    <div className="container narrow">
      <h1>Sign in</h1>
      <form onSubmit={submit} noValidate>
        <ErrorBox message={formErr} />
        <Input id="email" name="email" type="email" label="Email" autoComplete="email" error={errors.email} />
        <Input id="password" name="password" type="password" label="Password" autoComplete="current-password" error={errors.password} />
        <Button type="submit" loading={busy}>Sign in</Button>
      </form>
      <p>New here? <Link to="/register">Create an account</Link></p>
    </div>
  );
}
