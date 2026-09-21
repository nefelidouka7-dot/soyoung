import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/db/prisma";
import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";

export default async function AddressesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const addresses = await prisma.address.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="container-page py-10 lg:py-14">
      <Link href="/account" className="text-xs uppercase tracking-wider text-ink-muted hover:underline">
        ← Account
      </Link>
      <h1 className="mt-4 font-serif text-3xl">Addresses</h1>
      {addresses.length === 0 ? (
        <EmptyState
          title="No addresses saved"
          description="Add an address at checkout, or manage them here soon."
        />
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {addresses.map((a) => (
            <li key={a.id} className="border border-oak/40 bg-bg-muted p-5 text-sm">
              {a.isDefault ? (
                <span className="text-[10px] uppercase tracking-wider text-sage-dark">Default</span>
              ) : null}
              <p className="mt-1 font-medium">
                {a.firstName} {a.lastName}
              </p>
              <p className="mt-1 text-ink-muted">
                {a.line1}<br />
                {a.line2 ? <>{a.line2}<br /></> : null}
                {a.postalCode} {a.city}<br />
                {a.country}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
