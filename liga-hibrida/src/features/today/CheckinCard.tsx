// Morning check-in: 4 controls + optional weight, one "Guardar" (SPEC §8.2, rule R1).
import { useState } from 'react';
import { Button, Card, Eyebrow, Segmented, StatusPill, Stepper } from '@/components';
import { saveCheckin, symptomHistoryBefore } from '@/data';
import { computePv } from '@/domain/rules/pv';
import type { Checkin, ISODate, Scale5 } from '@/domain/types';
import type { TodayModel } from './useToday';

const SCALE: { value: Scale5; label: string }[] = [1, 2, 3, 4, 5].map((v) => ({
  value: v as Scale5,
  label: String(v),
}));

interface Draft {
  sleepHours: number;
  energy: Scale5;
  legs: Scale5;
  wrist: number;
  adductor: number;
  weightKg: number;
  withWeight: boolean;
}

function draftFrom(
  checkin: Checkin | null | undefined,
  yesterday: Checkin | null | undefined,
  lastWeight?: number,
): Draft {
  return {
    sleepHours: checkin?.sleepHours ?? yesterday?.sleepHours ?? 8,
    energy: checkin?.energy ?? 4,
    legs: checkin?.legs ?? 4,
    wrist: checkin?.wrist ?? 0,
    adductor: checkin?.adductor ?? 0,
    weightKg: checkin?.weightKg ?? lastWeight ?? 80,
    withWeight: checkin?.weightKg !== undefined,
  };
}

export function CheckinCard({ model }: { model: TodayModel }) {
  const { today, checkin, pvResult, yesterday, lastWeight } = model;
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<Draft>(() => draftFrom(checkin, yesterday, lastWeight?.value));

  const showForm = !checkin || editing;

  const startEdit = () => {
    setDraft(draftFrom(checkin, yesterday, lastWeight?.value));
    setEditing(true);
  };

  async function save(date: ISODate) {
    setSaving(true);
    try {
      const history = await symptomHistoryBefore(date, 2);
      const result = computePv(
        {
          sleepHours: draft.sleepHours,
          energy: draft.energy,
          legs: draft.legs,
          wrist: draft.wrist,
          adductor: draft.adductor,
        },
        history,
      );
      await saveCheckin({
        date,
        sleepHours: draft.sleepHours,
        energy: draft.energy,
        legs: draft.legs,
        wrist: draft.wrist,
        adductor: draft.adductor,
        weightKg: draft.withWeight ? draft.weightKg : undefined,
        note: checkin?.note,
        pv: result.pv,
        status: result.status,
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  if (!showForm && checkin && pvResult) {
    return (
      <Card
        eyebrow="Check-in de hoy"
        title={
          <span className="flex items-center gap-2">
            <span className="font-pixel text-base tracking-[1px]">PV {pvResult.pv}</span>
            <StatusPill status={pvResult.status} />
          </span>
        }
        right={
          <Button variant="ghost" onClick={startEdit} aria-label="Editar check-in">
            Editar
          </Button>
        }
      >
        <ul className="text-sm text-ink2 flex flex-col gap-1">
          {pvResult.reasons.map((r) => (
            <li key={r}>· {r}</li>
          ))}
        </ul>
        <p className="text-xs text-ink3 mt-3">
          Sueño {checkin.sleepHours.toString().replace('.', ',')} h · Energía {checkin.energy}/5 ·
          Piernas {checkin.legs}/5 · Muñeca {checkin.wrist}/10 · Aductor {checkin.adductor}/10
          {checkin.weightKg !== undefined
            ? ` · ${checkin.weightKg.toFixed(1).replace('.', ',')} kg`
            : ''}
        </p>
      </Card>
    );
  }

  return (
    <Card eyebrow="Check-in matinal · 30 s" title="¿Cómo te levantas?">
      <div className="flex flex-col gap-4">
        <Stepper
          label="Sueño"
          value={draft.sleepHours}
          onChange={(v) => setDraft({ ...draft, sleepHours: v })}
          step={0.5}
          min={0}
          max={12}
          unit="h"
          size="lg"
        />
        <Segmented
          label="Energía"
          value={draft.energy}
          onChange={(v) => setDraft({ ...draft, energy: v })}
          options={SCALE}
          size="lg"
          hint="1 vacío · 5 a tope"
        />
        <Segmented
          label="Piernas"
          value={draft.legs}
          onChange={(v) => setDraft({ ...draft, legs: v })}
          options={SCALE}
          size="lg"
          hint="1 destruidas · 5 frescas"
        />
        <div className="grid grid-cols-2 gap-3">
          <Stepper
            label="Muñeca 0–10"
            value={draft.wrist}
            onChange={(v) => setDraft({ ...draft, wrist: v })}
            step={1}
            min={0}
            max={10}
            inputMode="numeric"
          />
          <Stepper
            label="Aductor 0–10"
            value={draft.adductor}
            onChange={(v) => setDraft({ ...draft, adductor: v })}
            step={1}
            min={0}
            max={10}
            inputMode="numeric"
          />
        </div>
        {draft.withWeight ? (
          <Stepper
            label="Peso al despertar"
            value={draft.weightKg}
            onChange={(v) => setDraft({ ...draft, weightKg: v })}
            step={0.1}
            min={40}
            max={150}
            unit="kg"
          />
        ) : (
          <Button variant="ghost" onClick={() => setDraft({ ...draft, withWeight: true })}>
            + Añadir peso de hoy
          </Button>
        )}
        <Button size="lg" full onClick={() => save(today)} disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar'}
        </Button>
        {editing && (
          <Button variant="ghost" onClick={() => setEditing(false)}>
            Cancelar
          </Button>
        )}
        <Eyebrow>Regla R1 · PV = sueño + energía + piernas + dolor</Eyebrow>
      </div>
    </Card>
  );
}
