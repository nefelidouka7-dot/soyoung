"use client";

import { useActionState } from "react";
import {
  saveStoreCommerceSettings,
  type SettingActionState,
} from "@/features/admin/actions/misc";
import type { StoreSettings } from "@/lib/store-settings";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const fieldClass = "mt-1.5 h-10 border-oak/50 bg-white";

export function StoreSettingsForm({ settings }: { settings: StoreSettings }) {
  const [state, action, pending] = useActionState<SettingActionState, FormData>(
    saveStoreCommerceSettings,
    {}
  );

  return (
    <form action={action} className="space-y-8">
      {state.error ? (
        <p className="rounded-lg bg-coral/10 px-3 py-2 text-sm text-coral">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="rounded-lg bg-sage/15 px-3 py-2 text-sm text-sage-dark">
          {state.success}
        </p>
      ) : null}

      <section className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-ink">
            Αποστολή & πληρωμές
          </h3>
          <p className="mt-1 text-sm text-ink-muted">
            Εμφανίζονται στο banner, στο καλάθι και στο checkout. Ισχύουν αμέσως
            μετά την αποθήκευση.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="freeShippingThreshold">
              Δωρεάν αποστολή από (€)
            </Label>
            <Input
              id="freeShippingThreshold"
              name="freeShippingThreshold"
              type="number"
              step="0.01"
              min="0"
              required
              defaultValue={settings.freeShippingThreshold}
              className={fieldClass}
            />
            <p className="mt-1.5 text-xs text-ink-muted">
              π.χ. 50 → δωρεάν courier πάνω από €50
            </p>
          </div>
          <div>
            <Label htmlFor="standardShippingFee">Κόστος courier (€)</Label>
            <Input
              id="standardShippingFee"
              name="standardShippingFee"
              type="number"
              step="0.01"
              min="0"
              required
              defaultValue={settings.standardShippingFee}
              className={fieldClass}
            />
            <p className="mt-1.5 text-xs text-ink-muted">
              Χρεώνεται αν δεν φτάσει το όριο δωρεάν
            </p>
          </div>
          <div>
            <Label htmlFor="codFee">Αντικαταβολή (€)</Label>
            <Input
              id="codFee"
              name="codFee"
              type="number"
              step="0.01"
              min="0"
              required
              defaultValue={settings.codFee}
              className={fieldClass}
            />
            <p className="mt-1.5 text-xs text-ink-muted">
              Επιπλέον χρέωση για πληρωμή στην πόρτα
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4 border-t border-oak/25 pt-6">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-ink">
            Κατάστημα παραλαβής
          </h3>
          <p className="mt-1 text-sm text-ink-muted">
            Διεύθυνση που βλέπει ο πελάτης όταν διαλέγει παραλαβή από το
            κατάστημα.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="pickupName">Όνομα</Label>
            <Input
              id="pickupName"
              name="pickupName"
              required
              defaultValue={settings.pickup.name}
              className={fieldClass}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="pickupLine1">Οδός & αριθμός</Label>
            <Input
              id="pickupLine1"
              name="pickupLine1"
              required
              defaultValue={settings.pickup.line1}
              className={fieldClass}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="pickupLine2">Συμπλήρωμα διεύθυνσης</Label>
            <Input
              id="pickupLine2"
              name="pickupLine2"
              defaultValue={settings.pickup.line2 ?? ""}
              placeholder="Προαιρετικό"
              className={fieldClass}
            />
          </div>
          <div>
            <Label htmlFor="pickupCity">Πόλη</Label>
            <Input
              id="pickupCity"
              name="pickupCity"
              required
              defaultValue={settings.pickup.city}
              className={fieldClass}
            />
          </div>
          <div>
            <Label htmlFor="pickupPostalCode">ΤΚ</Label>
            <Input
              id="pickupPostalCode"
              name="pickupPostalCode"
              required
              defaultValue={settings.pickup.postalCode}
              className={fieldClass}
            />
          </div>
          <div>
            <Label htmlFor="pickupPhone">Τηλέφωνο</Label>
            <Input
              id="pickupPhone"
              name="pickupPhone"
              required
              defaultValue={settings.pickup.phone}
              className={fieldClass}
            />
          </div>
          <div>
            <Label htmlFor="pickupCountry">Χώρα</Label>
            <Input
              id="pickupCountry"
              name="pickupCountry"
              required
              defaultValue={settings.pickup.country}
              className={fieldClass}
            />
          </div>
        </div>
      </section>

      <div className="border-t border-oak/25 pt-4">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Αποθήκευση…" : "Αποθήκευση ρυθμίσεων"}
        </Button>
      </div>
    </form>
  );
}
