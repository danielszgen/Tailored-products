// "¿Aductor 30–60 min después?" fallback prompt for completed Lower sessions (SPEC §8.3).
import { useState } from 'react';
import { Button, Card, Stepper } from '@/components';
import { saveSession } from '@/data';
import { GYM_NAMES } from '@/domain/content/gyms';
import type { SessionLog } from '@/domain/types';

export function AdductorAfterCard({ sessions }: { sessions: SessionLog[] }) {
  const pending = sessions.find(
    (s) =>
      s.completed &&
      (s.gymId === 'cantera' || s.gymId === 'resorte') &&
      s.adductorAfter === undefined,
  );
  const [value, setValue] = useState(0);
  const [saving, setSaving] = useState(false);
  if (!pending) return null;

  return (
    <Card eyebrow={`Tras ${GYM_NAMES[pending.gymId]}`} title="¿Aductor 30–60 min después?">
      <p className="text-sm text-ink2 mb-3">
        Registra la molestia del aductor tras la sesión de pierna (0 nada · 10 máximo).
      </p>
      <div className="flex gap-2 items-end">
        <Stepper
          label="Aductor 0–10"
          value={value}
          onChange={setValue}
          step={1}
          min={0}
          max={10}
          inputMode="numeric"
          className="flex-1"
        />
        <Button
          onClick={async () => {
            setSaving(true);
            await saveSession({ ...pending, adductorAfter: value });
            setSaving(false);
          }}
          disabled={saving}
        >
          Guardar
        </Button>
      </div>
    </Card>
  );
}
