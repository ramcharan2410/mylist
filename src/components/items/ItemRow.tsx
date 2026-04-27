"use client";

import { forwardRef, useState, useRef, useEffect } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Item } from "@/types";

interface ItemRowProps {
  item: Item;
  isDragDisabled?: boolean;
  isEssential: boolean;
  onToggle: (item: Item) => void;
  onDelete: (item: Item) => void;
  onMarkEssential: (name: string) => void;
  onUnmarkEssential: (name: string) => void;
  onNotesUpdate: (id: string, notes: string) => void;
  onNameUpdate: (id: string, name: string) => void;
}

export const ItemRow = forwardRef<HTMLDivElement, ItemRowProps>(
  function ItemRow(
    {
      item,
      isDragDisabled = false,
      isEssential,
      onToggle,
      onDelete,
      onMarkEssential,
      onUnmarkEssential,
      onNotesUpdate,
      onNameUpdate,
    },
    _ref
  ) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
      useSortable({ id: item.id, disabled: isDragDisabled });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    // Inline name editing
    const [editingName, setEditingName] = useState(false);
    const [nameVal, setNameVal] = useState(item.name);
    const nameInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { setNameVal(item.name); }, [item.name]);

    function startEditName() {
      setNameVal(item.name);
      setEditingName(true);
      setTimeout(() => nameInputRef.current?.select(), 0);
    }

    function commitName() {
      setEditingName(false);
      const trimmed = nameVal.trim();
      if (trimmed && trimmed !== item.name) onNameUpdate(item.id, trimmed);
      else setNameVal(item.name);
    }

    function onNameKey(e: React.KeyboardEvent<HTMLInputElement>) {
      if (e.key === "Enter") { e.preventDefault(); commitName(); }
      if (e.key === "Escape") { setEditingName(false); setNameVal(item.name); }
    }

    // Notes editing
    const [editingNotes, setEditingNotes] = useState(false);
    const [notesVal, setNotesVal] = useState(item.notes ?? "");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => { setNotesVal(item.notes ?? ""); }, [item.notes]);

    function startNotes() {
      setNotesVal(item.notes ?? "");
      setEditingNotes(true);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          autoGrow(textareaRef.current);
        }
      }, 0);
    }

    function commitNotes() {
      setEditingNotes(false);
      const trimmed = notesVal.trim();
      if (trimmed !== (item.notes ?? "").trim()) onNotesUpdate(item.id, trimmed);
    }

    function onNotesKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
      if (e.key === "Escape") { setEditingNotes(false); setNotesVal(item.notes ?? ""); }
    }

    function autoGrow(el: HTMLTextAreaElement) {
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    }

    const hasNotes = (item.notes ?? "").trim().length > 0;

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`group flex flex-col rounded-xl border transition-colors ${
          item.isChecked
            ? "bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700/50"
            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
        } ${isDragging ? "shadow-lg z-10" : ""}`}
      >
        {/* ── Main row ─────────────────────────────────── */}
        <div className="flex items-center gap-2 px-3 py-3">
          {/* Drag handle */}
          {!isDragDisabled && (
            <button
              {...attributes}
              {...listeners}
              className="shrink-0 cursor-grab active:cursor-grabbing text-gray-300 dark:text-gray-600 hover:text-gray-400 dark:hover:text-gray-500 touch-none p-0.5"
              aria-label="Drag to reorder"
              tabIndex={-1}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" />
                <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
                <circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" />
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

          {/* Name — click to edit inline */}
          <div className="flex-1 min-w-0">
            {editingName ? (
              <input
                ref={nameInputRef}
                value={nameVal}
                onChange={(e) => setNameVal(e.target.value)}
                onBlur={commitName}
                onKeyDown={onNameKey}
                className="w-full text-sm bg-transparent border-b border-emerald-400 focus:outline-none text-gray-900 dark:text-white py-0.5"
              />
            ) : (
              <button
                type="button"
                onClick={startEditName}
                className={`text-left w-full text-sm truncate transition-colors ${
                  item.isChecked
                    ? "line-through text-gray-400 dark:text-gray-500"
                    : "text-gray-800 dark:text-gray-200 hover:text-emerald-700 dark:hover:text-emerald-300"
                }`}
                title="Click to rename"
              >
                {item.name}
              </button>
            )}
          </div>

          {/* Quantity badge */}
          <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">
            {item.quantityValue} {item.quantityUnit}
          </span>

          {/* Notes icon — only when notes exist OR as a show-on-touch / hover icon */}
          <button
            type="button"
            onClick={startNotes}
            aria-label={hasNotes ? "Edit notes" : "Add notes"}
            className={`shrink-0 p-1 rounded-lg transition-colors ${
              hasNotes
                ? "text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                : "text-gray-300 dark:text-gray-600 hover:text-blue-400 dark:hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 focus:opacity-100"
            }`}
            title={hasNotes ? "Edit notes" : "Add notes"}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>

          {/* Essential toggle — always visible */}
          <button
            type="button"
            onClick={() =>
              isEssential ? onUnmarkEssential(item.name) : onMarkEssential(item.name)
            }
            aria-label={isEssential ? "Unmark as Essential" : "Mark as Essential"}
            title={isEssential ? "Unmark Essential" : "Mark Essential"}
            className={`shrink-0 p-1 rounded-lg transition-colors ${
              isEssential
                ? "text-amber-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                : "text-gray-300 dark:text-gray-600 hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20"
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill={isEssential ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </button>

          {/* Delete — always visible on touch, hover-only on desktop */}
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

        {/* ── Notes row ────────────────────────────────── */}
        {(hasNotes || editingNotes) && (
          <div className="px-4 pb-3 -mt-1 pl-[2.6rem]">
            {editingNotes ? (
              <textarea
                ref={textareaRef}
                value={notesVal}
                onChange={(e) => { setNotesVal(e.target.value); autoGrow(e.target); }}
                onBlur={commitNotes}
                onKeyDown={onNotesKey}
                placeholder="Add notes…"
                rows={2}
                className="w-full resize-none text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-600"
              />
            ) : (
              <button
                type="button"
                onClick={startNotes}
                className="text-left w-full text-xs text-gray-500 dark:text-gray-400 italic leading-relaxed line-clamp-2 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
              >
                {item.notes}
              </button>
            )}
          </div>
        )}
      </div>
    );
  }
);
