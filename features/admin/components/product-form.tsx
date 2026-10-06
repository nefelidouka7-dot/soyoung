"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ChevronDown, Plus } from "lucide-react";
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
import { ProductImagesField } from "@/features/admin/components/product-images-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { decimalToNumber } from "@/lib/admin";
import { CATALOG_PRODUCT_TYPES } from "@/lib/catalog-taxonomy";
import { cn } from "@/lib/utils";

const PRODUCT_TYPE_OPTIONS = [
  ...new Set(Object.values(CATALOG_PRODUCT_TYPES).flatMap((types) => [...types])),
];

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
  image: string;
};

const STATUS_OPTIONS: { value: ProductStatus; label: string; hint: string }[] = [
  {
    value: "DRAFT",
    label: "Πρόχειρο",
    hint: "Μόνο στο admin — δεν φαίνεται στο shop",
  },
  {
    value: "ACTIVE",
    label: "Ενεργό",
    hint: "Εμφανίζεται στο κατάστημα",
  },
  {
    value: "ARCHIVED",
    label: "Archived",
    hint: "Κρυφό από τον κατάλογο",
  },
];

const variantTypes: VariantType[] = [
  "DEFAULT",
  "SHADE",
  "SIZE",
  "VOLUME",
  "COLOR",
];

