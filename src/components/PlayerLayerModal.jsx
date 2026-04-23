import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { POSITION_LABELS } from '../constants.js';

/**
 * Browse all FPL players, filter by name/position/team/price, and highlight
 * their club's fixtures in the grid via `onHighlight`.
 */
export default function PlayerLayerModal({
  isOpen,
  onClose,
  elements,
  teams,
  onHighlight,
  highlightedPlayerIds,
}) {
  const [q, setQ] = useState('');
  const [position, setPosition] = useState('');
  const [teamId, setTeamId] = useState('');
  const [maxPrice, setMaxPrice] = useState(150);

  const filtered = useMemo(() => {
    const ql = q.toLowerCase();
    return elements
      .filter(el => {
        if (position && String(el.element_type) !== position) return false;
        if (teamId && String(el.team) !== teamId) return false;
        if (el.now_cost > maxPrice) return false;
        if (!ql) return true;
        return (
          el.web_name.toLowerCase().includes(ql) ||
          el.first_name.toLowerCase().includes(ql) ||
          el.second_name.toLowerCase().includes(ql)
        );
      })
      .sort((a, b) => b.total_points - a.total_points)
      .slice(0, 100);
  }, [elements, q, position, teamId, maxPrice]);

  if (!isOpen) return null;
  const selected = new Set(highlightedPlayerIds || []);

  const toggle = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onHighlight([...next]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Players</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white">
            <X size={20} />
          </button>
        </div>
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2">
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search…"
            className="col-span-2 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md px-2 py-1.5 text-sm"
          />
          <select value={position} onChange={e => setPosition(e.target.value)} className="bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md px-2 py-1.5 text-sm">
            <option value="">All positions</option>
            {Object.entries(POSITION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={teamId} onChange={e => setTeamId(e.target.value)} className="bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md px-2 py-1.5 text-sm">
            <option value="">All teams</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.short_name}</option>)}
          </select>
          <label className="col-span-2 sm:col-span-4 flex items-center gap-2 text-xs text-slate-500">
            <span>Max price £{(maxPrice/10).toFixed(1)}m</span>
            <input type="range" min="40" max="150" step="1" value={maxPrice} onChange={e => setMaxPrice(Number(e.target.value))} className="flex-1" />
          </label>
        </div>
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-50 dark:bg-slate-950 text-left text-[10px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="p-2">Player</th>
                <th className="p-2">Team</th>
                <th className="p-2">Pos</th>
                <th className="p-2 text-right">Price</th>
                <th className="p-2 text-right">Form</th>
                <th className="p-2 text-right">Pts</th>
                <th className="p-2 text-right">Sel%</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(el => {
                const team = teams.find(t => t.id === el.team);
                const picked = selected.has(el.id);
                return (
                  <tr
                    key={el.id}
                    onClick={() => toggle(el.id)}
                    className={`cursor-pointer border-t border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/60 ${picked ? 'bg-sky-50 dark:bg-sky-900/30' : ''}`}
                  >
                    <td className="p-2 font-semibold text-slate-900 dark:text-white">{el.web_name}</td>
                    <td className="p-2 text-slate-600 dark:text-slate-300">{team?.short_name}</td>
                    <td className="p-2 text-slate-600 dark:text-slate-300">{POSITION_LABELS[el.element_type]}</td>
                    <td className="p-2 text-right tabular-nums">£{(el.now_cost/10).toFixed(1)}</td>
                    <td className="p-2 text-right tabular-nums">{el.form}</td>
                    <td className="p-2 text-right tabular-nums">{el.total_points}</td>
                    <td className="p-2 text-right tabular-nums">{el.selected_by_percent}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-500">{selected.size} highlighted · click rows to toggle</span>
          <button onClick={() => onHighlight([])} className="text-blue-500 hover:text-blue-400 font-semibold">Clear</button>
        </div>
      </div>
    </div>
  );
}
