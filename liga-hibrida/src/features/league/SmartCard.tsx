// The 10 SMART objectives of Bloque 1 with automatic progress or a manual mark (SPEC §6.2, §8.5).
import { useState } from 'react';
import { Button, Card, Meter, Pill } from '@/components';
import { updateProfile } from '@/data';
import { BLOCK_SUCCESS_CRITERIA } from '@/domain/content/smart';
import type { SmartProgress } from '@/domain/rules/league';
import type { ISODate, Profile } from '@/domain/types';
import { formatShort } from '@/lib/date';

const STATUS_LABEL: Record<SmartProgress['status'], string> = {
  done: 'Conseguido',
  progress: 'En progreso',
  pending: 'Pendiente',
  manual: 'Manual',
};

const STATUS_TONE: Record<SmartProgress['status'], 'ok' | 'cargado' | 'neutral' | 'gold'> = {
  done: 'ok',
  progress: 'cargado',
  pending: 'neutral',
  manual: 'gold',
};

export function SmartCard({
  smart,
  profile,
  today,
}: {
  smart: SmartProgress[] | null;
  profile: Profile;
  today: ISODate;
}) {
  const [busy, setBusy] = useState<number | null>(null);

  async function toggleManual(o: SmartProgress) {
    setBusy(o.id);
    try {
      const next = { ...(profile.smartManual ?? {}) };
      if (o.manual) delete next[String(o.id)];
      else next[String(o.id)] = { done: true, date: today };
      await updateProfile({ smartManual: next });
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card eyebrow="Objetivos SMART" title="Bloque 1 · 10 objetivos">
      {!smart ? (
        <p className="text-sm text-ink3">Calculando…</p>
      ) : (
        <ol className="flex flex-col gap-3" aria-label="Objetivos SMART">
          {smart.map((o) => (
            <li key={o.id} className="text-sm" data-testid={`smart-${o.id}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-ink">
                  {o.id}. {o.title}
                </span>
                <Pill tone={STATUS_TONE[o.status]}>
                  {o.status === 'manual' && o.manual?.done
                    ? 'Hecho a mano'
                    : STATUS_LABEL[o.status]}
                </Pill>
              </div>
              <span className="block text-ink2">{o.target}</span>
              <Meter
                value={(o.progress ?? 0) * 100}
                tone={o.status === 'done' || o.manual?.done ? 'ok' : 'accent'}
                height={5}
                showValue={false}
                className="mt-1"
              />
              <span className="block text-xs text-ink3 mt-1">
                {o.progress === null ? 'Sin datos · ' : ''}
                {o.detail}
                {o.manual ? ` Marcado a mano el ${formatShort(o.manual.date)}.` : ''}
              </span>
              <Button
                variant="ghost"
                className="mt-1 -ml-4"
                onClick={() => void toggleManual(o)}
                disabled={busy === o.id}
                aria-label={`${o.manual ? 'Quitar marca manual' : 'Marcar hecho a mano'}: ${o.title}`}
              >
                {o.manual ? 'Quitar marca manual' : 'Marcar hecho a mano'}
              </Button>
            </li>
          ))}
        </ol>
      )}
      <p className="text-xs text-ink3 mt-3">{BLOCK_SUCCESS_CRITERIA}</p>
    </Card>
  );
}
