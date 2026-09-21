import type { Metadata } from "next";

export function makeStaticPage(title: string, body: string) {
  function Page() {
    return (
      <div className="container-page py-14">
        <h1 className="font-serif text-3xl sm:text-4xl">{title}</h1>
        <div className="prose mt-6 max-w-2xl text-sm leading-relaxed text-ink-muted whitespace-pre-line">
          {body}
        </div>
      </div>
    );
  }
  return Page;
}

export function staticMetadata(title: string, description: string): Metadata {
  return { title, description };
}
