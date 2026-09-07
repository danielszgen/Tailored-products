import { Outlet } from 'react-router-dom';
import { TabBar } from '@/components/TabBar';

/** App frame: scrollable content + fixed bottom tab bar with safe-area padding. */
export function Layout() {
  return (
    <div className="min-h-dvh flex flex-col bg-bg">
      <main className="flex-1 pb-[calc(88px+env(safe-area-inset-bottom,0px))]">
        <Outlet />
      </main>
      <TabBar />
    </div>
  );
}
