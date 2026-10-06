import Link from "next/link";
import { Prisma, ProductStatus } from "@prisma/client";
import { prisma } from "@/db/prisma";
import { requireAdmin, decimalToNumber } from "@/lib/admin";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AdminEmpty,
  AdminPageHeader,
  AdminSelect,
  AdminTable,
  AdminTableHead,
  AdminTd,
  AdminTh,
  AdminTextLink,
  AdminToolbar,
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
        title="Προϊόντα"
        description={`${products.length} προϊόντ${products.length === 1 ? "ο" : "α"}`}
        actions={
          <Link href="/admin/products/new">
            <Button size="sm">Νέο προϊόν</Button>
          </Link>
        }
      />

      <form>
        <AdminToolbar>
          <Input
            name="q"
            placeholder="Αναζήτηση ονόματος, SKU, slug…"
            defaultValue={q ?? ""}
            className="h-10 min-w-[12rem] flex-1 border-oak/45 bg-white sm:max-w-xs"
          />
          <AdminSelect name="status" defaultValue={status ?? ""}>
            <option value="">Όλα τα statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Ενεργό</option>
            <option value="ARCHIVED">Archived</option>
          </AdminSelect>
          <Button type="submit" size="sm" variant="secondary">
            Φίλτρο
          </Button>
        </AdminToolbar>
      </form>

      <AdminTable>
        <AdminTableHead>
          <tr>
            <AdminTh>Προϊόν</AdminTh>
            <AdminTh>Brand</AdminTh>
            <AdminTh>Τιμή</AdminTh>
            <AdminTh>Stock</AdminTh>
            <AdminTh>Status</AdminTh>
            <AdminTh />
          </tr>
        </AdminTableHead>
        <tbody className="divide-y divide-oak/20">
          {products.map((p) => (
            <tr key={p.id} className="transition-colors hover:bg-bg/40">
              <AdminTd>
                <p className="font-medium text-ink">{p.name}</p>
                <p className="text-xs text-ink-muted">
                  {p.sku ?? p.slug} · {p.category.name}
                </p>
              </AdminTd>
              <AdminTd className="text-ink-muted">{p.brand.name}</AdminTd>
              <AdminTd className="tabular-nums">
                {formatPrice(decimalToNumber(p.price))}
              </AdminTd>
              <AdminTd>
                <span
                  className={
                    p.stock <= p.lowStockThreshold
                      ? "font-medium tabular-nums text-coral"
                      : "tabular-nums"
                  }
                >
                  {p.stock}
                </span>
              </AdminTd>
              <AdminTd>
                <StatusBadge tone={productStatusTone(p.status)}>
                  {p.status}
                </StatusBadge>
              </AdminTd>
              <AdminTd className="text-right">
                <AdminTextLink href={`/admin/products/${p.id}`}>Επεξεργασία</AdminTextLink>
              </AdminTd>
            </tr>
          ))}
          {products.length === 0 ? (
            <AdminEmpty colSpan={6}>Δεν βρέθηκαν προϊόντα.</AdminEmpty>
          ) : null}
        </tbody>
      </AdminTable>
    </div>
  );
}
