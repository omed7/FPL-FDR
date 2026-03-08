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
      <div className="fixed inset-y-0 right-0 w-[336px] bg-slate-900 shadow-2xl flex flex-col border-l border-slate-700">
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
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2">Configuration</h3>
            <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800">
              <div className="flex items-center justify-between p-3">
                <label className="text-sm font-medium text-gray-300">Sort Teams By</label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="bg-transparent text-right text-sm text-white focus:outline-none focus:ring-0 cursor-pointer w-auto"
                >
                  <option value="default" className="bg-slate-900">Default (ID)</option>
                  <option value="easiest" className="bg-slate-900">Easiest (FDR Asc)</option>
                  <option value="hardest" className="bg-slate-900">Hardest (FDR Desc)</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-3">
                <label className="text-sm font-medium text-gray-300">Start GW</label>
                <input
                  type="number"
                  min="1"
                  max="38"
                  value={gwStart}
                  onChange={(e) => setGwStart(Number(e.target.value))}
                  className="w-16 bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-sm text-center text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between p-3">
                <label className="text-sm font-medium text-gray-300">End GW</label>
                <input
                  type="number"
                  min="1"
                  max="38"
                  value={gwEnd}
                  onChange={(e) => setGwEnd(Number(e.target.value))}
                  className="w-16 bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-sm text-center text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Team Visibility */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2">Team Visibility</h3>
            <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800 max-h-64 overflow-y-auto custom-scrollbar">
              {teams.map(team => (
                <label key={team.id} className="flex items-center justify-between p-3 hover:bg-slate-900/50 cursor-pointer group transition-colors">
                  <div className="flex items-center space-x-3">
                    <img src={team.logoUrl} alt={team.short_name} className="w-5 h-5" />
                    <span className="text-sm text-gray-200">{team.name}</span>
                  </div>
                  <div className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={!hiddenTeams.includes(team.id)}
                      onChange={() => toggleTeamVisibility(team.id)}
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Section 3: Custom Strengths */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Custom Strengths</h3>
              <button
                onClick={() => setFdrOverrides({})}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Reset All
              </button>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800 max-h-80 overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between p-2 bg-slate-900/80 sticky top-0 z-10 border-b border-slate-800 backdrop-blur-md">
                <span className="text-[10px] text-gray-500 uppercase tracking-wider ml-1">Team</span>
                <div className="flex space-x-2 mr-1">
                  <span className="w-12 text-center text-[10px] text-gray-500 uppercase tracking-wider">Home</span>
                  <span className="w-12 text-center text-[10px] text-gray-500 uppercase tracking-wider">Away</span>
                </div>
              </div>

              {teams.map(team => (
                <div key={team.id} className="flex items-center justify-between p-3 hover:bg-slate-900/50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <img src={team.logoUrl} alt={team.short_name} className="w-5 h-5" />
                    <span className="text-sm text-gray-200 font-medium">{team.short_name}</span>
                  </div>
                  <div className="flex space-x-2">
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
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(n => <option key={n} value={n}>{n}</option>)}
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
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(n => <option key={n} value={n}>{n}</option>)}
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
