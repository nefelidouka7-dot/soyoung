import type { Metadata } from "next";
import { LegalPage } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Terms",
  description: "SoYoung terms of use.",
};

export default function Page() {
  return <LegalPage slug="terms" />;
}
