import { prisma } from "@/db/prisma";
import { requireAdmin, decimalToNumber, formatAdminDate } from "@/lib/admin";
import { formatPrice } from "@/lib/utils";
import { toggleCoupon, deleteCoupon } from "@/features/admin/actions/misc";
import {
  AdminEmpty,
  AdminPageHeader,
  AdminPanel,
  AdminTable,
  AdminTableHead,
  AdminTd,
  AdminTh,
  StatusBadge,
} from "@/features/admin/components/admin-ui";
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
        description="Create and manage coupon codes used at checkout."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminPanel title="Coupons" description={`${coupons.length} codes`} flush>
          <AdminTable minWidth="0" bare>
            <AdminTableHead>
              <tr>
                <AdminTh>Code</AdminTh>
                <AdminTh>Value</AdminTh>
                <AdminTh>Usage</AdminTh>
                <AdminTh>Expires</AdminTh>
                <AdminTh />
              </tr>
            </AdminTableHead>
            <tbody className="divide-y divide-oak/20">
              {coupons.map((c) => (
                <tr key={c.id} className="transition-colors hover:bg-bg/40">
                  <AdminTd>
                    <p className="font-medium">{c.code}</p>
                    <StatusBadge tone={c.active ? "success" : "neutral"}>
                      {c.active ? "Active" : "Off"}
                    </StatusBadge>
                  </AdminTd>
                  <AdminTd>
                    {c.type === "PERCENTAGE"
                      ? `${decimalToNumber(c.value)}%`
                      : formatPrice(decimalToNumber(c.value))}
                    {c.minOrderAmount ? (
                      <p className="text-xs text-ink-muted">
                        Min {formatPrice(decimalToNumber(c.minOrderAmount))}
                      </p>
                    ) : null}
                  </AdminTd>
                  <AdminTd className="tabular-nums">
                    {c.usageCount}
                    {c.usageLimit != null ? ` / ${c.usageLimit}` : ""}
                  </AdminTd>
                  <AdminTd className="text-ink-muted">
                    {c.expiresAt ? formatAdminDate(c.expiresAt) : "—"}
                  </AdminTd>
                  <AdminTd className="space-x-2 text-right">
                    <form
                      action={toggleCoupon.bind(null, c.id, !c.active)}
                      className="inline"
                    >
                      <button
                        type="submit"
                        className="text-xs font-medium text-sage-dark hover:underline"
                      >
                        {c.active ? "Disable" : "Enable"}
                      </button>
                    </form>
                    <form action={deleteCoupon.bind(null, c.id)} className="inline">
                      <button
                        type="submit"
                        className="text-xs font-medium text-coral hover:underline"
                      >
                        Delete
                      </button>
                    </form>
                  </AdminTd>
                </tr>
              ))}
              {coupons.length === 0 ? (
                <AdminEmpty colSpan={5}>No coupons yet.</AdminEmpty>
              ) : null}
            </tbody>
          </AdminTable>
        </AdminPanel>

        <CouponForm />
      </div>
    </div>
  );
}
