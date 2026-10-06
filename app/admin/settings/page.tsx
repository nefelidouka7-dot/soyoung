import { requireAdmin } from "@/lib/admin";
import { STORE_NAME, formatPrice } from "@/lib/utils";
import {
  AdminPageHeader,
  AdminPanel,
} from "@/features/admin/components/admin-ui";
import { StoreSettingsForm } from "@/features/admin/components/settings-form";
import { getStoreSettings } from "@/server/repositories/store-settings.repository";

export default async function AdminSettingsPage() {
  await requireAdmin();
  const settings = await getStoreSettings();

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Ρυθμίσεις"
        description="Ό,τι ορίζει τιμές αποστολής, αντικαταβολή και διεύθυνση παραλαβής στο shop."
      />

      <div className="rounded-xl border border-oak/30 bg-bg-muted/50 px-4 py-4 sm:px-5">
        <p className="text-sm font-medium text-ink">Τι αλλάζει εδώ</p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-ink-muted">
          <li>
            Το όριο δωρεάν αποστολής φαίνεται στο μαύρο banner πάνω από το menu.
          </li>
          <li>
            Το κόστος courier και η αντικαταβολή υπολογίζονται στο checkout.
          </li>
          <li>
            Η διεύθυνση παραλαβής εμφανίζεται όταν ο πελάτης διαλέγει pickup.
          </li>
        </ul>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Δωρεάν αποστολή από"
          value={formatPrice(settings.freeShippingThreshold)}
        />
        <SummaryCard
          label="Κόστος courier"
          value={formatPrice(settings.standardShippingFee)}
        />
        <SummaryCard
          label="Αντικαταβολή"
          value={formatPrice(settings.codFee)}
        />
      </div>

      <AdminPanel
        title="Κατάστημα"
        description={`${STORE_NAME} · νόμισμα ${settings.currency}`}
      >
        <StoreSettingsForm settings={settings} key={JSON.stringify(settings)} />
      </AdminPanel>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-ink/[0.08] bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(28,25,23,0.04)]">
      <p className="text-[13px] text-ink-muted">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight text-ink">
        {value}
      </p>
    </div>
  );
}
