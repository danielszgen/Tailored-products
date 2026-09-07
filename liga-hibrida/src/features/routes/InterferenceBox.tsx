// R4 result inside a form: light, findings and the "Sé lo que hago" confirmation on ROJO.
import { Eyebrow, Pill } from '@/components';
import { LIGHT_LABELS } from '@/domain/content/routes';
import { CONFIRM_LABEL, type DayEvaluation } from '@/domain/rules/interference';

const LIGHT_TONE = { verde: 'ok', ambar: 'cargado', rojo: 'ko' } as const;

export function InterferenceBox({
  evaluation,
  confirmed,
  onConfirm,
}: {
  evaluation: DayEvaluation;
  confirmed: boolean;
  onConfirm: (value: boolean) => void;
}) {
  return (
    <div className="rounded-list bg-surface2 p-3" data-testid="interference">
      <div className="flex items-center justify-between gap-2 mb-1">
        <Eyebrow>Interferencia · R4</Eyebrow>
        <Pill tone={LIGHT_TONE[evaluation.light]}>{LIGHT_LABELS[evaluation.light]}</Pill>
      </div>
      {evaluation.findings.length === 0 ? (
        <p className="text-sm text-ink2">Sin interferencias con el plan de hoy, ayer y mañana.</p>
      ) : (
        <ul className="text-sm text-ink2 flex flex-col gap-1">
          {evaluation.findings.map((f) => (
            <li key={f.combo}>
              <span className="font-bold text-ink">{f.combo}:</span> {f.message}
              {f.rule !== undefined && <span className="text-ink3"> · regla {f.rule}</span>}
            </li>
          ))}
        </ul>
      )}
      {evaluation.light === 'rojo' && (
        <label className="mt-3 flex items-center gap-3 min-h-touch">
          <input
            type="checkbox"
            className="w-5 h-5"
            checked={confirmed}
            onChange={(e) => onConfirm(e.target.checked)}
          />
          <span className="text-sm text-ink font-bold">{CONFIRM_LABEL}</span>
        </label>
      )}
    </div>
  );
}
