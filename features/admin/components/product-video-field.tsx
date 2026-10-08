"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Film, Loader2, Trash2 } from "lucide-react";
import {
  uploadProductVideo,
  uploadProductVideoPoster,
} from "@/features/admin/actions/products";
import { Button } from "@/components/ui/button";
import { MAX_PRODUCT_VIDEO_BYTES } from "@/lib/media-limits";

type Props = {
  initialVideoUrl?: string | null;
  initialPosterUrl?: string | null;
  onUploadingChange?: (uploading: boolean) => void;
};

const MAX_MB = Math.round(MAX_PRODUCT_VIDEO_BYTES / (1024 * 1024));

export function ProductVideoField({
  initialVideoUrl = null,
  initialPosterUrl = null,
  onUploadingChange,
}: Props) {
  const videoInputId = useId();
  const posterInputId = useId();
  const videoRef = useRef<HTMLInputElement>(null);
  const posterRef = useRef<HTMLInputElement>(null);

  const [videoUrl, setVideoUrl] = useState(initialVideoUrl ?? "");
  const [posterUrl, setPosterUrl] = useState(initialPosterUrl ?? "");
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onUploadingChange?.(uploading);
  }, [uploading, onUploadingChange]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  async function onVideoPick(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setError(null);

    if (!file.type.startsWith("video/")) {
      setError("Επίτρεπτα μόνο βίντεο MP4 ή WebM.");
      return;
    }
    if (file.size > MAX_PRODUCT_VIDEO_BYTES) {
      setError(`Το βίντεο είναι πολύ μεγάλο (μέγ. ${MAX_MB}MB).`);
      return;
    }

    if (preview) URL.revokeObjectURL(preview);
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    setUploading(true);

    const fd = new FormData();
    fd.set("file", file);
    const result = await uploadProductVideo(fd);
    setUploading(false);

    if (result.error || !result.url) {
      URL.revokeObjectURL(localPreview);
      setPreview(null);
      setError(result.error ?? "Αποτυχία ανεβάσματος");
      return;
    }

    setVideoUrl(result.url);
  }

  async function onPosterPick(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    const fd = new FormData();
    fd.set("file", file);
    const result = await uploadProductVideoPoster(fd);
    setUploading(false);
    if (result.error || !result.url) {
      setError(result.error ?? "Αποτυχία ανεβάσματος poster");
      return;
    }
    setPosterUrl(result.url);
  }

  function clearVideo() {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setVideoUrl("");
    setPosterUrl("");
    setError(null);
    if (videoRef.current) videoRef.current.value = "";
    if (posterRef.current) posterRef.current.value = "";
  }

  const showUrl = videoUrl || preview;

  return (
    <div className="rounded-lg border border-oak/40 bg-white p-4">
      <input type="hidden" name="videoUrl" value={videoUrl} />
      <input type="hidden" name="videoPosterUrl" value={posterUrl} />

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-ink">Reel / TikTok video</p>
          <p className="mt-1 text-xs leading-relaxed text-ink-muted">
            Κάθετο βίντεο (9:16) για τη σελίδα προϊόντος. MP4 ή WebM, έως{" "}
            {MAX_MB}MB. Κράτα το σύντομο (15–30″) για γρήγορο φόρτωμα.
          </p>
        </div>
        <Film className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" aria-hidden />
      </div>

      {showUrl ? (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="relative mx-auto aspect-[9/16] w-40 overflow-hidden rounded-md bg-ink/5 sm:mx-0">
            <video
              src={showUrl}
              poster={posterUrl || undefined}
              className="h-full w-full object-cover"
              muted
              playsInline
              loop
              preload="metadata"
              controls
            />
            {uploading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                <Loader2 className="h-5 w-5 animate-spin text-ink" />
              </div>
            ) : null}
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <input
              ref={posterRef}
              id={posterInputId}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              disabled={uploading}
              onChange={(e) => {
                void onPosterPick(e.target.files);
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={uploading || !videoUrl}
              onClick={() => posterRef.current?.click()}
            >
              {posterUrl ? "Αλλαγή poster" : "Poster (προαιρετικό)"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={uploading}
              onClick={clearVideo}
              className="text-coral"
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              Αφαίρεση video
            </Button>
            {posterUrl ? (
              <p className="text-[11px] text-ink-muted">Poster ορισμένο</p>
            ) : (
              <p className="text-[11px] text-ink-muted">
                Χωρίς poster χρησιμοποιείται η 1η φωτο του προϊόντος
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-4">
          <input
            ref={videoRef}
            id={videoInputId}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            className="sr-only"
            disabled={uploading}
            onChange={(e) => {
              void onVideoPick(e.target.files);
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="secondary"
            disabled={uploading}
            onClick={() => videoRef.current?.click()}
          >
            {uploading ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden />
                Ανέβασμα…
              </>
            ) : (
              "Ανέβασμα video"
            )}
          </Button>
        </div>
      )}

      {error ? <p className="mt-3 text-sm text-coral">{error}</p> : null}
    </div>
  );
}
