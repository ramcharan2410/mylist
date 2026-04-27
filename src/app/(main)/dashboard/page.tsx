"use client";

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { Header } from "@/components/common/Header";
import { ListGrid } from "@/components/lists/ListGrid";
import { ListModal } from "@/components/lists/ListModal";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { ListWithCount } from "@/types";

type SortKey = "newest" | "oldest" | "az";

export default function DashboardPage() {
  const [lists, setLists] = useState<ListWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortKey>("newest");

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  // Rename modal
  const [renameTarget, setRenameTarget] = useState<ListWithCount | null>(null);
  const [renameLoading, setRenameLoading] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<ListWithCount | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchLists = useCallback(async () => {
    try {
      const res = await fetch("/api/lists");
      const data = await res.json();
      if (data.data) setLists(data.data as ListWithCount[]);
    } catch {
      toast.error("Failed to load lists");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  // Sort
  const sortedLists = [...lists].sort((a, b) => {
    if (sort === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sort === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    return a.name.localeCompare(b.name);
  });

  async function handleCreate(name: string) {
    setCreateLoading(true);
    try {
      const res = await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed to create list"); return; }
      setLists((prev) => [data.data as ListWithCount, ...prev]);
      setCreateOpen(false);
      toast.success("List created!");
    } catch {
      toast.error("Network error");
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleRename(name: string) {
    if (!renameTarget) return;
    setRenameLoading(true);
    try {
      const res = await fetch(`/api/lists/${renameTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed to rename"); return; }
      setLists((prev) =>
        prev.map((l) => (l.id === renameTarget.id ? { ...l, name } : l))
      );
      setRenameTarget(null);
      toast.success("Renamed!");
    } catch {
      toast.error("Network error");
    } finally {
      setRenameLoading(false);
    }
  }

  async function handleDuplicate(list: ListWithCount) {
    const toastId = toast.loading("Duplicating…");
    try {
      const res = await fetch(`/api/lists/${list.id}/duplicate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed to duplicate", { id: toastId }); return; }
      setLists((prev) => [data.data as ListWithCount, ...prev]);
      toast.success("List duplicated!", { id: toastId });
    } catch {
      toast.error("Network error", { id: toastId });
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/lists/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) { toast.error("Failed to delete"); return; }
      setLists((prev) => prev.filter((l) => l.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success("List deleted");
    } catch {
      toast.error("Network error");
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <>
      <Header />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 flex flex-col gap-6">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">My Lists</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {lists.length} list{lists.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Sort */}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="text-sm px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="az">A–Z</option>
            </select>

            {/* New list */}
            <button
              onClick={() => setCreateOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              New list
            </button>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
          </div>
        ) : (
          <ListGrid
            lists={sortedLists}
            onRename={setRenameTarget}
            onDuplicate={handleDuplicate}
            onDelete={setDeleteTarget}
          />
        )}
      </main>

      {/* Create modal */}
      <ListModal
        open={createOpen}
        mode="create"
        loading={createLoading}
        onSubmit={handleCreate}
        onClose={() => setCreateOpen(false)}
      />

      {/* Rename modal */}
      <ListModal
        open={!!renameTarget}
        mode="rename"
        initialName={renameTarget?.name ?? ""}
        loading={renameLoading}
        onSubmit={handleRename}
        onClose={() => setRenameTarget(null)}
      />

      {/* Delete confirm */}
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete list"
        message={`Delete "${deleteTarget?.name}"? This will permanently remove all ${deleteTarget?.itemCount ?? 0} item${(deleteTarget?.itemCount ?? 0) !== 1 ? "s" : ""}.`}
        confirmLabel="Delete"
        danger
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
