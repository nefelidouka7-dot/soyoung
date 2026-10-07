"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  restrictToVerticalAxis,
  restrictToWindowEdges,
} from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import { createPortal } from "react-dom";
import { FolderPlus, GripVertical, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  deleteCategory,
  reorderCategories,
  toggleCategory,
} from "@/features/admin/actions/categories";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/features/admin/components/admin-ui";
import { cn } from "@/lib/utils";

export type CategoryListItem = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  parentId: string | null;
  sortOrder: number;
  productCount: number;
  childCount: number;
};

type TreeNode = CategoryListItem & { children: TreeNode[] };

function buildTree(items: CategoryListItem[]): TreeNode[] {
  const byParent = new Map<string | null, CategoryListItem[]>();
  for (const item of items) {
    const list = byParent.get(item.parentId) ?? [];
    list.push(item);
    byParent.set(item.parentId, list);
  }
  for (const list of byParent.values()) {
    list.sort(
      (a, b) =>
        a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "el")
    );
  }

  function nest(parentId: string | null): TreeNode[] {
    return (byParent.get(parentId) ?? []).map((item) => ({
      ...item,
      children: nest(item.id),
    }));
  }

  const ids = new Set(items.map((i) => i.id));
  const roots = nest(null);
  for (const orphan of items.filter(
    (i) => i.parentId && !ids.has(i.parentId)
  )) {
    roots.push({ ...orphan, children: nest(orphan.id) });
  }
  return roots;
}

function deleteBlockReason(item: CategoryListItem): string | null {
  const parts: string[] = [];
  if (item.productCount > 0) {
    parts.push(
      `${item.productCount} προϊόντ${item.productCount === 1 ? "ο" : "α"}`
    );
  }
  if (item.childCount > 0) {
    parts.push(
      `${item.childCount} υποκατηγορί${item.childCount === 1 ? "α" : "ες"}`
    );
  }
  if (parts.length === 0) return null;
  return `Διαγραφή μόνο όταν είναι άδεια · έχει ${parts.join(" και ")}`;
}

