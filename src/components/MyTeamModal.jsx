import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { fetchEntry, fetchEntryPicks } from '../api.js';
import { POSITION_LABELS } from '../constants.js';
import { cn } from '../utils/cn.js';

const STORAGE_KEY = 'fpl:entryId';

/**
 * Lets the user enter their FPL team ID and pulls down their current squad.
 * The squad's team IDs get surfaced back to the parent via `onSquadChange`
 * so player fixtures can be highlighted in the main grid.
 *
 * Also shows naive chip-planner hints: which chip is well-suited to each team
 * based on the visible window's average FDR.
 */
export default function MyTeamModal({
  isOpen,
  onClose,
  teams,
  elements,
  currentEventId,
  onSquadChange,
  processedData,
}) {
  const [entryId, setEntryId] = useState(() => localStorage.getItem(STORAGE_KEY) || '');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [entry, setEntry] = useState(null);
  const [picks, setPicks] = useState(null);

  if (!isOpen) return null;

  const load = async () => {
    if (!entryId) return;
    setLoading(true); setErr(null);
    try {
      localStorage.setItem(STORAGE_KEY, entryId);
      const [e, p] = await Promise.all([
        fetchEntry(Number(entryId)),
        fetchEntryPicks(Number(entryId), currentEventId),
      ]);
      setEntry(e); setPicks(p);
      const squadPlayers = (p.picks || [])
        .map(pick => elements.find(el => el.id === pick.element))
        .filter(Boolean);
      const squadTeamIds = [...new Set(squadPlayers.map(el => el.team))];
      onSquadChange(squadTeamIds, squadPlayers.map(el => el.id));
    } catch (e) {
      console.error(e);
      setErr('Could not load that team. Check the ID and try again.');
    } finally {
      setLoading(false);
    }
  };

  const squadPlayers = picks?.picks
    ? picks.picks
      .map(pick => ({ pick, el: elements.find(el => el.id === pick.element) }))
      .filter(x => x.el)
    : [];

  const hints = buildChipHints(squadPlayers, processedData);

  return (
    <ModalShell title={entry?.name ? `My Team: ${entry.name}` : 'My Team'} onClose={onClose}>
      <div className="space-y-3">
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">FPL Team ID</label>
        <div className="flex gap-2">
          <input
            value={entryId}
            onChange={e => setEntryId(e.target.value.replace(/\D/g, ''))}
            placeholder="e.g. 123456"
            className="flex-1 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-1.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            onClick={load}
            disabled={loading || !entryId}
            className="px-4 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-50 flex items-center gap-1"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Load
          </button>
        </div>
        <p className="text-[11px] text-slate-500">
          Find your team ID in the FPL app → Points → check the URL (<code>/entry/12345/…</code>).
        </p>
        {err && <div className="text-sm text-red-500">{err}</div>}
      </div>

      {squadPlayers.length > 0 && (
        <div className="mt-4 space-y-3">
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Squad (GW{currentEventId})</h4>
            <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto custom-scrollbar">
              {squadPlayers.map(({ pick, el }) => {
                const team = teams.find(t => t.id === el.team);
                return (
                  <div key={pick.element} className={cn(
                    'flex items-center gap-2 p-2 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs',
                    pick.is_captain && 'ring-1 ring-amber-400',
                    pick.position > 11 && 'opacity-70',
                  )}>
                    {team && <img src={team.logoUrl} alt="" className="w-4 h-4" />}
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold truncate text-slate-900 dark:text-white">{el.web_name}</span>
                      <span className="text-[10px] text-slate-500">
                        {POSITION_LABELS[el.element_type]} · {team?.short_name}
                        {pick.is_captain && ' · (C)'}
                        {pick.is_vice_captain && ' · (V)'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Chip hints (based on visible window)</h4>
            <ul className="space-y-1.5 text-xs">
              {hints.map(h => (
                <li key={h.label} className="flex items-start gap-2 p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="font-bold text-slate-900 dark:text-white w-24 flex-shrink-0">{h.label}</span>
                  <span className="text-slate-600 dark:text-slate-300">{h.suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </ModalShell>
  );
}

function buildChipHints(squadPlayers, processedData) {
  if (!processedData?.teams?.length) {
    return [
      { label: 'Wildcard', suggestion: 'Load your squad and adjust the visible gameweek window to see suggestions.' },
      { label: 'Bench Boost', suggestion: 'Look for a gameweek where all 15 of your players have green fixtures.' },
      { label: 'Triple Captain', suggestion: 'Target a gameweek where your captain has a DGW + low FDR.' },
      { label: 'Free Hit', suggestion: 'Useful in a BGW/DGW where your squad has 3+ blanks.' },
    ];
  }

  const squadTeamIds = new Set(squadPlayers.map(p => p.el.team));
  const squadTeams = processedData.teams.filter(t => squadTeamIds.has(t.id));
  const avg = squadTeams.length
    ? squadTeams.reduce((s, t) => s + t.avgFDR, 0) / squadTeams.length
    : null;

  // Find GW with the most DGWs + green fixtures for bench boost.
  let bestBBGw = null, bestBBScore = -1;
  for (const ev of processedData.events) {
    let score = 0;
    for (const t of squadTeams) {
      const slot = t.teamFixtures.find(s => s.eventId === ev.id);
      if (!slot || slot.isBlank) continue;
      for (const fx of slot.fixtures) {
        if (fx.fdr <= 5) score += 2;
        if (slot.fixtures.length > 1) score += 1;
      }
    }
    if (score > bestBBScore) { bestBBScore = score; bestBBGw = ev.id; }
  }

  // Find GW with a captain-worthy DGW (any squad team with DGW and low FDR).
  let bestTCGw = null; let bestTCTeam = null; let bestTCScore = -1;
  for (const ev of processedData.events) {
    for (const t of squadTeams) {
      const slot = t.teamFixtures.find(s => s.eventId === ev.id);
      if (!slot || slot.isBlank) continue;
      if (slot.fixtures.length < 2) continue;
      const avgFdr = slot.fixtures.reduce((s, f) => s + f.fdr, 0) / slot.fixtures.length;
      const score = (11 - avgFdr) * 2 + slot.fixtures.length;
      if (score > bestTCScore) {
        bestTCScore = score; bestTCGw = ev.id; bestTCTeam = t.short_name;
      }
    }
  }

  // Blanks this window
  let blankGw = null;
  for (const ev of processedData.events) {
    let blanks = 0;
    for (const t of squadTeams) {
      const slot = t.teamFixtures.find(s => s.eventId === ev.id);
      if (slot?.isBlank) blanks++;
    }
    if (blanks >= 3) { blankGw = ev.id; break; }
  }

  return [
    { label: 'Wildcard',      suggestion: avg != null ? `Avg FDR for your teams in this window: ${avg.toFixed(2)}. ${avg > 6.5 ? 'Consider wildcarding into teams with better runs.' : 'Your current squad has decent fixtures — hold.'}` : '–' },
    { label: 'Bench Boost',   suggestion: bestBBGw ? `Target GW${bestBBGw} — highest combined fixture score for your squad.` : '–' },
    { label: 'Triple Captain',suggestion: bestTCGw && bestTCTeam ? `Target GW${bestTCGw} — ${bestTCTeam} has a DGW with easy fixtures.` : 'No DGWs in the visible window for your squad.' },
    { label: 'Free Hit',      suggestion: blankGw ? `GW${blankGw} looks blank-heavy for your squad (3+ players blank).` : 'No heavy blank gameweeks detected in the visible window.' },
  ];
}

function ModalShell({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white">
            <X size={20} />
          </button>
        </div>
        <div className="p-4 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}
