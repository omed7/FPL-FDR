export default function LookaheadBar({ onLookahead, gwStart, gwEnd, onShiftWindow }) {
  const size = gwEnd - gwStart + 1;
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold mr-1">Window</span>
      <button onClick={() => onShiftWindow(-size)} aria-label="Previous window" className="px-2 py-1.5 text-xs font-semibold rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-slate-800">◀</button>
      <span className="text-xs font-mono text-slate-600 dark:text-slate-300 tabular-nums min-w-[80px] text-center">GW {gwStart}–{gwEnd}</span>
      <button onClick={() => onShiftWindow(size)} aria-label="Next window" className="px-2 py-1.5 text-xs font-semibold rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-slate-800">▶</button>

      <span className="hidden sm:inline text-xs text-slate-400 dark:text-slate-500 mx-1">·</span>

      <button onClick={() => onLookahead('all')} className="px-3 py-1.5 text-xs font-semibold rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">All</button>
      <button onClick={() => onLookahead(3)} className="px-3 py-1.5 text-xs font-semibold rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">Next 3</button>
      <button onClick={() => onLookahead(5)} className="px-3 py-1.5 text-xs font-semibold rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">Next 5</button>
      <button onClick={() => onLookahead(8)} className="px-3 py-1.5 text-xs font-semibold rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">Next 8</button>
    </div>
  );
}
