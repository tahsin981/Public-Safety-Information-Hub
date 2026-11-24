import type { Envelope } from '../lib/types';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';
const KEY = 'psih.token';

// Token lives in sessionStorage (cleared when the tab closes). The backend issues a Bearer JWT and
// no httpOnly cookie, so this is the pragmatic choice; see README "Security notes".
export const getToken = () => sessionStorage.getItem(KEY);
export const setToken = (t: string | null) =>
  t ? sessionStorage.setItem(KEY, t) : sessionStorage.removeItem(KEY);

let onUnauthorized: (() => void) | null = null;
export const setUnauthorizedHandler = (fn: (() => void) | null) => { onUnauthorized = fn; };

export interface FieldIssue { field: string; message: string }
export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: FieldIssue[]) { super(message); }
}

export async function api<T>(
  path: string,
  opts: { method?: string; body?: unknown } = {},
): Promise<Envelope<T>> {
  const token = getToken();
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method: opts.method ?? 'GET',
      headers: {
        ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Check your connection and try again.');
  }
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && token) onUnauthorized?.();
    throw new ApiError(
      res.status,
      json?.message ?? 'Something went wrong.',
      Array.isArray(json?.details) ? json.details : undefined,
    );
  }
  return json as Envelope<T>;
}
