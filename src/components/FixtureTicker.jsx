import { useEffect, useMemo, useState } from 'react';
import { formatDistanceToNowStrict } from 'date-fns';

/**
 * Show the next upcoming kickoff with a live countdown. While a match is in
 * progress we show a "LIVE" pill instead.
 */
export default function FixtureTicker({ fixtures, teams }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30 * 1000);
    return () => clearInterval(t);
  }, []);

  const state = useMemo(() => {
    if (!fixtures?.length || !teams?.length) return null;
    const live = fixtures.find(f => {
      if (!f.kickoff_time || f.finished) return false;
      const ko = new Date(f.kickoff_time).getTime();
      return now >= ko && now <= ko + 2 * 60 * 60 * 1000;
    });
    if (live) return { type: 'live', fixture: live };

    const upcoming = fixtures
      .filter(f => f.kickoff_time && !f.finished && new Date(f.kickoff_time).getTime() > now)
      .sort((a, b) => new Date(a.kickoff_time) - new Date(b.kickoff_time))[0];

    if (!upcoming) return null;
    return { type: 'upcoming', fixture: upcoming };
  }, [fixtures, now, teams]);

  if (!state) return null;

  const home = teams.find(t => t.id === state.fixture.team_h);
  const away = teams.find(t => t.id === state.fixture.team_a);
  if (!home || !away) return null;

  return (
    <div className="mb-4 flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 px-3 py-2 text-xs">
      {state.type === 'live' ? (
        <span className="px-2 py-0.5 rounded-full bg-red-500 text-white font-bold tracking-wider animate-pulse">LIVE</span>
      ) : (
        <span className="px-2 py-0.5 rounded-full bg-blue-500 text-white font-bold tracking-wider">NEXT</span>
      )}
      <div className="flex items-center gap-2 flex-wrap">
        <img src={home.logoUrl} alt="" className="w-4 h-4" />
        <span className="font-semibold text-slate-900 dark:text-white">{home.short_name}</span>
        <span className="text-slate-500">vs</span>
        <img src={away.logoUrl} alt="" className="w-4 h-4" />
        <span className="font-semibold text-slate-900 dark:text-white">{away.short_name}</span>
      </div>
      <span className="text-slate-500 dark:text-slate-400 ml-auto tabular-nums">
        {state.type === 'live'
          ? 'In progress'
          : `Kicks off in ${formatDistanceToNowStrict(new Date(state.fixture.kickoff_time))}`}
      </span>
    </div>
  );
}
