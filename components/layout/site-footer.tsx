"use client";

import Link from "next/link";
import { brand } from "@/lib/constants";
import { STORE_NAME } from "@/lib/utils";
import { NewsletterForm } from "@/components/layout/newsletter-form";
import { SiteLogo } from "@/components/layout/site-logo";
import { useTranslation } from "@/lib/i18n/use-translation";
import { navLabel } from "@/lib/i18n/nav";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";

export function SiteFooter() {
  const { dict } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-oak/40 bg-bg-muted">
      <div className="container-page py-12 sm:py-14 lg:py-16">
        <div className="grid gap-10 sm:gap-12 lg:grid-cols-6 lg:gap-10">
          <div className="lg:col-span-2">
            <SiteLogo />
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-muted">
              {dict.footer.tagline}
            </p>
            <div className="mt-6 max-w-sm">
              <p className="text-xs uppercase tracking-wider text-ink">
                {dict.footer.newsletter}
              </p>
              <NewsletterForm />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4 lg:col-span-4 lg:gap-8">
            <FooterCol title={dict.footer.shop}>
              {brand.nav
                .filter((n) => n.label !== "Brands")
                .map((n) => (
                  <li key={n.href}>
                    <FooterLink href={n.href}>
                      {navLabel(dict, n.href, n.label)}
                    </FooterLink>
                  </li>
                ))}
            </FooterCol>

            <FooterCol title={dict.footer.discover}>
              <li>
                <FooterLink href="/brands">{dict.footer.brands}</FooterLink>
              </li>
              <li>
                <FooterLink href="/skin-type">
                  {dict.footer.findForMySkin}
                </FooterLink>
              </li>
              <li>
                <FooterLink href="/#best-sellers">
                  {dict.footer.bestSellers}
                </FooterLink>
              </li>
            </FooterCol>

            <FooterCol title={dict.footer.customerCare}>
              <li>
                <FooterLink href="/contact">{dict.footer.contact}</FooterLink>
              </li>
              <li>
                <FooterLink href="/shipping">{dict.footer.shipping}</FooterLink>
              </li>
              <li>
                <FooterLink href="/returns">{dict.footer.returns}</FooterLink>
              </li>
              <li>
                <FooterLink href="/faq">{dict.footer.faq}</FooterLink>
              </li>
            </FooterCol>

            <FooterCol title={dict.footer.account}>
              <li>
                <FooterLink href="/login">{dict.footer.login}</FooterLink>
              </li>
              <li>
                <FooterLink href="/account/orders">{dict.footer.orders}</FooterLink>
              </li>
              <li>
                <FooterLink href="/wishlist">{dict.footer.wishlist}</FooterLink>
              </li>
            </FooterCol>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start gap-5 border-t border-oak/40 pt-8 sm:mt-12 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <nav
            className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-ink-muted"
            aria-label="Legal"
          >
            <FooterLink href="/privacy">{dict.footer.privacy}</FooterLink>
            <FooterLink href="/terms">{dict.footer.terms}</FooterLink>
            <FooterLink href="/cookies">{dict.footer.cookies}</FooterLink>
          </nav>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">
                {dict.locale.label}
              </span>
              <LocaleSwitcher />
            </div>
            <p className="text-xs text-ink-muted">
              © {year} {STORE_NAME}. {dict.footer.rights}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] uppercase tracking-wider text-ink-muted">
          <span>{dict.footer.secureCheckout}</span>
          <span className="hidden text-oak sm:inline" aria-hidden>
            ·
          </span>
          <span>Visa</span>
          <span>Mastercard</span>
          <span>Apple Pay</span>
          <span>Google Pay</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs uppercase tracking-wider text-ink">{title}</p>
      <ul className="mt-3 space-y-2.5 sm:mt-4">{children}</ul>
    </div>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-sm text-ink-muted transition-colors hover:text-ink"
    >
      {children}
    </Link>
  );
}
