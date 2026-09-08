import { lazy, Suspense, type ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, PROFILE_ID } from '@/data/db';
import { Splash } from '@/components/Splash';
import { Layout } from './Layout';
import { OnboardingScreen } from '@/features/onboarding';
import { TodayScreen } from '@/features/today';
import { GymScreen, GymSessionScreen } from '@/features/gym';
import { RoutesScreen } from '@/features/routes';
// Direct file import: the feature index also exports CouncilScreen, which would pull the Council
// into the first-load chunk instead of the lazy one below.
import { RegenScreen } from '@/features/regen/RegenScreen';

// Secondary screens load on demand to keep the first load small (SPEC §11: < 200 KB JS gzip).
const LeagueScreen = lazy(() =>
  import('@/features/league/LeagueScreen').then((m) => ({ default: m.LeagueScreen })),
);
const LeagueTestScreen = lazy(() =>
  import('@/features/league/LeagueTestScreen').then((m) => ({ default: m.LeagueTestScreen })),
);
const BlockReportScreen = lazy(() =>
  import('@/features/league/BlockReportScreen').then((m) => ({ default: m.BlockReportScreen })),
);
const CouncilScreen = lazy(() =>
  import('@/features/regen/CouncilScreen').then((m) => ({ default: m.CouncilScreen })),
);
const SettingsScreen = lazy(() =>
  import('@/features/settings/SettingsScreen').then((m) => ({ default: m.SettingsScreen })),
);
const RivalScreen = lazy(() =>
  import('@/features/rival/RivalScreen').then((m) => ({ default: m.RivalScreen })),
);

/** Gate: without a Profile the only screen is the onboarding ("Semana 0"). */
function RequireProfile({ children }: { children: ReactNode }) {
  const profile = useLiveQuery(async () => (await db.profile.get(PROFILE_ID)) ?? null, []);
  if (profile === undefined) return <Splash />;
  if (profile === null) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

function OnboardingGate() {
  const profile = useLiveQuery(async () => (await db.profile.get(PROFILE_ID)) ?? null, []);
  if (profile === undefined) return <Splash />;
  if (profile) return <Navigate to="/" replace />;
  return <OnboardingScreen />;
}

function Lazy({ children }: { children: ReactNode }) {
  return <Suspense fallback={<Splash />}>{children}</Suspense>;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/onboarding" element={<OnboardingGate />} />
      <Route
        element={
          <RequireProfile>
            <Layout />
          </RequireProfile>
        }
      >
        <Route index element={<TodayScreen />} />
        <Route path="gym" element={<GymScreen />} />
        <Route path="gym/:gymId" element={<GymSessionScreen />} />
        <Route path="rutas" element={<RoutesScreen />} />
        <Route
          path="liga"
          element={
            <Lazy>
              <LeagueScreen />
            </Lazy>
          }
        />
        <Route
          path="liga/combate"
          element={
            <Lazy>
              <LeagueTestScreen />
            </Lazy>
          }
        />
        <Route
          path="liga/informe"
          element={
            <Lazy>
              <BlockReportScreen />
            </Lazy>
          }
        />
        <Route path="regen" element={<RegenScreen />} />
        <Route
          path="regen/ajustes"
          element={
            <Lazy>
              <SettingsScreen />
            </Lazy>
          }
        />
        <Route
          path="regen/consejo"
          element={
            <Lazy>
              <CouncilScreen />
            </Lazy>
          }
        />
        <Route
          path="regen/rival"
          element={
            <Lazy>
              <RivalScreen />
            </Lazy>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
