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
  events,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-700">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800/80 backdrop-blur-md">
          <h2 className="text-xl font-bold text-white">Settings</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Sorting */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">Sort Teams By</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="default">Default (ID)</option>
              <option value="easiest">Easiest Fixtures (FDR Asc)</option>
              <option value="hardest">Hardest Fixtures (FDR Desc)</option>
            </select>
          </div>

          {/* GW Range */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">Gameweek Range</label>
            <div className="flex space-x-4">
              <div className="flex-1">
                <span className="text-xs text-gray-400 block mb-1">Start GW</span>
                <input
                  type="number"
                  min="1"
                  max="38"
                  value={gwStart}
                  onChange={(e) => setGwStart(Number(e.target.value))}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex-1">
                <span className="text-xs text-gray-400 block mb-1">End GW</span>
                <input
                  type="number"
                  min="1"
                  max="38"
                  value={gwEnd}
                  onChange={(e) => setGwEnd(Number(e.target.value))}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Team Visibility */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">Team Visibility</label>
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-2 max-h-48 overflow-y-auto space-y-1">
              {teams.map(team => (
                <label key={team.id} className="flex items-center space-x-3 p-2 hover:bg-gray-800 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!hiddenTeams.includes(team.id)}
                    onChange={() => toggleTeamVisibility(team.id)}
                    className="w-4 h-4 text-blue-500 bg-gray-800 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <img src={team.logoUrl} alt={team.short_name} className="w-5 h-5" />
                  <span className="text-sm text-gray-200">{team.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
