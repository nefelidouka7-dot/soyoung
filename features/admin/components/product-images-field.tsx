"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ImagePlus, Loader2, Star, Trash2, X } from "lucide-react";
import { uploadProductImage } from "@/features/admin/actions/products";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type GalleryItem = {
  key: string;
  url: string;
  preview?: string;
  uploading?: boolean;
  error?: string;
};

export function ProductImagesField({
  initialUrls = [],
  onUrlsChange,
  onUploadingChange,
}: {
  initialUrls?: string[];
  onUrlsChange?: (urls: string[]) => void;
  onUploadingChange?: (uploading: boolean) => void;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<GalleryItem[]>(() =>
    initialUrls.map((url, i) => ({ key: `${url}#${i}`, url }))
  );

  const readyUrls = items
    .filter((i) => i.url && !i.uploading && !i.error)
    .map((i) => i.url);
  const uploading = items.some((i) => i.uploading);

  useEffect(() => {
    onUrlsChange?.(readyUrls);
  }, [readyUrls.join("\n")]); // eslint-disable-line react-hooks/exhaustive-deps -- sync gallery URLs

  useEffect(() => {
    onUploadingChange?.(uploading);
  }, [uploading, onUploadingChange]);

  async function uploadFiles(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!list.length) return;

    const pending: GalleryItem[] = list.map((file) => ({
      key: `pending-${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
      url: "",
      preview: URL.createObjectURL(file),
      uploading: true,
    }));

    setItems((prev) => [...prev, ...pending]);

    await Promise.all(
      list.map(async (file, i) => {
        const key = pending[i]!.key;
        const fd = new FormData();
        fd.set("file", file);
        const result = await uploadProductImage(fd);

        setItems((prev) =>
          prev.map((item) => {
            if (item.key !== key) return item;
            if (item.preview) URL.revokeObjectURL(item.preview);
            if (result.error || !result.url) {
              return {
                ...item,
                uploading: false,
                error: result.error ?? "Αποτυχία ανεβάσματος",
                preview: undefined,
              };
            }
            return {
              key: `${result.url}#${key}`,
              url: result.url,
              uploading: false,
            };
          })
        );
      })
    );
  }

  function removeAt(key: string) {
    setItems((prev) => {
      const target = prev.find((i) => i.key === key);
      if (target?.preview) URL.revokeObjectURL(target.preview);
      return prev.filter((i) => i.key !== key);
    });
  }

  function makePrimary(key: string) {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.key === key);
      if (idx <= 0) return prev;
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      next.unshift(item!);
      return next;
    });
  }

  function dismissError(key: string) {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name="imageUrls" value={readyUrls.join("\n")} />

      <div className="rounded-lg border border-dashed border-oak/45 bg-bg/50 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-coral/10 text-coral">
              <ImagePlus className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">Φωτογραφίες προϊόντος</p>
              <p className="mt-1 max-w-lg text-sm leading-relaxed text-ink-muted">
                Διάλεξε <span className="font-medium text-ink">πολλές μαζί</span>{" "}
                (Ctrl/Cmd + κλικ ή σύρε). Η{" "}
                <span className="font-medium text-ink">πρώτη</span> είναι η κύρια
                φωτογραφία στο shop. Μπορείς αργότερα να δέσεις μια φωτο σε
                συγκεκριμένο shade/size στα variants.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
            <input
              ref={inputRef}
              id={inputId}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              className="sr-only"
              onChange={(e) => {
                if (e.target.files?.length) {
                  void uploadFiles(e.target.files);
                  e.target.value = "";
                }
              }}
            />
            <Button
              type="button"
              size="sm"
              className="gap-1.5"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <ImagePlus className="h-4 w-4" strokeWidth={2} aria-hidden />
              )}
              {uploading ? "Ανέβασμα…" : "Προσθήκη φωτογραφιών"}
            </Button>
            {uploading ? (
              <p className="text-xs text-ink-muted">Μην κλείσεις τη σελίδα…</p>
            ) : null}
          </div>
        </div>

        <div
          className="mt-4 rounded-lg border border-oak/30 bg-white/70 px-3 py-6 text-center transition-colors hover:border-coral/40 hover:bg-coral/[0.03]"
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.dataTransfer.files?.length) {
              void uploadFiles(e.dataTransfer.files);
            }
          }}
        >
          <p className="text-sm text-ink-muted">
            Σύρε εικόνες εδώ, ή πάτα «Προσθήκη φωτογραφιών»
          </p>
          <p className="mt-1 text-xs text-ink-muted">
            JPEG, PNG, WebP, GIF · έως 8MB η καθεμία
          </p>
        </div>
      </div>

      {items.length > 0 ? (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-5">
          {items.map((item, index) => {
            const src = item.url || item.preview;
            return (
              <li
                key={item.key}
                className={cn(
                  "relative aspect-square overflow-hidden rounded-lg border bg-bg-muted",
                  item.error ? "border-coral/50" : "border-oak/35",
                  index === 0 && item.url && "ring-2 ring-coral/40"
                )}
              >
                {src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={src}
                    alt=""
                    className={cn(
                      "h-full w-full object-contain",
                      item.uploading && "opacity-50"
                    )}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center p-2 text-center text-xs text-coral">
                    {item.error}
                  </div>
                )}

                {item.uploading ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-white/70">
                    <Loader2
                      className="h-6 w-6 animate-spin text-coral"
                      aria-hidden
                    />
                    <span className="text-xs font-medium text-ink">
                      Ανέβασμα…
                    </span>
                  </div>
                ) : null}

                {item.error && !item.uploading ? (
                  <button
                    type="button"
                    onClick={() => dismissError(item.key)}
                    className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-coral shadow-sm"
                    aria-label="Απόρριψη"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : null}

                {item.url && !item.uploading ? (
                  <>
                    {index === 0 ? (
                      <span className="absolute left-1 top-1 rounded bg-coral px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                        Κύρια
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => makePrimary(item.key)}
                        className="absolute left-1 top-1 inline-flex items-center gap-0.5 rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-medium text-ink shadow-sm hover:bg-white"
                        title="Κάν’ την κύρια"
                      >
                        <Star className="h-3 w-3" />
                        Κύρια
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeAt(item.key)}
                      className="absolute bottom-1 right-1 rounded-full bg-white/90 p-1.5 text-ink-muted shadow-sm hover:text-coral"
                      aria-label="Αφαίρεση φωτογραφίας"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-xs text-ink-muted">
          Δεν έχεις ανεβάσει ακόμα φωτογραφίες — το προϊόν μπορεί να σωθεί και
          χωρίς, αλλά καλύτερα να βάλεις τουλάχιστον μία.
        </p>
      )}
    </div>
  );
}
