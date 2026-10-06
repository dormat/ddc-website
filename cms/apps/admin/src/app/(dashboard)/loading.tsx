export default function Loading() {
  return (
    <div className="page-loader-block" aria-live="polite" aria-busy="true">
      <div className="spinner" />
      <span>Loading…</span>
    </div>
  );
}
