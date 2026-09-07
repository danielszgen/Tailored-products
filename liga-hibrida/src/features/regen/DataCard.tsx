// Export / import of the whole database as JSON (SPEC §8.6, §11 "Datos").
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card } from '@/components';
import { exportAll, exportFileName, serializeExport } from '@/data';
import { canShareFiles, downloadText, shareText } from './download';
import { ImportJson } from './ImportJson';

export function DataCard() {
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function doExport(share: boolean) {
    setBusy(true);
    try {
      const file = await exportAll();
      const text = serializeExport(file);
      const name = exportFileName(new Date());
      const ok = share ? await shareText(name, text) : downloadText(name, text);
      setMessage(
        ok
          ? { kind: 'ok', text: `Exportado ${name}.` }
          : { kind: 'error', text: 'No se pudo exportar en este navegador.' },
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card eyebrow="Datos" title="Exportar e importar">
      <p className="text-sm text-ink2 mb-3">
        Tus datos viven solo en este dispositivo. Exporta cada semana tras el Consejo para que
        limpiar Safari nunca los borre.
      </p>
      <div className="flex flex-col gap-2">
        <Button full onClick={() => doExport(false)} disabled={busy}>
          Exportar JSON
        </Button>
        {canShareFiles() && (
          <Button full variant="secondary" onClick={() => doExport(true)} disabled={busy}>
            Compartir
          </Button>
        )}
        <ImportJson />
        <Link
          to="/regen/ajustes"
          className="min-h-touch flex items-center text-accent font-bold text-sm"
        >
          Ajustes →
        </Link>
      </div>
      {message && (
        <div
          role={message.kind === 'error' ? 'alert' : 'status'}
          className={`mt-3 text-sm ${message.kind === 'error' ? 'text-status-ko' : 'text-status-ok'}`}
        >
          {message.text}
        </div>
      )}
    </Card>
  );
}
