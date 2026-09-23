import type { Metadata } from "next";

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
      <form className="mt-8 max-w-md space-y-4">
        <input
          name="name"
          placeholder="Name"
          className="flex h-11 w-full border border-oak/60 bg-bg-muted px-3 text-sm"
          required
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          className="flex h-11 w-full border border-oak/60 bg-bg-muted px-3 text-sm"
          required
        />
        <textarea
          name="message"
          placeholder="How can we help?"
          className="min-h-[120px] w-full border border-oak/60 bg-bg-muted px-3 py-2 text-sm"
          required
        />
        <button
          type="submit"
          className="h-11 bg-sage px-6 text-xs uppercase tracking-wide font-bold text-white hover:bg-sage-dark"
        >
          Send message
        </button>
      </form>
    </div>
  );
}
