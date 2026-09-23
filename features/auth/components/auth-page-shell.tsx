"use client";

export function AuthPageShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="home-wash">
      <div className="container-page flex justify-center py-16 sm:py-24">
        <div className="animate-soft-enter w-full max-w-sm">
          <h1 className="font-serif text-3xl tracking-tight text-ink sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            {description}
          </p>
          <div className="mt-10">{children}</div>
        </div>
      </div>
    </div>
  );
}

export const authFieldClass = "mt-1.5 h-12 border-oak/50 bg-white/80";
