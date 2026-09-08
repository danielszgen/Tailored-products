// Índice de Movimientos (SPEC §8.5): every exercise with its type, best mark at RIR ≤ 2, history and
// wrist/adductor notes; filters by gym and type.
import { useMemo, useState } from 'react';
import { Card, Eyebrow, Segmented } from '@/components';
import { GymIcon, TypeGlyph } from '@/brand/icons';
import { formatRir, formatSetsReps, GYM_NAMES, GYM_ORDER, GYMS } from '@/domain/content/gyms';
import { STATS } from '@/domain/content/smart';
import { allBestMarks, exerciseHistory, MARK_RIR_MAX } from '@/domain/rules/marks';
import type { GymId, SessionLog, StatKey } from '@/domain/types';
import { formatShort } from '@/lib/date';
import { formatKg } from '@/lib/format';

type GymFilter = GymId | 'todos';
type TypeFilter = StatKey | 'todos';

const GYM_OPTIONS: { value: GymFilter; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  ...GYM_ORDER.map((id) => ({ value: id, label: GYM_NAMES[id] })),
];
const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  ...STATS.map((s) => ({ value: s.key, label: s.name })),
];

function markText(m: {
  loadKg: number;
  reps: number;
  seconds?: number;
  rir: number;
  date: string;
}) {
  const amount = m.seconds !== undefined ? `${m.seconds} s` : `× ${m.reps}`;
  return `${formatKg(m.loadKg)} kg ${amount} @ RIR ${m.rir} · ${formatShort(m.date)}`;
}

export function MovementIndex({ sessions }: { sessions: SessionLog[] | null }) {
  const [gym, setGym] = useState<GymFilter>('todos');
  const [type, setType] = useState<TypeFilter>('todos');
  const marks = useMemo(() => allBestMarks(sessions ?? []), [sessions]);
  const withMarks = Object.keys(marks).length;

  return (
    <Card
      eyebrow={`25 ejercicios · ${withMarks} con marca a RIR ≤ ${MARK_RIR_MAX}`}
      title="Índice de Movimientos"
    >
      <Segmented value={gym} onChange={setGym} options={GYM_OPTIONS} columns={5} className="mb-2" />
      <Segmented
        value={type}
        onChange={setType}
        options={TYPE_OPTIONS}
        columns={6}
        className="mb-3"
      />
      <div className="flex flex-col gap-3">
        {GYM_ORDER.filter((id) => gym === 'todos' || gym === id).map((id) => {
          const spec = GYMS[id];
          const exercises = spec.main.filter((e) => type === 'todos' || e.types.includes(type));
          if (exercises.length === 0) return null;
          return (
            <div key={id}>
              <div className="flex items-center gap-2 mb-1">
                <GymIcon gym={id} size={18} />
                <span className="font-bold text-ink">{spec.name}</span>
              </div>
              <ul className="flex flex-col gap-1" aria-label={`Ejercicios de ${spec.name}`}>
                {exercises.map((e) => {
                  const best = marks[e.id];
                  const history = best ? exerciseHistory(sessions ?? [], e.id, 6) : [];
                  return (
                    <li key={e.id} className="list-item px-3 py-2">
                      <details>
                        <summary className="list-none cursor-pointer flex items-center gap-2 min-h-[36px]">
                          <span className="font-pixel text-[10px] tracking-[1px] text-ink3 w-6">
                            {e.slot}
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className="block truncate text-sm text-ink">{e.name}</span>
                            <span className="block text-xs text-ink3">
                              {formatSetsReps(e)} · RIR {formatRir(e.rirTarget)}
                              {best ? ` · Mejor: ${markText(best)}` : ' · Sin marca todavía'}
                            </span>
                          </span>
                          <span className="flex gap-0.5">
                            {e.types.map((t) => (
                              <TypeGlyph key={t} type={t} size={12} />
                            ))}
                          </span>
                        </summary>
                        {history.length > 0 && (
                          <ul
                            className="mt-2 flex flex-col gap-1 text-xs text-ink2"
                            aria-label={`Historial ${e.name}`}
                          >
                            {history.map((h) => (
                              <li key={h.date} className="flex justify-between gap-2">
                                <span>
                                  {formatShort(h.date)} · {formatKg(h.best.loadKg)} kg{' '}
                                  {h.best.seconds !== undefined
                                    ? `${h.best.seconds} s`
                                    : `× ${h.best.reps}`}{' '}
                                  @ RIR {h.best.rir} · {h.sets.length} series
                                </span>
                                <Eyebrow>
                                  {h.wristDuring !== undefined ? `muñeca ${h.wristDuring}` : ''}
                                  {h.adductorDuring !== undefined
                                    ? ` aductor ${h.adductorDuring}`
                                    : ''}
                                  {h.adductorAfter !== undefined
                                    ? ` (después ${h.adductorAfter})`
                                    : ''}
                                </Eyebrow>
                              </li>
                            ))}
                          </ul>
                        )}
                      </details>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
