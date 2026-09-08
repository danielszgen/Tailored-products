// Informe de 12 semanas (SPEC §10, §9 Etapa III): Markdown for El Rival, copy / share / export.
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Screen, Splash } from '@/components';
import { BLOCK_WEEKS } from '@/domain/content/block';
import { blockReport } from '@/domain/rules/league';
import { canShareFiles, downloadText, shareText } from '@/features/regen/download';
import { useLeague } from './useLeague';

export function BlockReportScreen() {
  const navigate = useNavigate();
  const { loading, input, summary } = useLeague();
  const [message, setMessage] = useState<string | null>(null);
  const report = useMemo(
    () => (input && summary ? blockReport(input, summary) : null),
    [input, summary],
  );

  if (loading || !input || !summary || !report) return <Splash />;
  const filename = `liga-hibrida-bloque-1-semana-${summary.weekOfBlock}.md`;

  return (
    <Screen
      title="Informe del Bloque 1"
      eyebrow={`Semana ${summary.weekOfBlock}/${BLOCK_WEEKS} · para El Rival`}
      back="/liga"
    >
      <Card eyebrow="Compartir" title="Informe de 12 semanas">
        <p className="text-sm text-ink2 mb-3">
          Ficha, medallas, SMART, Combates de Liga, peso, marcas, semanas, síntomas y evolución.
          Pégalo en Claude con «Actúa como El Rival según los documentos Performance Trainee».
        </p>
        <div className="flex flex-col gap-2">
          <Button
            full
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(report);
                setMessage('Informe copiado al portapapeles.');
              } catch {
                setMessage('No se pudo copiar: selecciona el texto de abajo.');
              }
            }}
          >
            Copiar informe
          </Button>
          {canShareFiles() && (
            <Button
              full
              variant="secondary"
              onClick={() => void shareText(filename, report, 'Liga Híbrida', 'text/markdown')}
            >
              Compartir
            </Button>
          )}
          <Button
            full
            variant="secondary"
            onClick={() => downloadText(filename, report, 'text/markdown')}
          >
            Exportar .md
          </Button>
          {message && (
            <p role="status" className="text-sm text-status-ok">
              {message}
            </p>
          )}
        </div>
      </Card>
      <Card eyebrow="Markdown" title="Informe">
        <pre
          className="text-xs text-ink2 whitespace-pre-wrap break-words"
          data-testid="block-report"
        >
          {report}
        </pre>
      </Card>
      <Button full size="lg" variant="secondary" onClick={() => navigate('/liga')}>
        Volver a la Liga
      </Button>
    </Screen>
  );
}
