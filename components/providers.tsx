"use client";

import { Toaster } from "sonner";
import { LocaleProvider } from "@/lib/i18n/provider";
import { NavigationProgress } from "@/components/navigation-progress";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <NavigationProgress />
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
