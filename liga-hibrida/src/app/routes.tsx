import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, PROFILE_ID } from '@/data/db';
import { Splash } from '@/components/Splash';
import { Layout } from './Layout';
import { OnboardingScreen } from '@/features/onboarding';
import { TodayScreen } from '@/features/today';
import { GymScreen, GymSessionScreen } from '@/features/gym';
import { RoutesScreen } from '@/features/routes';
import { LeagueScreen } from '@/features/league';
import { CouncilScreen, RegenScreen } from '@/features/regen';
import { SettingsScreen } from '@/features/settings';

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
        <Route path="liga" element={<LeagueScreen />} />
        <Route path="regen" element={<RegenScreen />} />
        <Route path="regen/ajustes" element={<SettingsScreen />} />
        <Route path="regen/consejo" element={<CouncilScreen />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
