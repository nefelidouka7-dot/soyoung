"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Plus, Tags, X } from "lucide-react";
import type { Brand } from "@prisma/client";
import {
  createBrand,
  updateBrand,
  type BrandActionState,
} from "@/features/admin/actions/brands";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const fieldClass = "mt-1.5 h-10 border-oak/50 bg-white text-sm";

export function BrandForm({
  brand,
  defaultOpen = false,
}: {
  brand?: Brand;
  defaultOpen?: boolean;
}) {
  const isEdit = Boolean(brand);
  const [open, setOpen] = useState(isEdit || defaultOpen);
  const action = brand ? updateBrand.bind(null, brand.id) : createBrand;
  const [state, formAction, pending] = useActionState<BrandActionState, FormData>(
    action,
    {}
  );

  if (!isEdit && !open) {
    return (
      <div
        id="add-brand"
        className="rounded-xl border border-dashed border-ink/20 bg-white p-5 shadow-[0_1px_2px_rgba(28,25,23,0.04)] sm:p-6"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-coral/10 text-coral">
              <Tags className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            </span>
            <div>
              <h3 className="text-base font-semibold tracking-tight text-ink">
                Προσθήκη brand
              </h3>
              <p className="mt-1 max-w-md text-sm leading-relaxed text-ink-muted">
                Πρόσθεσε νέο brand στον κατάλογο — όνομα, logo και προαιρετικά
                SEO.
              </p>
            </div>
          </div>
          <Button
            type="button"
            onClick={() => setOpen(true)}
            className="shrink-0 gap-1.5"
          >
            <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
            Προσθήκη brand
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      id={isEdit ? undefined : "add-brand"}
      action={formAction}
      className="space-y-4 rounded-xl border border-ink/[0.08] bg-white p-4 shadow-[0_1px_2px_rgba(28,25,23,0.04)] sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-coral/10 text-coral">
            <Tags className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          </span>
          <div>
            <h3 className="text-base font-semibold tracking-tight text-ink">
              {isEdit ? `Επεξεργασία · ${brand!.name}` : "Προσθήκη brand"}
            </h3>
            <p className="mt-1 text-sm text-ink-muted">
              {isEdit
                ? "Άλλαξε στοιχεία και αποθήκευσε. Η προσθήκη νέου brand μένει διαθέσιμη από κάτω."
                : "Συμπλήρωσε όνομα — τα υπόλοιπα είναι προαιρετικά."}
            </p>
          </div>
        </div>
        {isEdit ? (
          <Link
            href="/admin/brands"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-ink/[0.05] hover:text-ink"
            aria-label="Κλείσιμο επεξεργασίας"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-ink/[0.05] hover:text-ink"
            aria-label="Κλείσιμο φόρμας"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        )}
      </div>

      {state.error ? (
        <p className="rounded-lg bg-coral/10 px-3 py-2 text-sm text-coral">
          {state.error}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor={isEdit ? "edit-name" : "name"}>Όνομα</Label>
          <Input
            id={isEdit ? "edit-name" : "name"}
            name="name"
            required
            defaultValue={brand?.name ?? ""}
            className={fieldClass}
          />
        </div>
        <div>
          <Label htmlFor={isEdit ? "edit-slug" : "slug"}>Slug</Label>
          <Input
            id={isEdit ? "edit-slug" : "slug"}
            name="slug"
            defaultValue={brand?.slug ?? ""}
            placeholder="αυτόματο"
            className={fieldClass}
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor={isEdit ? "edit-description" : "description"}>
            Περιγραφή
          </Label>
          <Textarea
            id={isEdit ? "edit-description" : "description"}
            name="description"
            rows={3}
            defaultValue={brand?.description ?? ""}
            className="mt-1.5 border-oak/50 bg-white"
          />
        </div>
        <div>
          <Label htmlFor={isEdit ? "edit-logo" : "logo"}>URL logo</Label>
          <Input
            id={isEdit ? "edit-logo" : "logo"}
            name="logo"
            defaultValue={brand?.logo ?? ""}
            className={fieldClass}
          />
        </div>
        <div>
          <Label htmlFor={isEdit ? "edit-banner" : "banner"}>URL banner</Label>
          <Input
            id={isEdit ? "edit-banner" : "banner"}
            name="banner"
            defaultValue={brand?.banner ?? ""}
            className={fieldClass}
          />
        </div>
        <div>
          <Label htmlFor={isEdit ? "edit-website" : "website"}>Website</Label>
          <Input
            id={isEdit ? "edit-website" : "website"}
            name="website"
            defaultValue={brand?.website ?? ""}
            className={fieldClass}
          />
        </div>
        <div>
          <Label htmlFor={isEdit ? "edit-seoTitle" : "seoTitle"}>SEO title</Label>
          <Input
            id={isEdit ? "edit-seoTitle" : "seoTitle"}
            name="seoTitle"
            defaultValue={brand?.seoTitle ?? ""}
            className={fieldClass}
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor={isEdit ? "edit-seoDescription" : "seoDescription"}>
            SEO description
          </Label>
          <Textarea
            id={isEdit ? "edit-seoDescription" : "seoDescription"}
            name="seoDescription"
            rows={2}
            defaultValue={brand?.seoDescription ?? ""}
            className="mt-1.5 border-oak/50 bg-white"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="featured"
            defaultChecked={brand?.featured ?? false}
            className="accent-sage"
          />
          Featured
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="hidden" name="active" value="false" />
          <input
            type="checkbox"
            name="active"
            value="true"
            defaultChecked={brand?.active ?? true}
            className="accent-sage"
          />
          Ενεργό
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-oak/25 pt-4">
        <Button type="submit" size="sm" disabled={pending} className="gap-1.5">
          {!isEdit && !pending ? (
            <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
          ) : null}
          {pending
            ? "Αποθήκευση…"
            : isEdit
              ? "Αποθήκευση αλλαγών"
              : "Προσθήκη brand"}
        </Button>
        {isEdit ? (
          <Link
            href="/admin/brands"
            className="text-sm font-medium text-ink-muted hover:text-ink hover:underline"
          >
            Ακύρωση
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-sm font-medium text-ink-muted hover:text-ink hover:underline"
          >
            Ακύρωση
          </button>
        )}
      </div>
    </form>
  );
}
