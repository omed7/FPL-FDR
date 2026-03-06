import React from 'react';
import { X, Calendar, Clock, MapPin, Activity } from 'lucide-react';
import { format } from 'date-fns';

const FDR_COLORS = {
  1: 'bg-green-700 text-white',
  2: 'bg-green-500 text-gray-900',
  3: 'bg-gray-400 text-gray-900',
  4: 'bg-red-400 text-gray-900',
  5: 'bg-red-500 text-white',
  6: 'bg-red-700 text-white',
  7: 'bg-red-900 text-white',
};

export default function FixtureModal({
  isOpen,
  onClose,
  fixtureData
}) {
  if (!isOpen || !fixtureData) return null;

  const {
    opponentTeam,
    isHome,
    kickoffTime,
    fdr
  } = fixtureData;

  const dateStr = format(new Date(kickoffTime), 'EEEE, MMMM do, yyyy');
  const timeStr = format(new Date(kickoffTime), 'h:mm a');
  const fdrColorClass = FDR_COLORS[fdr] || 'bg-gray-500 text-white';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-sm bg-gray-800 rounded-3xl shadow-2xl overflow-hidden border border-gray-700 transform transition-all scale-100 opacity-100">

        {/* Header Ribbon / Close */}
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-gray-200 hover:text-white transition-all backdrop-blur-md"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col items-center pt-8 pb-6 px-6 relative">

          {/* Opponent Logo */}
          <div className="relative mb-4">
            <div className={`absolute -inset-4 rounded-full opacity-20 blur-xl ${fdrColorClass.split(' ')[0]}`} />
            <img
              src={opponentTeam.logoUrl}
              alt={opponentTeam.name}
              className="w-24 h-24 object-contain relative z-10 drop-shadow-2xl"
            />
          </div>

          <h2 className="text-2xl font-black text-white text-center mb-1">
            {opponentTeam.name}
          </h2>
          <div className="flex items-center space-x-2 text-sm text-gray-400 mb-6 uppercase tracking-wider font-semibold">
            <MapPin size={14} />
            <span>{isHome ? 'Home' : 'Away'}</span>
          </div>

          {/* Details Card */}
          <div className="w-full bg-gray-900/80 rounded-2xl p-4 space-y-4 backdrop-blur-sm border border-gray-700/50">

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 text-gray-300">
                <Calendar size={18} className="text-blue-400" />
                <span className="text-sm font-medium">{dateStr}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 text-gray-300">
                <Clock size={18} className="text-blue-400" />
                <span className="text-sm font-medium">{timeStr}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-700/50 flex items-center justify-between">
              <div className="flex items-center space-x-3 text-gray-300">
                <Activity size={18} className="text-purple-400" />
                <span className="text-sm font-medium">FDR Rating</span>
              </div>
              <div className={`px-3 py-1 rounded-lg font-bold text-sm shadow-lg ${fdrColorClass}`}>
                {fdr}
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
