import type { Metadata } from "next";

export const metadata: Metadata = { title: "FAQ" };

export default function FaqPage() {
  const faqs = [
    {
      q: "How do I choose products for my skin type?",
      a: "Visit Find for my skin to select your skin type and browse suitable products.",
    },
    {
      q: "When will I receive my order?",
      a: "Most orders ship within 1–2 business days. Delivery typically takes 2–5 business days.",
    },
    {
      q: "Do you ship internationally?",
      a: "We currently ship across the EU. Duties may apply outside Greece depending on destination.",
    },
  ];
  return (
    <div className="container-page py-14">
      <h1 className="font-serif text-3xl">FAQ</h1>
      <dl className="mt-8 max-w-2xl space-y-6">
        {faqs.map((f) => (
          <div key={f.q}>
            <dt className="font-medium text-ink">{f.q}</dt>
            <dd className="mt-2 text-sm text-ink-muted">{f.a}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
