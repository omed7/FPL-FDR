import { useMemo, useState } from 'react';
import { X, Plus, Minus } from 'lucide-react';
import { POSITION_LABELS } from '../constants.js';

const STORAGE_KEY = 'fpl:plannerSquad';
const DEFAULT_BUDGET = 1000; // £100.0m in FPL units

/**
 * Light-weight squad planner: pick up to 15 players and see the summed FDR
 * over the visible gameweek window so you can simulate transfers.
 *
 * Fully drag-and-drop would be a bigger lift; we opt for add/remove + sort by
 * fixture-adjusted score which covers the planning use case.
 */
export default function TransferPlannerModal({
  isOpen,
  onClose,
  elements,
  teams,
  processedData,
}) {
  const [squad, setSquad] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch { return []; }
  });
  const [q, setQ] = useState('');
  const [position, setPosition] = useState('');

  const save = (next) => {
    setSquad(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const add = (id) => {
    if (squad.includes(id) || squad.length >= 15) return;
    save([...squad, id]);
  };
  const remove = (id) => save(squad.filter(x => x !== id));

  const squadPlayers = squad.map(id => elements.find(e => e.id === id)).filter(Boolean);
  const totalCost = squadPlayers.reduce((s, p) => s + p.now_cost, 0);

  const fixtureScores = useMemo(() => {
    const byTeam = new Map();
    for (const t of processedData?.teams || []) {
      const sum = t.teamFixtures.reduce((acc, slot) => {
        if (slot.isBlank) return acc;
        return acc + slot.fixtures.reduce((a, f) => a + f.fdr, 0);
      }, 0);
      byTeam.set(t.id, sum);
    }
    return byTeam;
  }, [processedData]);

  const squadScore = squadPlayers.reduce((s, p) => s + (fixtureScores.get(p.team) ?? 0), 0);

  const candidates = useMemo(() => {
    const ql = q.toLowerCase();
    return elements
      .filter(e => {
        if (position && String(e.element_type) !== position) return false;
        if (!ql) return true;
        return e.web_name.toLowerCase().includes(ql)
          || e.first_name.toLowerCase().includes(ql)
          || e.second_name.toLowerCase().includes(ql);
      })
      .sort((a, b) => b.total_points - a.total_points)
      .slice(0, 80);
  }, [elements, q, position]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Transfer Planner</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 flex-1 overflow-hidden">
          <div className="border-r border-slate-200 dark:border-slate-800 flex flex-col min-h-0">
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search…" className="flex-1 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md px-2 py-1.5 text-sm" />
              <select value={position} onChange={e => setPosition(e.target.value)} className="bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md px-2 py-1.5 text-xs">
                <option value="">All</option>
                {Object.entries(POSITION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="overflow-y-auto flex-1">
              {candidates.map(el => {
                const team = teams.find(t => t.id === el.team);
                const inSquad = squad.includes(el.id);
                return (
                  <button
                    key={el.id}
                    disabled={inSquad || squad.length >= 15}
                    onClick={() => add(el.id)}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left border-b border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/60 disabled:opacity-40"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {team && <img src={team.logoUrl} alt="" className="w-4 h-4" />}
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 dark:text-white text-sm truncate">{el.web_name}</div>
                        <div className="text-[10px] text-slate-500">{POSITION_LABELS[el.element_type]} · {team?.short_name} · £{(el.now_cost/10).toFixed(1)}m · {el.total_points} pts</div>
                      </div>
                    </div>
                    <Plus size={14} className="text-slate-400" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col min-h-0">
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white">Squad ({squadPlayers.length}/15)</span>
              <span className="tabular-nums text-slate-600 dark:text-slate-300">
                £{(totalCost/10).toFixed(1)}m / £{(DEFAULT_BUDGET/10).toFixed(1)}m
              </span>
            </div>
            <div className="overflow-y-auto flex-1">
              {squadPlayers.map(el => {
                const team = teams.find(t => t.id === el.team);
                const fx = fixtureScores.get(el.team) ?? 0;
                return (
                  <div key={el.id} className="flex items-center justify-between gap-2 px-3 py-2 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2 min-w-0">
                      {team && <img src={team.logoUrl} alt="" className="w-4 h-4" />}
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 dark:text-white text-sm truncate">{el.web_name}</div>
                        <div className="text-[10px] text-slate-500">{POSITION_LABELS[el.element_type]} · {team?.short_name} · fix score {fx}</div>
                      </div>
                    </div>
                    <button onClick={() => remove(el.id)} className="text-rose-500 hover:text-rose-400">
                      <Minus size={14} />
                    </button>
                  </div>
                );
              })}
              {squadPlayers.length === 0 && (
                <div className="p-6 text-center text-sm text-slate-500">
                  Add up to 15 players from the left to simulate transfers.
                </div>
              )}
            </div>
            <div className="p-3 border-t border-slate-200 dark:border-slate-800 text-xs space-y-1 bg-slate-50 dark:bg-slate-950">
              <div className="flex justify-between"><span className="text-slate-500">Total cost</span><span className="tabular-nums">£{(totalCost/10).toFixed(1)}m</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Fixture score (sum FDR in window)</span><span className="tabular-nums">{squadScore}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Avg per player</span><span className="tabular-nums">{squadPlayers.length ? (squadScore/squadPlayers.length).toFixed(2) : '–'}</span></div>
              <p className="text-[10px] text-slate-400 pt-1">Lower score = easier run. Persisted in localStorage.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
