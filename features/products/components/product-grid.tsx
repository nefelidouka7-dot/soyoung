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
        "grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-4 sm:gap-y-10",
        variant === "catalog" && "md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-12",
        variant === "listing" && "md:grid-cols-3 lg:gap-x-6 lg:gap-y-10",
        variant === "featured" && "md:grid-cols-4 lg:gap-x-6 lg:gap-y-10",
        className
      )}
    >
      {children}
    </div>
  );
}
