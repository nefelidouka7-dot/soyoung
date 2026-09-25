import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const cardSurface =
  "rounded-xl border border-ink/[0.08] bg-white shadow-[0_1px_2px_rgba(28,25,23,0.04)]";

export function AdminPageHeader({
  title,
  description,
  actions,
  breadcrumb,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumb?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {breadcrumb ? <div className="mb-3">{breadcrumb}</div> : null}
        <h1 className="text-2xl font-semibold tracking-tight text-ink md:text-[1.7rem]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-muted">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}

export function AdminBreadcrumb({
  items,
}: {
  items: { href?: string; label: string }[];
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex flex-wrap items-center gap-1 text-xs text-ink-muted"
    >
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={`${item.label}-${i}`} className="inline-flex items-center gap-1">
            {i > 0 ? (
              <ChevronRight className="h-3 w-3 text-ink/25" aria-hidden />
            ) : null}
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="rounded px-0.5 transition-colors hover:text-ink"
              >
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? "font-medium text-ink" : undefined}>
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}

export function AdminPanel({
  children,
  className,
  title,
  description,
  action,
  flush,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  flush?: boolean;
}) {
  return (
    <section className={cn("overflow-hidden", cardSurface, className)}>
      {title || action ? (
        <div className="flex items-start justify-between gap-3 px-5 pb-1 pt-4">
          <div className="min-w-0">
            {title ? (
              <h2 className="text-[15px] font-semibold tracking-tight text-ink">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="mt-0.5 text-[13px] text-ink-muted">{description}</p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      <div className={cn(flush ? "pt-2" : "p-5 pt-4")}>{children}</div>
    </section>
  );
}

export function AdminDelta({
  value,
  className,
}: {
  /** Fractional change, e.g. 0.12 for +12%. `null` when there is no baseline. */
  value: number | null;
  className?: string;
}) {
  if (value === null) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full bg-ink/[0.05] px-1.5 py-0.5 text-[11px] font-semibold text-ink-muted",
          className
        )}
      >
        New
      </span>
    );
  }
  const up = value >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
        up ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700",
        className
      )}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {Math.abs(value * 100).toFixed(Math.abs(value) < 0.1 ? 1 : 0)}%
    </span>
  );
}

export function AdminStat({
  label,
  value,
  hint,
  href,
  icon: Icon,
  delta,
}: {
  label: string;
  value: string;
  hint?: string;
  href?: string;
  icon?: LucideIcon;
  /** Fractional change vs. the comparison period; omit to hide. */
  delta?: number | null;
}) {
  const inner = (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] font-medium text-ink-muted">{label}</p>
        {Icon ? (
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-ink/[0.04] text-ink/70 transition-colors group-hover:bg-coral/12 group-hover:text-sage-dark">
            <Icon className="h-4 w-4" aria-hidden />
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-[1.7rem] font-semibold leading-none tracking-tight text-ink tabular-nums">
        {value}
      </p>
      {delta !== undefined || hint ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {delta !== undefined ? <AdminDelta value={delta} /> : null}
          {hint ? <p className="text-xs text-ink-muted">{hint}</p> : null}
        </div>
      ) : null}
    </>
  );

  const className = cn("group relative block p-5 transition-all duration-200", cardSurface);

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          className,
          "hover:border-ink/15 hover:shadow-[0_8px_24px_-12px_rgba(28,25,23,0.18)]"
        )}
      >
        {inner}
      </Link>
    );
  }

  return <div className={className}>{inner}</div>;
}

export function AdminToolbar({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "mb-4 flex flex-wrap items-center gap-2 p-2.5 [&_input]:rounded-lg",
        cardSurface
      )}
    >
      {children}
    </div>
  );
}

export function AdminSelect({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-10 min-w-[9rem] rounded-lg border border-ink/[0.12] bg-white px-3 text-sm text-ink transition-colors",
        "hover:border-ink/25 focus-visible:border-coral focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-coral/15",
        className
      )}
      {...props}
    />
  );
}

export function AdminTable({
  children,
  minWidth = "720px",
  bare,
}: {
  children: React.ReactNode;
  minWidth?: string;
  /** Skip outer card chrome when nested inside AdminPanel */
  bare?: boolean;
}) {
  return (
    <div className={cn("overflow-x-auto", !bare && cardSurface)}>
      <table
        className="w-full text-left text-sm [&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-ink/[0.018] [&_tbody_tr+tr]:border-t [&_tbody_tr+tr]:border-ink/[0.06]"
        style={{ minWidth }}
      >
        {children}
      </table>
    </div>
  );
}

export function AdminTableHead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="border-b border-ink/[0.07] bg-ink/[0.02] text-xs text-ink-muted">
      {children}
    </thead>
  );
}

export function AdminTh({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <th className={cn("whitespace-nowrap px-4 py-2.5 font-medium", className)}>
      {children}
    </th>
  );
}

export function AdminTd({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return <td className={cn("px-4 py-3.5 align-middle", className)}>{children}</td>;
}

export function AdminEmpty({
  children,
  colSpan,
}: {
  children: React.ReactNode;
  colSpan?: number;
}) {
  if (colSpan != null) {
    return (
      <tr>
        <td
          colSpan={colSpan}
          className="px-4 py-16 text-center text-sm text-ink-muted"
        >
          {children}
        </td>
      </tr>
    );
  }
  return (
    <div className="rounded-xl border border-dashed border-ink/15 bg-white/60 px-4 py-16 text-center text-sm text-ink-muted">
      {children}
    </div>
  );
}

export function AdminTextLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-0.5 rounded-md px-2 py-1 text-[13px] font-medium text-ink-muted transition-colors hover:bg-ink/[0.04] hover:text-ink",
        className
      )}
    >
      {children}
      <ChevronRight
        className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
        aria-hidden
      />
    </Link>
  );
}

type Tone = "neutral" | "success" | "warning" | "danger" | "info";

const toneStyles: Record<Tone, { badge: string; dot: string }> = {
  neutral: { badge: "bg-ink/[0.05] text-ink-muted ring-ink/10", dot: "bg-ink/40" },
  success: { badge: "bg-emerald-50 text-emerald-700 ring-emerald-600/15", dot: "bg-emerald-500" },
  warning: { badge: "bg-amber-50 text-amber-800 ring-amber-600/20", dot: "bg-amber-500" },
  danger: { badge: "bg-rose-50 text-rose-700 ring-rose-600/15", dot: "bg-rose-500" },
  info: { badge: "bg-sky-50 text-sky-700 ring-sky-600/15", dot: "bg-sky-500" },
};

export function toneDotClass(tone: Tone) {
  return toneStyles[tone].dot;
}

function humanizeEnum(value: React.ReactNode) {
  if (typeof value !== "string" || !/^[A-Z][A-Z_]*$/.test(value)) return value;
  const lower = value.replace(/_/g, " ").toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export function StatusBadge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: Tone;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        toneStyles[tone].badge
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", toneStyles[tone].dot)} aria-hidden />
      {humanizeEnum(children)}
    </span>
  );
}

export function productStatusTone(status: string): Tone {
  switch (status) {
    case "ACTIVE":
      return "success";
    case "DRAFT":
      return "warning";
    case "ARCHIVED":
      return "neutral";
    default:
      return "info";
  }
}

export function orderStatusTone(status: string): Tone {
  switch (status) {
    case "DELIVERED":
    case "PAID":
      return "success";
    case "PENDING":
      return "warning";
    case "PROCESSING":
    case "SHIPPED":
      return "info";
    case "CANCELLED":
    case "REFUNDED":
      return "danger";
    default:
      return "neutral";
  }
}
