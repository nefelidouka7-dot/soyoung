import { prisma } from "@/db/prisma";
import { requireAdmin } from "@/lib/admin";
import { FREE_SHIPPING_THRESHOLD, STORE_NAME } from "@/lib/utils";
import { AdminPageHeader, AdminPanel } from "@/features/admin/components/admin-ui";
import { SettingsForm } from "@/features/admin/components/settings-form";
import { formatPrice } from "@/lib/utils";

export default async function AdminSettingsPage() {
  await requireAdmin();

  const settings = await prisma.siteSetting.findMany({
    orderBy: { key: "asc" },
  });

  return (
    <div>
      <AdminPageHeader
        title="Settings"
        description="Store configuration."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <AdminPanel title="Store">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">Store name</dt>
              <dd className="font-medium">{STORE_NAME}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">Free shipping threshold</dt>
              <dd className="font-medium">
                {formatPrice(FREE_SHIPPING_THRESHOLD)}
              </dd>
            </div>
            <p className="pt-2 text-xs text-ink-muted">
              Store name and free shipping threshold are read from environment
              variables (<code className="text-ink">NEXT_PUBLIC_STORE_NAME</code>
              , <code className="text-ink">FREE_SHIPPING_THRESHOLD</code>).
            </p>
          </dl>
        </AdminPanel>

        <AdminPanel title="Saved site settings">
          {settings.length === 0 ? (
            <p className="text-sm text-ink-muted">No custom settings yet.</p>
          ) : (
            <ul className="divide-y divide-oak/20 text-sm">
              {settings.map((s) => (
                <li key={s.id} className="py-2 first:pt-0 last:pb-0">
                  <p className="font-medium">{s.key}</p>
                  <pre className="mt-0.5 overflow-x-auto text-xs text-ink-muted">
                    {JSON.stringify(s.value)}
                  </pre>
                </li>
              ))}
            </ul>
          )}
        </AdminPanel>
      </div>

      <SettingsForm />
    </div>
  );
}
