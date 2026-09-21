import type { Metadata } from "next";
import { LegalPage } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Returns",
  description: "SoYoung returns policy.",
};

export default function Page() {
  return <LegalPage slug="returns" />;
}
