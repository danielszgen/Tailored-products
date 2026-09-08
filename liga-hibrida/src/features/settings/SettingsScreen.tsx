// Ajustes (SPEC §8.6): theme, windows, week template, units, notifications, El Rival (§10.2),
// export, delete all.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  Eyebrow,
  Pill,
  Screen,
  Segmented,
  Sheet,
  Splash,
  type PillTone,
} from '@/components';
import { useTheme, type ThemePref } from '@/app/providers/ThemeProvider';
import {
  clearAll,
  exportAll,
  exportFileName,
  saveWeek,
  SCHEMA_VERSION,
  serializeExport,
  updateProfile,
  useProfile,
} from '@/data';
import { BLOCK_WEEKS } from '@/domain/content/block';
import { buildWeekPlan, WEEK_TEMPLATE_NAMES } from '@/domain/content/week';
import { applyDeloadToWeek } from '@/domain/rules/deload';
import type { WeekTemplate } from '@/domain/types';
import { todayISO, weekOfBlock, weekStartOf } from '@/lib/date';
import {
  isNotificationsEnabled,
  isStandalone,
  NOTIFICATIONS_IOS_NOTE,
  notificationPermission,
  requestNotificationPermission,
  setNotificationsEnabled,
  type NotificationPermissionState,
} from '@/lib/notifications';
import { downloadText } from '@/features/regen/download';
import { RivalSettingsCard } from '@/features/rival/RivalSettingsCard';

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
  const [applyOpen, setApplyOpen] = useState(false);
  const [applied, setApplied] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [busy, setBusy] = useState(false);

  if (profile === undefined) return <Splash />;

  const today = todayISO();
  const wob = profile ? weekOfBlock(today, profile.blockStart) : 0;
  const inBlock = wob >= 1 && wob <= BLOCK_WEEKS;
  const template = profile?.defaultTemplate ?? 'estandar';

  async function applyTemplate() {
    if (!profile || !inBlock) return;
    setBusy(true);
    try {
      const plan = applyDeloadToWeek(
        buildWeekPlan({ weekStart: weekStartOf(today), weekOfBlock: wob, template }),
      );
      await saveWeek(plan);
      setApplyOpen(false);
      setApplied(`Semana ${wob} regenerada con la plantilla ${WEEK_TEMPLATE_NAMES[template]}.`);
    } finally {
      setBusy(false);
    }
  }

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
            Se usa al generar cada semana (primera apertura y Consejo de la Liga). Fatiga y Viaje
            activan el orden de recorte (R9) en HOY.
          </p>
          <Button
            full
            variant="secondary"
            className="mt-3"
            onClick={() => setApplyOpen(true)}
            disabled={!inBlock}
          >
            Aplicar a esta semana
          </Button>
          {applied && (
            <p role="status" className="text-sm text-status-ok mt-2">
              {applied}
            </p>
          )}
        </Card>
      )}

      <Card eyebrow="Unidades (D12)" title="kg · cm · min">
        <p className="text-sm text-ink3">Peso con 1 decimal.</p>
      </Card>

      <NotificationsCard />

      {profile && <RivalSettingsCard profile={profile} />}

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
        open={applyOpen}
        onClose={() => setApplyOpen(false)}
        title="¿Aplicar la plantilla a esta semana?"
        footer={
          <Button full onClick={applyTemplate} disabled={busy}>
            Aplicar {WEEK_TEMPLATE_NAMES[template]}
          </Button>
        }
      >
        <p className="text-sm text-ink2">
          Sustituye el plan de la semana {wob} (y sus sustituciones) por la plantilla{' '}
          {WEEK_TEMPLATE_NAMES[template]}. Los combates y rutas registrados no se tocan.
        </p>
      </Sheet>

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

const PERMISSION_LABEL: Record<NotificationPermissionState, { text: string; tone: PillTone }> = {
  granted: { text: 'concedido', tone: 'ok' },
  denied: { text: 'denegado', tone: 'ko' },
  default: { text: 'pendiente', tone: 'neutral' },
  unsupported: { text: 'no disponible', tone: 'neutral' },
};

const REMINDERS = [
  'Check-in matinal al abrir la ventana AM, si aún no lo has hecho.',
  '«¿Aductor 30–60 min después?» 45 min tras Cantera o Resorte.',
  'Fin del descanso entre series.',
];

/** Local notifications opt-in (SPEC §9 Etapa III, §11): the switch only stays on when granted. */
function NotificationsCard() {
  const [permission, setPermission] = useState<NotificationPermissionState>(notificationPermission);
  const [enabled, setEnabled] = useState(
    () => isNotificationsEnabled() && notificationPermission() === 'granted',
  );
  const [busy, setBusy] = useState(false);

  async function toggle(next: boolean) {
    if (!next) {
      setNotificationsEnabled(false);
      setEnabled(false);
      return;
    }
    setBusy(true);
    try {
      const result = await requestNotificationPermission();
      const granted = result === 'granted';
      setPermission(result);
      setNotificationsEnabled(granted);
      setEnabled(granted);
    } finally {
      setBusy(false);
    }
  }

  const label = PERMISSION_LABEL[permission];
  return (
    <Card
      eyebrow="Notificaciones locales"
      title="Check-in, aductor y descansos"
      right={<Pill tone={label.tone}>{label.text}</Pill>}
    >
      <label className="flex items-center justify-between gap-3 min-h-touch">
        <span className="text-sm text-ink">Avisos en este dispositivo</span>
        <input
          type="checkbox"
          role="switch"
          aria-label="Notificaciones locales"
          className="w-6 h-6 accent-accent"
          checked={enabled}
          disabled={busy}
          onChange={(e) => void toggle(e.target.checked)}
        />
      </label>
      <ul className="text-sm text-ink2 mt-2 flex flex-col gap-1">
        {REMINDERS.map((text) => (
          <li key={text}>· {text}</li>
        ))}
      </ul>
      <p className="text-xs text-ink3 mt-3">{NOTIFICATIONS_IOS_NOTE}</p>
      <Eyebrow className="block mt-2">
        Instalada en pantalla de inicio: {isStandalone() ? 'sí' : 'no'}
      </Eyebrow>
    </Card>
  );
}
