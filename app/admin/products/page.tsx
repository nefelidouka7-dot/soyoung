import Link from "next/link";
import { Prisma, ProductStatus } from "@prisma/client";
import { prisma } from "@/db/prisma";
import { requireAdmin, decimalToNumber } from "@/lib/admin";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AdminPageHeader,
  StatusBadge,
  productStatusTone,
} from "@/features/admin/components/admin-ui";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  await requireAdmin();
  const { q, status } = await searchParams;

  const where: Prisma.ProductWhereInput = {};
  if (q?.trim()) {
    where.OR = [
      { name: { contains: q.trim(), mode: "insensitive" } },
      { sku: { contains: q.trim(), mode: "insensitive" } },
      { slug: { contains: q.trim(), mode: "insensitive" } },
    ];
  }
  if (status && ["DRAFT", "ACTIVE", "ARCHIVED"].includes(status)) {
    where.status = status as ProductStatus;
  }

  const products = await prisma.product.findMany({
    where,
    include: { brand: true, category: true },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <AdminPageHeader
        title="Products"
        description={`${products.length} product${products.length === 1 ? "" : "s"}`}
        actions={
          <Link href="/admin/products/new">
            <Button size="sm">New product</Button>
          </Link>
        }
      />

      <form className="mb-4 flex flex-wrap gap-2">
        <Input
          name="q"
          placeholder="Search name, SKU, slug…"
          defaultValue={q ?? ""}
          className="h-10 max-w-xs border-oak/50 bg-white"
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          className="h-10 border border-oak/50 bg-white px-3 text-sm"
        >
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="ACTIVE">Active</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <Button type="submit" size="sm" variant="secondary">
          Filter
        </Button>
      </form>

      <div className="overflow-x-auto rounded-sm border border-oak/40 bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-oak/30 bg-bg-muted text-[10px] uppercase tracking-wider text-ink-muted">
            <tr>
              <th className="px-3 py-2.5 font-medium">Product</th>
              <th className="px-3 py-2.5 font-medium">Brand</th>
              <th className="px-3 py-2.5 font-medium">Price</th>
              <th className="px-3 py-2.5 font-medium">Stock</th>
              <th className="px-3 py-2.5 font-medium">Status</th>
              <th className="px-3 py-2.5 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-oak/20">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-bg-muted/50">
                <td className="px-3 py-2.5">
                  <p className="font-medium text-ink">{p.name}</p>
                  <p className="text-xs text-ink-muted">
                    {p.sku ?? p.slug} · {p.category.name}
                  </p>
                </td>
                <td className="px-3 py-2.5 text-ink-muted">{p.brand.name}</td>
                <td className="px-3 py-2.5">
                  {formatPrice(decimalToNumber(p.price))}
                </td>
                <td className="px-3 py-2.5">
                  <span
                    className={
                      p.stock <= p.lowStockThreshold ? "text-coral font-medium" : ""
                    }
                  >
                    {p.stock}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <StatusBadge tone={productStatusTone(p.status)}>
                    {p.status}
                  </StatusBadge>
                </td>
                <td className="px-3 py-2.5 text-right">
                  <Link
                    href={`/admin/products/${p.id}`}
                    className="text-xs font-medium text-sage hover:underline"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-ink-muted">
                  No products found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
