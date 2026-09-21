"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import type {
  Brand,
  Category,
  Product,
  ProductImage,
  ProductStatus,
  ProductVariant,
  SkinType,
  VariantType,
} from "@prisma/client";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  duplicateProduct,
  type ProductActionState,
} from "@/features/admin/actions/products";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { decimalToNumber } from "@/lib/admin";

type ProductWithRelations = Product & {
  skinTypes: { skinTypeId: string }[];
  images?: ProductImage[];
  variants?: ProductVariant[];
};

type VariantRow = {
  name: string;
  type: VariantType;
  sku: string;
  price: string;
  stock: string;
};

const statuses: ProductStatus[] = ["DRAFT", "ACTIVE", "ARCHIVED"];
const variantTypes: VariantType[] = [
  "DEFAULT",
  "SHADE",
  "SIZE",
  "VOLUME",
  "COLOR",
];

const fieldClass =
  "mt-1.5 h-10 border-oak/50 bg-white text-sm focus-visible:ring-sage";

export function ProductForm({
  product,
  brands,
  categories,
  skinTypes,
}: {
  product?: ProductWithRelations;
  brands: Brand[];
  categories: Category[];
  skinTypes: SkinType[];
}) {
  const isEdit = Boolean(product);
  const boundUpdate = product
    ? updateProduct.bind(null, product.id)
    : createProduct;

  const [state, action, pending] = useActionState<ProductActionState, FormData>(
    boundUpdate,
    {}
  );

  const selectedSkin = new Set(product?.skinTypes.map((s) => s.skinTypeId) ?? []);
  const [variants, setVariants] = useState<VariantRow[]>(
    product?.variants?.length
      ? product.variants.map((v) => ({
          name: v.name,
          type: v.type,
          sku: v.sku,
          price: v.price != null ? String(decimalToNumber(v.price)) : "",
          stock: String(v.stock),
        }))
      : []
  );

  const existingImageUrls =
    product?.images
      ?.slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((i) => i.url)
      .join("\n") ?? "";

  return (
    <form action={action} className="space-y-6">
      {state.error ? (
        <p className="rounded-sm border border-coral/40 bg-coral/10 px-3 py-2 text-sm text-coral">
          {state.error}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Section title="Basics">
            <Field label="Name" htmlFor="name" error={state.fieldErrors?.name}>
              <Input
                id="name"
                name="name"
                required
                defaultValue={product?.name ?? ""}
                className={fieldClass}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Slug" htmlFor="slug">
                <Input
                  id="slug"
                  name="slug"
                  defaultValue={product?.slug ?? ""}
                  placeholder="auto from name"
                  className={fieldClass}
                />
              </Field>
              <Field label="SKU" htmlFor="sku">
                <Input
                  id="sku"
                  name="sku"
                  defaultValue={product?.sku ?? ""}
                  className={fieldClass}
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Brand"
                htmlFor="brandId"
                error={state.fieldErrors?.brandId}
              >
                <select
                  id="brandId"
                  name="brandId"
                  required
                  defaultValue={product?.brandId ?? ""}
                  className={`${fieldClass} flex w-full border px-3`}
                >
                  <option value="">Select brand</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                label="Category"
                htmlFor="categoryId"
                error={state.fieldErrors?.categoryId}
              >
                <select
                  id="categoryId"
                  name="categoryId"
                  required
                  defaultValue={product?.categoryId ?? ""}
                  className={`${fieldClass} flex w-full border px-3`}
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </Section>

          <Section title="Copy">
            <Field label="Short description" htmlFor="shortDescription">
              <Textarea
                id="shortDescription"
                name="shortDescription"
                rows={2}
                defaultValue={product?.shortDescription ?? ""}
                className="mt-1.5 border-oak/50 bg-white"
              />
            </Field>
            <Field label="Description" htmlFor="description">
              <Textarea
                id="description"
                name="description"
                rows={5}
                defaultValue={product?.description ?? ""}
                className="mt-1.5 border-oak/50 bg-white"
              />
            </Field>
            <Field label="Ingredients" htmlFor="ingredients">
              <Textarea
                id="ingredients"
                name="ingredients"
                rows={3}
                defaultValue={product?.ingredients ?? ""}
                className="mt-1.5 border-oak/50 bg-white"
              />
            </Field>
            <Field label="Usage instructions (emailed after purchase)" htmlFor="howToUse">
              <Textarea
                id="howToUse"
                name="howToUse"
                rows={5}
                defaultValue={product?.howToUse ?? ""}
                placeholder="These instructions are sent to the customer in the order confirmation email."
                className="mt-1.5 border-oak/50 bg-white"
              />
            </Field>
            <p className="text-xs text-ink-muted">
              Shown on the product page and included in the confirmation email
              when the order is paid.
            </p>
          </Section>

          <Section title="Images">
            <p className="text-xs text-ink-muted">
              Paste image URLs (one per line) and/or upload files. First image is
              primary.
            </p>
            <Field label="Image URLs" htmlFor="imageUrls">
              <Textarea
                id="imageUrls"
                name="imageUrls"
                rows={4}
                defaultValue={existingImageUrls}
                placeholder="/images/product-serum.jpg"
                className="mt-1.5 border-oak/50 bg-white font-mono text-xs"
              />
            </Field>
            <Field label="Upload files" htmlFor="imageFiles">
              <Input
                id="imageFiles"
                name="imageFiles"
                type="file"
                accept="image/*"
                multiple
                className={`${fieldClass} py-2`}
              />
            </Field>
            {product?.images?.length ? (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((img) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={img.id}
                    src={img.url}
                    alt={img.alt ?? ""}
                    className="aspect-square bg-bg-muted object-contain"
                  />
                ))}
              </div>
            ) : null}
          </Section>

          <Section title="Variants">
            <p className="text-xs text-ink-muted">
              Optional shades / sizes. Leave empty for simple products.
            </p>
            {variants.map((row, index) => (
              <div
                key={index}
                className="grid gap-2 border border-oak/30 p-3 sm:grid-cols-5"
              >
                <Input
                  name="variantName"
                  placeholder="Name"
                  value={row.name}
                  onChange={(e) =>
                    setVariants((rows) =>
                      rows.map((r, i) =>
                        i === index ? { ...r, name: e.target.value } : r
                      )
                    )
                  }
                  className={fieldClass}
                />
                <select
                  name="variantType"
                  value={row.type}
                  onChange={(e) =>
                    setVariants((rows) =>
                      rows.map((r, i) =>
                        i === index
                          ? { ...r, type: e.target.value as VariantType }
                          : r
                      )
                    )
                  }
                  className={`${fieldClass} flex w-full border px-3`}
                >
                  {variantTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <Input
                  name="variantSku"
                  placeholder="SKU"
                  value={row.sku}
                  onChange={(e) =>
                    setVariants((rows) =>
                      rows.map((r, i) =>
                        i === index ? { ...r, sku: e.target.value } : r
                      )
                    )
                  }
                  className={fieldClass}
                />
                <Input
                  name="variantPrice"
                  placeholder="Price"
                  type="number"
                  step="0.01"
                  value={row.price}
                  onChange={(e) =>
                    setVariants((rows) =>
                      rows.map((r, i) =>
                        i === index ? { ...r, price: e.target.value } : r
                      )
                    )
                  }
                  className={fieldClass}
                />
                <div className="flex gap-2">
                  <Input
                    name="variantStock"
                    placeholder="Stock"
                    type="number"
                    min="0"
                    value={row.stock}
                    onChange={(e) =>
                      setVariants((rows) =>
                        rows.map((r, i) =>
                          i === index ? { ...r, stock: e.target.value } : r
                        )
                      )
                    }
                    className={fieldClass}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-1.5"
                    onClick={() =>
                      setVariants((rows) => rows.filter((_, i) => i !== index))
                    }
                  >
                    ×
                  </Button>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() =>
                setVariants((rows) => [
                  ...rows,
                  {
                    name: "",
                    type: "SHADE",
                    sku: "",
                    price: "",
                    stock: "0",
                  },
                ])
              }
            >
              Add variant
            </Button>
          </Section>
        </div>

        <div className="space-y-4">
          <Section title="Pricing & stock">
            <Field label="Price" htmlFor="price" error={state.fieldErrors?.price}>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                required
                defaultValue={
                  product?.price != null ? decimalToNumber(product.price) : ""
                }
                className={fieldClass}
              />
            </Field>
            <Field label="Compare at" htmlFor="compareAtPrice">
              <Input
                id="compareAtPrice"
                name="compareAtPrice"
                type="number"
                step="0.01"
                defaultValue={
                  product?.compareAtPrice != null
                    ? decimalToNumber(product.compareAtPrice)
                    : ""
                }
                className={fieldClass}
              />
            </Field>
            <Field label="Cost" htmlFor="cost">
              <Input
                id="cost"
                name="cost"
                type="number"
                step="0.01"
                defaultValue={
                  product?.cost != null ? decimalToNumber(product.cost) : ""
                }
                className={fieldClass}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Stock" htmlFor="stock">
                <Input
                  id="stock"
                  name="stock"
                  type="number"
                  min="0"
                  defaultValue={product?.stock ?? 0}
                  className={fieldClass}
                />
              </Field>
              <Field label="Low stock at" htmlFor="lowStockThreshold">
                <Input
                  id="lowStockThreshold"
                  name="lowStockThreshold"
                  type="number"
                  min="0"
                  defaultValue={product?.lowStockThreshold ?? 5}
                  className={fieldClass}
                />
              </Field>
            </div>
          </Section>

          <Section title="Details">
            <Field label="Product type" htmlFor="productType">
              <Input
                id="productType"
                name="productType"
                defaultValue={product?.productType ?? ""}
                className={fieldClass}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Volume" htmlFor="volume">
                <Input
                  id="volume"
                  name="volume"
                  defaultValue={product?.volume ?? ""}
                  className={fieldClass}
                />
              </Field>
              <Field label="Weight" htmlFor="weight">
                <Input
                  id="weight"
                  name="weight"
                  defaultValue={product?.weight ?? ""}
                  className={fieldClass}
                />
              </Field>
            </div>
            <Field label="Tags (comma-separated)" htmlFor="tags">
              <Input
                id="tags"
                name="tags"
                defaultValue={product?.tags.join(", ") ?? ""}
                className={fieldClass}
              />
            </Field>
            <Field label="Status" htmlFor="status">
              <select
                id="status"
                name="status"
                defaultValue={product?.status ?? "DRAFT"}
                className={`${fieldClass} flex w-full border px-3`}
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="featured"
                defaultChecked={product?.featured ?? false}
                className="accent-sage"
              />
              Featured
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="bestSeller"
                defaultChecked={product?.bestSeller ?? false}
                className="accent-sage"
              />
              Best seller
            </label>
          </Section>

          <Section title="Skin types">
            <div className="space-y-2">
              {skinTypes.map((st) => (
                <label key={st.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="skinTypeIds"
                    value={st.id}
                    defaultChecked={selectedSkin.has(st.id)}
                    className="accent-sage"
                  />
                  {st.name}
                  {st.nameEl ? (
                    <span className="text-ink-muted">({st.nameEl})</span>
                  ) : null}
                </label>
              ))}
            </div>
          </Section>

          <Section title="SEO">
            <Field label="SEO title" htmlFor="seoTitle">
              <Input
                id="seoTitle"
                name="seoTitle"
                defaultValue={product?.seoTitle ?? ""}
                className={fieldClass}
              />
            </Field>
            <Field label="SEO description" htmlFor="seoDescription">
              <Textarea
                id="seoDescription"
                name="seoDescription"
                rows={3}
                defaultValue={product?.seoDescription ?? ""}
                className="mt-1.5 border-oak/50 bg-white"
              />
            </Field>
          </Section>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-oak/30 pt-4">
        <Button type="submit" disabled={pending} size="sm">
          {pending ? "Saving…" : isEdit ? "Save changes" : "Create product"}
        </Button>
        <Link href="/admin/products">
          <Button type="button" variant="secondary" size="sm">
            Cancel
          </Button>
        </Link>
      </div>
    </form>
  );
}

export function ProductDangerActions({ productId }: { productId: string }) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <form action={duplicateProduct.bind(null, productId)}>
        <Button type="submit" variant="secondary" size="sm">
          Duplicate
        </Button>
      </form>
      <form
        action={deleteProduct.bind(null, productId)}
        onSubmit={(e) => {
          if (!confirm("Delete this product?")) e.preventDefault();
        }}
      >
        <Button type="submit" variant="ghost" size="sm" className="text-coral">
          Delete
        </Button>
      </form>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-sm border border-oak/40 bg-white p-4">
      <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-ink-muted">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string[];
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error?.[0] ? <p className="mt-1 text-xs text-coral">{error[0]}</p> : null}
    </div>
  );
}
