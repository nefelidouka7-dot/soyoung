function Block({ className }: { className: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl border border-ink/[0.06] bg-white ${className}`}
    />
  );
}

export default function AdminLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading">
      <div className="space-y-2.5 pb-2">
        <div className="h-3.5 w-40 animate-pulse rounded-md bg-ink/[0.06]" />
        <div className="h-7 w-64 animate-pulse rounded-md bg-ink/[0.08]" />
        <div className="h-4 w-80 max-w-full animate-pulse rounded-md bg-ink/[0.05]" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Block key={i} className="h-[8.5rem]" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <Block className="h-[26rem] xl:col-span-2" />
        <Block className="h-[26rem]" />
      </div>
    </div>
  );
}
