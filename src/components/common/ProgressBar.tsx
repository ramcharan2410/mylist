interface ProgressBarProps {
  checked: number;
  total: number;
}

export function ProgressBar({ checked, total }: ProgressBarProps) {
  const pct = total === 0 ? 0 : Math.round((checked / total) * 100);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
        <span>{checked}/{total} items</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
