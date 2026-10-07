"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { FolderTree, Plus, X } from "lucide-react";
import type { Category } from "@prisma/client";
import {
  createCategory,
  updateCategory,
  type CategoryActionState,
} from "@/features/admin/actions/categories";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const fieldClass = "mt-1.5 h-10 border-oak/50 bg-white text-sm";

type ParentOption = Pick<Category, "id" | "name" | "parentId">;

export function CategoryForm({
  category,
  parents,
  defaultParentId,
  defaultOpen = false,
}: {
  category?: Category;
  parents: ParentOption[];
  /** Pre-select parent when adding a subcategory. */
  defaultParentId?: string;
  defaultOpen?: boolean;
}) {
  const isEdit = Boolean(category);
  const [open, setOpen] = useState(
    isEdit || defaultOpen || Boolean(defaultParentId)
  );
  const action = category
    ? updateCategory.bind(null, category.id)
    : createCategory;
  const [state, formAction, pending] = useActionState<
    CategoryActionState,
    FormData
  >(action, {});

  const parentChoices = parents.filter((p) => p.id !== category?.id);
  const prefix = isEdit ? "edit-" : defaultParentId ? "sub-" : "";

  if (!isEdit && !open) {
    return (
      <div
        id="add-category"
        className="rounded-xl border border-dashed border-ink/20 bg-white p-5 shadow-[0_1px_2px_rgba(28,25,23,0.04)] sm:p-6"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-coral/10 text-coral">
              <FolderTree className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            </span>
            <div>
              <h3 className="text-base font-semibold tracking-tight text-ink">
                Νέα κατηγορία
              </h3>
              <p className="mt-1 max-w-md text-sm leading-relaxed text-ink-muted">
                Ξεκίνα με το όνομα. Αν θέλεις υποκατηγορία, επίλεξε γονική στη
                φόρμα — ή πάτα «+ Μέσα σε αυτή» στη λίστα.
              </p>
            </div>
          </div>
          <Button
            type="button"
            onClick={() => setOpen(true)}
            className="shrink-0 gap-1.5"
          >
            <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
            Προσθήκη κατηγορίας
          </Button>
        </div>
      </div>
    );
  }

  const parentName = category?.parentId
    ? parents.find((p) => p.id === category.parentId)?.name
    : defaultParentId
      ? parents.find((p) => p.id === defaultParentId)?.name
      : null;

  return (
    <form
      id={isEdit ? undefined : "add-category"}
      action={formAction}
      className="space-y-5 rounded-xl border border-ink/[0.08] bg-white p-4 shadow-[0_1px_2px_rgba(28,25,23,0.04)] sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-coral/10 text-coral">
            <FolderTree className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          </span>
          <div>
            <h3 className="text-base font-semibold tracking-tight text-ink">
              {isEdit
                ? `Επεξεργασία · ${category!.name}`
                : defaultParentId
                  ? "Νέα υποκατηγορία"
                  : "Νέα κατηγορία"}
            </h3>
            <p className="mt-1 text-sm text-ink-muted">
              {isEdit
                ? "Άλλαξε όνομα, γονική, σειρά ή εμφάνιση στο κατάστημα."
                : defaultParentId && parentName
                  ? `Θα μπει κάτω από «${parentName}».`
                  : "Συμπλήρωσε όνομα — τα υπόλοιπα είναι προαιρετικά."}
            </p>
          </div>
        </div>
        {isEdit ? (
          <Link
            href="/admin/categories"
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

      <fieldset className="space-y-4">
        <legend className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-muted">
          Βασικά
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor={`${prefix}name`}>Όνομα</Label>
            <Input
              id={`${prefix}name`}
              name="name"
              required
              defaultValue={category?.name ?? ""}
              placeholder="π.χ. Οροί"
              className={fieldClass}
            />
            <p className="mt-1 text-xs text-ink-muted">
              Όπως εμφανίζεται στο μενού και στη σελίδα κατηγορίας.
            </p>
          </div>
          <div>
            <Label htmlFor={`${prefix}slug`}>Slug (URL)</Label>
            <Input
              id={`${prefix}slug`}
              name="slug"
              defaultValue={category?.slug ?? ""}
              placeholder="αυτόματο από το όνομα"
              className={fieldClass}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor={`${prefix}description`}>Περιγραφή</Label>
            <Textarea
              id={`${prefix}description`}
              name="description"
              rows={3}
              defaultValue={category?.description ?? ""}
              placeholder="Κείμενο κάτω από τον τίτλο στη σελίδα της κατηγορίας"
              className="mt-1.5 border-oak/50 bg-white"
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-muted">
          Θέση στο μενού
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor={`${prefix}parentId`}>Γονική κατηγορία</Label>
            <select
              id={`${prefix}parentId`}
              name="parentId"
              defaultValue={
                category?.parentId ?? defaultParentId ?? ""
              }
              className={`${fieldClass} flex w-full border px-3`}
            >
              <option value="">Καμία — κορυφαία κατηγορία</option>
              {parentChoices.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.parentId ? `↳ ${p.name}` : p.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-ink-muted">
              Επίλεξε γονική για υποκατηγορία, ή άφησέ το κενό για κορυφαία.
            </p>
          </div>
          <div>
            <Label htmlFor={`${prefix}sortOrder`}>Σειρά εμφάνισης</Label>
            <Input
              id={`${prefix}sortOrder`}
              name="sortOrder"
              type="number"
              defaultValue={category?.sortOrder ?? 0}
              className={fieldClass}
            />
            <p className="mt-1 text-xs text-ink-muted">
              Μικρότερος αριθμός = πιο πάνω. Εναλλακτικά σύρε τη κατηγορία στη
              λίστα.
            </p>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor={`${prefix}image`}>URL εικόνας (προαιρετικό)</Label>
            <Input
              id={`${prefix}image`}
              name="image"
              defaultValue={category?.image ?? ""}
              placeholder="/images/… ή https://…"
              className={fieldClass}
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-muted">
          SEO (προαιρετικό)
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor={`${prefix}seoTitle`}>SEO title</Label>
            <Input
              id={`${prefix}seoTitle`}
              name="seoTitle"
              defaultValue={category?.seoTitle ?? ""}
              className={fieldClass}
            />
          </div>
          <div className="sm:col-span-2 sm:col-start-1">
            <Label htmlFor={`${prefix}seoDescription`}>SEO description</Label>
            <Textarea
              id={`${prefix}seoDescription`}
              name="seoDescription"
              rows={2}
              defaultValue={category?.seoDescription ?? ""}
              className="mt-1.5 border-oak/50 bg-white"
            />
          </div>
        </div>
      </fieldset>

      <label className="flex items-center gap-2 text-sm">
        <input type="hidden" name="active" value="false" />
        <input
          type="checkbox"
          name="active"
          value="true"
          defaultChecked={category?.active ?? true}
          className="accent-sage"
        />
        Ενεργή — εμφανίζεται στο κατάστημα
      </label>

      <div className="flex flex-wrap items-center gap-3 border-t border-oak/25 pt-4">
        <Button type="submit" size="sm" disabled={pending} className="gap-1.5">
          {!isEdit && !pending ? (
            <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
          ) : null}
          {pending
            ? "Αποθήκευση…"
            : isEdit
              ? "Αποθήκευση αλλαγών"
              : "Δημιουργία κατηγορίας"}
        </Button>
        {isEdit ? (
          <Link
            href="/admin/categories"
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
