// RUTAS tab — Etapa I: aerobic plan of the wave and the document tables, logging arrives in Etapa II.
import { Button, Card, Pill, Screen, Splash } from '@/components';
import { Collapsible } from '@/components/Collapsible';
import { useProfile } from '@/data';
import { aerobicRowForWave, BLOCK_WEEKS, waveForWeek, waveLabel } from '@/domain/content/block';
import {
  COMPATIBILITY_TABLE,
  INTERFERENCE_RULES,
  LIGHT_LABELS,
  LIVE_WEEK_SCENARIOS,
  ROUTE_CLASSIFICATION,
  SUBSTITUTION_MATRIX,
  SUBSTITUTION_PRINCIPLE,
} from '@/domain/content/routes';
import { todayISO, weekOfBlock } from '@/lib/date';

const LIGHT_TONE = { verde: 'ok', ambar: 'cargado', rojo: 'ko' } as const;

export function RoutesScreen() {
  const profile = useProfile();
  if (profile === undefined) return <Splash />;
  const wob = profile ? weekOfBlock(todayISO(), profile.blockStart) : 1;
  const inBlock = wob >= 1 && wob <= BLOCK_WEEKS;
  const wave = waveForWeek(inBlock ? wob : 1);
  const row = aerobicRowForWave(wave);

  return (
    <Screen title="Rutas" eyebrow="Z2 y Zona Salvaje">
      <Card eyebrow={`Plan aeróbico · ${waveLabel(wave)}`} title={row.weeks}>
        <p className="text-sm text-ink">{row.z2}</p>
        <p className="text-sm text-ink2 mt-1">{row.adventure}</p>
        {!inBlock && (
          <p className="text-xs text-ink3 mt-2">Fuera del bloque: se muestra la ola 1.</p>
        )}
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" disabled>
          Registrar ruta <Pill tone="neutral">Etapa II</Pill>
        </Button>
        <Button variant="secondary" disabled>
          Zona Salvaje <Pill tone="neutral">Etapa II</Pill>
        </Button>
      </div>

      <Card eyebrow="Clasificación de una ruta" title="RPE">
        <p className="text-sm text-ink2">
          {ROUTE_CLASSIFICATION.z2} · {ROUTE_CLASSIFICATION.medio} · {ROUTE_CLASSIFICATION.duro}.
        </p>
        <p className="text-xs text-ink3 mt-1">
          Si sube de RPE 8, la app avisa: «{ROUTE_CLASSIFICATION.warning}».
        </p>
      </Card>

      <Collapsible title="Reglas de interferencia" eyebrow="Las 7">
        <ol className="flex flex-col gap-2">
          {INTERFERENCE_RULES.map((r) => (
            <li key={r.id}>
              <span className="font-bold text-ink">
                {r.id}. {r.name}:
              </span>{' '}
              {r.text}
            </li>
          ))}
        </ol>
      </Collapsible>

      <Card eyebrow="Semáforo de compatibilidad" title="Mismo día">
        <ul className="flex flex-col gap-2">
          {COMPATIBILITY_TABLE.map((c) => (
            <li key={c.combo} className="flex items-start justify-between gap-2 text-sm">
              <span className="text-ink">{c.combo}</span>
              <Pill tone={LIGHT_TONE[c.light]} className="shrink-0" title={c.reading}>
                {LIGHT_LABELS[c.light]}
              </Pill>
            </li>
          ))}
        </ul>
        <p className="text-xs text-ink3 mt-2">
          {COMPATIBILITY_TABLE.filter((c) => c.reading !== LIGHT_LABELS[c.light])
            .map((c) => `${c.combo}: ${c.reading}`)
            .join(' · ')}
        </p>
      </Card>

      <Collapsible title="Matriz de sustituciones" eyebrow={SUBSTITUTION_PRINCIPLE}>
        <ul className="flex flex-col gap-2">
          {SUBSTITUTION_MATRIX.map((s) => (
            <li key={s.appears}>
              <span className="font-bold text-ink">{s.appears}</span>
              <span className="block">Puede sustituir: {s.canReplace}</span>
              <span className="block">No debe sustituir: {s.mustNotReplace}</span>
              <span className="block text-xs text-ink3">Ajuste: {s.adjustment}</span>
            </li>
          ))}
        </ul>
      </Collapsible>

      <Collapsible title="Escenarios de semana viva">
        <ul className="list-disc pl-4 flex flex-col gap-1">
          {LIVE_WEEK_SCENARIOS.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </Collapsible>
    </Screen>
  );
}
