import type { Metadata } from "next";
import { LegalPage } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Cookies",
  description: "SoYoung cookies policy.",
};

export default function Page() {
  return <LegalPage slug="cookies" />;
}
