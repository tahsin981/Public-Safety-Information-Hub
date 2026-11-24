import type { Thana } from './types';

export const coords = (t: Thana): [number, number] | null =>
  t.latitude != null && t.longitude != null ? [Number(t.latitude), Number(t.longitude)] : null;

export function distanceKm([a, b]: [number, number], [c, d]: [number, number]) {
  const r = (x: number) => (x * Math.PI) / 180, R = 6371;
  const h = Math.sin(r(c - a) / 2) ** 2 + Math.cos(r(a)) * Math.cos(r(c)) * Math.sin(r(d - b) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
