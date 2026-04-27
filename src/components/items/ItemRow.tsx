"use client";

import { forwardRef } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Item } from "@/types";

interface ItemRowProps {
  item: Item;
  isDragDisabled?: boolean;
  onToggle: (item: Item) => void;
  onDelete: (item: Item) => void;
}

export const ItemRow = forwardRef<HTMLDivElement, ItemRowProps>(
  function ItemRow({ item, isDragDisabled = false, onToggle, onDelete }, _ref) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
      useSortable({ id: item.id, disabled: isDragDisabled });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`group flex items-center gap-3 px-3 py-3 rounded-xl border transition-colors ${
          item.isChecked
            ? "bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700/50"
            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
        } ${isDragging ? "shadow-lg z-10" : ""}`}
      >
        {/* Drag handle */}
        {!isDragDisabled && (
          <button
            {...attributes}
            {...listeners}
            className="shrink-0 cursor-grab active:cursor-grabbing text-gray-300 dark:text-gray-600 hover:text-gray-400 dark:hover:text-gray-500 touch-none"
            aria-label="Drag to reorder"
            tabIndex={-1}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="9" cy="6" r="1.5" />
              <circle cx="15" cy="6" r="1.5" />
              <circle cx="9" cy="12" r="1.5" />
              <circle cx="15" cy="12" r="1.5" />
              <circle cx="9" cy="18" r="1.5" />
              <circle cx="15" cy="18" r="1.5" />
            </svg>
          </button>
        )}

        {/* Checkbox */}
        <button
          onClick={() => onToggle(item)}
          className={`shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
            item.isChecked
              ? "bg-emerald-500 border-emerald-500"
              : "border-gray-300 dark:border-gray-600 hover:border-emerald-400"
          }`}
          aria-label={item.isChecked ? "Uncheck item" : "Check item"}
        >
          {item.isChecked && (
            <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="2,6 5,9 10,3" />
            </svg>
          )}
        </button>

        {/* Name */}
        <span
          className={`flex-1 text-sm min-w-0 truncate ${
            item.isChecked
              ? "line-through text-gray-400 dark:text-gray-500"
              : "text-gray-800 dark:text-gray-200"
          }`}
        >
          {item.name}
        </span>

        {/* Quantity badge */}
        <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-medium">
          {item.quantityValue} {item.quantityUnit}
        </span>

        {/* Delete */}
        <button
          onClick={() => onDelete(item)}
          className="shrink-0 p-1 rounded-lg text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 focus:opacity-100"
          aria-label="Delete item"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
          </svg>
        </button>
      </div>
    );
  }
);
