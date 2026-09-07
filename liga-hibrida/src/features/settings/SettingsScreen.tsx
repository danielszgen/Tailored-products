// Ajustes (SPEC §8.6): theme, windows, week template, units, export, delete all, about.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Eyebrow, Screen, Segmented, Sheet, Splash } from '@/components';
import { useTheme, type ThemePref } from '@/app/providers/ThemeProvider';
import {
  clearAll,
  exportAll,
  exportFileName,
  SCHEMA_VERSION,
  serializeExport,
  updateProfile,
  useProfile,
} from '@/data';
import { WEEK_TEMPLATE_NAMES } from '@/domain/content/week';
import type { WeekTemplate } from '@/domain/types';
import { downloadText } from '@/features/regen/download';

const THEME_OPTIONS: { value: ThemePref; label: string }[] = [
  { value: 'system', label: 'Sistema' },
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
];

const TEMPLATE_OPTIONS = (Object.keys(WEEK_TEMPLATE_NAMES) as WeekTemplate[]).map((id) => ({
  value: id,
  label: WEEK_TEMPLATE_NAMES[id],
}));

export function SettingsScreen() {
  const navigate = useNavigate();
  const { pref, setPref } = useTheme();
  const profile = useProfile();
  const [wipeOpen, setWipeOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [busy, setBusy] = useState(false);

  if (profile === undefined) return <Splash />;

  const setWindow = (key: 'amWindow' | 'pmWindow', index: 0 | 1, value: string) => {
    if (!profile) return;
    const next: [string, string] = [...profile[key]] as [string, string];
    next[index] = value;
    void updateProfile({ [key]: next });
  };

  async function wipe() {
    setBusy(true);
    try {
      await clearAll();
      setWipeOpen(false);
      navigate('/onboarding', { replace: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen title="Ajustes" eyebrow="Entrenador" back="/regen">
      <Card eyebrow="Tema" title="Claro / oscuro">
        <Segmented value={pref} onChange={setPref} options={THEME_OPTIONS} />
      </Card>

      {profile && (
        <Card eyebrow="Ventanas (D7)" title="AM y PM">
          <div className="grid grid-cols-2 gap-3">
            {(['amWindow', 'pmWindow'] as const).map((key) =>
              ([0, 1] as const).map((i) => (
                <label key={`${key}-${i}`} className="block">
                  <span className="eyebrow block mb-1">
                    {key === 'amWindow' ? 'AM' : 'PM'} · {i === 0 ? 'desde' : 'hasta'}
                  </span>
                  <input
                    className="input"
                    type="time"
                    value={profile[key][i]}
                    onChange={(e) => setWindow(key, i, e.target.value)}
                  />
                </label>
              )),
            )}
          </div>
        </Card>
      )}

      {profile && (
        <Card eyebrow="Plantilla de semana" title="Por defecto">
          <Segmented
            value={profile.defaultTemplate ?? 'estandar'}
            onChange={(v) => void updateProfile({ defaultTemplate: v })}
            options={TEMPLATE_OPTIONS}
            columns={2}
          />
          <p className="text-xs text-ink3 mt-2">
            Las plantillas distintas de Estándar se aplican al planificador desde la Etapa II.
          </p>
        </Card>
      )}

      <Card eyebrow="Unidades (D12)" title="kg · cm · min">
        <p className="text-sm text-ink3">Peso con 1 decimal.</p>
      </Card>

      <Card eyebrow="Datos" title="Exportar">
        <Button
          full
          variant="secondary"
          onClick={async () => {
            const file = await exportAll();
            downloadText(exportFileName(new Date()), serializeExport(file));
          }}
        >
          Exportar JSON
        </Button>
      </Card>

      <Card eyebrow="Zona peligrosa" title="Borrar todo">
        <p className="text-sm text-ink2 mb-3">
          Elimina la ficha y todos los registros de este dispositivo. Exporta antes.
        </p>
        <Button full variant="danger" onClick={() => setWipeOpen(true)}>
          Borrar todo
        </Button>
      </Card>

      <div className="px-1">
        <Eyebrow className="block">Liga Híbrida · Esquema v{SCHEMA_VERSION}</Eyebrow>
        <Eyebrow className="block">Local-first · sin analítica · sin cookies</Eyebrow>
      </div>

      <Sheet
        open={wipeOpen}
        onClose={() => setWipeOpen(false)}
        title="¿Borrar todo?"
        footer={
          <Button
            full
            variant="danger"
            disabled={confirmText.trim().toUpperCase() !== 'BORRAR' || busy}
            onClick={wipe}
          >
            Borrar definitivamente
          </Button>
        }
      >
        <p className="text-sm text-ink2 mb-3">Escribe BORRAR para confirmar.</p>
        <input
          className="input"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          aria-label="Confirmación"
          autoCapitalize="characters"
        />
      </Sheet>
    </Screen>
  );
}
