import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-soft-pulse bg-oak/25", className)}
      aria-hidden="true"
    />
  );
}
