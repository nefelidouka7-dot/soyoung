import { cn } from "@/lib/utils";

export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="font-serif text-2xl text-ink md:text-3xl">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-ink-muted">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function AdminPanel({
  children,
  className,
  title,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <section className={cn("rounded-sm border border-oak/40 bg-white", className)}>
      {title ? (
        <div className="border-b border-oak/30 px-4 py-3">
          <h2 className="text-sm font-medium text-ink">{title}</h2>
        </div>
      ) : null}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function StatusBadge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
        tone === "neutral" && "bg-oak-soft text-ink",
        tone === "success" && "bg-sage/25 text-sage-dark",
        tone === "warning" && "bg-oak/50 text-ink",
        tone === "danger" && "bg-coral/20 text-coral",
        tone === "info" && "bg-ink/10 text-ink"
      )}
    >
      {children}
    </span>
  );
}

export function productStatusTone(
  status: string
): "neutral" | "success" | "warning" | "danger" | "info" {
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

export function orderStatusTone(
  status: string
): "neutral" | "success" | "warning" | "danger" | "info" {
  switch (status) {
    case "DELIVERED":
    case "PAID":
      return "success";
    case "PENDING":
    case "PROCESSING":
      return "warning";
    case "SHIPPED":
      return "info";
    case "CANCELLED":
    case "REFUNDED":
      return "danger";
    default:
      return "neutral";
  }
}
