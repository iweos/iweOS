export default function PortalLoadingState({ label = "Loading workspace" }: { label?: string }) {
  return (
    <section className="portal-loading-state" aria-live="polite" aria-busy="true">
      <div className="portal-loading-heading"><span className="portal-skeleton portal-skeleton-kicker" /><span className="portal-skeleton portal-skeleton-title" /><span className="visually-hidden">{label}</span></div>
      <div className="portal-loading-stats">{Array.from({ length: 4 }, (_, index) => <span className="portal-skeleton" key={index} />)}</div>
      <div className="portal-loading-panel"><span className="portal-skeleton portal-skeleton-line" /><span className="portal-skeleton portal-skeleton-line is-short" /><span className="portal-skeleton portal-skeleton-block" /></div>
    </section>
  );
}
