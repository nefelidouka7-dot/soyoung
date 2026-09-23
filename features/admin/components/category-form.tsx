"use client";

import { useActionState } from "react";
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

export function CategoryForm({
  category,
  parents,
}: {
  category?: Category;
  parents: Category[];
}) {
  const action = category
    ? updateCategory.bind(null, category.id)
    : createCategory;
  const [state, formAction, pending] = useActionState<
    CategoryActionState,
    FormData
  >(action, {});

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-xl border border-ink/[0.08] bg-white p-4 shadow-[0_1px_2px_rgba(28,25,23,0.04)] sm:p-5"
    >
      <h3 className="text-sm font-semibold tracking-tight text-ink">
        {category ? "Edit category" : "New category"}
      </h3>
      {state.error ? <p className="text-sm text-coral">{state.error}</p> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            required
            defaultValue={category?.name ?? ""}
            className={fieldClass}
          />
        </div>
        <div>
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            name="slug"
            defaultValue={category?.slug ?? ""}
            placeholder="auto"
            className={fieldClass}
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={category?.description ?? ""}
            className="mt-1.5 border-oak/50 bg-white"
          />
        </div>
        <div>
          <Label htmlFor="image">Image URL</Label>
          <Input
            id="image"
            name="image"
            defaultValue={category?.image ?? ""}
            className={fieldClass}
          />
        </div>
        <div>
          <Label htmlFor="parentId">Parent</Label>
          <select
            id="parentId"
            name="parentId"
            defaultValue={category?.parentId ?? ""}
            className={`${fieldClass} flex w-full border px-3`}
          >
            <option value="">None (top-level)</option>
            {parents
              .filter((p) => p.id !== category?.id)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </select>
        </div>
        <div>
          <Label htmlFor="sortOrder">Sort order</Label>
          <Input
            id="sortOrder"
            name="sortOrder"
            type="number"
            defaultValue={category?.sortOrder ?? 0}
            className={fieldClass}
          />
        </div>
        <div>
          <Label htmlFor="seoTitle">SEO title</Label>
          <Input
            id="seoTitle"
            name="seoTitle"
            defaultValue={category?.seoTitle ?? ""}
            className={fieldClass}
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="seoDescription">SEO description</Label>
          <Textarea
            id="seoDescription"
            name="seoDescription"
            rows={2}
            defaultValue={category?.seoDescription ?? ""}
            className="mt-1.5 border-oak/50 bg-white"
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="hidden" name="active" value="false" />
        <input
          type="checkbox"
          name="active"
          value="true"
          defaultChecked={category?.active ?? true}
          className="accent-sage"
        />
        Active
      </label>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving…" : category ? "Update category" : "Create category"}
      </Button>
    </form>
  );
}
