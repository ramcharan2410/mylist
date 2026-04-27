"use client";

import { useState, FormEvent } from "react";
import toast from "react-hot-toast";
import { Item } from "@/types";
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

  const isCustom = amount === "Custom";
  const finalAmount = isCustom ? customAmount : amount;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    if (isCustom && !customAmount.trim()) {
      toast.error("Please enter a custom quantity");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/lists/${listId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), quantityValue: finalAmount, quantityUnit: unit }),
      });

      const data = await res.json();

      if (res.status === 409) {
        toast.error(`"${name.trim()}" already exists — scrolling to it`);
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
        {/* Item name */}
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Item name (e.g. Milk)"
          required
          className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        />

        {/* Amount */}
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

          {/* Unit */}
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