function CategoryCard({
  item,
  depth,
  parentName,
  editingId,
  pending,
  dragHandleProps,
  isDragging,
  isOverlay,
  onToggle,
  onDelete,
}: {
  item: CategoryListItem;
  depth: number;
  parentName?: string | null;
  editingId?: string;
  pending: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
  isDragging?: boolean;
  isOverlay?: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const isEditing = editingId === item.id;
  const blockReason = deleteBlockReason(item);

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-3.5",
        isOverlay
          ? "border-coral/50 bg-white shadow-lg ring-2 ring-coral/20"
          : isEditing
            ? "border-coral/40 bg-coral/[0.04]"
            : "border-oak/30 bg-white",
        isDragging && !isOverlay && "opacity-30",
        !item.active && !isOverlay && "bg-bg/50"
      )}
    >
      <div className="flex min-w-0 items-start gap-2">
        <button
          type="button"
          className={cn(
            "mt-0.5 inline-flex h-9 w-9 shrink-0 touch-none items-center justify-center rounded-lg border border-oak/30 bg-bg/60 text-ink-muted transition-colors hover:border-oak/50 hover:bg-bg hover:text-ink",
            dragHandleProps
              ? "cursor-grab active:cursor-grabbing"
              : "cursor-default opacity-40"
          )}
          aria-label="Σύρε για αλλαγή σειράς"
          title="Σύρε πάνω/κάτω για αλλαγή σειράς στο μενού"
          {...dragHandleProps}
        >
          <GripVertical className="h-4 w-4" strokeWidth={1.75} />
        </button>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[15px] font-semibold text-ink">{item.name}</p>
            <StatusBadge tone={item.active ? "success" : "neutral"}>
              {item.active ? "Φαίνεται στο shop" : "Κρυφή από το shop"}
            </StatusBadge>
            {isEditing ? (
              <StatusBadge tone="warning">Τώρα επεξεργάζεσαι</StatusBadge>
            ) : null}
          </div>

          <p className="mt-1 text-sm text-ink-muted">
            {depth === 0 ? (
              <span>Κορυφαία κατηγορία στο μενού</span>
            ) : (
              <span>
                Υποκατηγορία
                {parentName ? (
                  <>
                    {" "}
                    της «<span className="text-ink/80">{parentName}</span>»
                  </>
                ) : null}
              </span>
            )}
            <span className="mx-1.5 text-ink/25">·</span>
            <span className="font-mono text-xs">{item.slug}</span>
          </p>

          <p className="mt-0.5 text-xs text-ink-muted">
            {item.productCount === 0 && item.childCount === 0
              ? "Άδεια — μπορείς να τη διαγράψεις"
              : [
                  item.productCount > 0
                    ? `${item.productCount} προϊόντ${item.productCount === 1 ? "ο" : "α"}`
                    : null,
                  item.childCount > 0
                    ? `${item.childCount} υποκατηγορί${item.childCount === 1 ? "α" : "ες"}`
                    : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
          </p>
        </div>
      </div>

      {!isOverlay ? (
        <div className="flex shrink-0 flex-col items-stretch gap-1.5 pl-11 sm:items-end sm:pl-0">
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={pending}
              className="text-ink-muted"
              onClick={onToggle}
              title={
                item.active
                  ? "Να μην φαίνεται στο κατάστημα"
                  : "Να φαίνεται στο κατάστημα"
              }
            >
              {item.active ? "Απόκρυψη" : "Εμφάνιση"}
            </Button>

            <Link href={`/admin/categories?new=${item.id}`}>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="gap-1 text-ink-muted"
                title={`Προσθήκη υποκατηγορίας μέσα στη «${item.name}»`}
              >
                <FolderPlus className="h-3.5 w-3.5" strokeWidth={1.75} />
                + Μέσα σε αυτή
              </Button>
            </Link>

            {isEditing ? (
              <Link href="/admin/categories">
                <Button type="button" size="sm" variant="secondary">
                  Κλείσιμο
                </Button>
              </Link>
            ) : (
              <Link href={`/admin/categories?edit=${item.id}`}>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="gap-1"
                >
                  <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
                  Επεξεργασία
                </Button>
              </Link>
            )}

            {blockReason ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled
                className="gap-1 text-ink-muted/50"
                title={blockReason}
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                Διαγραφή
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={pending}
                className="gap-1 text-coral hover:bg-coral/10 hover:text-coral"
                onClick={onDelete}
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                Διαγραφή
              </Button>
            )}
          </div>

          {blockReason ? (
            <p className="max-w-xs text-right text-[11px] leading-snug text-ink-muted">
              {blockReason}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

type RowActions = {
  onToggle: () => void;
  onDelete: () => void;
};

function SortableCategoryNode({
  node,
  depth,
  parentName,
  editingId,
  pending,
  actionsFor,
}: {
  node: TreeNode;
  depth: number;
  parentName?: string | null;
  editingId?: string;
  pending: boolean;
  actionsFor: (item: CategoryListItem) => RowActions;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: node.id,
    data: { parentId: node.parentId, type: "category" },
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : undefined,
  };

  const actions = actionsFor(node);

  return (
    <li>
      <div ref={setNodeRef} style={style}>
        <CategoryCard
          item={node}
          depth={depth}
          parentName={parentName}
          editingId={editingId}
          pending={pending}
          isDragging={isDragging}
          dragHandleProps={{ ...attributes, ...listeners }}
          {...actions}
        />
      </div>
      {node.children.length > 0 ? (
        <div className="relative mt-2 ml-3 border-l-2 border-oak/35 pl-3 sm:ml-5 sm:pl-4">
          <CategorySortableGroup
            parentId={node.id}
            parentName={node.name}
            nodes={node.children}
            depth={depth + 1}
            editingId={editingId}
            pending={pending}
            actionsFor={actionsFor}
          />
        </div>
      ) : null}
    </li>
  );
}

function CategorySortableGroup({
  parentId,
  parentName,
  nodes,
  depth,
  editingId,
  pending,
  actionsFor,
}: {
  parentId: string | null;
  parentName?: string | null;
  nodes: TreeNode[];
  depth: number;
  editingId?: string;
  pending: boolean;
  actionsFor: (item: CategoryListItem) => RowActions;
}) {
  const ids = useMemo(() => nodes.map((n) => n.id), [nodes]);

  return (
    <SortableContext
      id={parentId ?? "root"}
      items={ids}
      strategy={verticalListSortingStrategy}
    >
      <ul className="space-y-2">
        {nodes.map((node) => (
          <SortableCategoryNode
            key={node.id}
            node={node}
            depth={depth}
            parentName={parentName}
            editingId={editingId}
            pending={pending}
            actionsFor={actionsFor}
          />
        ))}
      </ul>
    </SortableContext>
  );
}

function StaticCategoryNode({
  node,
  depth,
  parentName,
  editingId,
  pending,
  actionsFor,
}: {
  node: TreeNode;
  depth: number;
  parentName?: string | null;
  editingId?: string;
  pending: boolean;
  actionsFor: (item: CategoryListItem) => RowActions;
}) {
  return (
    <li>
      <CategoryCard
        item={node}
        depth={depth}
        parentName={parentName}
        editingId={editingId}
        pending={pending}
        {...actionsFor(node)}
      />
      {node.children.length > 0 ? (
        <div className="relative mt-2 ml-3 border-l-2 border-oak/35 pl-3 sm:ml-5 sm:pl-4">
          <ul className="space-y-2">
            {node.children.map((child) => (
              <StaticCategoryNode
                key={child.id}
                node={child}
                depth={depth + 1}
                parentName={node.name}
                editingId={editingId}
                pending={pending}
                actionsFor={actionsFor}
              />
            ))}
          </ul>
        </div>
      ) : null}
    </li>
  );
}

const sameParentCollision: CollisionDetection = (args) => {
  const collisions = closestCenter(args);
  const activeParent = args.active.data.current?.parentId ?? null;
  const filtered = collisions.filter((collision) => {
    const container = args.droppableContainers.find(
      (c) => c.id === collision.id
    );
    return (container?.data.current?.parentId ?? null) === activeParent;
  });
  return filtered.length > 0 ? filtered : [];
};

export function CategoryList({
  categories: initialCategories,
  editingId,
}: {
  categories: CategoryListItem[];
  editingId?: string;
}) {
  const [items, setItems] = useState(initialCategories);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dndReady, setDndReady] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setItems(initialCategories);
  }, [initialCategories]);

  useEffect(() => {
    setDndReady(true);
  }, []);

  const tree = useMemo(() => buildTree(items), [items]);
  const activeItem = activeId
    ? (items.find((i) => i.id === activeId) ?? null)
    : null;
  const activeParentName = activeItem?.parentId
    ? (items.find((i) => i.id === activeItem.parentId)?.name ?? null)
    : null;
  const activeDepth = activeItem
    ? (() => {
        let d = 0;
        let pid = activeItem.parentId;
        while (pid) {
          d += 1;
          pid = items.find((i) => i.id === pid)?.parentId ?? null;
        }
        return d;
      })()
    : 0;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function run(
    label: string,
    fn: () => Promise<{ error?: string } | void>,
    rollback?: CategoryListItem[]
  ) {
    startTransition(async () => {
      try {
        const result = await fn();
        if (result && "error" in result && result.error) {
          if (rollback) setItems(rollback);
          toast.error(result.error);
          return;
        }
        toast.success(label);
      } catch {
        if (rollback) setItems(rollback);
        toast.error("Κάτι πήγε στραβά. Δοκίμασε ξανά.");
      }
    });
  }

  function actionsFor(item: CategoryListItem): RowActions {
    return {
      onToggle: () =>
        run(
          item.active
            ? "Κρύφτηκε από το κατάστημα"
            : "Εμφανίζεται στο κατάστημα",
          () => toggleCategory(item.id, !item.active)
        ),
      onDelete: () => {
        if (!confirm(`Διαγραφή της κατηγορίας «${item.name}»;`)) return;
        run("Η κατηγορία διαγράφηκε", () => deleteCategory(item.id));
      },
    };
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragCancel() {
    setActiveId(null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const activeParent =
      (active.data.current?.parentId as string | null | undefined) ?? null;
    const overParent =
      (over.data.current?.parentId as string | null | undefined) ?? null;

    if (activeParent !== overParent) {
      toast.message("Η σειρά αλλάζει μόνο στο ίδιο επίπεδο.", {
        description:
          "Για να τη βάλεις σε άλλη γονική: Επεξεργασία → Γονική κατηγορία.",
      });
      return;
    }

    const parentId = activeParent;
    const siblings = items
      .filter((i) => i.parentId === parentId)
      .sort(
        (a, b) =>
          a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "el")
      );

    const oldIndex = siblings.findIndex((s) => s.id === active.id);
    const newIndex = siblings.findIndex((s) => s.id === over.id);
    if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;

    const reordered = arrayMove(siblings, oldIndex, newIndex);
    const orderMap = new Map(reordered.map((s, i) => [s.id, i]));
    const prev = items;
    setItems(
      items.map((i) =>
        orderMap.has(i.id) ? { ...i, sortOrder: orderMap.get(i.id)! } : i
      )
    );

    run(
      "Η σειρά στο μενού αποθηκεύτηκε",
      () =>
        reorderCategories(
          parentId,
          reordered.map((s) => s.id)
        ),
      prev
    );
  }

  if (items.length === 0) {
    return (
      <p className="px-1 py-6 text-center text-sm text-ink-muted">
        Δεν υπάρχουν κατηγορίες ακόμα. Πρόσθεσε την πρώτη από πάνω.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-oak/30 bg-bg/50 px-3.5 py-3 text-[13px] leading-relaxed text-ink-muted">
        <p className="font-medium text-ink">Πώς δουλεύει</p>
        <ol className="mt-1.5 list-decimal space-y-1 pl-4">
          <li>
            <span className="font-medium text-ink">Σύρε</span> το{" "}
            <GripVertical className="relative -top-px inline h-3.5 w-3.5" /> για
            να αλλάξεις τη σειρά στο μενού (μόνο στο ίδιο επίπεδο).
          </li>
          <li>
            <span className="font-medium text-ink">+ Μέσα σε αυτή</span> → νέα
            υποκατηγορία κάτω από αυτήν.
          </li>
          <li>
            <span className="font-medium text-ink">Επεξεργασία</span> → όνομα,
            γονική, SEO.{" "}
            <span className="font-medium text-ink">Διαγραφή</span> μόνο αν δεν
            έχει προϊόντα ούτε υποκατηγορίες.
          </li>
        </ol>
      </div>

      {dndReady ? (
        <DndContext
          id="admin-categories-dnd"
          sensors={sensors}
          modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
          collisionDetection={sameParentCollision}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <CategorySortableGroup
            parentId={null}
            nodes={tree}
            depth={0}
            editingId={editingId}
            pending={pending}
            actionsFor={actionsFor}
          />
          {createPortal(
            <DragOverlay dropAnimation={null} zIndex={80}>
              {activeItem ? (
                <div className="w-[min(36rem,calc(100vw-2rem))] cursor-grabbing">
                  <CategoryCard
                    item={activeItem}
                    depth={activeDepth}
                    parentName={activeParentName}
                    editingId={editingId}
                    pending={false}
                    isOverlay
                    onToggle={() => {}}
                    onDelete={() => {}}
                  />
                </div>
              ) : null}
            </DragOverlay>,
            document.body
          )}
        </DndContext>
      ) : (
        <ul className="space-y-2">
          {tree.map((node) => (
            <StaticCategoryNode
              key={node.id}
              node={node}
              depth={0}
              editingId={editingId}
              pending={pending}
              actionsFor={actionsFor}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
