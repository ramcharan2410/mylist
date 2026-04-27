"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import { Header } from "@/components/common/Header";
import { AddItemForm } from "@/components/items/AddItemForm";
import { SortableItemList } from "@/components/items/SortableItemList";
import { FilterTabs, FilterTab } from "@/components/common/FilterTabs";
import { SearchBar } from "@/components/common/SearchBar";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { ProgressBar } from "@/components/common/ProgressBar";
import { Item, ListWithItems, Essential } from "@/types";

export default function ListDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [list, setList] = useState<ListWithItems | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [essentials, setEssentials] = useState<Essential[]>([]);

  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");

  // Delete item
  const [deleteTarget, setDeleteTarget] = useState<Item | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Clear checked confirm
  const [clearCheckedOpen, setClearCheckedOpen] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);

  // Refs for duplicate-scroll highlight
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const fetchList = useCallback(async () => {
    try {
      const res = await fetch(`/api/lists/${id}`);
      const data = await res.json();
      if (data.data) {
        setList(data.data as ListWithItems);
        setItems((data.data as ListWithItems).items);
      }
    } catch {
      toast.error("Failed to load list");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchEssentials = useCallback(async () => {
    try {
      const res = await fetch("/api/essentials");
      if (res.ok) {
        const data = await res.json();
        setEssentials(data.data ?? []);
      }
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    fetchList();
    fetchEssentials();
  }, [fetchList, fetchEssentials]);

  // Update browser tab title to list name
  useEffect(() => {
    if (list?.name) document.title = `${list.name} — My List`;
    return () => { document.title = "My List"; };
  }, [list?.name]);

  // Debounced search state
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 200);
    return () => clearTimeout(t);
  }, [search]);

  // Filtered items
  const filteredItems = items.filter((item) => {
    const matchesTab =
      filterTab === "all" ||
      (filterTab === "active" && !item.isChecked) ||
      (filterTab === "checked" && item.isChecked);
    const matchesSearch =
      !debouncedSearch ||
      item.name.toLowerCase().includes(debouncedSearch.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const isDragDisabled = filterTab !== "all" || !!debouncedSearch;

  // Counts for filter tabs
  const counts = {
    all: items.length,
    active: items.filter((i) => !i.isChecked).length,
    checked: items.filter((i) => i.isChecked).length,
  };

  const checkedCount = items.filter((i) => i.isChecked).length;
  const allChecked = items.length > 0 && checkedCount === items.length;

  function scrollToItem(itemId: string) {
    const el = itemRefs.current[itemId];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("flash-highlight");
      setTimeout(() => el.classList.remove("flash-highlight"), 2000);
    }
  }

  function handleAdded(item: Item) {
    setItems((prev) => [...prev, item]);
    toast.success(`"${item.name}" added!`);
  }

  function handleDuplicateItem(existingId: string) {
    setFilterTab("all");
    setSearch("");
    setTimeout(() => scrollToItem(existingId), 100);
  }

  async function handleToggle(item: Item) {
    const next = !item.isChecked;
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, isChecked: next } : i)));
    try {
      await fetch(`/api/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isChecked: next }),
      });
    } catch {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, isChecked: item.isChecked } : i)));
      toast.error("Failed to update item");
    }
  }

  async function handleCheckAll() {
    const next = !allChecked;
    const toUpdate = items.filter((i) => i.isChecked !== next);
    setItems((prev) => prev.map((i) => ({ ...i, isChecked: next })));
    try {
      await Promise.all(
        toUpdate.map((i) =>
          fetch(`/api/items/${i.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isChecked: next }),
          })
        )
      );
    } catch {
      toast.error("Failed to update items");
      fetchList();
    }
  }

  async function handleReorder(reordered: Item[]) {
    setItems(reordered);
    try {
      await fetch("/api/items/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: reordered.map((i) => ({ id: i.id, position: i.position })),
        }),
      });
    } catch {
      toast.error("Failed to save order");
      fetchList();
    }
  }

  async function handleDeleteItem() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/items/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) { toast.error("Failed to delete item"); return; }
      setItems((prev) => prev.filter((i) => i.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success(`"${deleteTarget.name}" removed`);
    } catch {
      toast.error("Network error");
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleClearChecked() {
    setClearLoading(true);
    const checkedIds = items.filter((i) => i.isChecked).map((i) => i.id);
    try {
      await Promise.all(checkedIds.map((cid) => fetch(`/api/items/${cid}`, { method: "DELETE" })));
      setItems((prev) => prev.filter((i) => !i.isChecked));
      setClearCheckedOpen(false);
      toast.success("Cleared checked items");
    } catch {
      toast.error("Failed to clear items");
    } finally {
      setClearLoading(false);
    }
  }

  async function handleMarkEssential(name: string) {
    try {
      const res = await fetch("/api/essentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.status === 409) { toast(`"${name}" is already an Essential`); return; }
      if (!res.ok) { toast.error("Failed to mark Essential"); return; }
      const data = await res.json();
      setEssentials((prev) => [...prev, data.data as Essential].sort((a, b) => a.name.localeCompare(b.name)));
      toast.success(`"${name}" marked as Essential ★`);
    } catch {
      toast.error("Network error");
    }
  }

  async function handleUnmarkEssential(name: string) {
    const essential = essentials.find((e) => e.name.toLowerCase() === name.toLowerCase());
    if (!essential) return;
    try {
      const res = await fetch(`/api/essentials/${essential.id}`, { method: "DELETE" });
      if (!res.ok) { toast.error("Failed to unmark Essential"); return; }
      setEssentials((prev) => prev.filter((e) => e.id !== essential.id));
      toast(`"${name}" removed from Essentials`);
    } catch {
      toast.error("Network error");
    }
  }

  async function handleNotesUpdate(itemId: string, notes: string) {
    setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, notes } : i)));
    try {
      await fetch(`/api/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
    } catch {
      toast.error("Failed to save notes");
    }
  }

  async function handleNameUpdate(itemId: string, name: string) {
    const prev = items.find((i) => i.id === itemId);
    setItems((prevItems) => prevItems.map((i) => (i.id === itemId ? { ...i, name } : i)));
    try {
      const res = await fetch(`/api/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        if (prev) setItems((p) => p.map((i) => (i.id === itemId ? { ...i, name: prev.name } : i)));
        toast.error("Failed to rename item");
      }
    } catch {
      toast.error("Network error");
    }
  }

  // Quick-add from empty state essentials chips
  async function handleQuickAdd(essentialName: string) {
    try {
      const res = await fetch(`/api/lists/${id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: essentialName, quantityValue: "1", quantityUnit: "no." }),
      });
      const data = await res.json();
      if (res.status === 409) {
        toast.error(`"${essentialName}" already in list`);
        handleDuplicateItem(data.existingId);
        return;
      }
      if (!res.ok) { toast.error(data.error ?? "Failed to add item"); return; }
      setItems((prev) => [...prev, data.data as Item]);
      toast.success(`"${essentialName}" added!`);
    } catch {
      toast.error("Network error");
    }
  }

  return (
    <>
      <Header backHref="/dashboard" backLabel="My Lists" title={list?.name ?? "List"} />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-6 flex flex-col gap-5">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
          </div>
        ) : (
          <>
            {/* List header */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate">
                  {list?.name}
                </h1>
                <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
                  {items.length} item{items.length !== 1 ? "s" : ""}
                </span>
              </div>
              <ProgressBar checked={checkedCount} total={items.length} />
            </div>

            {/* Add item form */}
            <AddItemForm
              listId={id}
              essentials={essentials}
              onAdded={handleAdded}
              onDuplicate={handleDuplicateItem}
            />

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <FilterTabs
                active={filterTab}
                onChange={(tab) => { setFilterTab(tab); setSearch(""); }}
                counts={counts}
              />
              <SearchBar value={search} onChange={setSearch} />
            </div>

            {/* Drag hint */}
            {isDragDisabled && items.length > 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-xl px-3 py-2">
                Drag-to-reorder is available when showing all items with no search filter.
              </p>
            )}

            {/* Toolbar actions row */}
            {items.length > 0 && (
              <div className="flex items-center justify-between gap-2">
                {/* Check all / Uncheck all */}
                <button
                  onClick={handleCheckAll}
                  className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {allChecked ? (
                      <path d="M9 14l-4-4 1.4-1.4L9 11.2l8.6-8.6L19 4l-10 10z" />
                    ) : (
                      <>
                        <polyline points="9 11 12 14 22 4" />
                        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                      </>
                    )}
                  </svg>
                  {allChecked ? "Uncheck all" : "Check all"}
                </button>

                {/* Clear checked */}
                {checkedCount > 0 && (
                  <button
                    onClick={() => setClearCheckedOpen(true)}
                    className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                      <path d="M10 11v6M14 11v6" />
                      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                    </svg>
                    Clear {checkedCount} checked
                  </button>
                )}
              </div>
            )}

            {/* Items list */}
            <div>
              <SortableItemList
                items={filteredItems}
                essentials={essentials}
                isDragDisabled={isDragDisabled}
                onReorder={handleReorder}
                onToggle={handleToggle}
                onDelete={setDeleteTarget}
                onMarkEssential={handleMarkEssential}
                onUnmarkEssential={handleUnmarkEssential}
                onNotesUpdate={handleNotesUpdate}
                onNameUpdate={handleNameUpdate}
                onQuickAdd={handleQuickAdd}
              />
              {/* Hidden refs layer for scroll targeting */}
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  ref={(el) => { itemRefs.current[item.id] = el; }}
                  style={{ position: "absolute", pointerEvents: "none", height: 0 }}
                />
              ))}
            </div>
          </>
        )}
      </main>

      {/* Delete item confirm */}
      <ConfirmModal
        open={!!deleteTarget}
        title="Remove item"
        message={`Remove "${deleteTarget?.name}" from this list?`}
        confirmLabel="Remove"
        danger
        loading={deleteLoading}
        onConfirm={handleDeleteItem}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Clear checked confirm */}
      <ConfirmModal
        open={clearCheckedOpen}
        title="Clear checked items"
        message={`Remove all ${checkedCount} checked item${checkedCount !== 1 ? "s" : ""}? This cannot be undone.`}
        confirmLabel="Clear all"
        danger
        loading={clearLoading}
        onConfirm={handleClearChecked}
        onCancel={() => setClearCheckedOpen(false)}
      />
    </>
  );
}
