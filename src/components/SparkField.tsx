import { cn } from '@/lib/cn';

/**
 * Generative SVG background: a sparse field of diagonal "spark" strokes in
 * volt. Deterministic (seeded), so server and client render identically —
 * no hydration mismatch, no Math.random. Purely decorative.
 */

type Props = {
  className?: string;
  density?: number; // strokes across the field
  seed?: number;
  opacity?: number;
};

// Small deterministic PRNG (mulberry32) so layout is stable across renders.
function makeRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function SparkField({
  className,
  density = 28,
  seed = 7,
  opacity = 0.06,
}: Props) {
  const rng = makeRng(seed);
  const strokes = Array.from({ length: density }, (_, i) => {
    const x = rng() * 100;
    const y = rng() * 100;
    const len = 2 + rng() * 5;
    return { key: i, x1: x, y1: y, x2: x + len, y2: y - len * 1.6 };
  });

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      className={cn('pointer-events-none absolute inset-0 h-full w-full', className)}
      style={{ opacity }}
    >
      {strokes.map((s) => (
        <line
          key={s.key}
          x1={s.x1}
          y1={s.y1}
          x2={s.x2}
          y2={s.y2}
          stroke="var(--color-volt)"
          strokeWidth={0.6}
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}
