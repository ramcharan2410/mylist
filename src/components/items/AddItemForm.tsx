"use client";

import { useState, FormEvent, useEffect, useRef, useCallback } from "react";
import toast from "react-hot-toast";
import { Item, Essential } from "@/types";
import { QUANTITY_UNITS } from "@/constants/units";
import { QUANTITY_AMOUNTS } from "@/constants/amounts";

interface AddItemFormProps {
  listId: string;
  essentials: Essential[];
  onAdded: (item: Item) => void;
  onDuplicate: (existingId: string) => void;
}

export function AddItemForm({ listId, essentials, onAdded, onDuplicate }: AddItemFormProps) {
  const [name, setName] = useState("");
  const [unit, setUnit] = useState(QUANTITY_UNITS[0]);
  const [amount, setAmount] = useState("1");
  const [customAmount, setCustomAmount] = useState("");
  const [loading, setLoading] = useState(false);

  // Essentials browse panel
  const [browseOpen, setBrowseOpen] = useState(false);
  const [browseSearch, setBrowseSearch] = useState("");

  // Autocomplete while typing
  const [showAutoComplete, setShowAutoComplete] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const browseRef = useRef<HTMLDivElement>(null);
  const browseSearchRef = useRef<HTMLInputElement>(null);

  const isCustom = amount === "Custom";
  const finalAmount = isCustom ? customAmount : amount;
  const trimmedName = name.trim();

  // Autocomplete matches (while typing — only show if not browsing)
  const autoMatches = !browseOpen && trimmedName
    ? essentials.filter((e) => e.name.toLowerCase().includes(trimmedName.toLowerCase()))
    : [];

  // Browse panel filtered list
  const browseMatches = browseSearch.trim()
    ? essentials.filter((e) => e.name.toLowerCase().includes(browseSearch.trim().toLowerCase()))
    : essentials;

  // Close browse on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (browseRef.current && !browseRef.current.contains(e.target as Node)) {
        setBrowseOpen(false);
      }
    }
    if (browseOpen) {
      document.addEventListener("mousedown", handleOutside);
      // Auto-focus search
      setTimeout(() => browseSearchRef.current?.focus(), 50);
    }
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [browseOpen]);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setBrowseOpen(false);
        setShowAutoComplete(false);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function handleNameChange(value: string) {
    setName(value);
    const trimmed = value.trim();
    setShowAutoComplete(
      !!trimmed &&
      essentials.some((e) => e.name.toLowerCase().includes(trimmed.toLowerCase()))
    );
  }

  function selectName(selectedName: string) {
    setName(selectedName);
    setShowAutoComplete(false);
    setBrowseOpen(false);
    setBrowseSearch("");
    nameInputRef.current?.focus();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!trimmedName) return;
    if (isCustom && !customAmount.trim()) {
      toast.error("Please enter a custom quantity");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/lists/${listId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName, quantityValue: finalAmount, quantityUnit: unit }),
      });

      const data = await res.json();

      if (res.status === 409) {
        toast.error(`"${trimmedName}" already exists — scrolling to it`);
        onDuplicate(data.existingId);
        return;
      }

      if (!res.ok) {
        toast.error(data.error ?? "Failed to add item");
        return;
      }

      onAdded(data.data as Item);
      setName("");
      setAmount("1");
      setCustomAmount("");
      setShowAutoComplete(false);
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 flex flex-col gap-3"
    >
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        Add item
      </p>

      <div className="flex flex-col sm:flex-row gap-2">
        {/* Item name + Browse Essentials */}
        <div className="relative flex-1" ref={browseRef}>
          <div className="flex gap-2">
            {/* Name input */}
            <div className="relative flex-1">
              <input
                ref={nameInputRef}
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                onFocus={() => {
                  if (trimmedName && autoMatches.length > 0) setShowAutoComplete(true);
                }}
                onBlur={() => setTimeout(() => setShowAutoComplete(false), 150)}
                placeholder="Item name (e.g. Milk)"
                required
                autoFocus
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />

              {/* Autocomplete while typing */}
              {showAutoComplete && autoMatches.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-40 overflow-hidden">
                  <p className="px-3 pt-2 pb-1 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                    Your Essentials
                  </p>
                  <ul className="max-h-40 overflow-y-auto pb-1">
                    {autoMatches.map((e) => (
                      <li key={e.id}>
                        <button
                          type="button"
                          onMouseDown={() => selectName(e.name)}
                          className="w-full text-left px-3 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-2 transition-colors"
                        >
                          <svg className="w-3 h-3 shrink-0 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                          {e.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Browse Essentials button */}
            {essentials.length > 0 && (
              <button
                type="button"
                onClick={() => { setBrowseOpen((o) => !o); setBrowseSearch(""); }}
                aria-label="Browse your Essentials"
                aria-expanded={browseOpen}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-colors ${
                  browseOpen
                    ? "border-amber-400 dark:border-amber-500 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:border-amber-300 dark:hover:border-amber-600 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                }`}
              >
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <span className="hidden sm:inline whitespace-nowrap">Browse</span>
                <span className="text-[10px] bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-300 rounded-full px-1.5 py-0.5 font-bold">
                  {essentials.length}
                </span>
              </button>
            )}
          </div>

          {/* Browse Essentials dropdown panel */}
          {browseOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-40 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-3 pt-3 pb-2 border-b border-gray-100 dark:border-gray-700">
                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  Consider from your Essentials
                </p>
                <button
                  type="button"
                  onClick={() => setBrowseOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              {/* Search */}
              <div className="px-3 py-2">
                <input
                  ref={browseSearchRef}
                  type="text"
                  value={browseSearch}
                  onChange={(e) => setBrowseSearch(e.target.value)}
                  placeholder="Search essentials…"
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                />
              </div>
              {/* Results */}
              <ul className="max-h-52 overflow-y-auto pb-2">
                {browseMatches.length === 0 ? (
                  <li className="px-3 py-3 text-sm text-gray-400 dark:text-gray-500 text-center">
                    No essentials match
                  </li>
                ) : (
                  browseMatches.map((e) => (
                    <li key={e.id}>
                      <button
                        type="button"
                        onMouseDown={() => selectName(e.name)}
                        className="w-full text-left px-3 py-2.5 text-sm text-gray-800 dark:text-gray-200 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-700 dark:hover:text-amber-300 flex items-center gap-2.5 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5 shrink-0 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                        <span>{e.name}</span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Amount + Unit */}
        <div className="flex gap-2">
          <select
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-28 px-2 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none cursor-pointer"
          >
            {QUANTITY_AMOUNTS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>

          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value as typeof unit)}
            className="w-24 px-2 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none cursor-pointer"
          >
            {QUANTITY_UNITS.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Custom amount input */}
      {isCustom && (
        <input
          type="number"
          min="0.01"
          step="0.01"
          value={customAmount}
          onChange={(e) => setCustomAmount(e.target.value)}
          placeholder="Enter custom quantity (e.g. 2.3)"
          required
          className="px-3 py-2 rounded-xl border border-emerald-400 dark:border-emerald-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      )}

      <button
        type="submit"
        disabled={loading}
        className="self-end flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors disabled:opacity-60"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        {loading ? "Adding…" : "Add item"}
      </button>
    </form>
  );
}

