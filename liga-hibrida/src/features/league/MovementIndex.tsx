// Índice de Movimientos: all exercises grouped by gym (SPEC §8.5). Best marks arrive in Etapa III.
import { Collapsible } from '@/components/Collapsible';
import { GymIcon, TypeGlyph } from '@/brand/icons';
import { formatRir, formatSetsReps, GYM_ORDER, GYMS } from '@/domain/content/gyms';

export function MovementIndex() {
  return (
    <Collapsible
      title="Índice de Movimientos"
      eyebrow="25 ejercicios · mejores marcas en Etapa III"
    >
      <div className="flex flex-col gap-3">
        {GYM_ORDER.map((id) => {
          const gym = GYMS[id];
          return (
            <div key={id}>
              <div className="flex items-center gap-2 mb-1">
                <GymIcon gym={id} size={18} />
                <span className="font-bold text-ink">{gym.name}</span>
              </div>
              <ul className="flex flex-col gap-1">
                {gym.main.map((e) => (
                  <li key={e.id} className="flex items-center gap-2">
                    <span className="font-pixel text-[10px] tracking-[1px] text-ink3 w-6">
                      {e.slot}
                    </span>
                    <span className="flex-1 min-w-0 truncate">{e.name}</span>
                    <span className="text-xs text-ink3 whitespace-nowrap">
                      {formatSetsReps(e)} · RIR {formatRir(e.rirTarget)}
                    </span>
                    <span className="flex gap-0.5">
                      {e.types.map((t) => (
                        <TypeGlyph key={t} type={t} size={12} />
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </Collapsible>
  );
}
