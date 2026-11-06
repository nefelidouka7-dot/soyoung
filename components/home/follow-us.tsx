import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import {
  INSTAGRAM_HANDLE,
  INSTAGRAM_URL,
  TIKTOK_HANDLE,
  TIKTOK_URL,
} from "@/lib/constants";

type Social = {
  name: string;
  handle: string;
  href: string;
  icon: ReactNode;
};

const SOCIALS: Social[] = [
  {
    name: "Facebook",
    handle: "/soyoung",
    href: "https://www.facebook.com/soyoung",
    icon: (
      <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z" />
    ),
  },
  {
    name: "Instagram",
    handle: INSTAGRAM_HANDLE,
    href: INSTAGRAM_URL,
    icon: (
      <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zM12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63a5.86 5.86 0 0 0-2.13 1.38A5.86 5.86 0 0 0 .63 4.14C.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.3.79.72 1.46 1.38 2.13a5.86 5.86 0 0 0 2.13 1.38c.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.86 5.86 0 0 0 2.13-1.38 5.86 5.86 0 0 0 1.38-2.13c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.86 5.86 0 0 0-1.38-2.13A5.86 5.86 0 0 0 19.86.63C19.1.33 18.22.13 16.95.07 15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.41-11.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88z" />
    ),
  },
  {
    name: "TikTok",
    handle: TIKTOK_HANDLE,
    href: TIKTOK_URL,
    icon: (
      <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    ),
  },
];

type Props = {
  headline: string;
  subhead: string;
  action: string;
};

export function FollowUs({ headline, subhead, action }: Props) {
  return (
    <section className="py-20 lg:py-28">
      <div className="container-page">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="font-serif text-[2rem] leading-tight text-ink sm:text-[2.35rem]">
            {headline}
          </h2>
          <p className="mt-4 text-[15px] leading-[1.7] text-ink-muted">{subhead}</p>
        </div>

        <ul className="mx-auto mt-12 grid max-w-5xl gap-px overflow-hidden border border-oak/30 bg-oak/30 sm:grid-cols-3">
          {SOCIALS.map((social) => (
            <li key={social.name}>
              <a
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex h-full min-h-[11rem] flex-col justify-between bg-bg px-6 py-7 transition-colors duration-500 ease-out hover:bg-bg-muted sm:min-h-[13rem] sm:px-7 sm:py-8"
              >
                <div className="flex items-start justify-between">
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-[18px] w-[18px] text-ink/70 transition-colors duration-500 ease-out group-hover:text-coral"
                    aria-hidden
                  >
                    {social.icon}
                  </svg>
                  <span className="text-[12px] text-ink-muted">{social.handle}</span>
                </div>
                <div>
                  <span className="block font-serif text-[1.65rem] leading-none text-ink sm:text-[1.85rem]">
                    {social.name}
                  </span>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-ink-muted transition-colors duration-500 ease-out group-hover:text-ink">
                    {action}
                    <ArrowRight
                      className="h-3 w-3 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                  </span>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
