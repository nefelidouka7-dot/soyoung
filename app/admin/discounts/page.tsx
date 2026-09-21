import { prisma } from "@/db/prisma";
import { requireAdmin, decimalToNumber, formatAdminDate } from "@/lib/admin";
import { formatPrice } from "@/lib/utils";
import { toggleCoupon, deleteCoupon } from "@/features/admin/actions/misc";
import { AdminPageHeader, StatusBadge } from "@/features/admin/components/admin-ui";
import { CouponForm } from "@/features/admin/components/coupon-form";

export default async function AdminDiscountsPage() {
  await requireAdmin();

  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <AdminPageHeader
        title="Discounts"
        description="Coupon codes and promotions."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="overflow-x-auto rounded-sm border border-oak/40 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-oak/30 bg-bg-muted text-[10px] uppercase tracking-wider text-ink-muted">
              <tr>
                <th className="px-3 py-2.5 font-medium">Code</th>
                <th className="px-3 py-2.5 font-medium">Value</th>
                <th className="px-3 py-2.5 font-medium">Usage</th>
                <th className="px-3 py-2.5 font-medium">Expires</th>
                <th className="px-3 py-2.5 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-oak/20">
              {coupons.map((c) => (
                <tr key={c.id}>
                  <td className="px-3 py-2.5">
                    <p className="font-medium">{c.code}</p>
                    <StatusBadge tone={c.active ? "success" : "neutral"}>
                      {c.active ? "Active" : "Off"}
                    </StatusBadge>
                  </td>
                  <td className="px-3 py-2.5">
                    {c.type === "PERCENTAGE"
                      ? `${decimalToNumber(c.value)}%`
                      : formatPrice(decimalToNumber(c.value))}
                    {c.minOrderAmount ? (
                      <p className="text-xs text-ink-muted">
                        Min {formatPrice(decimalToNumber(c.minOrderAmount))}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-3 py-2.5">
                    {c.usageCount}
                    {c.usageLimit != null ? ` / ${c.usageLimit}` : ""}
                  </td>
                  <td className="px-3 py-2.5 text-ink-muted">
                    {c.expiresAt ? formatAdminDate(c.expiresAt) : "—"}
                  </td>
                  <td className="space-x-2 px-3 py-2.5 text-right">
                    <form
                      action={toggleCoupon.bind(null, c.id, !c.active)}
                      className="inline"
                    >
                      <button
                        type="submit"
                        className="text-xs text-sage hover:underline"
                      >
                        {c.active ? "Disable" : "Enable"}
                      </button>
                    </form>
                    <form action={deleteCoupon.bind(null, c.id)} className="inline">
                      <button
                        type="submit"
                        className="text-xs text-coral hover:underline"
                      >
                        Delete
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-ink-muted">
                    No coupons yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <CouponForm />
      </div>
    </div>
  );
}
