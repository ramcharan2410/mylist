"use client";

import { useState, FormEvent, useEffect, useRef, useCallback } from "react";
import toast from "react-hot-toast";
import { Item, Essential } from "@/types";
import { QUANTITY_UNITS } from "@/constants/units";
import { QUANTITY_AMOUNTS } from "@/constants/amounts";

interface AddItemFormProps {
  listId: string;
  onAdded: (item: Item) => void;
  onDuplicate: (existingId: string) => void;
}

export function AddItemForm({ listId, onAdded, onDuplicate }: AddItemFormProps) {
  const [name, setName] = useState("");
  const [unit, setUnit] = useState(QUANTITY_UNITS[0]);
  const [amount, setAmount] = useState("1");
  const [customAmount, setCustomAmount] = useState("");
  const [loading, setLoading] = useState(false);

  // Essentials state
  const [essentials, setEssentials] = useState<Essential[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showExistsTooltip, setShowExistsTooltip] = useState(false);
  const [savingEssential, setSavingEssential] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const tooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isCustom = amount === "Custom";
  const finalAmount = isCustom ? customAmount : amount;

  const trimmedName = name.trim();
  const nameAlreadyEssential = essentials.some(
    (e) => e.name.toLowerCase() === trimmedName.toLowerCase()
  );
  const matchingEssentials = essentials.filter((e) =>
    e.name.toLowerCase().includes(trimmedName.toLowerCase())
  );

  // Fetch essentials on mount
  const fetchEssentials = useCallback(async () => {
    try {
      const res = await fetch("/api/essentials");
      if (res.ok) {
        const data = await res.json();
        setEssentials(data.data ?? []);
      }
    } catch {
      // non-critical — essentials simply won't show
    }
  }, []);

  useEffect(() => {
    fetchEssentials();
  }, [fetchEssentials]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        nameInputRef.current &&
        !nameInputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  // Cleanup tooltip timer on unmount
  useEffect(() => {
    return () => {
      if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
    };
  }, []);

  function handleNameFocus() {
    if (trimmedName && matchingEssentials.length > 0) setShowDropdown(true);
  }

  function handleNameChange(value: string) {
    setName(value);
    const trimmed = value.trim();
    if (trimmed && essentials.some((e) => e.name.toLowerCase().includes(trimmed.toLowerCase()))) {
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  }

  function selectEssential(essentialName: string) {
    setName(essentialName);
    setShowDropdown(false);
    nameInputRef.current?.focus();
  }

  async function handleAddEssential() {
    if (!trimmedName || nameAlreadyEssential) return;
    setSavingEssential(true);
    try {
      const res = await fetch("/api/essentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName }),
      });
      if (res.status === 409) {
        toast.error(`"${trimmedName}" is already in Essentials`);
        return;
      }
      if (!res.ok) {
        toast.error("Failed to add to Essentials");
        return;
      }
      const data = await res.json();
      setEssentials((prev) => [...prev, data.data as Essential].sort((a, b) => a.name.localeCompare(b.name)));
      toast.success(`"${trimmedName}" added to Essentials ✓`);
    } catch {
      toast.error("Network error");
    } finally {
      setSavingEssential(false);
    }
  }

  function handleExistsClick() {
    if (!nameAlreadyEssential) return;
    setShowExistsTooltip(true);
    if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
    tooltipTimerRef.current = setTimeout(() => setShowExistsTooltip(false), 2000);
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
      setShowDropdown(false);
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
        {/* Item name + essentials */}
        <div className="relative flex-1">
          <div className="flex gap-2">
            <input
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              onFocus={handleNameFocus}
              placeholder="Item name (e.g. Milk)"
              required
              autoFocus
              className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />

            {/* Add to Essentials button */}
            <div className="relative group/essential flex-shrink-0">
              <button
                type="button"
                disabled={!trimmedName || nameAlreadyEssential || savingEssential}
                onClick={nameAlreadyEssential ? handleExistsClick : handleAddEssential}
                aria-label={nameAlreadyEssential ? "Already in Essentials" : "Add to Essentials"}
                className={`h-full px-2.5 rounded-xl border text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  nameAlreadyEssential
                    ? "border-amber-200 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-900/20 text-amber-500 dark:text-amber-400 cursor-not-allowed"
                    : !trimmedName
                    ? "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-300 dark:text-gray-600 cursor-not-allowed"
                    : "border-emerald-200 dark:border-emerald-700/50 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 cursor-pointer"
                }`}
              >
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <span className="hidden sm:inline whitespace-nowrap">Essentials</span>
              </button>

              {/* Desktop tooltip — CSS hover */}
              {nameAlreadyEssential && (
                <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 rounded-lg bg-gray-900 dark:bg-gray-700 text-white text-xs whitespace-nowrap shadow-lg opacity-0 group-hover/essential:opacity-100 transition-opacity z-20 [@media(hover:none)]:hidden">
                  The item already exists
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
                </div>
              )}

              {/* Mobile/tablet tooltip — visible after click */}
              {nameAlreadyEssential && showExistsTooltip && (
                <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 rounded-lg bg-gray-900 dark:bg-gray-700 text-white text-xs whitespace-nowrap shadow-lg z-20 [@media(hover:hover)]:hidden">
                  The item already exists
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
                </div>
              )}
            </div>
          </div>

          {/* Essentials dropdown */}
          {showDropdown && matchingEssentials.length > 0 && (
            <div
              ref={dropdownRef}
              className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-30 overflow-hidden"
            >
              <p className="px-3 pt-2 pb-1 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                Essentials
              </p>
              <ul className="max-h-48 overflow-y-auto">
                {matchingEssentials.map((e) => (
                  <li key={e.id}>
                    <button
                      type="button"
                      onMouseDown={(ev) => { ev.preventDefault(); selectEssential(e.name); }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-2 transition-colors"
                    >
                      <svg className="w-3 h-3 shrink-0 text-emerald-500 dark:text-emerald-400" viewBox="0 0 24 24" fill="currentColor">
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

        {/* Amount + Unit */}
        <div className="flex gap-2">
          <select
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-28 px-2 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none cursor-pointer"
          >
            {QUANTITY_AMOUNTS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>

          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value as typeof unit)}
            className="w-24 px-2 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none cursor-pointer"
          >
            {QUANTITY_UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
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

