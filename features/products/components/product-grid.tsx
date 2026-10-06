import { cn } from "@/lib/utils";

/** Consistent product grid — tighter on phones, roomier from md up. */
export function ProductGrid({
  children,
  className,
  variant = "catalog",
}: {
  children: React.ReactNode;
  className?: string;
  /** catalog = up to 4 cols; listing = 3 cols beside filters; featured = 4 from md */
  variant?: "catalog" | "listing" | "featured";
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-x-3 gap-y-3 sm:gap-x-4 sm:gap-y-4",
        variant === "catalog" && "md:grid-cols-3 lg:grid-cols-4 lg:gap-x-5 lg:gap-y-5",
        variant === "listing" && "md:grid-cols-3 lg:gap-x-5 lg:gap-y-5",
        variant === "featured" && "md:grid-cols-4 lg:gap-x-5 lg:gap-y-5",
        className
      )}
    >
      {children}
    </div>
  );
}
