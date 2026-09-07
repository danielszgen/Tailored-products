// Reusable "Importar JSON" control: file picker → zod validation → confirmation sheet → replace.
import { useRef, useState } from 'react';
import { Button, Sheet } from '@/components';
import { ImportError, importAll, parseExport, type ExportFile } from '@/data';

function countRows(file: ExportFile): { table: string; n: number }[] {
  return Object.entries(file.tables).map(([table, rows]) => ({
    table,
    n: Array.isArray(rows) ? rows.length : 0,
  }));
}

export interface ImportJsonProps {
  label?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  onImported?: (counts: Record<string, number>) => void;
}

export function ImportJson({
  label = 'Importar JSON',
  variant = 'secondary',
  onImported,
}: ImportJsonProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<ExportFile | null>(null);
  const [message, setMessage] = useState<{
    kind: 'ok' | 'error';
    text: string;
    issues?: string[];
  } | null>(null);
  const [busy, setBusy] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    try {
      const text = await f.text();
      setPending(parseExport(text));
      setMessage(null);
    } catch (err) {
      if (err instanceof ImportError)
        setMessage({ kind: 'error', text: err.message, issues: err.issues });
      else setMessage({ kind: 'error', text: 'Archivo no válido.' });
    }
  }

  async function confirmImport() {
    if (!pending) return;
    setBusy(true);
    try {
      const counts = await importAll(pending, 'replace');
      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      setMessage({ kind: 'ok', text: `Importado: ${total} registros.` });
      setPending(null);
      onImported?.(counts);
    } catch (err) {
      setMessage({
        kind: 'error',
        text: err instanceof Error ? err.message : 'Error al importar.',
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button full variant={variant} onClick={() => fileInput.current?.click()} disabled={busy}>
        {label}
      </Button>
      <input
        ref={fileInput}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        aria-label="Archivo de importación"
        onChange={onFile}
      />
      {message && (
        <div
          role={message.kind === 'error' ? 'alert' : 'status'}
          className={`mt-2 text-sm ${message.kind === 'error' ? 'text-status-ko' : 'text-status-ok'}`}
        >
          {message.text}
          {message.issues && message.issues.length > 0 && (
            <ul className="text-xs text-ink3 mt-1 list-disc pl-4">
              {message.issues.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      <Sheet
        open={!!pending}
        onClose={() => setPending(null)}
        title="Reemplazar todos los datos"
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setPending(null)} disabled={busy}>
              Cancelar
            </Button>
            <Button full variant="danger" onClick={confirmImport} disabled={busy}>
              Importar y reemplazar
            </Button>
          </div>
        }
      >
        {pending && (
          <>
            <p className="text-sm text-ink2 mb-2">
              Exportado el {pending.exportedAt.slice(0, 10)} · esquema v{pending.schemaVersion}. Se
              borrará lo que hay ahora.
            </p>
            <ul className="text-sm text-ink grid grid-cols-2 gap-1">
              {countRows(pending).map((r) => (
                <li key={r.table}>
                  {r.table}: <span className="font-bold">{r.n}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </Sheet>
    </>
  );
}
