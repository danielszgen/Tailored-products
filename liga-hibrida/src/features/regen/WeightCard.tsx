// Weight: 7-day average, weekly trend, SVG chart with target band, quick entry (SPEC §8.6).
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Button, Card, Pill, Segmented, Stepper } from '@/components';
import { getCheckin, saveCheckin, useProfile, weightSeries } from '@/data';
import { addDaysISO, formatShort, todayISO } from '@/lib/date';
import { mean, movingAverage7, roundTo } from '@/lib/math';
import { WeightChart } from './WeightChart';

function fmt(v: number | undefined, decimals = 1): string {
  return v === undefined ? '—' : v.toFixed(decimals).replace('.', ',');
}

export function WeightCard() {
  const profile = useProfile();
  const today = todayISO();
  const [days, setDays] = useState<28 | 56>(28);
  const points = useLiveQuery(() => weightSeries({ days: 60, until: today }), [today]);
  const todayCheckin = useLiveQuery(() => getCheckin(today), [today]);
  const [weight, setWeight] = useState<number>(0);
  const [saved, setSaved] = useState(false);

  const ma = points ? movingAverage7(points) : [];
  const last = points?.[points.length - 1];
  const avg7 = ma[ma.length - 1]?.value;

  const thisWeek = points?.filter((p) => p.date > addDaysISO(today, -7)).map((p) => p.value) ?? [];
  const prevWeek =
    points
      ?.filter((p) => p.date > addDaysISO(today, -14) && p.date <= addDaysISO(today, -7))
      .map((p) => p.value) ?? [];
  const mThis = mean(thisWeek);
  const mPrev = mean(prevWeek);
  const trend =
    mThis !== undefined && mPrev !== undefined ? ((mThis - mPrev) / mPrev) * 100 : undefined;

  const initialWeight = weight || last?.value || profile?.startWeightKg || 80;

  async function saveToday() {
    if (!todayCheckin) return;
    await saveCheckin({ ...todayCheckin, weightKg: roundTo(initialWeight, 1) });
    setSaved(true);
  }

  return (
    <Card
      eyebrow="Peso"
      title={`${fmt(avg7)} kg`}
      right={
        <Pill
          tone={trend === undefined ? 'neutral' : trend >= 0.1 && trend <= 0.25 ? 'ok' : 'neutral'}
        >
          {trend === undefined ? 'sin tendencia' : `${trend >= 0 ? '+' : ''}${fmt(trend, 2)} %/sem`}
        </Pill>
      }
    >
      <p className="text-xs text-ink3 mb-2">
        Media móvil 7 d · último {last ? `${fmt(last.value)} kg (${formatShort(last.date)})` : '—'}
      </p>
      <WeightChart
        points={points ?? []}
        startWeightKg={profile?.startWeightKg}
        blockStart={profile?.blockStart}
        days={days}
      />
      <Segmented
        value={days}
        onChange={setDays}
        options={[
          { value: 28, label: '28 días' },
          { value: 56, label: '56 días' },
        ]}
        className="mt-2"
      />
      <div className="mt-4">
        {todayCheckin ? (
          <div className="flex gap-2 items-end">
            <Stepper
              label="Peso de hoy"
              value={initialWeight}
              onChange={(v) => {
                setWeight(v);
                setSaved(false);
              }}
              step={0.1}
              min={40}
              max={150}
              unit="kg"
              className="flex-1"
            />
            <Button onClick={saveToday}>{saved ? 'Guardado ✓' : 'Guardar'}</Button>
          </div>
        ) : (
          <p className="text-sm text-ink2">
            Haz el{' '}
            <Link to="/" className="text-accent font-bold">
              check-in en HOY
            </Link>{' '}
            para registrar el peso de hoy.
          </p>
        )}
      </div>
    </Card>
  );
}
