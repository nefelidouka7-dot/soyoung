import Link from "next/link";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: { label: string; href: string };
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-16 text-center",
        className
      )}
    >
      <h2 className="font-serif text-2xl text-ink">{title}</h2>
      {description ? (
        <p className="mt-2 max-w-md text-sm text-ink-muted">{description}</p>
      ) : null}
      {action ? (
        <Link
          href={action.href}
          className="mt-6 inline-flex h-11 items-center bg-sage px-6 text-xs uppercase tracking-wide font-bold text-white transition-colors hover:bg-sage-dark"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
