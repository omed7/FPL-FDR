import { forwardRef } from 'react';
import { Pin, PinOff } from 'lucide-react';
import FixtureCell from './FixtureCell.jsx';
import { columnAverages } from '../utils/processData.js';
import { detectRuns } from '../fdr.js';
import { cn } from '../utils/cn.js';

const FixtureGrid = forwardRef(function FixtureGrid({
  processedData,
  pinnedTeams,
  togglePin,
  highlightPlayerTeamIds,
  showRuns,
}, ref) {
  const averages = columnAverages(processedData);
  const pinnedSet = new Set(pinnedTeams);

  return (
    <div ref={ref} className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-md rounded-3xl border border-slate-200 dark:border-slate-800/50 shadow-2xl overflow-hidden relative">
      <div className="overflow-x-auto pb-4 custom-scrollbar">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="text-[10px] text-slate-600 dark:text-gray-400 uppercase bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl sticky top-0 z-20">
            <tr>
              <th scope="col" className="px-2 py-2 font-bold tracking-wider sticky left-0 z-30 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 min-w-[88px] shadow-[4px_0_12px_rgba(0,0,0,0.3)]">
                Team
              </th>
              {processedData.events.map(event => (
                <th key={event.id} scope="col" className="px-0 py-2 text-center font-bold tracking-wider border-b border-slate-200 dark:border-slate-800 w-12">
                  GW {event.id}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {processedData.teams.map((team) => {
              const runs = showRuns ? detectRuns(team.teamFixtures) : [];
              const pinned = pinnedSet.has(team.id);
              return (
                <tr key={team.id} className="transition-colors group">
                  <td className={cn(
                    'px-2 py-2 whitespace-nowrap sticky left-0 z-10 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 shadow-[4px_0_12px_rgba(0,0,0,0.15)]',
                    pinned && 'ring-1 ring-inset ring-amber-400/60',
                  )}>
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center space-x-2 min-w-0">
                        <button
                          onClick={() => togglePin(team.id)}
                          title={pinned ? 'Unpin' : 'Pin to top'}
                          className="text-slate-400 hover:text-amber-500 transition-colors"
                        >
                          {pinned ? <Pin size={12} /> : <PinOff size={12} />}
                        </button>
                        <img src={team.logoUrl} alt={team.name} className="w-6 h-6 object-contain drop-shadow-md" loading="lazy" />
                        <span className="font-bold text-slate-900 dark:text-gray-100 text-xs hidden sm:inline-block">{team.short_name}</span>
                      </div>
                      <div className="ml-1 px-1 py-0.5 bg-slate-100 dark:bg-slate-900 rounded border border-slate-300 dark:border-slate-700 text-[10px] font-mono font-bold text-slate-700 dark:text-gray-300 shadow-inner">
                        {team.avgFDR}
                      </div>
                    </div>
                  </td>
                  {team.teamFixtures.map((slot, i) => {
                    const run = runs.find(r => i >= r.start && i <= r.end);
                    return (
                      <td
                        key={`${team.id}-${slot.eventId}-${i}`}
                        className={cn(
                          'p-0 align-middle border-r border-slate-200 dark:border-slate-800 last:border-r-0',
                          run && run.kind === 'easy' && 'ring-2 ring-inset ring-emerald-400/70',
                          run && run.kind === 'hard' && 'ring-2 ring-inset ring-rose-500/70',
                        )}
                      >
                        <FixtureCell slot={slot} highlightPlayerTeamIds={highlightPlayerTeamIds} />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>

          <tfoot className="bg-slate-50 dark:bg-slate-950/90 sticky bottom-0">
            <tr>
              <td className="px-2 py-2 sticky left-0 bg-slate-50 dark:bg-slate-950/90 border-t border-slate-200 dark:border-slate-800 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                GW Avg
              </td>
              {averages.map((avg, i) => (
                <td key={`avg-${i}`} className="px-0 py-2 text-center border-t border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] font-mono font-semibold text-slate-700 dark:text-slate-300">
                    {avg == null ? '–' : avg.toFixed(2)}
                  </span>
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
});

export default FixtureGrid;
