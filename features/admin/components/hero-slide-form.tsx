"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import type { HeroSlide, HeroSlideType } from "@prisma/client";
import { ImagePlus, Plus, X } from "lucide-react";
import {
  createHeroSlide,
  updateHeroSlide,
  type HeroActionState,
} from "@/features/admin/actions/hero";
import { HeroSlideLivePreview } from "@/features/admin/components/hero-slide-live-preview";
import { ProductSearchPicker } from "@/features/admin/components/product-search-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Product options for the searchable picker + live preview. */
type ProductOption = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  imageUrl: string | null;
  price: number;
  compareAtPrice: number | null;
};

type Draft = {
  type: HeroSlideType;
  productId: string;
  imageUrl: string;
  eyebrowEn: string;
  eyebrowEl: string;
  headlineEn: string;
  headlineEl: string;
  headlineAccentEn: string;
  headlineAccentEl: string;
  subheadEn: string;
  subheadEl: string;
  ctaPrimaryLabelEn: string;
  ctaPrimaryLabelEl: string;
  ctaPrimaryHref: string;
  ctaSecondaryLabelEn: string;
  ctaSecondaryLabelEl: string;
  ctaSecondaryHref: string;
  imageAltEn: string;
  imageAltEl: string;
  sortOrder: string;
  active: boolean;
};

const fieldClass =
  "mt-1.5 h-10 border-oak/50 bg-white text-sm focus-visible:ring-coral";

function initialDraft(slide?: HeroSlide): Draft {
  return {
    type: slide?.type ?? "CAMPAIGN",
    productId: slide?.productId ?? "",
    imageUrl: slide?.imageUrl ?? "",
    eyebrowEn: slide?.eyebrowEn ?? "",
    eyebrowEl: slide?.eyebrowEl ?? "",
    headlineEn: slide?.headlineEn ?? "",
    headlineEl: slide?.headlineEl ?? "",
    headlineAccentEn: slide?.headlineAccentEn ?? "",
    headlineAccentEl: slide?.headlineAccentEl ?? "",
    subheadEn: slide?.subheadEn ?? "",
    subheadEl: slide?.subheadEl ?? "",
    ctaPrimaryLabelEn: slide?.ctaPrimaryLabelEn ?? "Shop now",
    ctaPrimaryLabelEl: slide?.ctaPrimaryLabelEl ?? "Shop now",
    ctaPrimaryHref:
      slide?.ctaPrimaryHref ??
      (slide?.type === "PRODUCT" ? "" : "/best-sellers"),
    ctaSecondaryLabelEn: slide?.ctaSecondaryLabelEn ?? "",
    ctaSecondaryLabelEl: slide?.ctaSecondaryLabelEl ?? "",
    ctaSecondaryHref: slide?.ctaSecondaryHref ?? "",
    imageAltEn: slide?.imageAltEn ?? "",
    imageAltEl: slide?.imageAltEl ?? "",
    sortOrder: String(slide?.sortOrder ?? 0),
    active: slide?.active ?? true,
  };
}

