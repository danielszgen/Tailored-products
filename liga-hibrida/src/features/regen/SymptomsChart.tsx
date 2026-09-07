// SVG chart of wrist and adductor over the last 28 days (SPEC §8.6 "Síntomas").
import type { SymptomPoint } from '@/domain/rules/symptoms';
import { addDaysISO, daysBetween, formatShort } from '@/lib/date';

const W = 320;
const H = 150;
const PAD = { top: 10, right: 10, bottom: 22, left: 24 };
const DAYS = 28;

function path(points: SymptomPoint[], today: string): string {
  const first = addDaysISO(today, -(DAYS - 1));
  return points
    .map((p, i) => {
      const x = PAD.left + (daysBetween(first, p.date) / (DAYS - 1)) * (W - PAD.left - PAD.right);
      const y = PAD.top + (1 - p.value / 10) * (H - PAD.top - PAD.bottom);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

export function SymptomsChart({
  wrist,
  adductor,
  today,
}: {
  wrist: SymptomPoint[];
  adductor: SymptomPoint[];
  today: string;
}) {
  const first = addDaysISO(today, -(DAYS - 1));
  const y = (v: number) => PAD.top + (1 - v / 10) * (H - PAD.top - PAD.bottom);
  const label = `Muñeca y aductor, últimos 28 días: ${wrist.length} registros de muñeca (último ${
    wrist[wrist.length - 1]?.value ?? '—'
  }), ${adductor.length} de aductor (último ${adductor[adductor.length - 1]?.value ?? '—'}).`;

  if (wrist.length === 0 && adductor.length === 0) {
    return (
      <div className="text-sm text-ink3 py-6 text-center" role="status">
        Sin registros de síntomas todavía. Salen del check-in y de los combates.
      </div>
    );
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img" aria-label={label}>
      {[0, 5, 10].map((v) => (
        <g key={v}>
          <line
            x1={PAD.left}
            x2={W - PAD.right}
            y1={y(v)}
            y2={y(v)}
            stroke="var(--c-line)"
            strokeDasharray={v === 5 ? '3 3' : undefined}
          />
          <text x={PAD.left - 4} y={y(v) + 3} textAnchor="end" fontSize="9" fill="var(--c-ink3)">
            {v}
          </text>
        </g>
      ))}
      <line
        x1={PAD.left}
        x2={W - PAD.right}
        y1={y(4)}
        y2={y(4)}
        stroke="var(--c-gold)"
        strokeDasharray="2 4"
        strokeOpacity="0.7"
      />
      {wrist.length > 0 && (
        <path
          d={path(wrist, today)}
          fill="none"
          stroke="var(--c-accent)"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}
      {adductor.length > 0 && (
        <path
          d={path(adductor, today)}
          fill="none"
          stroke="#3BB8D6"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}
      <text x={PAD.left} y={H - 6} fontSize="9" fill="var(--c-ink3)">
        {formatShort(first)}
      </text>
      <text x={W - PAD.right} y={H - 6} textAnchor="end" fontSize="9" fill="var(--c-ink3)">
        {formatShort(today)}
      </text>
      <g fontSize="9" fill="var(--c-ink2)">
        <rect x={W - 120} y={PAD.top} width={8} height={8} fill="var(--c-accent)" />
        <text x={W - 108} y={PAD.top + 7}>
          muñeca
        </text>
        <rect x={W - 62} y={PAD.top} width={8} height={8} fill="#3BB8D6" />
        <text x={W - 50} y={PAD.top + 7}>
          aductor
        </text>
      </g>
    </svg>
  );
}
