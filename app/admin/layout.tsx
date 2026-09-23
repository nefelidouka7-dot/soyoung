import { prisma } from "@/db/prisma";
import { requireAdmin } from "@/lib/admin";
import { STORE_NAME } from "@/lib/utils";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { logoutAction } from "@/features/auth/actions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: {
    default: "Admin",
    template: `%s · Admin · ${STORE_NAME}`,
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();
  const [pendingOrders, pendingReviews] = await Promise.all([
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.review.count({ where: { status: "PENDING" } }),
  ]);

  return (
    <AdminShell
      email={session.user.email ?? ""}
      logoutAction={logoutAction}
      badges={{
        "/admin/orders": pendingOrders,
        "/admin/reviews": pendingReviews,
      }}
    >
      {children}
    </AdminShell>
  );
}
