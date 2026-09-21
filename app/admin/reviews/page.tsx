import { prisma } from "@/db/prisma";
import { requireAdmin, formatAdminDate } from "@/lib/admin";
import {
  approveReview,
  hideReview,
  deleteReview,
} from "@/features/admin/actions/misc";
import { AdminPageHeader, StatusBadge } from "@/features/admin/components/admin-ui";
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
        description="Moderate customer reviews."
      />

      <form className="mb-4">
        <select
          name="status"
          defaultValue={status ?? ""}
          className="h-10 border border-oak/50 bg-white px-3 text-sm"
        >
          <option value="">All</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="HIDDEN">Hidden</option>
        </select>
        <Button type="submit" size="sm" variant="secondary" className="ml-2">
          Filter
        </Button>
      </form>

      <div className="space-y-3">
        {reviews.map((r) => (
          <article
            key={r.id}
            className="rounded-sm border border-oak/40 bg-white p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium">{r.product.name}</p>
                <p className="text-xs text-ink-muted">
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
              <p className="mt-2 text-sm font-medium">{r.title}</p>
            ) : null}
            {r.comment ? (
              <p className="mt-1 text-sm text-ink-muted">{r.comment}</p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
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
                <Button type="submit" size="sm" variant="ghost" className="text-coral">
                  Delete
                </Button>
              </form>
            </div>
          </article>
        ))}
        {reviews.length === 0 ? (
          <p className="text-sm text-ink-muted">No reviews.</p>
        ) : null}
      </div>
    </div>
  );
}
