// Hand-drawn SVG weight chart: raw points, 7-day moving average and the target band (SPEC §8.6).
import { useMemo } from 'react';
import type { ISODate } from '@/domain/types';
import { daysBetween, formatShort } from '@/lib/date';
import { movingAverage7, type DatedValue } from '@/lib/math';
import { targetBand } from './weightBand';

export interface WeightChartProps {
  points: DatedValue[];
  startWeightKg?: number;
  blockStart?: ISODate;
  days?: 28 | 56;
  height?: number;
}

const W = 320;
const PAD = { top: 12, right: 12, bottom: 22, left: 36 };

export function WeightChart({
  points,
  startWeightKg,
  blockStart,
  days = 28,
  height = 180,
}: WeightChartProps) {
  const model = useMemo(() => {
    const sorted = [...points].sort((a, b) => (a.date < b.date ? -1 : 1));
    if (sorted.length === 0) return null;
    const last = sorted[sorted.length - 1].date;
    const visible = sorted.filter((p) => daysBetween(p.date, last) < days);
    const first = visible[0].date;
    const ma = movingAverage7(sorted).filter((p) => daysBetween(p.date, last) < days);
    const span = Math.max(1, daysBetween(first, last));

    const band =
      startWeightKg && blockStart
        ? [first, last].map((d) => {
            const weeks = Math.max(0, daysBetween(blockStart, d)) / 7;
            return { date: d, bounds: targetBand(startWeightKg, weeks) };
          })
        : null;

    const values = [
      ...visible.map((p) => p.value),
      ...ma.map((p) => p.value),
      ...(band ? band.flatMap((b) => b.bounds) : []),
    ];
    const min = Math.floor(Math.min(...values) - 0.5);
    const max = Math.ceil(Math.max(...values) + 0.5);

    const x = (d: ISODate) =>
      PAD.left + (daysBetween(first, d) / span) * (W - PAD.left - PAD.right);
    const y = (v: number) =>
      PAD.top + (1 - (v - min) / (max - min)) * (height - PAD.top - PAD.bottom);

    const maPath = ma
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.date).toFixed(1)},${y(p.value).toFixed(1)}`)
      .join(' ');

    const bandPath = band
      ? `M${x(band[0].date).toFixed(1)},${y(band[0].bounds[0]).toFixed(1)} L${x(band[1].date).toFixed(1)},${y(band[1].bounds[0]).toFixed(1)} L${x(band[1].date).toFixed(1)},${y(band[1].bounds[1]).toFixed(1)} L${x(band[0].date).toFixed(1)},${y(band[0].bounds[1]).toFixed(1)} Z`
      : null;

    const lastMa = ma[ma.length - 1]?.value;
    const lastValue = visible[visible.length - 1].value;
    return { visible, ma, first, last, min, max, x, y, maPath, bandPath, lastMa, lastValue };
  }, [points, startWeightKg, blockStart, days, height]);

  if (!model) {
    return (
      <div className="text-sm text-ink3 py-6 text-center" role="status">
        Sin pesos todavía. Añade el peso en el check-in de la mañana.
      </div>
    );
  }

  const label = `Peso: último ${model.lastValue.toFixed(1).replace('.', ',')} kg, media 7 días ${
    model.lastMa !== undefined ? model.lastMa.toFixed(1).replace('.', ',') : '—'
  } kg, ${model.visible.length} registros en ${days} días.`;

  return (
    <svg
      viewBox={`0 0 ${W} ${height}`}
      width="100%"
      height={height}
      role="img"
      aria-label={label}
      className="text-ink"
    >
      {model.bandPath && (
        <path d={model.bandPath} fill="var(--c-gold)" fillOpacity="0.18" stroke="none" />
      )}
      <line
        x1={PAD.left}
        x2={W - PAD.right}
        y1={model.y(model.min)}
        y2={model.y(model.min)}
        stroke="var(--c-line)"
      />
      <line
        x1={PAD.left}
        x2={W - PAD.right}
        y1={model.y(model.max)}
        y2={model.y(model.max)}
        stroke="var(--c-line)"
        strokeDasharray="2 3"
      />
      {model.visible.map((p) => (
        <circle
          key={p.date}
          cx={model.x(p.date)}
          cy={model.y(p.value)}
          r={2.5}
          fill="var(--c-ink3)"
        />
      ))}
      {model.maPath && (
        <path
          d={model.maPath}
          fill="none"
          stroke="var(--c-accent)"
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}
      <text
        x={PAD.left - 4}
        y={model.y(model.max) + 4}
        textAnchor="end"
        fontSize="9"
        fill="var(--c-ink3)"
      >
        {model.max}
      </text>
      <text
        x={PAD.left - 4}
        y={model.y(model.min) + 4}
        textAnchor="end"
        fontSize="9"
        fill="var(--c-ink3)"
      >
        {model.min}
      </text>
      <text x={PAD.left} y={height - 6} fontSize="9" fill="var(--c-ink3)">
        {formatShort(model.first)}
      </text>
      <text x={W - PAD.right} y={height - 6} textAnchor="end" fontSize="9" fill="var(--c-ink3)">
        {formatShort(model.last)}
      </text>
    </svg>
  );
}
