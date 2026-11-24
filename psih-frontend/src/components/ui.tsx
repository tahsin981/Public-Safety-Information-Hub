import { forwardRef, useEffect, useRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import { label, type SubmissionStatus } from '../lib/types';

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger'; loading?: boolean };
export function Button({ variant = 'primary', loading, children, disabled, ...p }: BtnProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }} className={`btn btn-${variant}`} disabled={disabled || loading}
      aria-busy={loading || undefined} {...(p as object)}
    >
      {loading ? 'Please wait…' : children}
    </motion.button>
  );
}

interface FieldShell { id: string; label: string; error?: string; hint?: string }
function Shell({ id, label: l, error, hint, children }: FieldShell & { children: ReactNode }) {
  return (
    <div className="field">
      <label htmlFor={id}>{l}</label>
      {children}
      {hint && !error && <small id={`${id}-h`}>{hint}</small>}
      {error && <small id={`${id}-e`} className="err" role="alert">{error}</small>}
    </div>
  );
}
const aria = (id: string, error?: string, hint?: string) => ({
  'aria-invalid': !!error || undefined,
  'aria-describedby': error ? `${id}-e` : hint ? `${id}-h` : undefined,
});

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & FieldShell>(
  ({ id, label: l, error, hint, ...p }, ref) => (
    <Shell id={id} label={l} error={error} hint={hint}><input id={id} ref={ref} {...aria(id, error, hint)} {...p} /></Shell>
  ));
export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & FieldShell>(
  ({ id, label: l, error, hint, children, ...p }, ref) => (
    <Shell id={id} label={l} error={error} hint={hint}><select id={id} ref={ref} {...aria(id, error, hint)} {...p}>{children}</select></Shell>
  ));
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & FieldShell>(
  ({ id, label: l, error, hint, ...p }, ref) => (
    <Shell id={id} label={l} error={error} hint={hint}><textarea id={id} ref={ref} {...aria(id, error, hint)} {...p} /></Shell>
  ));

export function StatusBadge({ status }: { status: SubmissionStatus }) {
  // Text + colour (never colour alone) for WCAG 1.4.1
  return <span className={`badge badge-${status.toLowerCase()}`}>{label(status.toLowerCase())}</span>;
}
export const ErrorBox = ({ message }: { message?: string }) =>
  message ? <div className="alert" role="alert">{message}</div> : null;
export const Spinner = ({ text = 'Loading…' }: { text?: string }) => <p role="status" className="muted">{text}</p>;

// Text is always shown with the colour (WCAG 1.4.1). Tones: ok | warn | bad | info.
export const Pill = ({ tone, children }: { tone: 'ok' | 'warn' | 'bad' | 'info'; children: ReactNode }) =>
  <span className={`badge badge-${tone}`}>{children}</span>;

// Native <dialog>: focus trap, Esc to close and inert background come from the browser.
export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current!;
    if (typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open', '');
  }, []);
  return (
    <dialog ref={ref} className="modal" aria-labelledby="modal-t" onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) ref.current?.close(); }}>
      <div className="modal-body">
        <h2 id="modal-t">{title}</h2>
        {children}
        <Button type="button" variant="ghost" onClick={() => ref.current?.close()}>Cancel</Button>
      </div>
    </dialog>
  );
}
