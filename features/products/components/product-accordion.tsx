"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";

export type AccordionItem = {
  id: string;
  title: React.ReactNode;
  content: React.ReactNode;
  defaultOpen?: boolean;
};

export function ProductAccordion({ items }: { items: AccordionItem[] }) {
  const [openIds, setOpenIds] = useState<Set<string>>(
    () => new Set(items.filter((item) => item.defaultOpen).map((item) => item.id))
  );

  function toggle(id: string) {
    setOpenIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div>
      {items.map((item) => (
        <AccordionRow
          key={item.id}
          item={item}
          open={openIds.has(item.id)}
          onToggle={() => toggle(item.id)}
        />
      ))}
    </div>
  );
}

function AccordionRow({
  item,
  open,
  onToggle,
}: {
  item: AccordionItem;
  open: boolean;
  onToggle: () => void;
}) {
  const panelId = useId();
  const buttonId = useId();

  return (
    <div className="border-b border-oak/40 first:border-t">
      <h3 className="m-0">
        <button
          type="button"
          id={buttonId}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
          className="group flex w-full cursor-pointer items-center justify-between gap-6 py-6 text-left"
        >
          <span className="font-serif text-[1.4rem] leading-tight tracking-tight text-ink transition-colors duration-300 group-hover:text-coral-dark sm:text-[1.6rem]">
            {item.title}
          </span>
          <span
            className={cn(
              "relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-1 transition-[background-color,box-shadow] duration-300",
              open ? "bg-ink ring-ink" : "ring-oak group-hover:ring-ink/40"
            )}
            aria-hidden
          >
            <span
              className={cn(
                "absolute h-px w-3.5 transition-colors duration-300",
                open ? "bg-bg" : "bg-ink"
              )}
            />
            <span
              className={cn(
                "absolute h-3.5 w-px transition-[rotate,background-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                open ? "rotate-90 bg-bg" : "bg-ink"
              )}
            />
          </span>
        </button>
      </h3>

      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        aria-hidden={!open}
        className={cn(
          "grid transition-[grid-template-rows] duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            className={cn(
              "transition-opacity duration-300 ease-out",
              open ? "pb-7 opacity-100 delay-75" : "opacity-0"
            )}
          >
            {item.content}
          </div>
        </div>
      </div>
    </div>
  );
}
