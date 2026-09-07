// The 10 SMART objectives of Bloque 1 and the trainer level placeholder (SPEC §6.2, §6.10).
import { Card, Eyebrow, Pill } from '@/components';
import { Collapsible } from '@/components/Collapsible';
import {
  BLOCK_SUCCESS_CRITERIA,
  SMART_OBJECTIVES,
  STATS,
  STAT_PLACEHOLDER,
} from '@/domain/content/smart';
import { TRAINER_LEVEL_NOTE, TRAINER_LEVELS } from '@/domain/content/tests';
import { TypeGlyph } from '@/brand/icons';

export function SmartCard() {
  return (
    <>
      <Card eyebrow="Estadísticas" title="Ficha del entrenador">
        <ul className="grid grid-cols-5 gap-1 text-center">
          {STATS.map((s) => (
            <li key={s.key} className="flex flex-col items-center gap-1">
              <TypeGlyph type={s.key} size={22} title={s.name} />
              <span className="font-pixel text-[9px] tracking-[1px] text-ink3">{s.name}</span>
              <span className="display text-lg">{STAT_PLACEHOLDER}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-ink3 mt-2">Los números 0–100 se calculan en la Etapa III.</p>
      </Card>

      <Card
        eyebrow="Objetivos SMART"
        title="Bloque 1 · 10 objetivos"
        right={<Pill tone="neutral">progreso · Etapa III</Pill>}
      >
        <ol className="flex flex-col gap-2">
          {SMART_OBJECTIVES.map((o) => (
            <li key={o.id} className="text-sm">
              <span className="font-bold text-ink">
                {o.id}. {o.title}
              </span>
              <span className="block text-ink2">{o.target}</span>
              <span className="block text-xs text-ink3">Validación: {o.validation}</span>
            </li>
          ))}
        </ol>
        <p className="text-xs text-ink3 mt-3">{BLOCK_SUCCESS_CRITERIA}</p>
      </Card>

      <Collapsible title="Nivel de entrenador" eyebrow="Adherencia 4 semanas">
        <p>Se calcula con 4 semanas de datos (Etapa III).</p>
        <ul className="mt-2 flex flex-col gap-1">
          {TRAINER_LEVELS.map((l) => (
            <li key={l.id}>
              <span className="font-bold text-ink">{l.name}</span> · {l.min}–{l.max} %
            </li>
          ))}
        </ul>
        <Eyebrow className="block mt-2">{TRAINER_LEVEL_NOTE}</Eyebrow>
      </Collapsible>
    </>
  );
}
