import { Badge } from "@/components/ui/badge";
import type { Dictionary } from "@/lib/i18n/types";
import { cn } from "@/lib/utils";

type StatusKey = keyof Dictionary["account"]["statuses"];

export function orderStatusLabel(
  dict: Dictionary,
  status: string
): string {
  const statuses = dict.account.statuses;
  if (status in statuses) {
    return statuses[status as StatusKey];
  }
  return status;
}

export function OrderStatusBadge({
  status,
  label,
  className,
}: {
  status: string;
  label: string;
  className?: string;
}) {
  const tone =
    status === "DELIVERED" || status === "PAID"
      ? "neutral"
      : status === "CANCELLED" || status === "REFUNDED"
        ? "sale"
        : "new";

  return (
    <Badge
      variant={tone === "sale" ? "sale" : tone === "new" ? "new" : "neutral"}
      className={cn(
        tone === "new" && "bg-oak-soft text-ink",
        className
      )}
    >
      {label}
    </Badge>
  );
}
