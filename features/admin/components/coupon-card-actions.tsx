"use client";

import { deleteCoupon, toggleCoupon } from "@/features/admin/actions/misc";
import { Button } from "@/components/ui/button";

export function CouponCardActions({
  id,
  active,
  code,
}: {
  id: string;
  active: boolean;
  code: string;
}) {
  return (
    <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-stretch">
      <form action={toggleCoupon.bind(null, id, !active)}>
        <Button type="submit" size="sm" variant="secondary" className="w-full">
          {active ? "Απενεργοποίηση" : "Ενεργοποίηση"}
        </Button>
      </form>
      <form
        action={deleteCoupon.bind(null, id)}
        onSubmit={(e) => {
          if (!confirm(`Διαγραφή του coupon ${code};`)) e.preventDefault();
        }}
      >
        <Button
          type="submit"
          size="sm"
          variant="ghost"
          className="w-full text-coral hover:bg-coral/10 hover:text-coral"
        >
          Διαγραφή
        </Button>
      </form>
    </div>
  );
}
