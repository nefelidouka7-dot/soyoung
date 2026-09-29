"use client";

import { useActionState } from "react";
import {
  saveSkinGuide,
  type SkinGuideState,
} from "@/features/admin/actions/skin";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const fieldClass = "mt-1.5 h-10 border-oak/50 bg-white text-sm";

type Item = {
  id: string;
  name: string;
  nameEl: string;
  slug: string;
  story: string | null;
  storyEn: string | null;
  sortOrder: number;
  active: boolean;
};

export function SkinGuideForm({
  kind,
  item,
  fallbackEl,
  fallbackEn,
}: {
  kind: "concern" | "skin";
  item?: Item;
  fallbackEl?: { title: string; body: string };
  fallbackEn?: { title: string; body: string };
}) {
  const action = saveSkinGuide.bind(null, item?.id ?? null);
  const [state, formAction, pending] = useActionState<SkinGuideState, FormData>(
    action,
    {}
  );
  const greekTitle = kind === "concern" ? "στόχο" : "τύπο δέρματος";

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-xl border border-ink/[0.08] bg-white p-4 shadow-[0_1px_2px_rgba(28,25,23,0.04)] sm:p-5"
    >
      <div>
        <h3 className="text-sm font-semibold tracking-tight text-ink">
          {item ? `Αλλαγή: ${item.nameEl || item.name}` : `Νέος ${greekTitle}`}
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-ink-muted">
          Ο τίτλος φαίνεται στο μενού. Το κείμενο φαίνεται στη σελίδα, κάτω από
          τον τίτλο, όταν ο πελάτης το επιλέξει.
        </p>
      </div>
      {state.error ? <p className="text-sm text-coral">{state.error}</p> : null}
      <input type="hidden" name="kind" value={kind} />
      <div className="grid gap-4">
        <div>
          <Label htmlFor="nameEl">Τίτλος στα ελληνικά</Label>
          <Input
            id="nameEl"
            name="nameEl"
            required
            defaultValue={item?.nameEl || fallbackEl?.title || ""}
            className={fieldClass}
          />
        </div>
        <div>
          <Label htmlFor="name">Τίτλος στα αγγλικά</Label>
          <Input
            id="name"
            name="name"
            required
            defaultValue={item?.name || fallbackEn?.title || ""}
            className={fieldClass}
          />
        </div>
        {!item ? (
          <div>
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              name="slug"
              placeholder="π.χ. blemishes — άστο κενό για αυτόματο"
              className={fieldClass}
            />
          </div>
        ) : null}
        <div>
          <Label htmlFor="story">Κείμενο στα ελληνικά</Label>
          <Textarea
            id="story"
            name="story"
            rows={4}
            defaultValue={item?.story || fallbackEl?.body || ""}
            className="mt-1.5 border-oak/50 bg-white"
          />
          <p className="mt-1 text-xs text-ink-muted">
            Γράψε σαν να μιλάς στον πελάτη για αυτή την ανάγκη.
          </p>
        </div>
        <div>
          <Label htmlFor="storyEn">Κείμενο στα αγγλικά</Label>
          <Textarea
            id="storyEn"
            name="storyEn"
            rows={4}
            defaultValue={item?.storyEn || fallbackEn?.body || ""}
            className="mt-1.5 border-oak/50 bg-white"
          />
        </div>
        <div>
          <Label htmlFor="sortOrder">Σειρά στο μενού</Label>
          <Input
            id="sortOrder"
            name="sortOrder"
            type="number"
            defaultValue={item?.sortOrder ?? 0}
            className={fieldClass}
          />
          <p className="mt-1 text-xs text-ink-muted">Μικρότερος αριθμός = πιο ψηλά.</p>
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="hidden" name="active" value="false" />
        <input
          type="checkbox"
          name="active"
          value="true"
          defaultChecked={item?.active ?? true}
          className="accent-sage"
        />
        Φαίνεται στο μενού
      </label>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Αποθήκευση…" : "Αποθήκευση"}
      </Button>
    </form>
  );
}
