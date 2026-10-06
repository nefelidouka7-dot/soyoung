import { TicketPercent } from "lucide-react";
import { prisma } from "@/db/prisma";
import { requireAdmin, decimalToNumber, formatAdminDate } from "@/lib/admin";
import { cn, formatPrice } from "@/lib/utils";
import {
  AdminPageHeader,
  AdminPanel,
  StatusBadge,
} from "@/features/admin/components/admin-ui";
import { CouponForm } from "@/features/admin/components/coupon-form";
import { CouponCardActions } from "@/features/admin/components/coupon-card-actions";

type CouponRow = Awaited<
  ReturnType<typeof prisma.coupon.findMany>
>[number];

function couponHealth(c: CouponRow, now: Date) {
  if (!c.active) return "inactive" as const;
  if (c.expiresAt && c.expiresAt < now) return "expired" as const;
  if (c.usageLimit != null && c.usageCount >= c.usageLimit)
    return "exhausted" as const;
  if (c.startsAt && c.startsAt > now) return "scheduled" as const;
  return "active" as const;
}

const HEALTH_LABEL: Record<ReturnType<typeof couponHealth>, string> = {
  active: "Ενεργό",
  inactive: "Κλειστό",
  expired: "Έληξε",
  exhausted: "Εξαντλήθηκε",
  scheduled: "Προγραμματισμένο",
};

const HEALTH_TONE: Record<
  ReturnType<typeof couponHealth>,
  "success" | "neutral" | "warning" | "danger" | "info"
> = {
  active: "success",
  inactive: "neutral",
  expired: "danger",
  exhausted: "warning",
  scheduled: "info",
};

export default async function AdminDiscountsPage() {
  await requireAdmin();

  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();
  const activeCount = coupons.filter(
    (c) => couponHealth(c, now) === "active"
  ).length;
  const totalUses = coupons.reduce((s, c) => s + c.usageCount, 0);
  const needsAttention = coupons.filter((c) => {
    const h = couponHealth(c, now);
    return h === "expired" || h === "exhausted";
  }).length;

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Εκπτώσεις"
        description="Coupon codes που οι πελάτες βάζουν στο checkout για έκπτωση."
      />

      <div className="rounded-xl border border-oak/30 bg-bg-muted/50 px-4 py-4 sm:px-5">
        <p className="text-sm font-medium text-ink">Πώς λειτουργεί</p>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-ink-muted">
          <li>Δημιούργησε έναν κωδικό (π.χ. WELCOME10) με ποσοστό ή σταθερό €.</li>
          <li>
            Προαιρετικά βάλε ελάχιστη παραγγελία, όριο χρήσεων ή ημερομηνία λήξης.
          </li>
          <li>
            Ο πελάτης τον πληκτρολογεί στο checkout — αν ισχύουν οι όροι, πέφτει
            η έκπτωση.
          </li>
        </ol>
        <p className="mt-3 text-xs text-ink-muted">
          Tip: κράτα λίγα ενεργά coupons. Πολλά μαζί μπερδεύουν και δυσκολεύουν
          τον έλεγχο.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Ενεργά τώρα" value={String(activeCount)} />
        <StatCard label="Συνολικές χρήσεις" value={String(totalUses)} />
        <StatCard
          label="Χρειάζονται προσοχή"
          value={String(needsAttention)}
          hint="Έληξαν ή εξαντλήθηκαν"
        />
      </div>

      <CouponForm defaultOpen={coupons.length === 0} />

      <AdminPanel
        title="Τα coupons σου"
        description={
          coupons.length
            ? `${coupons.length} κωδικό${coupons.length === 1 ? "ς" : "ι"} · πάτα για ενεργοποίηση ή διαγραφή`
            : "Δεν υπάρχουν ακόμα — δημιούργησε το πρώτο παραπάνω."
        }
      >
        {coupons.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-ink/[0.04] text-ink-muted">
              <TicketPercent className="h-6 w-6" strokeWidth={1.5} />
            </span>
            <p className="text-sm text-ink-muted">
              Χωρίς coupons, το checkout δεν έχει επιλογή έκπτωσης.
            </p>
          </div>
        ) : (
          <ul className="grid gap-3">
            {coupons.map((c) => (
              <CouponCard key={c.id} coupon={c} now={now} />
            ))}
          </ul>
        )}
      </AdminPanel>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-ink/[0.08] bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(28,25,23,0.04)]">
      <p className="text-[13px] text-ink-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-ink">
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-xs text-ink-muted">{hint}</p> : null}
    </div>
  );
}

function CouponCard({ coupon: c, now }: { coupon: CouponRow; now: Date }) {
  const health = couponHealth(c, now);
  const valueLabel =
    c.type === "PERCENTAGE"
      ? `${decimalToNumber(c.value)}%`
      : formatPrice(decimalToNumber(c.value));
  const usagePct =
    c.usageLimit != null && c.usageLimit > 0
      ? Math.min(100, Math.round((c.usageCount / c.usageLimit) * 100))
      : null;

  return (
    <li className="rounded-xl border border-oak/30 bg-bg/40 p-4 transition-colors hover:border-oak/45 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-mono text-lg font-semibold tracking-wide text-ink">
              {c.code}
            </p>
            <StatusBadge tone={HEALTH_TONE[health]}>
              {HEALTH_LABEL[health]}
            </StatusBadge>
          </div>

          <p className="mt-2 text-2xl font-semibold tracking-tight text-coral">
            {valueLabel}
            <span className="ml-1.5 text-sm font-medium text-ink-muted">
              {c.type === "PERCENTAGE" ? "έκπτωση" : "σταθερή έκπτωση"}
            </span>
          </p>

          <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-ink-muted">
            {c.minOrderAmount ? (
              <div>
                <dt className="inline">Ελάχ. </dt>
                <dd className="inline font-medium text-ink">
                  {formatPrice(decimalToNumber(c.minOrderAmount))}
                </dd>
              </div>
            ) : null}
            {c.maxDiscount && c.type === "PERCENTAGE" ? (
              <div>
                <dt className="inline">Μέγ. </dt>
                <dd className="inline font-medium text-ink">
                  {formatPrice(decimalToNumber(c.maxDiscount))}
                </dd>
              </div>
            ) : null}
            {c.startsAt ? (
              <div>
                <dt className="inline">Από </dt>
                <dd className="inline font-medium text-ink">
                  {formatAdminDate(c.startsAt)}
                </dd>
              </div>
            ) : null}
            <div>
              <dt className="inline">Λήξη </dt>
              <dd className="inline font-medium text-ink">
                {c.expiresAt ? formatAdminDate(c.expiresAt) : "χωρίς"}
              </dd>
            </div>
          </dl>

          <div className="mt-3 max-w-xs">
            <div className="flex items-baseline justify-between gap-2 text-xs">
              <span className="text-ink-muted">Χρήσεις</span>
              <span className="tabular-nums font-medium text-ink">
                {c.usageCount}
                {c.usageLimit != null ? ` / ${c.usageLimit}` : " · απεριόριστες"}
              </span>
            </div>
            {usagePct != null ? (
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink/[0.06]">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    usagePct >= 100
                      ? "bg-coral"
                      : usagePct >= 75
                        ? "bg-amber-500"
                        : "bg-sage"
                  )}
                  style={{ width: `${usagePct}%` }}
                />
              </div>
            ) : null}
          </div>
        </div>

        <CouponCardActions id={c.id} active={c.active} code={c.code} />
      </div>
    </li>
  );
}
