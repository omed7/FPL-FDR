import { format } from 'date-fns';
import { cn } from '../utils/cn.js';
import { FDR_COLORS } from '../constants.js';

export default function FixtureCell({ slot, highlightPlayerTeamIds }) {
  if (slot.isBlank) {
    return (
      <div className="w-12 h-12 mx-auto flex flex-col items-center justify-center">
        <div className="w-full h-full bg-black flex items-center justify-center">
          <span className="text-gray-600 text-[10px] font-black uppercase">Blank</span>
        </div>
      </div>
    );
  }

  const isDouble = slot.fixtures.length > 1;

  return (
    <div className="w-12 h-12 mx-auto flex flex-col items-center justify-center relative">
      <div className={cn(
        'w-full h-full flex flex-col items-center justify-center',
        isDouble && 'ring-2 ring-yellow-400 ring-inset'
      )}>
        {slot.fixtures.map((fixture) => {
          const tooltip = formatTooltip(fixture);
          const playerMatch = highlightPlayerTeamIds?.has?.(fixture.opponentTeam?.id);
          return (
            <div
              key={fixture.id}
              title={tooltip}
              className={cn(
                'flex-1 w-full flex flex-col items-center justify-center relative',
                FDR_COLORS[fixture.fdr] || 'bg-slate-800',
                fixture.isHome ? 'font-bold' : 'italic font-medium',
                !fixture.isHome && fixture.fdr !== 6 && 'text-gray-300/80 drop-shadow-md',
                fixture.isHome && fixture.fdr !== 6 && 'text-white drop-shadow-md',
                playerMatch && 'outline outline-2 outline-sky-400',
                fixture.overridden && 'ring-1 ring-inset ring-fuchsia-400/70',
              )}
            >
              <span className="text-[10px] tracking-tight leading-none">
                {fixture.opponentTeam?.short_name || 'TBD'}
              </span>
              <span className="text-[8px] opacity-80 mt-0.5">
                ({fixture.isHome ? 'H' : 'A'})
              </span>
            </div>
          );
        })}
      </div>
      {isDouble && (
        <span className="absolute -top-1 -right-1 px-1 text-[8px] font-bold rounded bg-yellow-400 text-black">DGW</span>
      )}
    </div>
  );
}

function formatTooltip(fixture) {
  const parts = [];
  parts.push(`${fixture.isHome ? 'H' : 'A'} vs ${fixture.opponentTeam?.name ?? 'TBD'}`);
  parts.push(`FDR ${fixture.fdr}${fixture.overridden ? ' (override)' : ''}`);
  if (fixture.kickoffTime) {
    try {
      parts.push(format(new Date(fixture.kickoffTime), 'EEE d MMM HH:mm'));
    } catch {
      /* ignore date parse errors */
    }
  }
  if (fixture.finished && fixture.team_h_score != null && fixture.team_a_score != null) {
    parts.push(`FT ${fixture.team_h_score}-${fixture.team_a_score}`);
  }
  return parts.join(' · ');
}
