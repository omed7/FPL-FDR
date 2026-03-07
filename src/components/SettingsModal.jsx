import React from 'react';
import { X } from 'lucide-react';

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
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Slide-over Content */}
      <div className="fixed inset-y-0 right-0 w-80 bg-slate-900 shadow-2xl flex flex-col border-l border-slate-700">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900 backdrop-blur-md">
          <h2 className="text-lg font-bold text-white">Settings</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-800 text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 space-y-6">
          {/* Section 1: Configuration */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Configuration</h3>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-300">Sort Teams By</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-md px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="default">Default (ID)</option>
                <option value="easiest">Easiest Fixtures (FDR Asc)</option>
                <option value="hardest">Hardest Fixtures (FDR Desc)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-300">Gameweek Range</label>
              <div className="flex space-x-2">
                <div className="flex-1">
                  <span className="text-[10px] text-gray-500 block mb-0.5">Start GW</span>
                  <input
                    type="number"
                    min="1"
                    max="38"
                    value={gwStart}
                    onChange={(e) => setGwStart(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-md px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="flex-1">
                  <span className="text-[10px] text-gray-500 block mb-0.5">End GW</span>
                  <input
                    type="number"
                    min="1"
                    max="38"
                    value={gwEnd}
                    onChange={(e) => setGwEnd(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-md px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Team Visibility */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Team Visibility</h3>
            <div className="bg-slate-950 border border-slate-800 rounded-md p-1.5 max-h-48 overflow-y-auto space-y-0.5 custom-scrollbar">
              {teams.map(team => (
                <label key={team.id} className="flex items-center justify-between p-1.5 hover:bg-slate-900 rounded cursor-pointer group">
                  <div className="flex items-center space-x-2">
                    <img src={team.logoUrl} alt={team.short_name} className="w-4 h-4 opacity-80 group-hover:opacity-100" />
                    <span className="text-xs text-gray-300 group-hover:text-gray-100">{team.name}</span>
                  </div>
                  <div className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={!hiddenTeams.includes(team.id)}
                      onChange={() => toggleTeamVisibility(team.id)}
                    />
                    <div className="w-7 h-4 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-500"></div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Section 3: Custom Strengths */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Custom Strengths</h3>
              <button
                onClick={() => setFdrOverrides({})}
                className="text-[10px] px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded border border-slate-700 transition-colors"
              >
                Reset
              </button>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-md p-1.5 max-h-48 overflow-y-auto space-y-0.5 custom-scrollbar">
              <div className="flex items-center justify-end px-1 text-[9px] text-gray-500 uppercase tracking-wider mb-1">
                <div className="w-10 text-center mr-1">Home</div>
                <div className="w-10 text-center">Away</div>
              </div>
              {teams.map(team => (
                <div key={team.id} className="flex items-center justify-between p-1 hover:bg-slate-900 rounded group">
                  <div className="flex items-center space-x-2">
                    <img src={team.logoUrl} alt={team.short_name} className="w-4 h-4 opacity-80 group-hover:opacity-100" />
                    <span className="text-xs text-gray-300 group-hover:text-gray-100">{team.short_name}</span>
                  </div>
                  <div className="flex space-x-1">
                    <select
                      value={fdrOverrides[team.id]?.h || team.strength || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFdrOverrides(prev => {
                          const updated = { ...prev };
                          if (!updated[team.id]) updated[team.id] = {};
                          if (val === '') {
                            delete updated[team.id].h;
                            if (Object.keys(updated[team.id]).length === 0) delete updated[team.id];
                          } else {
                            updated[team.id].h = Number(val);
                          }
                          return updated;
                        });
                      }}
                      className="w-10 bg-slate-800 border border-slate-700 rounded px-1 py-0.5 text-[10px] text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-center"
                    >
                      <option value="">-</option>
                      {[1, 2, 3, 4, 5, 6, 7].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>

                    <select
                      value={fdrOverrides[team.id]?.a || team.strength || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFdrOverrides(prev => {
                          const updated = { ...prev };
                          if (!updated[team.id]) updated[team.id] = {};
                          if (val === '') {
                            delete updated[team.id].a;
                            if (Object.keys(updated[team.id]).length === 0) delete updated[team.id];
                          } else {
                            updated[team.id].a = Number(val);
                          }
                          return updated;
                        });
                      }}
                      className="w-10 bg-slate-800 border border-slate-700 rounded px-1 py-0.5 text-[10px] text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-center"
                    >
                      <option value="">-</option>
                      {[1, 2, 3, 4, 5, 6, 7].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
