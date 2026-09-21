import type { Metadata } from "next";
import { LegalPage } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Shipping",
  description: "SoYoung shipping information.",
};

export default function Page() {
  return <LegalPage slug="shipping" />;
}
