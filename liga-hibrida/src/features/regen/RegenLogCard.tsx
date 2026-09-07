// Regen sessions log (yoga, movilidad, microdosis, sauna…) with the weekly minimum counters
// (SPEC §6.6 "Movilidad mínima semanal", §8.6 "Microdosis … con contador semanal").
import { useState } from 'react';
import { Button, Card, Eyebrow, Meter, Segmented, Stepper } from '@/components';
import { deleteRegen, saveRegen, useRegen } from '@/data';
import type { RegenKind } from '@/domain/types';
import { addDaysISO, formatShort } from '@/lib/date';
import { newId } from '@/lib/id';
import { countRegen, REGEN_KIND_LABELS, WEEKLY_TARGETS } from './regenCounts';

const DEFAULT_MINUTES: Record<RegenKind, number> = {
  yoga: 45,
  movilidad: 20,
  muneca: 10,
  aductor: 10,
  sauna: 15,
  frio: 5,
  siesta: 20,
  paseo: 30,
};

const KINDS = (Object.keys(REGEN_KIND_LABELS) as RegenKind[]).map((k) => ({
  value: k,
  label: REGEN_KIND_LABELS[k],
}));

export function RegenLogCard({ today, weekStart }: { today: string; weekStart: string }) {
  const logs = useRegen({ from: weekStart, to: addDaysISO(weekStart, 6) });
  const [kind, setKind] = useState<RegenKind>('muneca');
  const [minutes, setMinutes] = useState(DEFAULT_MINUTES.muneca);
  const [busy, setBusy] = useState(false);
  const counts = countRegen(logs ?? []);

  async function save() {
    setBusy(true);
    try {
      await saveRegen({ id: newId('regen'), date: today, kind, minutes });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card eyebrow="Centro Regen · esta semana" title="Registrar sesión regen">
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4">
        <Meter
          label="Yoga / movilidad"
          value={counts.mobility}
          max={WEEKLY_TARGETS.mobility}
          height={6}
        />
        <Meter label="Muñeca 8–12'" value={counts.wrist} max={WEEKLY_TARGETS.wrist} height={6} />
        <Meter label="Aductor" value={counts.adductor} max={WEEKLY_TARGETS.adductor} height={6} />
        <Meter
          label="Regenerativa"
          value={counts.regenerative}
          max={WEEKLY_TARGETS.regenerative}
          height={6}
        />
      </div>
      <div className="flex flex-col gap-3">
        <Segmented
          label="Tipo"
          value={kind}
          onChange={(k) => {
            setKind(k);
            setMinutes(DEFAULT_MINUTES[k]);
          }}
          options={KINDS}
          columns={4}
        />
        <Stepper
          label="Minutos"
          value={minutes}
          onChange={setMinutes}
          step={5}
          min={5}
          max={180}
          unit="min"
          inputMode="numeric"
        />
        <Button full onClick={save} disabled={busy}>
          Guardar sesión regen
        </Button>
      </div>
      {logs && logs.length > 0 && (
        <ul className="mt-4 flex flex-col gap-1" aria-label="Sesiones regen de la semana">
          {[...logs].reverse().map((g) => (
            <li key={g.id} className="flex items-center justify-between text-sm text-ink2">
              <span>
                {formatShort(g.date)} · {REGEN_KIND_LABELS[g.kind]} {g.minutes}&apos;
              </span>
              <Button
                variant="ghost"
                aria-label={`Borrar ${REGEN_KIND_LABELS[g.kind]} del ${formatShort(g.date)}`}
                onClick={() => deleteRegen(g.id)}
              >
                ✕
              </Button>
            </li>
          ))}
        </ul>
      )}
      <Eyebrow className="block mt-3">
        Mínimo semanal: 2× yoga/movilidad · 3× muñeca · 2× tobillo/cadera pre-Lower · 1×
        regenerativa
      </Eyebrow>
    </Card>
  );
}
