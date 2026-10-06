"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Percent, Plus, Ticket, X } from "lucide-react";
import {
  createCoupon,
  type CouponActionState,
} from "@/features/admin/actions/misc";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CouponForm({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(defaultOpen);
  const [type, setType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [code, setCode] = useState("");
  const [value, setValue] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [state, action, pending] = useActionState<CouponActionState, FormData>(
    createCoupon,
    {}
  );

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      setCode("");
      setValue("");
      setType("PERCENTAGE");
      setShowAdvanced(false);
    }
  }, [state.success]);

  if (!open) {
    return (
      <div
        id="add-coupon"
        className="rounded-xl border border-dashed border-ink/20 bg-white p-5 shadow-[0_1px_2px_rgba(28,25,23,0.04)] sm:p-6"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-coral/10 text-coral">
              <Ticket className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            </span>
            <div>
              <h3 className="text-base font-semibold tracking-tight text-ink">
                Νέο coupon
              </h3>
              <p className="mt-1 max-w-md text-sm leading-relaxed text-ink-muted">
                Φτιάξε κωδικό έκπτωσης για το checkout — ποσοστό ή σταθερό ποσό,
                με προαιρετικό όριο χρήσεων και ημερομηνία λήξης.
              </p>
            </div>
          </div>
          <Button
            type="button"
            onClick={() => setOpen(true)}
            className="shrink-0 gap-1.5"
          >
            <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
            Δημιουργία coupon
          </Button>
        </div>
      </div>
    );
  }

  const previewValue =
    value.trim() === ""
      ? "—"
      : type === "PERCENTAGE"
        ? `${value}%`
        : `€${value}`;

  return (
    <form
      ref={formRef}
      id="add-coupon"
      action={action}
      className="space-y-5 rounded-xl border border-ink/[0.08] bg-white p-4 shadow-[0_1px_2px_rgba(28,25,23,0.04)] sm:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-coral/10 text-coral">
            <Ticket className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          </span>
          <div>
            <h3 className="text-base font-semibold tracking-tight text-ink">
              Νέο coupon
            </h3>
            <p className="mt-1 text-sm text-ink-muted">
              Συμπλήρωσε τα βασικά — τα υπόλοιπα είναι προαιρετικά.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-ink/[0.05] hover:text-ink"
          aria-label="Κλείσιμο φόρμας"
        >
          <X className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>

      {state.error ? (
        <p className="rounded-lg bg-coral/10 px-3 py-2 text-sm text-coral">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="rounded-lg bg-sage/15 px-3 py-2 text-sm text-sage-dark">
          {state.success}
        </p>
      ) : null}

      <div className="rounded-lg border border-oak/35 bg-bg px-4 py-3">
        <p className="text-xs font-medium text-ink-muted">Προεπισκόπηση</p>
        <div className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-mono text-lg font-semibold tracking-wide text-ink">
            {code.trim() ? code.trim().toUpperCase() : "WELCOME10"}
          </span>
          <span className="text-sm font-medium text-coral">{previewValue} off</span>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <Label htmlFor="code">Κωδικός</Label>
          <Input
            id="code"
            name="code"
            required
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="π.χ. WELCOME10"
            className="mt-1.5 h-11 border-oak/50 bg-white font-mono uppercase tracking-wide"
            autoComplete="off"
          />
          <p className="mt-1.5 text-xs text-ink-muted">
            Στο checkout δεν μετράνε πεζά/κεφαλαία.
          </p>
        </div>

        <div>
          <p className="text-sm font-medium text-ink">Τύπος έκπτωσης</p>
          <input type="hidden" name="type" value={type} />
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <TypeOption
              selected={type === "PERCENTAGE"}
              title="Ποσοστό"
              description="π.χ. 15% off σε όλη την παραγγελία"
              icon={<Percent className="h-4 w-4" strokeWidth={1.75} />}
              onSelect={() => setType("PERCENTAGE")}
            />
            <TypeOption
              selected={type === "FIXED"}
              title="Σταθερό ποσό"
              description="π.χ. €10 έκπτωση στο σύνολο"
              icon={<span className="text-sm font-semibold">€</span>}
              onSelect={() => setType("FIXED")}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="value">
            {type === "PERCENTAGE" ? "Ποσοστό (%)" : "Ποσό (€)"}
          </Label>
          <Input
            id="value"
            name="value"
            type="number"
            step="0.01"
            min="0"
            max={type === "PERCENTAGE" ? 100 : undefined}
            required
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={type === "PERCENTAGE" ? "15" : "10"}
            className="mt-1.5 h-11 border-oak/50 bg-white"
          />
        </div>
      </div>

      <div className="border-t border-oak/25 pt-4">
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="text-sm font-medium text-sage-dark hover:underline"
        >
          {showAdvanced
            ? "Απόκρυψη επιπλέον επιλογών"
            : "Όρια, ημερομηνίες & προϋποθέσεις"}
        </button>

        {showAdvanced ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {type === "PERCENTAGE" ? (
              <div>
                <Label htmlFor="maxDiscount">Μέγιστη έκπτωση (€)</Label>
                <Input
                  id="maxDiscount"
                  name="maxDiscount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="π.χ. 20"
                  className="mt-1.5 h-10 border-oak/50 bg-white"
                />
                <p className="mt-1 text-xs text-ink-muted">
                  Αν 15% βγάζει πολύ, κόβεται σε αυτό το ποσό.
                </p>
              </div>
            ) : (
              <input type="hidden" name="maxDiscount" value="" />
            )}
            <div>
              <Label htmlFor="minOrder">Ελάχ. παραγγελία (€)</Label>
              <Input
                id="minOrder"
                name="minOrder"
                type="number"
                step="0.01"
                min="0"
                placeholder="π.χ. 50"
                className="mt-1.5 h-10 border-oak/50 bg-white"
              />
              <p className="mt-1 text-xs text-ink-muted">
                Ισχύει μόνο αν το καλάθι φτάνει αυτό το ποσό.
              </p>
            </div>
            <div>
              <Label htmlFor="usageLimit">Όριο χρήσεων</Label>
              <Input
                id="usageLimit"
                name="usageLimit"
                type="number"
                min="1"
                placeholder="Απεριόριστο"
                className="mt-1.5 h-10 border-oak/50 bg-white"
              />
            </div>
            <div className="sm:col-span-2 grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="startsAt">Έναρξη</Label>
                <Input
                  id="startsAt"
                  name="startsAt"
                  type="datetime-local"
                  className="mt-1.5 h-10 border-oak/50 bg-white"
                />
              </div>
              <div>
                <Label htmlFor="expiresAt">Λήξη</Label>
                <Input
                  id="expiresAt"
                  name="expiresAt"
                  type="datetime-local"
                  className="mt-1.5 h-10 border-oak/50 bg-white"
                />
              </div>
            </div>
          </div>
        ) : (
          <>
            <input type="hidden" name="maxDiscount" value="" />
            <input type="hidden" name="minOrder" value="" />
            <input type="hidden" name="usageLimit" value="" />
            <input type="hidden" name="startsAt" value="" />
            <input type="hidden" name="expiresAt" value="" />
          </>
        )}
      </div>

      <label className="flex items-start gap-2.5 rounded-lg border border-oak/30 bg-bg/60 px-3 py-2.5 text-sm">
        <input
          type="checkbox"
          name="active"
          defaultChecked
          className="mt-0.5 accent-sage"
        />
        <span>
          <span className="font-medium text-ink">Ενεργό αμέσως</span>
          <span className="mt-0.5 block text-xs text-ink-muted">
            Αν είναι τσεκαρισμένο, ο κωδικός δουλεύει στο checkout μόλις τον
            αποθηκεύσεις.
          </span>
        </span>
      </label>

      <div className="flex flex-wrap items-center gap-3 border-t border-oak/25 pt-4">
        <Button type="submit" disabled={pending} className="gap-1.5">
          {!pending ? (
            <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
          ) : null}
          {pending ? "Δημιουργία…" : "Δημιουργία coupon"}
        </Button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm font-medium text-ink-muted hover:text-ink hover:underline"
        >
          Ακύρωση
        </button>
      </div>
    </form>
  );
}

function TypeOption({
  selected,
  title,
  description,
  icon,
  onSelect,
}: {
  selected: boolean;
  title: string;
  description: string;
  icon: React.ReactNode;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex items-start gap-3 rounded-lg border px-3 py-3 text-left transition-colors",
        selected
          ? "border-coral/50 bg-coral/[0.06] ring-1 ring-coral/30"
          : "border-oak/40 bg-white hover:border-oak/60 hover:bg-bg/50"
      )}
    >
      <span
        className={cn(
          "mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          selected ? "bg-coral/15 text-coral" : "bg-ink/[0.05] text-ink-muted"
        )}
      >
        {icon}
      </span>
      <span>
        <span className="block text-sm font-semibold text-ink">{title}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-ink-muted">
          {description}
        </span>
      </span>
    </button>
  );
}
