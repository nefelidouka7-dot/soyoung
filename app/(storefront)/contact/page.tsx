import type { Metadata } from "next";
import { ContactForm } from "@/features/contact/components/contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with SoYoung customer care.",
};

export default function ContactPage() {
  return (
    <div className="container-page py-14">
      <h1 className="font-serif text-3xl sm:text-4xl">Contact</h1>
      <p className="mt-4 max-w-xl text-sm leading-relaxed text-ink-muted">
        Our customer care team is available Monday–Friday, 9:00–18:00 (EET).
        Email us at care@soyoung.example or use the form below.
      </p>
      <ContactForm />
    </div>
  );
}
