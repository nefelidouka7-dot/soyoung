import Link from "next/link";
import { prisma } from "@/db/prisma";
import { requireAdmin } from "@/lib/admin";
import { skinIntentCopy } from "@/lib/skin-intent";
import {
  AdminPageHeader,
  AdminPanel,
} from "@/features/admin/components/admin-ui";
import { SkinGuideForm } from "@/features/admin/components/skin-guide-form";
import { deleteSkinGuide } from "@/features/admin/actions/skin";

export default async function AdminSkinPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; kind?: string; new?: string }>;
}) {
  await requireAdmin();
  const { edit, kind, new: creating } = await searchParams;
  const mode = kind === "skin" || creating === "skin" ? "skin" : "concern";

  const [concerns, skinTypes] = await Promise.all([
    prisma.concern.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: { _count: { select: { products: true } } },
    }),
    prisma.skinType.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: { _count: { select: { products: true } } },
    }),
  ]);

  const editingConcern =
    edit && mode === "concern" ? concerns.find((c) => c.id === edit) : undefined;
  const editingSkin =
    edit && mode === "skin" ? skinTypes.find((s) => s.id === edit) : undefined;
  const showForm = Boolean(creating || editingConcern || editingSkin);
  const formKind = editingSkin || creating === "skin" ? "skin" : "concern";
  const current = editingConcern ?? editingSkin;
  const fallbackEl = current
    ? skinIntentCopy(
        "el",
        formKind === "concern" ? current.slug : undefined,
        formKind === "skin" ? current.slug : undefined
      )
    : undefined;
  const fallbackEn = current
    ? skinIntentCopy(
        "en",
        formKind === "concern" ? current.slug : undefined,
        formKind === "skin" ? current.slug : undefined
      )
    : undefined;

  return (
    <div>
      <AdminPageHeader
        title="Επιδερμίδα"
        description="Άλλαξε τους στόχους και τους τύπους δέρματος που βλέπει ο πελάτης στο μενού και στη σελίδα. Οι κατηγορίες προϊόντων (Πρόσωπο, Μακιγιάζ) αλλάζουν από το Categories."
      />

      {showForm ? (
        <div className="mb-8 max-w-xl">
          <SkinGuideForm
            key={current?.id ?? `new-${formKind}`}
            kind={formKind}
            item={current}
            fallbackEl={
              fallbackEl ? { title: fallbackEl.title, body: fallbackEl.body } : undefined
            }
            fallbackEn={
              fallbackEn ? { title: fallbackEn.title, body: fallbackEn.body } : undefined
            }
          />
          <Link
            href="/admin/skin"
            className="mt-3 inline-block text-xs text-ink-muted hover:text-ink"
          >
            Ακύρωση
          </Link>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminPanel
          title="Στόχοι επιδερμίδας"
          description="Ακμή, ενυδάτωση, φραγμός και τα υπόλοιπα."
          action={
            <Link
              href="/admin/skin?new=concern"
              className="text-xs font-semibold text-sage-dark hover:underline"
            >
              Νέος στόχος
            </Link>
          }
        >
          <GuideList
            kind="concern"
            rows={concerns.map((c) => ({
              id: c.id,
              title: c.nameEl || c.name,
              story: c.story,
              products: c._count.products,
              active: c.active,
            }))}
          />
        </AdminPanel>

        <AdminPanel
          title="Τύπος δέρματος"
          description="Λιπαρό, ξηρό, μικτό, ευαίσθητο, κανονικό."
          action={
            <Link
              href="/admin/skin?new=skin"
              className="text-xs font-semibold text-sage-dark hover:underline"
            >
              Νέος τύπος
            </Link>
          }
        >
          <GuideList
            kind="skin"
            rows={skinTypes.map((s) => ({
              id: s.id,
              title: s.nameEl || s.name,
              story: s.story,
              products: s._count.products,
              active: s.active,
            }))}
          />
        </AdminPanel>
      </div>
    </div>
  );
}

function GuideList({
  kind,
  rows,
}: {
  kind: "concern" | "skin";
  rows: {
    id: string;
    title: string;
    story: string | null;
    products: number;
    active: boolean;
  }[];
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-ink-muted">Δεν υπάρχει τίποτα ακόμα.</p>;
  }

  return (
    <ul className="divide-y divide-oak/25">
      {rows.map((row) => (
        <li key={row.id} className="flex items-start justify-between gap-4 py-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink">
              {row.title}
              {!row.active ? (
                <span className="ml-2 text-xs font-normal text-ink-muted">Κρυφό</span>
              ) : null}
            </p>
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-muted">
              {row.story || "Χρησιμοποιείται το έτοιμο κείμενο. Άνοιξέ το για να το αλλάξεις."}
            </p>
            <p className="mt-1 text-[11px] text-ink-muted">{row.products} προϊόντα</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <Link
              href={`/admin/skin?kind=${kind}&edit=${row.id}`}
              className="text-xs font-semibold text-sage-dark hover:underline"
            >
              Άλλαξε
            </Link>
            {row.products === 0 ? (
              <form action={deleteSkinGuide.bind(null, kind, row.id)}>
                <button type="submit" className="text-xs text-coral hover:underline">
                  Διαγραφή
                </button>
              </form>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