const fieldClass =
  "mt-1.5 h-10 border-oak/50 bg-white text-sm focus-visible:ring-coral";

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
          image: v.image ?? "",
        }))
      : []
  );
  const [status, setStatus] = useState<ProductStatus>(
    product?.status ?? "DRAFT"
  );
  const [galleryUrls, setGalleryUrls] = useState<string[]>(
    () =>
      product?.images
        ?.slice()
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((i) => i.url) ?? []
  );
  const [imagesUploading, setImagesUploading] = useState(false);

  const hasTexts = Boolean(
    product?.shortDescription ||
      product?.description ||
      product?.ingredients ||
      product?.howToUse
  );
  const hasExtras = Boolean(
    product?.productType ||
      product?.volume ||
      product?.weight ||
      product?.tags?.length ||
      product?.seoTitle ||
      product?.seoDescription ||
      selectedSkin.size
  );

  const [openTexts, setOpenTexts] = useState(isEdit && hasTexts);
  const [openVariants, setOpenVariants] = useState(
    isEdit && (product?.variants?.length ?? 0) > 0
  );
  const [openExtras, setOpenExtras] = useState(isEdit && hasExtras);
  const [openAdvanced, setOpenAdvanced] = useState(false);

  return (
    <form
      action={action}
      className="space-y-5"
      onSubmit={(e) => {
        if (imagesUploading) {
          e.preventDefault();
        }
      }}
    >
      {!isEdit ? (
        <div className="rounded-xl border border-oak/30 bg-bg-muted/50 px-4 py-3.5 sm:px-5">
          <p className="text-sm font-medium text-ink">Γρήγορη προσθήκη</p>
          <p className="mt-1 text-sm leading-relaxed text-ink-muted">
            Συμπλήρωσε όνομα, brand, κατηγορία, τιμή και (προαιρετικά) φωτογραφία.
            Τα υπόλοιπα μπορείς να τα ανοίξεις παρακάτω ή να τα συμπληρώσεις
            αργότερα από την επεξεργασία.
          </p>
        </div>
      ) : null}

      {state.error ? (
        <p className="rounded-lg border border-coral/40 bg-coral/10 px-3 py-2 text-sm text-coral">
          {state.error}
        </p>
      ) : null}

      <Section
        title="Τα απαραίτητα"
        description="Αυτά χρειάζονται για να δημιουργηθεί το προϊόν."
      >
        <Field label="Όνομα προϊόντος" htmlFor="name" error={state.fieldErrors?.name} required>
          <Input
            id="name"
            name="name"
            required
            defaultValue={product?.name ?? ""}
            placeholder="π.χ. Moisture Surge Serum"
            className={fieldClass}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Brand"
            htmlFor="brandId"
            error={state.fieldErrors?.brandId}
            required
          >
            <select
              id="brandId"
              name="brandId"
              required
              defaultValue={product?.brandId ?? ""}
              className={`${fieldClass} flex w-full border px-3`}
            >
              <option value="">Διάλεξε brand…</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="Κατηγορία"
            htmlFor="categoryId"
            error={state.fieldErrors?.categoryId}
            required
          >
            <select
              id="categoryId"
              name="categoryId"
              required
              defaultValue={product?.categoryId ?? ""}
              className={`${fieldClass} flex w-full border px-3`}
            >
              <option value="">Διάλεξε κατηγορία…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Τιμή (€)" htmlFor="price" error={state.fieldErrors?.price} required>
            <Input
              id="price"
              name="price"
              type="number"
              step="0.01"
              min="0"
              required
              defaultValue={
                product?.price != null ? decimalToNumber(product.price) : ""
              }
              placeholder="24.90"
              className={fieldClass}
            />
          </Field>
          <Field label="Αρχική τιμή (€)" htmlFor="compareAtPrice" hint="Για sale">
            <Input
              id="compareAtPrice"
              name="compareAtPrice"
              type="number"
              step="0.01"
              min="0"
              defaultValue={
                product?.compareAtPrice != null
                  ? decimalToNumber(product.compareAtPrice)
                  : ""
              }
              placeholder="Προαιρετικό"
              className={fieldClass}
            />
          </Field>
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
        </div>

        <div>
          <p className="text-sm font-medium text-ink">
            Status <span className="text-coral">*</span>
          </p>
          <input type="hidden" name="status" value={status} />
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {STATUS_OPTIONS.filter((s) =>
              isEdit ? true : s.value !== "ARCHIVED"
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatus(opt.value)}
                className={cn(
                  "rounded-lg border px-3 py-2.5 text-left transition-colors",
                  status === opt.value
                    ? "border-coral/50 bg-coral/[0.06] ring-1 ring-coral/25"
                    : "border-oak/40 bg-white hover:border-oak/60"
                )}
              >
                <span className="block text-sm font-semibold text-ink">
                  {opt.label}
                </span>
                <span className="mt-0.5 block text-xs text-ink-muted">
                  {opt.hint}
                </span>
              </button>
            ))}
          </div>
        </div>

        <ProductImagesField
          initialUrls={galleryUrls}
          onUrlsChange={(urls) => {
            setGalleryUrls(urls);
            setVariants((rows) =>
              rows.map((r) =>
                !r.image || urls.includes(r.image) ? r : { ...r, image: "" }
              )
            );
          }}
          onUploadingChange={setImagesUploading}
        />

        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="featured"
              defaultChecked={product?.featured ?? false}
              className="accent-sage"
            />
            Featured στην αρχική
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
        </div>
      </Section>

      <Collapsible
        title="Περιγραφή & οδηγίες"
        hint="Κείμενα σελίδας προϊόντος και email"
        open={openTexts}
        onToggle={() => setOpenTexts((v) => !v)}
      >
        <Field label="Σύντομη περιγραφή" htmlFor="shortDescription">
          <Textarea
            id="shortDescription"
            name="shortDescription"
            rows={2}
            defaultValue={product?.shortDescription ?? ""}
            placeholder="1–2 γραμμές για τις κάρτες προϊόντος"
            className="mt-1.5 border-oak/50 bg-white"
          />
        </Field>
        <Field label="Πλήρης περιγραφή" htmlFor="description">
          <Textarea
            id="description"
            name="description"
            rows={4}
            defaultValue={product?.description ?? ""}
            className="mt-1.5 border-oak/50 bg-white"
          />
        </Field>
        <Field label="Συστατικά" htmlFor="ingredients">
          <Textarea
            id="ingredients"
            name="ingredients"
            rows={3}
            defaultValue={product?.ingredients ?? ""}
            className="mt-1.5 border-oak/50 bg-white"
          />
        </Field>
        <Field
          label="Οδηγίες χρήσης"
          htmlFor="howToUse"
          hint="Στέλνονται και στο email επιβεβαίωσης παραγγελίας"
        >
          <Textarea
            id="howToUse"
            name="howToUse"
            rows={4}
            defaultValue={product?.howToUse ?? ""}
            className="mt-1.5 border-oak/50 bg-white"
          />
        </Field>
      </Collapsible>

      <Collapsible
        title="Variants (shades / sizes)"
        hint="π.χ. αποχρώσεις κραγιόν ή μεγέθη — άστο κλειστό αν δεν χρειάζεται"
        open={openVariants}
        onToggle={() => setOpenVariants((v) => !v)}
      >
        <div className="rounded-lg border border-oak/30 bg-bg/50 px-3 py-3 text-sm leading-relaxed text-ink-muted">
          <p className="font-medium text-ink">Πότε τα χρειάζεσαι;</p>
          <ul className="mt-1.5 list-disc space-y-1 pl-5">
            <li>
              Αν το προϊόν έχει πολλές αποχρώσεις/μεγέθη — πρόσθεσε από μία
              γραμμή για το καθένα.
            </li>
            <li>
              Μπορείς να δέσεις{" "}
              <span className="font-medium text-ink">διαφορετική φωτο</span> σε
              κάθε shade (από αυτές που ανέβασες πάνω).
            </li>
            <li>
              Αν είναι απλό προϊόν (μία μόνο εκδοχή), άφησε αυτή την ενότητα
              κενή.
            </li>
          </ul>
        </div>

        {variants.map((row, index) => (
          <div
            key={index}
            className="space-y-3 rounded-lg border border-oak/30 p-3 sm:p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-ink">
                Variant {index + 1}
                {row.name ? (
                  <span className="font-normal text-ink-muted"> · {row.name}</span>
                ) : null}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-coral hover:bg-coral/10 hover:text-coral"
                onClick={() =>
                  setVariants((rows) => rows.filter((_, i) => i !== index))
                }
              >
                Αφαίρεση
              </Button>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              <Input
                name="variantName"
                placeholder="Όνομα (π.χ. Rose Beige)"
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
                placeholder="SKU (υποχρεωτικό)"
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
                placeholder="Τιμή (κενό = ίδια)"
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
            </div>

            <div>
              <input type="hidden" name="variantImage" value={row.image} />
              <p className="text-sm font-medium text-ink">Φωτογραφία variant</p>
              <p className="mt-0.5 text-xs text-ink-muted">
                Προαιρετικό. Αν δεν διαλέξεις, στο shop φαίνεται η κύρια
                φωτογραφία του προϊόντος.
              </p>
              {galleryUrls.length === 0 ? (
                <p className="mt-2 text-xs text-ink-muted">
                  Ανέβασε πρώτα φωτογραφίες στην ενότητα πάνω για να τις δέσεις
                  εδώ.
                </p>
              ) : (
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setVariants((rows) =>
                        rows.map((r, i) =>
                          i === index ? { ...r, image: "" } : r
                        )
                      )
                    }
                    className={cn(
                      "flex h-14 w-14 items-center justify-center rounded-lg border text-[10px] font-medium",
                      !row.image
                        ? "border-coral/50 bg-coral/[0.06] text-ink ring-1 ring-coral/30"
                        : "border-oak/40 bg-white text-ink-muted hover:border-oak/60"
                    )}
                  >
                    Καμία
                  </button>
                  {galleryUrls.map((url) => {
                    const selected = row.image === url;
                    return (
                      <button
                        key={url}
                        type="button"
                        onClick={() =>
                          setVariants((rows) =>
                            rows.map((r, i) =>
                              i === index ? { ...r, image: url } : r
                            )
                          )
                        }
                        className={cn(
                          "relative h-14 w-14 overflow-hidden rounded-lg border bg-bg-muted",
                          selected
                            ? "border-coral/50 ring-2 ring-coral/35"
                            : "border-oak/40 hover:border-oak/60"
                        )}
                        title="Επιλογή φωτογραφίας"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt=""
                          className="h-full w-full object-contain"
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="gap-1.5"
          onClick={() =>
            setVariants((rows) => [
              ...rows,
              {
                name: "",
                type: "SHADE",
                sku: "",
                price: "",
                stock: "0",
                image: "",
              },
            ])
          }
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          Προσθήκη variant
        </Button>
      </Collapsible>

      <Collapsible
        title="Τύπος επιδερμίδας, SEO & λεπτομέρειες"
        hint="Tags, όγκος, SEO"
        open={openExtras}
        onToggle={() => setOpenExtras((v) => !v)}
      >
        <Field label="Τύπος προϊόντος" htmlFor="productType">
          <Input
            id="productType"
            name="productType"
            list="product-type-options"
            defaultValue={product?.productType ?? ""}
            placeholder="π.χ. Serum, Water Cleanser"
            className={fieldClass}
          />
          <datalist id="product-type-options">
            {PRODUCT_TYPE_OPTIONS.map((type) => (
              <option key={type} value={type} />
            ))}
          </datalist>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Όγκος" htmlFor="volume">
            <Input
              id="volume"
              name="volume"
              defaultValue={product?.volume ?? ""}
              placeholder="π.χ. 50ml"
              className={fieldClass}
            />
          </Field>
          <Field label="Βάρος" htmlFor="weight">
            <Input
              id="weight"
              name="weight"
              defaultValue={product?.weight ?? ""}
              className={fieldClass}
            />
          </Field>
        </div>
        <Field label="Tags" htmlFor="tags" hint="Χωρισμένα με κόμμα">
          <Input
            id="tags"
            name="tags"
            defaultValue={product?.tags.join(", ") ?? ""}
            placeholder="hydrating, glass-skin"
            className={fieldClass}
          />
        </Field>

        <div>
          <p className="text-sm font-medium text-ink">Τύποι επιδερμίδας</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {skinTypes.map((st) => (
              <label
                key={st.id}
                className="flex items-center gap-2 rounded-md border border-oak/30 bg-bg/40 px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  name="skinTypeIds"
                  value={st.id}
                  defaultChecked={selectedSkin.has(st.id)}
                  className="accent-sage"
                />
                <span>
                  {st.name}
                  {st.nameEl ? (
                    <span className="text-ink-muted"> ({st.nameEl})</span>
                  ) : null}
                </span>
              </label>
            ))}
          </div>
        </div>

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
      </Collapsible>

      <Collapsible
        title="Προχωρημένα"
        hint="SKU, slug, κόστος"
        open={openAdvanced}
        onToggle={() => setOpenAdvanced((v) => !v)}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="SKU" htmlFor="sku">
            <Input
              id="sku"
              name="sku"
              defaultValue={product?.sku ?? ""}
              className={fieldClass}
            />
          </Field>
          <Field label="Slug" htmlFor="slug" hint="Αυτόματο από το όνομα αν μείνει κενό">
            <Input
              id="slug"
              name="slug"
              defaultValue={product?.slug ?? ""}
              placeholder="αυτόματο"
              className={fieldClass}
            />
          </Field>
          <Field label="Κόστος (€)" htmlFor="cost">
            <Input
              id="cost"
              name="cost"
              type="number"
              step="0.01"
              min="0"
              defaultValue={
                product?.cost != null ? decimalToNumber(product.cost) : ""
              }
              className={fieldClass}
            />
          </Field>
          <Field label="Χαμηλό stock από" htmlFor="lowStockThreshold">
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
      </Collapsible>

      {/* Hidden defaults when collapsibles closed still submit empty via uncontrolled fields inside closed sections - they stay in DOM so OK */}

      <div className="sticky bottom-0 z-20 -mx-4 border-t border-ink/[0.08] bg-white/95 px-4 py-3 backdrop-blur-sm sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="hidden text-xs text-ink-muted sm:block">
            {imagesUploading
              ? "Περίμενε να τελειώσει το ανέβασμα των φωτογραφιών…"
              : isEdit
                ? "Οι αλλαγές αποθηκεύονται στο κατάλογο."
                : status === "ACTIVE"
                  ? "Θα εμφανιστεί αμέσως στο shop."
                  : "Θα μείνει πρόχειρο μέχρι να το ενεργοποιήσεις."}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/admin/products">
              <Button type="button" variant="secondary" size="sm">
                Ακύρωση
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={pending || imagesUploading}
              size="sm"
              className="gap-1.5"
            >
              {!isEdit && !pending && !imagesUploading ? (
                <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
              ) : null}
              {imagesUploading
                ? "Ανέβασμα φωτο…"
                : pending
                  ? "Αποθήκευση…"
                  : isEdit
                    ? "Αποθήκευση αλλαγών"
                    : "Προσθήκη προϊόντος"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}

export function ProductDangerActions({ productId }: { productId: string }) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      <form action={duplicateProduct.bind(null, productId)}>
        <Button type="submit" variant="secondary" size="sm">
          Αντιγραφή
        </Button>
      </form>
      <form
        action={deleteProduct.bind(null, productId)}
        onSubmit={(e) => {
          if (!confirm("Διαγραφή αυτού του προϊόντος;")) e.preventDefault();
        }}
      >
        <Button type="submit" variant="ghost" size="sm" className="text-coral">
          Διαγραφή
        </Button>
      </form>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-ink/[0.08] bg-white p-4 shadow-[0_1px_2px_rgba(28,25,23,0.04)] sm:p-5">
      <h3 className="text-base font-semibold tracking-tight text-ink">{title}</h3>
      {description ? (
        <p className="mt-1 text-sm text-ink-muted">{description}</p>
      ) : null}
      <div className="mt-4 space-y-4">{children}</div>
    </div>
  );
}

function Collapsible({
  title,
  hint,
  open,
  onToggle,
  children,
}: {
  title: string;
  hint?: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-ink/[0.08] bg-white shadow-[0_1px_2px_rgba(28,25,23,0.04)]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left sm:px-5"
        aria-expanded={open}
      >
        <span>
          <span className="block text-sm font-semibold text-ink">{title}</span>
          {hint ? (
            <span className="mt-0.5 block text-xs text-ink-muted">{hint}</span>
          ) : null}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-ink-muted transition-transform",
            open && "rotate-180"
          )}
          aria-hidden
        />
      </button>
      <div
        className={cn(
          "space-y-4 border-t border-oak/25 px-4 py-4 sm:px-5",
          !open && "hidden"
        )}
        aria-hidden={!open}
      >
        {children}
      </div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string[];
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={htmlFor}>
        {label}
        {required ? <span className="text-coral"> *</span> : null}
      </Label>
      {children}
      {hint && !error?.[0] ? (
        <p className="mt-1 text-xs text-ink-muted">{hint}</p>
      ) : null}
      {error?.[0] ? <p className="mt-1 text-xs text-coral">{error[0]}</p> : null}
    </div>
  );
}
