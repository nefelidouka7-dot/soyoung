import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/db/prisma";
import { updateAccountDetails } from "@/features/auth/account-actions";
import { getServerDictionary } from "@/lib/i18n/server";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default async function AccountDetailsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [{ saved }, dict, user] = await Promise.all([
    searchParams,
    getServerDictionary(),
    prisma.user.findUnique({ where: { id: session.user.id } }),
  ]);

  if (!user) redirect("/login");

  return (
    <div>
      <h2 className="font-serif text-2xl text-ink sm:text-[1.75rem]">
        {dict.account.details}
      </h2>
      <p className="mt-2 text-sm text-ink-muted">{dict.account.detailsHint}</p>

      {saved ? (
        <p className="mt-5 text-sm text-sage-dark">{dict.account.saved}</p>
      ) : null}

      <form action={updateAccountDetails} className="mt-8 max-w-md space-y-5">
        <div>
          <Label htmlFor="firstName">{dict.auth.firstName}</Label>
          <Input
            name="firstName"
            id="firstName"
            defaultValue={user.firstName ?? ""}
            className="mt-1.5 bg-white/60"
            autoComplete="given-name"
          />
        </div>
        <div>
          <Label htmlFor="lastName">{dict.auth.lastName}</Label>
          <Input
            name="lastName"
            id="lastName"
            defaultValue={user.lastName ?? ""}
            className="mt-1.5 bg-white/60"
            autoComplete="family-name"
          />
        </div>
        <div>
          <Label htmlFor="phone">{dict.account.phone}</Label>
          <Input
            name="phone"
            id="phone"
            type="tel"
            defaultValue={user.phone ?? ""}
            className="mt-1.5 bg-white/60"
            autoComplete="tel"
          />
        </div>
        <div>
          <Label htmlFor="email">{dict.auth.email}</Label>
          <Input
            id="email"
            value={user.email}
            disabled
            className="mt-1.5"
            readOnly
          />
          <p className="mt-1.5 text-xs text-ink-muted">
            {dict.account.emailReadonly}
          </p>
        </div>
        <Button type="submit">{dict.account.saveChanges}</Button>
      </form>
    </div>
  );
}
