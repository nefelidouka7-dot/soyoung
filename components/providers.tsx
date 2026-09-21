"use client";

import { Toaster } from "sonner";
import { LocaleProvider } from "@/lib/i18n/provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          className: "border border-oak/50 bg-bg-muted text-ink shadow-none",
        }}
      />
    </LocaleProvider>
  );
}
