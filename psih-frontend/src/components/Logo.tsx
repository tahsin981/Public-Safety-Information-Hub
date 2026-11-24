// Original emblem: shield + laurel + red disc on green (Bangladesh flag colours) + gold star.
// Inspired by police insignia motifs but NOT the official Bangladesh Police crest; get written
// approval before swapping in any official insignia.
export function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size * 1.12} viewBox="0 0 64 72" role="img" aria-label="Public Safety Information Hub emblem">
      <path d="M32 2 6 12v22c0 17 11 30 26 36 15-6 26-19 26-36V12z" fill="#0b1f3a" stroke="#c8a24b" strokeWidth="3" />
      <path d="M14 30c0 12 7 22 18 27M50 30c0 12-7 22-18 27" fill="none" stroke="#c8a24b" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="1 5" />
      <circle cx="32" cy="36" r="13" fill="#006a4e" />
      <circle cx="30" cy="36" r="7" fill="#f42a41" />
      <path d="m32 9 2.6 5.400h5.800l-4.700 3.600 1.800 5.800L32 20.600l-5.500 3.200 1.800-5.800-4.700-3.600h5.800z" fill="#c8a24b" />
    </svg>
  );
}
