import type { Metadata } from "next";
import { LegalPage } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Privacy",
  description: "SoYoung privacy policy (GDPR).",
};

export default function Page() {
  return <LegalPage slug="privacy" />;
}
