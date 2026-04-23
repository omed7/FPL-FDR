import { X, Eye, EyeOff, Pin } from 'lucide-react';
import {
  MODE_LABELS,
  ALGORITHM_LABELS,
  FDR_MODES,
  FDR_ALGORITHMS,
} from '../constants.js';

export default function SettingsModal({
  isOpen,
  onClose,
  sortOrder,
  setSortOrder,
  gwStart,
  setGwStart,
  gwEnd,
  setGwEnd,
  hiddenTeams,
  toggleTeamVisibility,
  teams,
  fdrOverrides,
  setFdrOverrides,
  fdrMode,
  setFdrMode,
  fdrAlgorithm,
  setFdrAlgorithm,
  showRuns,
  setShowRuns,
  pinnedTeams,
  togglePin,
}) {
  if (!isOpen) return null;
  const hiddenSet = new Set(hiddenTeams);
  const pinnedSet = new Set(pinnedTeams);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-[360px] max-w-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-700">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Settings</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 space-y-6">
          {/* Window */}
          <Section title="Window">
            <Row>
              <Label>Sort By</Label>
              <select value={sortOrder} onChange={e => setSortOrder(e.target.value)} className="bg-transparent text-right text-sm text-slate-900 dark:text-white focus:outline-none cursor-pointer">
                <option value="default" className="bg-white dark:bg-slate-900">Default (ID)</option>
                <option value="easiest" className="bg-white dark:bg-slate-900">Easiest (FDR Asc)</option>
                <option value="hardest" className="bg-white dark:bg-slate-900">Hardest (FDR Desc)</option>
              </select>
            </Row>
            <Row>
              <Label>Start GW</Label>
              <NumberInput value={gwStart} onChange={setGwStart} />
            </Row>
            <Row>
              <Label>End GW</Label>
              <NumberInput value={gwEnd} onChange={setGwEnd} />
            </Row>
          </Section>

          {/* FDR algorithm */}
          <Section title="FDR algorithm">
            <Row>
              <Label>Mode</Label>
              <select value={fdrMode} onChange={e => setFdrMode(e.target.value)} className="bg-transparent text-right text-sm text-slate-900 dark:text-white focus:outline-none cursor-pointer">
                {FDR_MODES.map(m => <option key={m} value={m} className="bg-white dark:bg-slate-900">{MODE_LABELS[m]}</option>)}
              </select>
            </Row>
            <Row>
              <Label>Algorithm</Label>
              <select value={fdrAlgorithm} onChange={e => setFdrAlgorithm(e.target.value)} className="bg-transparent text-right text-sm text-slate-900 dark:text-white focus:outline-none cursor-pointer">
                {FDR_ALGORITHMS.map(a => <option key={a} value={a} className="bg-white dark:bg-slate-900">{ALGORITHM_LABELS[a]}</option>)}
              </select>
            </Row>
            <Row>
              <Label>Highlight runs (3+ GWs)</Label>
              <Toggle checked={showRuns} onChange={setShowRuns} />
            </Row>
          </Section>

          {/* Teams */}
          <Section title="Teams" right={(
            <button
              onClick={() => { teams.forEach(t => { if (pinnedSet.has(t.id)) togglePin(t.id); }); }}
              className="text-xs text-blue-500 hover:text-blue-400"
            >
              Unpin all
            </button>
          )}>
            <div className="max-h-64 overflow-y-auto custom-scrollbar divide-y divide-slate-200 dark:divide-slate-800">
              {teams.map(team => (
                <div key={team.id} className="flex items-center gap-3 py-2 px-1">
                  <img src={team.logoUrl} alt="" className="w-5 h-5" />
                  <span className="flex-1 text-sm text-slate-900 dark:text-white">{team.name}</span>
                  <button
                    title={pinnedSet.has(team.id) ? 'Unpin' : 'Pin'}
                    onClick={() => togglePin(team.id)}
                    className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 ${pinnedSet.has(team.id) ? 'text-amber-500' : 'text-slate-400'}`}
                  >
                    <Pin size={14} />
                  </button>
                  <button
                    title={hiddenSet.has(team.id) ? 'Show' : 'Hide'}
                    onClick={() => toggleTeamVisibility(team.id)}
                    className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 ${hiddenSet.has(team.id) ? 'text-slate-400' : 'text-emerald-500'}`}
                  >
                    {hiddenSet.has(team.id) ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              ))}
            </div>
          </Section>

          {/* Custom strengths */}
          <Section title="Custom strengths" right={(
            <button onClick={() => setFdrOverrides({})} className="text-xs text-blue-500 hover:text-blue-400">Reset all</button>
          )}>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
                <span className="text-[10px] uppercase tracking-wider text-slate-500">Team</span>
                <div className="flex gap-2">
                  <span className="w-12 text-center text-[10px] uppercase text-slate-500">Home</span>
                  <span className="w-12 text-center text-[10px] uppercase text-slate-500">Away</span>
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto custom-scrollbar divide-y divide-slate-200 dark:divide-slate-800">
                {teams.map(team => (
                  <div key={team.id} className="flex items-center justify-between p-2">
                    <div className="flex items-center gap-2">
                      <img src={team.logoUrl} alt="" className="w-5 h-5" />
                      <span className="text-sm text-slate-900 dark:text-white font-medium">{team.short_name}</span>
                    </div>
                    <div className="flex gap-2">
                      <OverrideSelect
                        value={fdrOverrides[team.id]?.h ?? ''}
                        onChange={val => updateOverride(setFdrOverrides, team.id, 'h', val)}
                      />
                      <OverrideSelect
                        value={fdrOverrides[team.id]?.a ?? ''}
                        onChange={val => updateOverride(setFdrOverrides, team.id, 'a', val)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

function updateOverride(setFdrOverrides, teamId, side, val) {
  setFdrOverrides(prev => {
    const next = { ...prev };
    if (!next[teamId]) next[teamId] = {};
    else next[teamId] = { ...next[teamId] };
    if (val === '' || val == null) {
      delete next[teamId][side];
      if (Object.keys(next[teamId]).length === 0) delete next[teamId];
    } else {
      next[teamId][side] = Number(val);
    }
    return next;
  });
}

function Section({ title, right, children }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</h3>
        {right}
      </div>
      <div>{children}</div>
    </div>
  );
}

function Row({ children }) {
  return <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-800 last:border-b-0">{children}</div>;
}
function Label({ children }) {
  return <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{children}</label>;
}
function NumberInput({ value, onChange }) {
  return (
    <input
      type="number"
      min="1"
      max="38"
      value={value}
      onChange={e => onChange(Number(e.target.value))}
      className="w-16 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md px-2 py-1 text-sm text-center text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
    />
  );
}
function Toggle({ checked, onChange }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`w-11 h-6 rounded-full relative transition-colors ${checked ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
    >
      <span className={`absolute top-[2px] left-[2px] w-5 h-5 bg-white rounded-full transition-transform ${checked ? 'translate-x-5' : ''}`} />
    </button>
  );
}
function OverrideSelect({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-12 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-1 py-0.5 text-[10px] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-center"
    >
      <option value="">–</option>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(n => <option key={n} value={n}>{n}</option>)}
    </select>
  );
}
