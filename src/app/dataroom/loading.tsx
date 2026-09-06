export default function DataroomLoading() {
  return (
    <section className="dataroom-loading" aria-live="polite" aria-busy="true">
      <span className="dataroom-skeleton is-heading" /><span className="visually-hidden">Loading Dataroom</span>
      <div>{Array.from({ length: 4 }, (_, index) => <span className="dataroom-skeleton is-stat" key={index} />)}</div>
      <span className="dataroom-skeleton is-panel" />
    </section>
  );
}
