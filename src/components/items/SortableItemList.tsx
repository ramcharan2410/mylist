"use client";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { Item, Essential } from "@/types";
import { ItemRow } from "./ItemRow";

interface SortableItemListProps {
  items: Item[];
  essentials: Essential[];
  isDragDisabled?: boolean;
  onReorder: (items: Item[]) => void;
  onToggle: (item: Item) => void;
  onDelete: (item: Item) => void;
  onMarkEssential: (name: string) => void;
  onUnmarkEssential: (name: string) => void;
  onNotesUpdate: (id: string, notes: string) => void;
  onNameUpdate: (id: string, name: string) => void;
  /** Called when user clicks a quick-add chip in the empty state */
  onQuickAdd?: (name: string) => void;
}

export function SortableItemList({
  items,
  essentials,
  isDragDisabled = false,
  onReorder,
  onToggle,
  onDelete,
  onMarkEssential,
  onUnmarkEssential,
  onNotesUpdate,
  onNameUpdate,
  onQuickAdd,
}: SortableItemListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const essentialNames = new Set(essentials.map((e) => e.name.toLowerCase()));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex).map((item, idx) => ({
      ...item,
      position: idx,
    }));
    onReorder(reordered);
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center py-10 gap-4 text-center">
        <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <svg className="w-6 h-6 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
            <rect x="9" y="3" width="6" height="4" rx="1" />
            <line x1="9" y1="12" x2="15" y2="12" />
            <line x1="9" y1="16" x2="13" y2="16" />
          </svg>
        </div>
        <p className="text-sm text-gray-400 dark:text-gray-500">No items yet — add one above</p>

        {/* Quick-add chips from Essentials */}
        {essentials.length > 0 && onQuickAdd && (
          <div className="w-full max-w-sm">
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-2 flex items-center justify-center gap-1.5">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              Quick-add from your Essentials
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {essentials.slice(0, 12).map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => onQuickAdd(e.name)}
                  className="px-3 py-1.5 rounded-full border border-amber-200 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-xs font-medium hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                >
                  + {e.name}
                </button>
              ))}
              {essentials.length > 12 && (
                <span className="text-xs text-gray-400 dark:text-gray-500 self-center">
                  +{essentials.length - 12} more in Browse
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              isDragDisabled={isDragDisabled}
              isEssential={essentialNames.has(item.name.toLowerCase())}
              onToggle={onToggle}
              onDelete={onDelete}
              onMarkEssential={onMarkEssential}
              onUnmarkEssential={onUnmarkEssential}
              onNotesUpdate={onNotesUpdate}
              onNameUpdate={onNameUpdate}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
