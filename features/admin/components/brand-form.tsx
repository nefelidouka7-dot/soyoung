"use client";

import { useActionState } from "react";
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

export function BrandForm({ brand }: { brand?: Brand }) {
  const action = brand ? updateBrand.bind(null, brand.id) : createBrand;
  const [state, formAction, pending] = useActionState<BrandActionState, FormData>(
    action,
    {}
  );

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-xl border border-ink/[0.08] bg-white p-4 shadow-[0_1px_2px_rgba(28,25,23,0.04)] sm:p-5"
    >
      <h3 className="text-sm font-semibold tracking-tight text-ink">
        {brand ? "Edit brand" : "New brand"}
      </h3>
      {state.error ? <p className="text-sm text-coral">{state.error}</p> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required defaultValue={brand?.name ?? ""} className={fieldClass} />
        </div>
        <div>
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" name="slug" defaultValue={brand?.slug ?? ""} placeholder="auto" className={fieldClass} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" rows={3} defaultValue={brand?.description ?? ""} className="mt-1.5 border-oak/50 bg-white" />
        </div>
        <div>
          <Label htmlFor="logo">Logo URL</Label>
          <Input id="logo" name="logo" defaultValue={brand?.logo ?? ""} className={fieldClass} />
        </div>
        <div>
          <Label htmlFor="banner">Banner URL</Label>
          <Input id="banner" name="banner" defaultValue={brand?.banner ?? ""} className={fieldClass} />
        </div>
        <div>
          <Label htmlFor="website">Website</Label>
          <Input id="website" name="website" defaultValue={brand?.website ?? ""} className={fieldClass} />
        </div>
        <div>
          <Label htmlFor="seoTitle">SEO title</Label>
          <Input id="seoTitle" name="seoTitle" defaultValue={brand?.seoTitle ?? ""} className={fieldClass} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="seoDescription">SEO description</Label>
          <Textarea id="seoDescription" name="seoDescription" rows={2} defaultValue={brand?.seoDescription ?? ""} className="mt-1.5 border-oak/50 bg-white" />
        </div>
      </div>
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="featured" defaultChecked={brand?.featured ?? false} className="accent-sage" />
          Featured
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="hidden" name="active" value="false" />
          <input type="checkbox" name="active" value="true" defaultChecked={brand?.active ?? true} className="accent-sage" />
          Active
        </label>
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving…" : brand ? "Update brand" : "Create brand"}
      </Button>
    </form>
  );
}
