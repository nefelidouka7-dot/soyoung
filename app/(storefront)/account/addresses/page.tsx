import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/db/prisma";
import { getServerDictionary } from "@/lib/i18n/server";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";

export default async function AddressesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [dict, addresses] = await Promise.all([
    getServerDictionary(),
    prisma.address.findMany({
      where: { userId: session.user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    }),
  ]);

  return (
    <div>
      <h2 className="font-serif text-2xl text-ink sm:text-[1.75rem]">
        {dict.account.addresses}
      </h2>

      {addresses.length === 0 ? (
        <EmptyState
          className="mt-4 items-start px-0 py-12 text-left"
          title={dict.account.noAddresses}
          description={dict.account.noAddressesHint}
        />
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {addresses.map((a) => (
            <li
              key={a.id}
              className="border border-oak/35 bg-white/50 p-5 text-sm"
            >
              {a.isDefault ? (
                <Badge variant="neutral" className="mb-2">
                  {dict.account.defaultAddress}
                </Badge>
              ) : null}
              <p className="font-medium text-ink">
                {a.firstName} {a.lastName}
              </p>
              <p className="mt-2 leading-relaxed text-ink-muted">
                {a.line1}
                <br />
                {a.line2 ? (
                  <>
                    {a.line2}
                    <br />
                  </>
                ) : null}
                {a.postalCode} {a.city}
                <br />
                {a.country}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
