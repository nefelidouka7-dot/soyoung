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
    <div className="border-b border-oak/35 py-5 first:pt-0">
      <h3 className="m-0">
        <button
          type="button"
          id={buttonId}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
          className="flex w-full cursor-pointer items-center justify-between gap-4 text-left"
        >
          <span className="font-serif text-xl text-ink sm:text-[1.35rem]">
            {item.title}
          </span>
          <span
            className={cn(
              "inline-flex h-6 w-6 shrink-0 items-center justify-center text-lg leading-none text-ink-muted transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
              open && "rotate-45"
            )}
            aria-hidden
          >
            +
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
              open ? "opacity-100 delay-75" : "opacity-0"
            )}
          >
            {item.content}
          </div>
        </div>
      </div>
    </div>
  );
}
