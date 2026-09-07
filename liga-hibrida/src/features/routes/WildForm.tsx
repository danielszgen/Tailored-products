// Zona Salvaje logging (SPEC §8.4): sport, minutes, intensity, note → R4 check, then R5 proposals.
import { useState } from 'react';
import { Button, Eyebrow, Segmented, Sheet, Stepper } from '@/components';
import { saveWild } from '@/data';
import { fuelIntraByMinutes } from '@/domain/content/nutrition';
import { WILD_KIND_LABELS } from '@/domain/content/routes';
import { needsConfirmation } from '@/domain/rules/interference';
import type { WildKind, WildLog } from '@/domain/types';
import { newId } from '@/lib/id';
import { InterferenceBox } from './InterferenceBox';
import { useDayContext } from './useDayContext';

const KINDS = (Object.keys(WILD_KIND_LABELS) as WildKind[]).map((k) => ({
  value: k,
  label: WILD_KIND_LABELS[k],
}));
const INTENSITY = [
  { value: 'facil' as const, label: 'Fácil' },
  { value: 'moderada' as const, label: 'Moderada' },
  { value: 'dura' as const, label: 'Dura' },
];

export function WildForm({
  open,
  today,
  onClose,
  onSaved,
}: {
  open: boolean;
  today: string;
  onClose: () => void;
  onSaved: (wild: WildLog) => void;
}) {
  const [date, setDate] = useState(today);
  const [kind, setKind] = useState<WildKind>('mtb');
  const [minutes, setMinutes] = useState(90);
  const [intensity, setIntensity] = useState<WildLog['intensity']>('moderada');
  const [note, setNote] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const context = useDayContext(date);

  const evaluation = context.evaluateWith(
    { kind: 'wild', wildKind: kind, intensity, minutes },
    'wild',
  );
  const blocked = needsConfirmation(evaluation) && !confirmed;

  async function save() {
    setBusy(true);
    try {
      const wild: WildLog = {
        id: newId('wild'),
        date,
        kind,
        minutes,
        intensity,
        note: note.trim() || undefined,
      };
      await saveWild(wild);
      onSaved(wild);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Zona Salvaje"
      footer={
        <Button full size="lg" onClick={save} disabled={busy || blocked || context.loading}>
          Guardar aventura
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <label className="block">
          <span className="eyebrow block mb-1">Fecha</span>
          <input
            className="input"
            type="date"
            value={date}
            onChange={(e) => e.target.value && setDate(e.target.value)}
          />
        </label>
        <Segmented label="Deporte" value={kind} onChange={setKind} options={KINDS} columns={4} />
        <Stepper
          label="Minutos"
          value={minutes}
          onChange={setMinutes}
          step={15}
          min={15}
          max={480}
          unit="min"
          inputMode="numeric"
          size="lg"
        />
        <Segmented
          label="Intensidad"
          value={intensity}
          onChange={setIntensity}
          options={INTENSITY}
        />
        <div className="rounded-list bg-surface2 p-3">
          <Eyebrow className="block mb-1">Intra · por duración</Eyebrow>
          <p className="text-sm text-ink2">{fuelIntraByMinutes(minutes)}</p>
        </div>
        <label className="block">
          <span className="eyebrow block mb-1">Nota</span>
          <input
            className="input"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="p. ej. con amigos, mucho desnivel…"
          />
        </label>
        <InterferenceBox evaluation={evaluation} confirmed={confirmed} onConfirm={setConfirmed} />
        <Eyebrow>
          Al guardar, la app propone sustituciones (R5): nunca añadir, intercambiar.
        </Eyebrow>
      </div>
    </Sheet>
  );
}
