// Route logging (SPEC §8.4): kind, minutes, RPE, elevation, note → z2/medio/duro + R4 check.
import { useState } from 'react';
import { Button, Eyebrow, Pill, Segmented, Sheet, Stepper } from '@/components';
import { saveRoute } from '@/data';
import { classifyRoute, ROUTE_CLASSIFICATION, ROUTE_KIND_LABELS } from '@/domain/content/routes';
import { fuelIntraByMinutes } from '@/domain/content/nutrition';
import { needsConfirmation } from '@/domain/rules/interference';
import type { RouteKind, RouteLog } from '@/domain/types';
import { newId } from '@/lib/id';
import { InterferenceBox } from './InterferenceBox';
import { useDayContext } from './useDayContext';

const KINDS = (Object.keys(ROUTE_KIND_LABELS) as RouteKind[]).map((k) => ({
  value: k,
  label: ROUTE_KIND_LABELS[k],
}));
const RPE = Array.from({ length: 10 }, (_, i) => ({ value: i + 1, label: String(i + 1) }));
const COUNTS_TONE = { z2: 'ok', medio: 'cargado', duro: 'ko' } as const;

export function RouteForm({
  open,
  today,
  onClose,
  onSaved,
}: {
  open: boolean;
  today: string;
  onClose: () => void;
  onSaved: (route: RouteLog) => void;
}) {
  const [date, setDate] = useState(today);
  const [kind, setKind] = useState<RouteKind>('run');
  const [minutes, setMinutes] = useState(45);
  const [rpe, setRpe] = useState(5);
  const [withElevation, setWithElevation] = useState(false);
  const [elevation, setElevation] = useState(0);
  const [note, setNote] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const context = useDayContext(date);

  const countsAs = classifyRoute(rpe);
  const evaluation = context.evaluateWith(
    { kind: 'route', routeKind: kind, effort: countsAs, minutes },
    'route',
  );
  const blocked = needsConfirmation(evaluation) && !confirmed;

  async function save() {
    setBusy(true);
    try {
      const route: RouteLog = {
        id: newId('route'),
        date,
        kind,
        minutes,
        rpe,
        elevationM: withElevation ? elevation : undefined,
        note: note.trim() || undefined,
        countsAs,
      };
      await saveRoute(route);
      onSaved(route);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Registrar ruta"
      footer={
        <Button full size="lg" onClick={save} disabled={busy || blocked || context.loading}>
          Guardar ruta
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
            max={today}
            onChange={(e) => e.target.value && setDate(e.target.value)}
          />
        </label>
        <Segmented label="Tipo" value={kind} onChange={setKind} options={KINDS} />
        <Stepper
          label="Minutos"
          value={minutes}
          onChange={setMinutes}
          step={5}
          min={5}
          max={300}
          unit="min"
          inputMode="numeric"
          size="lg"
        />
        <Segmented label="RPE 1–10" value={rpe} onChange={setRpe} options={RPE} columns={5} />
        <div className="rounded-list bg-surface2 p-3">
          <div className="flex items-center justify-between gap-2">
            <Eyebrow>Clasificación</Eyebrow>
            <Pill tone={COUNTS_TONE[countsAs]}>{countsAs}</Pill>
          </div>
          <p className="text-sm text-ink2 mt-1">
            {countsAs === 'z2' && ROUTE_CLASSIFICATION.z2}
            {countsAs === 'medio' && ROUTE_CLASSIFICATION.medio}
            {countsAs === 'duro' && ROUTE_CLASSIFICATION.duro}
          </p>
          {countsAs === 'duro' && (
            <p className="text-sm text-status-ko mt-1" role="alert">
              Aviso: {ROUTE_CLASSIFICATION.warning}.
            </p>
          )}
          <p className="text-xs text-ink3 mt-1">Intra: {fuelIntraByMinutes(minutes)}</p>
        </div>
        {withElevation ? (
          <Stepper
            label="Desnivel"
            value={elevation}
            onChange={setElevation}
            step={50}
            min={0}
            max={5000}
            unit="m+"
            inputMode="numeric"
          />
        ) : (
          <Button variant="ghost" onClick={() => setWithElevation(true)}>
            + Añadir desnivel
          </Button>
        )}
        <label className="block">
          <span className="eyebrow block mb-1">Nota</span>
          <input
            className="input"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="p. ej. sin molestias, terreno blando…"
          />
        </label>
        <InterferenceBox evaluation={evaluation} confirmed={confirmed} onConfirm={setConfirmed} />
      </div>
    </Sheet>
  );
}
