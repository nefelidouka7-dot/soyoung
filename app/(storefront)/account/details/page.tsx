import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/db/prisma";
import { updateAccountDetails } from "@/features/auth/account-actions";

export default async function AccountDetailsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/login");

  return (
    <div className="container-page py-10 lg:py-14">
      <Link href="/account" className="text-xs uppercase tracking-wider text-ink-muted hover:underline">
        ← Account
      </Link>
      <h1 className="mt-4 font-serif text-3xl">Account details</h1>
      <form action={updateAccountDetails} className="mt-8 max-w-md space-y-4">
        <div>
          <label className="text-sm font-medium" htmlFor="firstName">First name</label>
          <input name="firstName" id="firstName" defaultValue={user.firstName ?? ""} className="mt-1.5 flex h-11 w-full border border-oak/60 bg-bg-muted px-3 text-sm" />
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="lastName">Last name</label>
          <input name="lastName" id="lastName" defaultValue={user.lastName ?? ""} className="mt-1.5 flex h-11 w-full border border-oak/60 bg-bg-muted px-3 text-sm" />
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="phone">Phone</label>
          <input name="phone" id="phone" defaultValue={user.phone ?? ""} className="mt-1.5 flex h-11 w-full border border-oak/60 bg-bg-muted px-3 text-sm" />
        </div>
        <p className="text-sm text-ink-muted">Email: {user.email}</p>
        <button type="submit" className="h-11 bg-sage px-6 text-xs uppercase tracking-wide text-bg hover:bg-sage-dark">
          Save changes
        </button>
      </form>
    </div>
  );
}
