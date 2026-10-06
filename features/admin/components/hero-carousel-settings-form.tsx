"use client";

import { useActionState } from "react";
import {
  saveHeroCarouselSettings,
  type HeroActionState,
} from "@/features/admin/actions/hero";
import type { HeroCarouselSettings } from "@/server/repositories/hero.repository";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function HeroCarouselSettingsForm({
  settings,
}: {
  settings: HeroCarouselSettings;
}) {
  const [state, action, pending] = useActionState<HeroActionState, FormData>(
    saveHeroCarouselSettings,
    {}
  );

  return (
    <form
      action={action}
      className="space-y-4 rounded-xl border border-ink/[0.08] bg-white p-4 shadow-[0_1px_2px_rgba(28,25,23,0.04)] sm:p-5"
    >
      <div>
        <h3 className="text-sm font-semibold tracking-tight text-ink">
          Αυτόματη αλλαγή slide
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-ink-muted">
          Οι επισκέπτες μπορούν πάντα να κάνουν swipe ή να χρησιμοποιούν τα
          βελάκια. Άνοιξε το autoplay αν θέλεις και αυτόματη εναλλαγή.
        </p>
      </div>
      {state.error ? (
        <p className="rounded-lg bg-coral/10 px-3 py-2 text-sm text-coral">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="rounded-lg bg-sage-dark/10 px-3 py-2 text-sm text-sage-dark">
          {state.success}
        </p>
      ) : null}
      <label className="flex items-start gap-2.5 text-sm text-ink">
        <input
          type="checkbox"
          name="autoplay"
          defaultChecked={settings.autoplay}
          className="mt-0.5 h-4 w-4 border-oak"
        />
        <span>
          <span className="font-medium">Ενεργό autoplay</span>
          <span className="mt-0.5 block text-xs text-ink-muted">
            Προτείνεται: 5–8 δευτερόλεπτα, ώστε να προλαβαίνουν να διαβάσουν.
          </span>
        </span>
      </label>
      <div className="max-w-[14rem]">
        <Label htmlFor="intervalSeconds">Δευτερόλεπτα ανά slide</Label>
        <Input
          id="intervalSeconds"
          name="intervalSeconds"
          type="number"
          min={2}
          max={60}
          required
          defaultValue={settings.intervalSeconds}
          className="mt-1.5 h-10 border-oak/50 bg-white"
        />
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Αποθήκευση…" : "Αποθήκευση autoplay"}
      </Button>
    </form>
  );
}
