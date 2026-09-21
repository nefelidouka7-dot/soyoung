import { cn } from "@/lib/utils";

export function Badge({
  children,
  variant = "sale",
  className,
}: {
  children: React.ReactNode;
  variant?: "sale" | "new" | "neutral";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
        variant === "sale" && "bg-coral text-bg",
        variant === "new" && "bg-ink text-bg",
        variant === "neutral" && "bg-oak-soft text-ink",
        className
      )}
    >
      {children}
    </span>
  );
}
