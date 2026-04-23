import { Pin, PinOff } from 'lucide-react';
import { cn } from '../utils/cn.js';
import { FDR_COLORS } from '../constants.js';

/**
 * Mobile-friendly alternative to `FixtureGrid`. Each team gets a card with a
 * horizontal strip of gameweek chips.
 */
export default function MobileFixtureCards({ processedData, pinnedTeams, togglePin }) {
  const pinnedSet = new Set(pinnedTeams);
  return (
    <div className="sm:hidden space-y-2">
      {processedData.teams.map(team => {
        const pinned = pinnedSet.has(team.id);
        return (
          <div key={team.id} className={cn(
            'rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow',
            pinned && 'ring-1 ring-amber-400/60',
          )}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <img src={team.logoUrl} alt={team.name} className="w-6 h-6" />
                <span className="font-bold text-sm text-slate-900 dark:text-white">{team.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  avg {team.avgFDR}
                </span>
                <button onClick={() => togglePin(team.id)} className="text-slate-400 hover:text-amber-500">
                  {pinned ? <Pin size={14} /> : <PinOff size={14} />}
                </button>
              </div>
            </div>
            <div className="flex overflow-x-auto gap-1.5 custom-scrollbar pb-1">
              {team.teamFixtures.map((slot, i) => (
                <div key={`${team.id}-${slot.eventId}-${i}`} className="flex-shrink-0 w-14 text-center">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">GW{slot.eventId}</div>
                  {slot.isBlank ? (
                    <div className="h-12 rounded bg-black text-gray-500 text-[10px] flex items-center justify-center font-black uppercase">Blank</div>
                  ) : (
                    <div className={cn('h-12 rounded overflow-hidden', slot.fixtures.length > 1 && 'ring-2 ring-yellow-400')}>
                      {slot.fixtures.map(f => (
                        <div key={f.id} className={cn(
                          'flex-1 flex flex-col items-center justify-center h-full',
                          FDR_COLORS[f.fdr] || 'bg-slate-800',
                          f.isHome ? 'font-bold text-white' : 'italic text-gray-200',
                        )}>
                          <span className="text-[10px] leading-none">{f.opponentTeam?.short_name || 'TBD'}</span>
                          <span className="text-[8px] opacity-80">({f.isHome ? 'H' : 'A'})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