export function HeroSlideForm({
  slide,
  products,
  defaultOpen = true,
}: {
  slide?: HeroSlide;
  products: ProductOption[];
  defaultOpen?: boolean;
}) {
  const isEdit = Boolean(slide);
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const boundUpdate = slide
    ? updateHeroSlide.bind(null, slide.id)
    : createHeroSlide;
  const [state, action, pending] = useActionState<HeroActionState, FormData>(
    boundUpdate,
    {}
  );
  const [open, setOpen] = useState(isEdit || defaultOpen);
  const [draft, setDraft] = useState<Draft>(() => initialDraft(slide));
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [previewDevice, setPreviewDevice] = useState<"mobile" | "desktop">(
    "mobile"
  );
  const [previewLocale, setPreviewLocale] = useState<"en" | "el">("en");

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === draft.productId) ?? null,
    [products, draft.productId]
  );

  const previewSrc = filePreview || draft.imageUrl || "/images/hero.jpg";

  function patch<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  useEffect(() => {
    if (!isEdit && state.success) {
      formRef.current?.reset();
      setDraft(initialDraft());
      setFilePreview(null);
      if (fileRef.current) fileRef.current.value = "";
      setOpen(false);
    }
  }, [state.success, isEdit]);

  useEffect(() => {
    if (isEdit) return;
    const openFromHash = () => {
      if (window.location.hash === "#add-slide") setOpen(true);
    };
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, [isEdit]);

  useEffect(() => {
    return () => {
      if (filePreview) URL.revokeObjectURL(filePreview);
    };
  }, [filePreview]);

  if (!isEdit && !open) {
    return (
      <div
        id="add-slide"
        className="rounded-xl border border-dashed border-ink/20 bg-white p-5 shadow-[0_1px_2px_rgba(28,25,23,0.04)] sm:p-6"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-coral/10 text-coral">
              <ImagePlus className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            </span>
            <div>
              <h3 className="text-base font-semibold tracking-tight text-ink">
                Προσθήκη slide στην αρχική
              </h3>
              <p className="mt-1 max-w-md text-sm leading-relaxed text-ink-muted">
                Δημιούργησε banner καμπάνιας ή βάλε προϊόν σε προσφορά. Ανέβασε
                φωτογραφία, γράψε σύντομο τίτλο και διάλεξε πού πάει το κουμπί.
              </p>
            </div>
          </div>
          <Button
            type="button"
            onClick={() => setOpen(true)}
            className="shrink-0 gap-1.5"
          >
            <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
            Προσθήκη slide
          </Button>
        </div>
      </div>
    );
  }

  const liveDraft = {
    type: draft.type,
    imageSrc: previewSrc,
    locale: previewLocale,
    eyebrow: previewLocale === "el" ? draft.eyebrowEl : draft.eyebrowEn,
    headline: previewLocale === "el" ? draft.headlineEl : draft.headlineEn,
    headlineAccent:
      previewLocale === "el" ? draft.headlineAccentEl : draft.headlineAccentEn,
    subhead: previewLocale === "el" ? draft.subheadEl : draft.subheadEn,
    ctaPrimary:
      previewLocale === "el"
        ? draft.ctaPrimaryLabelEl
        : draft.ctaPrimaryLabelEn,
    ctaSecondary:
      previewLocale === "el"
        ? draft.ctaSecondaryLabelEl
        : draft.ctaSecondaryLabelEn,
    product:
      draft.type === "PRODUCT" && selectedProduct
        ? {
            price: selectedProduct.price,
            compareAtPrice: selectedProduct.compareAtPrice,
          }
        : null,
  };

  return (
    <div
      id={isEdit ? undefined : "add-slide"}
      className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,26rem)]"
    >
      <form
        ref={formRef}
        action={action}
        className="space-y-6 rounded-xl border border-ink/[0.08] bg-white p-4 shadow-[0_1px_2px_rgba(28,25,23,0.04)] sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            {!isEdit ? (
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-coral/10 text-coral">
                <ImagePlus className="h-5 w-5" strokeWidth={1.75} aria-hidden />
              </span>
            ) : null}
            <div>
              <h3 className="text-base font-semibold tracking-tight text-ink">
                {isEdit ? "Επεξεργασία slide" : "Νέο slide αρχικής"}
              </h3>
              <p className="mt-1 text-sm text-ink-muted">
                {isEdit
                  ? "Άλλαξε εικόνα, κείμενα ή links — δες το live preview."
                  : "Επεξεργασία αριστερά. Το preview δεξιά ενημερώνεται live."}
              </p>
            </div>
          </div>
          {!isEdit ? (
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-ink/[0.05] hover:text-ink"
              aria-label="Κλείσιμο φόρμας"
            >
              <X className="h-4 w-4" strokeWidth={1.75} />
            </button>
          ) : null}
        </div>

        {state.error ? (
          <p className="rounded-lg bg-coral/10 px-3 py-2 text-sm text-coral">
            {state.error}
          </p>
        ) : null}
        {state.success ? (
          <p className="rounded-lg bg-sage-dark/10 px-3 py-2 text-sm text-sage-dark">
            {state.success}
          </p>
        ) : null}

        <Section
          step="1"
          title="Τι είδους slide;"
          hint="Campaign = γενικό μήνυμα. Product promo = δείχνει τιμή & έκπτωση στο banner."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <TypeCard
              selected={draft.type === "CAMPAIGN"}
              title="Campaign"
              description="New in, εποχιακό μήνυμα, quiz, brand spotlight — χωρίς τιμή προϊόντος."
              onSelect={() => patch("type", "CAMPAIGN")}
            />
            <TypeCard
              selected={draft.type === "PRODUCT"}
              title="Product promo"
              description="Ένα προϊόν. Η τιμή Sale εμφανίζεται στο hero όταν υπάρχει."
              onSelect={() => patch("type", "PRODUCT")}
            />
          </div>
          <input type="hidden" name="type" value={draft.type} />

          {draft.type === "PRODUCT" ? (
            <div className="mt-4">
              <Label htmlFor="product-search">Προϊόν προς προβολή</Label>
              <ProductSearchPicker
                products={products}
                value={draft.productId}
                onChange={(id) => patch("productId", id)}
                required
                placeholder="Αναζήτηση με όνομα ή κωδικό…"
              />
              <p className="mt-1.5 text-[11px] text-ink-muted">
                Αναζήτηση με όνομα ή κωδικό — κάθε αποτέλεσμα δείχνει την εικόνα.
              </p>
            </div>
          ) : (
            <input type="hidden" name="productId" value="" />
          )}
        </Section>

        <Section
          step="2"
          title="Εικόνα hero"
          hint="Ανέβασε φαρδιά φωτογραφία (προτείνεται). Ή επικόλλησε υπάρχον URL."
        >
          <div className="space-y-3">
            <div>
              <Label htmlFor="imageFile">Ανέβασμα εικόνας</Label>
              <Input
                ref={fileRef}
                id="imageFile"
                name="imageFile"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className={`${fieldClass} py-2`}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (filePreview) URL.revokeObjectURL(filePreview);
                  if (!file) {
                    setFilePreview(null);
                    return;
                  }
                  setFilePreview(URL.createObjectURL(file));
                }}
              />
              <p className="mt-1 text-[11px] text-ink-muted">
                JPEG, PNG, WebP or GIF.
              </p>
            </div>
            <div>
              <Label htmlFor="imageUrl">Ή URL εικόνας</Label>
              <Input
                id="imageUrl"
                name="imageUrl"
                value={draft.imageUrl}
                onChange={(e) => patch("imageUrl", e.target.value)}
                placeholder="/images/hero.jpg or https://…"
                className={fieldClass}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                id="imageAltEn"
                label="Alt text (Αγγλικά)"
                value={draft.imageAltEn}
                onChange={(v) => patch("imageAltEn", v)}
                placeholder="Περιγραφή εικόνας"
              />
              <Field
                id="imageAltEl"
                label="Alt text (Ελληνικά)"
                value={draft.imageAltEl}
                onChange={(v) => patch("imageAltEl", v)}
              />
            </div>
          </div>
        </Section>

        <Section
          step="3"
          title="Κείμενο στο banner"
          hint="Συμπλήρωσε και τις δύο γλώσσες. Άλλαξε EN/EL στο preview για έλεγχο."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <LocaleBlock locale="English">
              <Field
                id="eyebrowEn"
                label="Μικρή ετικέτα (προαιρετικό)"
                value={draft.eyebrowEn}
                onChange={(v) => patch("eyebrowEn", v)}
                placeholder="π.χ. New in"
              />
              <Field
                id="headlineEn"
                label="Τίτλος"
                required
                value={draft.headlineEn}
                onChange={(v) => patch("headlineEn", v)}
                placeholder="Your Korean routine"
              />
              <Field
                id="headlineAccentEn"
                label="Δεύτερη γραμμή (προαιρετικό, coral italic)"
                value={draft.headlineAccentEn}
                onChange={(v) => patch("headlineAccentEn", v)}
                placeholder="starts here."
              />
              <div>
                <Label htmlFor="subheadEn">Σύντομο συνοδευτικό κείμενο</Label>
                <Textarea
                  id="subheadEn"
                  name="subheadEn"
                  rows={2}
                  value={draft.subheadEn}
                  onChange={(e) => patch("subheadEn", e.target.value)}
                  className="mt-1.5 border-oak/50 bg-white text-sm"
                />
              </div>
            </LocaleBlock>
            <LocaleBlock locale="Ελληνικά">
              <Field
                id="eyebrowEl"
                label="Μικρή ετικέτα (προαιρετικό)"
                value={draft.eyebrowEl}
                onChange={(v) => patch("eyebrowEl", v)}
                placeholder="π.χ. Νέες αφίξεις"
              />
              <Field
                id="headlineEl"
                label="Τίτλος"
                required
                value={draft.headlineEl}
                onChange={(v) => patch("headlineEl", v)}
              />
              <Field
                id="headlineAccentEl"
                label="Δεύτερη γραμμή (προαιρετικό)"
                value={draft.headlineAccentEl}
                onChange={(v) => patch("headlineAccentEl", v)}
              />
              <div>
                <Label htmlFor="subheadEl">Σύντομο κείμενο</Label>
                <Textarea
                  id="subheadEl"
                  name="subheadEl"
                  rows={2}
                  value={draft.subheadEl}
                  onChange={(e) => patch("subheadEl", e.target.value)}
                  className="mt-1.5 border-oak/50 bg-white text-sm"
                />
              </div>
            </LocaleBlock>
          </div>
        </Section>

        <Section
          step="4"
          title="Κουμπιά"
          hint="Primary είναι το κύριο coral κουμπί. Άφησε το secondary κενό αν θες μόνο ένα."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              id="ctaPrimaryLabelEn"
              label="Κύριο κουμπί — EN"
              value={draft.ctaPrimaryLabelEn}
              onChange={(v) => patch("ctaPrimaryLabelEn", v)}
            />
            <Field
              id="ctaPrimaryLabelEl"
              label="Κύριο κουμπί — EL"
              value={draft.ctaPrimaryLabelEl}
              onChange={(v) => patch("ctaPrimaryLabelEl", v)}
            />
            <Field
              id="ctaPrimaryHref"
              label="Link κύριου κουμπιού"
              value={draft.ctaPrimaryHref}
              onChange={(v) => patch("ctaPrimaryHref", v)}
              placeholder={
                draft.type === "PRODUCT"
                  ? "Άφησέ το κενό για τη σελίδα προϊόντος"
                  : "/best-sellers"
              }
            />
            <div className="hidden sm:block" />
            <Field
              id="ctaSecondaryLabelEn"
              label="Δεύτερο κουμπί — EN (προαιρετικό)"
              value={draft.ctaSecondaryLabelEn}
              onChange={(v) => patch("ctaSecondaryLabelEn", v)}
            />
            <Field
              id="ctaSecondaryLabelEl"
              label="Δεύτερο κουμπί — EL (προαιρετικό)"
              value={draft.ctaSecondaryLabelEl}
              onChange={(v) => patch("ctaSecondaryLabelEl", v)}
            />
            <Field
              id="ctaSecondaryHref"
              label="Link δεύτερου κουμπιού"
              value={draft.ctaSecondaryHref}
              onChange={(v) => patch("ctaSecondaryHref", v)}
              placeholder="/skin-type"
            />
          </div>
        </Section>

        <Section
          step="5"
          title="Ορατότητα"
          hint="Τα ανενεργά slides μένουν αποθηκευμένα αλλά κρυφά στην αρχική."
        >
          <div className="flex flex-wrap items-end gap-4">
            <div className="w-28">
              <Label htmlFor="sortOrder">Σειρά</Label>
              <Input
                id="sortOrder"
                name="sortOrder"
                type="number"
                min={0}
                value={draft.sortOrder}
                onChange={(e) => patch("sortOrder", e.target.value)}
                className={fieldClass}
              />
              <p className="mt-1 text-[11px] text-ink-muted">0 = πρώτο</p>
            </div>
            <label className="mb-2 inline-flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                name="active"
                checked={draft.active}
                onChange={(e) => patch("active", e.target.checked)}
                className="h-4 w-4 border-oak"
              />
              Εμφάνιση στην αρχική
            </label>
          </div>
        </Section>

        <div className="flex flex-wrap items-center gap-3 border-t border-oak/25 pt-4">
          <Button type="submit" disabled={pending} className="gap-1.5">
            {!isEdit && !pending ? (
              <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
            ) : null}
            {pending
              ? "Αποθήκευση…"
              : isEdit
                ? "Αποθήκευση αλλαγών"
                : "Προσθήκη slide στην αρχική"}
          </Button>
          {!isEdit ? (
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-sm font-medium text-ink-muted hover:text-ink hover:underline"
            >
              Ακύρωση
            </button>
          ) : null}
          <p className="w-full text-xs text-ink-muted sm:w-auto">
            Το preview είναι live· η αρχική ενημερώνεται μετά την αποθήκευση.
          </p>
        </div>
      </form>

      <aside className="xl:sticky xl:top-20 xl:self-start">
        <HeroSlideLivePreview
          draft={liveDraft}
          device={previewDevice}
          onDeviceChange={setPreviewDevice}
          locale={previewLocale}
          onLocaleChange={setPreviewLocale}
        />
      </aside>
    </div>
  );
}

function Section({
  step,
  title,
  hint,
  children,
}: {
  step: string;
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 border-t border-oak/20 pt-5 first:border-t-0 first:pt-0">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
          Βήμα {step}
        </p>
        <h4 className="mt-0.5 text-sm font-semibold text-ink">{title}</h4>
        <p className="mt-0.5 text-xs text-ink-muted">{hint}</p>
      </div>
      {children}
    </section>
  );
}

function TypeCard({
  selected,
  title,
  description,
  onSelect,
}: {
  selected: boolean;
  title: string;
  description: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "rounded-lg border px-4 py-3 text-left transition-colors",
        selected
          ? "border-ink bg-ink/[0.03] ring-1 ring-ink/15"
          : "border-oak/40 hover:border-oak/70"
      )}
    >
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-ink-muted">{description}</p>
    </button>
  );
}

function LocaleBlock({
  locale,
  children,
}: {
  locale: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3 rounded-lg border border-oak/30 bg-bg/40 p-3 sm:p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
        {locale}
      </p>
      {children}
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  required,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={id}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={fieldClass}
      />
    </div>
  );
}
