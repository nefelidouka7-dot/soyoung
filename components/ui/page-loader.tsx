"use client";

export function PageLoader() {
  return (
    <div
      data-page-loader
      className="flex min-h-[40vh] items-center justify-center py-16"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Loading</span>
      <span
        className="h-5 w-5 rounded-full border border-oak/30 border-t-sage/80 animate-loader-spin"
        aria-hidden
      />
    </div>
  );
}
