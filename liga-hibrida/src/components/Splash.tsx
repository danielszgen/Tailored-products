/** Full-screen loading state shown while Dexie answers the first query. */
export function Splash() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-3 bg-bg text-ink">
      <div className="display text-3xl">LIGA HÍBRIDA</div>
      <div className="eyebrow" role="status">
        Cargando…
      </div>
    </div>
  );
}
