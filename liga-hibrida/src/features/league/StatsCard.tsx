// "Estadísticas 0–100 en la ficha" (SPEC §6.2, Etapa III) and the trainer level (§6.10).
import { Card, Eyebrow, Meter } from '@/components';
import { Collapsible } from '@/components/Collapsible';
import { TypeGlyph } from '@/brand/icons';
import { STAT_PLACEHOLDER } from '@/domain/content/smart';
import { TRAINER_LEVEL_NOTE, TRAINER_LEVELS } from '@/domain/content/tests';
import type { StatValue, TrainerLevelResult } from '@/domain/rules/league';

export function StatsRow({
  stats,
  compact = false,
}: {
  stats: StatValue[] | null;
  compact?: boolean;
}) {
  return (
    <ul className="grid grid-cols-5 gap-1 text-center" aria-label="Estadísticas">
      {(stats ?? []).map((s) => (
        <li key={s.key} className="flex flex-col items-center gap-1" title={s.detail}>
          <TypeGlyph type={s.key} size={compact ? 16 : 22} title={s.name} />
          {!compact && (
            <span className="font-pixel text-[9px] tracking-[1px] text-ink3">{s.name}</span>
          )}
          <span
            className={
              compact ? 'font-pixel text-[11px] tracking-[1px] text-ink' : 'display text-lg'
            }
            data-testid={`stat-${s.key}`}
          >
            {s.value ?? STAT_PLACEHOLDER}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function StatsCard({ stats }: { stats: StatValue[] | null }) {
  return (
    <Card eyebrow="Estadísticas" title="Ficha del entrenador">
      {!stats ? (
        <p className="text-sm text-ink3">Calculando…</p>
      ) : (
        <>
          <StatsRow stats={stats} />
          <ul className="mt-3 flex flex-col gap-1 text-xs text-ink3">
            {stats.map((s) => (
              <li key={s.key}>
                <span className="font-bold text-ink2">{s.name}:</span> {s.detail}
              </li>
            ))}
          </ul>
          <p className="text-xs text-ink3 mt-2">Hasta tener datos, el stat muestra «—».</p>
        </>
      )}
    </Card>
  );
}

export function LevelCard({ level }: { level: TrainerLevelResult | null }) {
  return (
    <Card
      eyebrow="Nivel de entrenador"
      title={level?.level?.name ?? 'Sin datos todavía'}
      right={level?.percent !== null && level ? <Eyebrow>{level.percent} %</Eyebrow> : undefined}
    >
      {!level ? (
        <p className="text-sm text-ink3">Calculando…</p>
      ) : (
        <>
          {level.percent !== null && (
            <Meter value={level.percent} tone="accent" height={8} showValue={false} />
          )}
          <p className="text-sm text-ink2 mt-2">{level.detail}</p>
          {level.weeks.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Semanas contadas">
              {level.weeks.map((w) => (
                <li key={w.weekOfBlock} className="font-pixel text-[10px] tracking-[1px] text-ink3">
                  S{w.weekOfBlock} {w.done}/6
                </li>
              ))}
            </ul>
          )}
          <Collapsible title="Cómo se calcula" className="mt-3">
            <p>
              % de sesiones A (2 Lower + 2 Upper + 1 Z2 + 1 movilidad) completadas en las últimas 4
              semanas.
            </p>
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
      )}
    </Card>
  );
}
