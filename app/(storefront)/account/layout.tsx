import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { interpolate } from "@/lib/i18n";
import { getServerDictionary } from "@/lib/i18n/server";
import {
  AccountNav,
  AccountSignOutMobile,
} from "@/features/account/components/account-nav";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/account");

  const dict = await getServerDictionary();
  const firstName = session.user.name?.trim().split(/\s+/)[0] ?? null;
  const greeting = firstName
    ? interpolate(dict.account.welcomeNamed, { name: firstName })
    : dict.account.welcome;

  return (
    <div className="pb-16 lg:pb-24">
      <div className="border-b border-oak/30 bg-bg-muted/50">
        <div className="container-page py-8 lg:py-10">
          <p className="text-[11px] uppercase tracking-[0.16em] text-ink-muted">
            {dict.account.title}
          </p>
          <h1 className="mt-2 font-serif text-[1.85rem] leading-tight text-ink sm:text-[2.25rem]">
            {greeting}
          </h1>
          {session.user.email ? (
            <p className="mt-2 text-sm text-ink-muted">{session.user.email}</p>
          ) : null}
        </div>
      </div>

      <div className="container-page mt-8 grid gap-8 lg:mt-12 lg:grid-cols-[13.5rem_minmax(0,1fr)] lg:gap-14">
        <aside>
          <AccountNav />
        </aside>
        <div className="min-w-0">
          {children}
          <AccountSignOutMobile />
        </div>
      </div>
    </div>
  );
}
