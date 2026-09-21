import { getServerDictionary } from "@/lib/i18n/server";

export default async function StorefrontLoading() {
  const dict = await getServerDictionary();

  return (
    <div className="container-page flex min-h-[50vh] flex-col items-center justify-center gap-5 py-20">
      <div
        className="h-9 w-9 animate-spin rounded-full border-2 border-oak/40 border-t-sage"
        aria-hidden
      />
      <p className="text-[11px] uppercase tracking-[0.18em] text-ink-muted">
        {dict.common.loading}
      </p>
    </div>
  );
}
