import { useEffect, useMemo, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { fetchEventLive } from '../api.js';
import { POSITION_LABELS, OFFICIAL_FDR_MAP } from '../constants.js';

/**
 * For finished gameweeks, compare the official FDR of each fixture against the
 * actual points scored by players in those fixtures (grouped by position).
 * Gives a calibration sense of how well the 1-11 mapping tracks outcomes.
 */
export default function HistoricalAccuracyModal({
  isOpen,
  onClose,
  allEvents,
  fixturesData,
  elements,
  teams,
}) {
  const finishedEvents = useMemo(
    () => (allEvents || []).filter(e => e.finished).map(e => e.id).sort((a, b) => a - b),
    [allEvents],
  );
  const [selected, setSelected] = useState(finishedEvents[finishedEvents.length - 1] ?? null);
  const [live, setLive] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!isOpen || !selected) return;
    let active = true;
    setLoading(true); setErr(null);
    fetchEventLive(selected)
      .then(d => { if (active) setLive(d); })
      .catch(e => { if (active) { console.error(e); setErr('Could not load live data'); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [selected, isOpen]);

  const rows = useMemo(() => {
    if (!live || !selected) return [];
    const fixtures = fixturesData.filter(f => f.event === selected && f.finished);
    const pointsByElement = new Map();
    for (const el of live.elements || []) {
      pointsByElement.set(el.id, el.stats?.total_points ?? 0);
    }

    // Build per-fixture rows with actual points split by home/away team and position.
    const out = [];
    for (const fx of fixtures) {
      const homeTeam = teams.find(t => t.id === fx.team_h);
      const awayTeam = teams.find(t => t.id === fx.team_a);
      const homeByPos = { 1: 0, 2: 0, 3: 0, 4: 0 };
      const awayByPos = { 1: 0, 2: 0, 3: 0, 4: 0 };
      for (const el of elements) {
        const pts = pointsByElement.get(el.id) ?? 0;
        if (el.team === fx.team_h) homeByPos[el.element_type] += pts;
        if (el.team === fx.team_a) awayByPos[el.element_type] += pts;
      }
      out.push({ fixture: fx, homeTeam, awayTeam, homeByPos, awayByPos });
    }
    return out;
  }, [live, selected, fixturesData, elements, teams]);

  // Summaries: avg points per position bucketed by official FDR (1..5).
  const summary = useMemo(() => {
    const bucket = {};
    for (const r of rows) {
      const hFdr = r.fixture.team_h_difficulty;
      const aFdr = r.fixture.team_a_difficulty;
      for (const pos of [1, 2, 3, 4]) {
        (bucket[hFdr] ??= { 1:[], 2:[], 3:[], 4:[] })[pos].push(r.homeByPos[pos]);
        (bucket[aFdr] ??= { 1:[], 2:[], 3:[], 4:[] })[pos].push(r.awayByPos[pos]);
      }
    }
    return Object.entries(bucket)
      .map(([fdr, posData]) => {
        const avg = {};
        for (const pos of [1, 2, 3, 4]) {
          const arr = posData[pos];
          avg[pos] = arr.length ? (arr.reduce((s, x) => s + x, 0) / arr.length).toFixed(1) : '–';
        }
        return { fdr: Number(fdr), mapped: OFFICIAL_FDR_MAP[Number(fdr)] ?? '–', avg, n: posData[1].length };
      })
      .sort((a, b) => a.fdr - b.fdr);
  }, [rows]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Historical accuracy</h2>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500">Gameweek</label>
            <select
              value={selected ?? ''}
              onChange={e => setSelected(Number(e.target.value))}
              className="bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md px-2 py-1.5 text-sm"
            >
              {finishedEvents.length === 0 && <option value="">No finished GWs yet</option>}
              {finishedEvents.map(id => <option key={id} value={id}>GW{id}</option>)}
            </select>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white">
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {loading && <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 size={14} className="animate-spin" /> Loading…</div>}
          {err && <div className="text-sm text-red-500">{err}</div>}

          {!loading && !err && summary.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Avg points per team by official FDR (this GW)</h3>
              <table className="w-full text-sm">
                <thead className="text-[10px] text-slate-500 uppercase">
                  <tr>
                    <th className="p-2 text-left">FDR</th>
                    <th className="p-2 text-left">Mapped (1–11)</th>
                    {Object.entries(POSITION_LABELS).map(([k, v]) => <th key={k} className="p-2 text-right">{v}</th>)}
                    <th className="p-2 text-right">N</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.map(row => (
                    <tr key={row.fdr} className="border-t border-slate-200 dark:border-slate-800">
                      <td className="p-2">{row.fdr}</td>
                      <td className="p-2">{row.mapped}</td>
                      {[1, 2, 3, 4].map(pos => (
                        <td key={pos} className="p-2 text-right tabular-nums">{row.avg[pos]}</td>
                      ))}
                      <td className="p-2 text-right tabular-nums">{row.n}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-[10px] text-slate-400 mt-2">
                Lower average points in higher-FDR buckets → FDR is tracking reality. Flat rows suggest FDR isn't differentiating that position much.
              </p>
            </div>
          )}

          {!loading && !err && rows.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Per-fixture breakdown</h3>
              <div className="space-y-1.5 text-xs">
                {rows.map(r => (
                  <div key={r.fixture.id} className="flex items-center justify-between gap-2 p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 dark:text-white">{r.homeTeam?.short_name}</span>
                      <span className="tabular-nums">{r.fixture.team_h_score}–{r.fixture.team_a_score}</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{r.awayTeam?.short_name}</span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      FDR H{r.fixture.team_h_difficulty} / A{r.fixture.team_a_difficulty}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
