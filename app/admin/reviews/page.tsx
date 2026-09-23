import { prisma } from "@/db/prisma";
import { requireAdmin, formatAdminDate } from "@/lib/admin";
import {
  approveReview,
  hideReview,
  deleteReview,
} from "@/features/admin/actions/misc";
import {
  AdminEmpty,
  AdminPageHeader,
  AdminSelect,
  AdminToolbar,
  StatusBadge,
} from "@/features/admin/components/admin-ui";
import { Button } from "@/components/ui/button";

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();
  const { status } = await searchParams;

  const reviews = await prisma.review.findMany({
    where: status
      ? { status: status as "PENDING" | "APPROVED" | "HIDDEN" }
      : undefined,
    include: {
      product: { select: { id: true, name: true } },
      user: { select: { email: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <AdminPageHeader
        title="Reviews"
        description="Moderate customer reviews before they go live."
      />

      <form>
        <AdminToolbar>
          <AdminSelect name="status" defaultValue={status ?? ""}>
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="HIDDEN">Hidden</option>
          </AdminSelect>
          <Button type="submit" size="sm" variant="secondary">
            Filter
          </Button>
        </AdminToolbar>
      </form>

      <div className="space-y-3">
        {reviews.map((r) => (
          <article
            key={r.id}
            className="rounded-sm border border-oak/35 bg-white p-4 shadow-[0_1px_0_rgba(43,41,39,0.03)] sm:p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">{r.product.name}</p>
                <p className="mt-0.5 text-xs text-ink-muted">
                  {r.user.name ?? r.user.email} · {r.rating}/5 ·{" "}
                  {formatAdminDate(r.createdAt)}
                  {r.verifiedPurchase ? " · Verified" : ""}
                </p>
              </div>
              <StatusBadge
                tone={
                  r.status === "APPROVED"
                    ? "success"
                    : r.status === "HIDDEN"
                      ? "neutral"
                      : "warning"
                }
              >
                {r.status}
              </StatusBadge>
            </div>
            {r.title ? (
              <p className="mt-3 text-sm font-medium text-ink">{r.title}</p>
            ) : null}
            {r.comment ? (
              <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                {r.comment}
              </p>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2 border-t border-oak/20 pt-3">
              {r.status !== "APPROVED" ? (
                <form action={approveReview.bind(null, r.id)}>
                  <Button type="submit" size="sm" variant="secondary">
                    Approve
                  </Button>
                </form>
              ) : null}
              {r.status !== "HIDDEN" ? (
                <form action={hideReview.bind(null, r.id)}>
                  <Button type="submit" size="sm" variant="secondary">
                    Hide
                  </Button>
                </form>
              ) : null}
              <form action={deleteReview.bind(null, r.id)}>
                <Button
                  type="submit"
                  size="sm"
                  variant="ghost"
                  className="text-coral"
                >
                  Delete
                </Button>
              </form>
            </div>
          </article>
        ))}
        {reviews.length === 0 ? <AdminEmpty>No reviews.</AdminEmpty> : null}
      </div>
    </div>
  );
}
