"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  adjustStock,
  type StockActionState,
} from "@/features/admin/actions/misc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/features/admin/components/admin-ui";

export function InventoryStockControls({
  productId,
  initialStock,
  lowStockThreshold,
}: {
  productId: string;
  initialStock: number;
  lowStockThreshold: number;
}) {
  const [stock, setStock] = useState(initialStock);
  const [flash, setFlash] = useState<"up" | "down" | null>(null);
  const [feedback, setFeedback] = useState<{
    message: string;
    tone: "ok" | "err";
  } | null>(null);
  const [pending, startTransition] = useTransition();
  const [pendingDelta, setPendingDelta] = useState<number | "custom" | null>(
    null
  );
  const deltaRef = useRef<HTMLInputElement>(null);
  const noteRef = useRef<HTMLInputElement>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setStock(initialStock);
  }, [initialStock]);

  useEffect(() => {
    return () => {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    };
  }, []);

  function showFeedback(message: string, tone: "ok" | "err") {
    setFeedback({ message, tone });
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setFeedback(null), 3500);
  }

  function run(delta: number, note?: string, kind: number | "custom" = delta) {
    const fd = new FormData();
    fd.set("delta", String(delta));
    if (note) fd.set("note", note);

    setPendingDelta(kind);
    startTransition(async () => {
      const result: StockActionState = await adjustStock(productId, {}, fd);
      setPendingDelta(null);

      if (result.error) {
        toast.error(result.error);
        showFeedback(result.error, "err");
        return;
      }

      if (result.stock != null) {
        setStock(result.stock);
        setFlash(
          (result.appliedDelta ?? 0) > 0
            ? "up"
            : (result.appliedDelta ?? 0) < 0
              ? "down"
              : null
        );
        window.setTimeout(() => setFlash(null), 700);
      }

      const message = result.success ?? "Το stock ενημερώθηκε.";
      toast.success(message);
      showFeedback(message, "ok");

      if (kind === "custom") {
        if (deltaRef.current) deltaRef.current.value = "";
        if (noteRef.current) noteRef.current.value = "";
      }
    });
  }

  const low = stock <= lowStockThreshold;
  const busy = pending;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "inline-flex min-w-[2.5rem] items-center justify-center rounded-md px-2 py-1 font-semibold tabular-nums transition-colors",
            flash === "up" && "bg-emerald-100 text-emerald-800",
            flash === "down" && "bg-coral/15 text-coral",
            !flash && low && "bg-coral/10 text-coral",
            !flash && !low && "bg-ink/[0.04] text-ink"
          )}
        >
          {stock}
        </span>
        {low ? <StatusBadge tone="danger">Χαμηλό stock</StatusBadge> : null}
        <span className="text-xs text-ink-muted">
          όριο {lowStockThreshold}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={busy || stock <= 0}
          onClick={() => run(-1)}
          aria-label="Μείωση κατά 1"
        >
          {pendingDelta === -1 ? "…" : "−1"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={busy}
          onClick={() => run(1)}
          aria-label="Αύξηση κατά 1"
        >
          {pendingDelta === 1 ? "…" : "+1"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={busy}
          onClick={() => run(5)}
          aria-label="Αύξηση κατά 5"
        >
          {pendingDelta === 5 ? "…" : "+5"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={busy || stock <= 0}
          onClick={() => run(-5)}
          aria-label="Μείωση κατά 5"
        >
          {pendingDelta === -5 ? "…" : "−5"}
        </Button>

        <div className="flex items-center gap-1">
          <Input
            ref={deltaRef}
            name="delta"
            type="number"
            placeholder="±"
            disabled={busy}
            className="h-9 w-16 border-oak/45 bg-white px-2 text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const n = Number(deltaRef.current?.value);
                if (Number.isInteger(n) && n !== 0) {
                  run(n, noteRef.current?.value.trim() || undefined, "custom");
                } else {
                  toast.error("Βάλε ακέραιο διαφορετικό από το 0.");
                }
              }
            }}
          />
          <Input
            ref={noteRef}
            name="note"
            placeholder="Σημείωση"
            disabled={busy}
            className="h-9 w-28 border-oak/45 bg-white px-2 text-sm"
          />
          <Button
            type="button"
            size="sm"
            disabled={busy}
            onClick={() => {
              const n = Number(deltaRef.current?.value);
              if (!Number.isInteger(n) || n === 0) {
                toast.error("Βάλε ακέραιο διαφορετικό από το 0.");
                return;
              }
              run(n, noteRef.current?.value.trim() || undefined, "custom");
            }}
          >
            {pendingDelta === "custom" ? "…" : "Εφαρμογή"}
          </Button>
        </div>
      </div>

      {feedback ? (
        <p
          className={cn(
            "text-xs font-medium",
            feedback.tone === "err" ? "text-coral" : "text-sage-dark"
          )}
          role="status"
          aria-live="polite"
        >
          {feedback.message}
        </p>
      ) : (
        <p className="text-xs text-ink-muted">
          Οι αλλαγές αποθηκεύονται αμέσως.
        </p>
      )}
    </div>
  );
}
