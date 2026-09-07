// Session close: the "registro mínimo tras cada sesión" fields (SPEC §6.5, §8.3).
import { useState } from 'react';
import { Button, Segmented, Sheet, Stepper } from '@/components';
import type { GymId, Scale5 } from '@/domain/types';
import type { FinishInput } from './useSession';

export interface FinishSheetProps {
  open: boolean;
  gymId: GymId;
  onClose: () => void;
  onFinish: (input: FinishInput) => Promise<void> | void;
}

const SCALE = [1, 2, 3, 4, 5].map((v) => ({ value: v as Scale5, label: String(v) }));

export function FinishSheet({ open, gymId, onClose, onFinish }: FinishSheetProps) {
  const lower = gymId === 'cantera' || gymId === 'resorte';
  const [energyEnd, setEnergyEnd] = useState<Scale5>(3);
  const [wristDuring, setWristDuring] = useState(0);
  const [adductorDuring, setAdductorDuring] = useState(0);
  const [feel, setFeel] = useState<'facil' | 'normal' | 'pesado'>('normal');
  const [sport, setSport] = useState('');
  const [busy, setBusy] = useState(false);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Terminar combate"
      footer={
        <Button
          full
          size="lg"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onFinish({ energyEnd, wristDuring, adductorDuring, feel, sportLast24h: sport });
            } finally {
              setBusy(false);
            }
          }}
        >
          Terminar combate
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <Segmented
          label="Energía al terminar"
          value={energyEnd}
          onChange={setEnergyEnd}
          options={SCALE}
          size="lg"
        />
        <div className="grid grid-cols-2 gap-3">
          <Stepper
            label="Muñeca durante 0–10"
            value={wristDuring}
            onChange={setWristDuring}
            step={1}
            min={0}
            max={10}
            inputMode="numeric"
          />
          <Stepper
            label={lower ? 'Aductor durante 0–10' : 'Aductor 0–10'}
            value={adductorDuring}
            onChange={setAdductorDuring}
            step={1}
            min={0}
            max={10}
            inputMode="numeric"
          />
        </div>
        <Segmented
          label="Sensación"
          value={feel}
          onChange={setFeel}
          options={[
            { value: 'facil', label: 'Fácil' },
            { value: 'normal', label: 'Normal' },
            { value: 'pesado', label: 'Pesado' },
          ]}
        />
        <label className="block">
          <span className="eyebrow block mb-1">Deporte en las 24 h previas</span>
          <input
            className="input"
            value={sport}
            onChange={(e) => setSport(e.target.value)}
            placeholder="p. ej. MTB 90' suave, nada…"
          />
        </label>
        {lower && (
          <p className="text-xs text-ink3">
            Recuerda registrar el aductor 30–60 min después: aparecerá en HOY.
          </p>
        )}
      </div>
    </Sheet>
  );
}
