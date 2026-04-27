import { ListWithCount } from "@/types";
import { ListCard } from "./ListCard";

interface ListGridProps {
  lists: ListWithCount[];
  onRename: (list: ListWithCount) => void;
  onDuplicate: (list: ListWithCount) => void;
  onDelete: (list: ListWithCount) => void;
}

export function ListGrid({ lists, onRename, onDuplicate, onDelete }: ListGridProps) {
  if (lists.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-emerald-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
            <rect x="9" y="3" width="6" height="4" rx="1" ry="1" />
            <path d="M12 12h.01M12 16h.01M8 12h.01M8 16h.01" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-gray-700 dark:text-gray-200">No lists yet</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Create your first shopping list to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {lists.map((list) => (
        <ListCard
          key={list.id}
          list={list}
          onRename={onRename}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
