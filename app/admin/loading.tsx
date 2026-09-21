export default function AdminLoading() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 p-10">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-oak/40 border-t-sage"
        aria-hidden
      />
      <p className="text-xs uppercase tracking-wider text-ink-muted">Loading…</p>
    </div>
  );
}
