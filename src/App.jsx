import { useState, useEffect, useMemo } from 'react';
import { Settings, RefreshCw, AlertTriangle } from 'lucide-react';
import { fetchFPLData } from './api';
import SettingsModal from './components/SettingsModal';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

const FDR_COLORS = {
  1: 'bg-[#016D2F]',
  2: 'bg-[#1E9A45]',
  3: 'bg-[#62C051]',
  4: 'bg-[#A3D869]',
  5: 'bg-[#E1F296]',
  6: 'bg-[#FFFFFF] text-black',
  7: 'bg-[#FBD176]',
  8: 'bg-[#FA9C56]',
  9: 'bg-[#F47137]',
  10: 'bg-[#DB2726]',
  11: 'bg-[#900613]',
};

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

function App() {
  const [data, setData] = useState({ teams: [], events: [], fixturesData: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Settings State (with localStorage persistence)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState(() => localStorage.getItem('sortOrder') || 'default');
  const [gwStart, setGwStart] = useState(() => Number(localStorage.getItem('gwStart')) || 1);
  const [gwEnd, setGwEnd] = useState(() => Number(localStorage.getItem('gwEnd')) || 38);
  const [fdrOverrides, setFdrOverrides] = useState(() => {
    const saved = localStorage.getItem("fdrOverrides");
    return saved ? JSON.parse(saved) : {};
  });

  const [hiddenTeams, setHiddenTeams] = useState(() => {
    const saved = localStorage.getItem('hiddenTeams');
    return saved ? JSON.parse(saved) : [];
  });

  // Modal State

  useEffect(() => {
    localStorage.setItem('sortOrder', sortOrder);
    localStorage.setItem('gwStart', gwStart);
    localStorage.setItem('gwEnd', gwEnd);
    localStorage.setItem('hiddenTeams', JSON.stringify(hiddenTeams));
    localStorage.setItem('fdrOverrides', JSON.stringify(fdrOverrides));
  }, [sortOrder, gwStart, gwEnd, hiddenTeams, fdrOverrides]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFPLData();

      // Auto-set gwStart and gwEnd based on current events if not set by user explicitly before
      if (!localStorage.getItem('gwStart') && result.events.length > 0) {
        const nextEvent = result.events.find(e => !e.finished) || result.events[0];
        setGwStart(nextEvent.id);
        setGwEnd(Math.min(nextEvent.id + 5, 38)); // Show next 6 gameweeks by default
      }

      setData(result);
    } catch (err) {
      console.error(err);
      setError("Failed to load FPL data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const toggleTeamVisibility = (teamId) => {
    setHiddenTeams(prev =>
      prev.includes(teamId)
        ? prev.filter(id => id !== teamId)
        : [...prev, teamId]
    );
  };

  const handleLookahead = (count) => {
    if (count === 'all') {
      setGwEnd(38);
    } else {
      setGwEnd(Math.min(gwStart + count - 1, 38));
    }
    if (sortOrder !== 'easiest') {
      setSortOrder('easiest');
    }
  };

  // Process data for the grid
  const processedData = useMemo(() => {
    if (!data.teams.length || !data.events.length || !data.fixturesData.length) return [];

    const visibleEvents = data.events.filter(e => e.id >= gwStart && e.id <= gwEnd);

    let processedTeams = data.teams
      .filter(team => !hiddenTeams.includes(team.id))
      .map(team => {
        let totalFDR = 0;
        let fixtureCount = 0;

        const teamFixtures = visibleEvents.map(event => {
          // Find all fixtures for this team in this event
          const eventFixtures = data.fixturesData.filter(f =>
            f.event === event.id &&
            (f.team_h === team.id || f.team_a === team.id)
          );

          if (eventFixtures.length === 0) return { eventId: event.id, isBlank: true };

          const mappedFixtures = eventFixtures.map(fixture => {
            const isHome = fixture.team_h === team.id;
            const opponentId = isHome ? fixture.team_a : fixture.team_h;
            const opponentTeam = data.teams.find(t => t.id === opponentId);

            let fdr;
            if (fdrOverrides[opponentId]) {
              // The difficulty of the fixture depends on how strong the opponent is.
              // If we are Home, the opponent is Away, so we check their Away override.
              const override = isHome ? fdrOverrides[opponentId].a : fdrOverrides[opponentId].h;
              if (override) {
                fdr = Number(override);
              }
            }
            if (fdr === undefined) {
              const baseFdr = isHome ? fixture.team_h_difficulty : fixture.team_a_difficulty;
              // Map FPL 1-5 scale to our 1-11 scale
              const fdrMap = { 1: 1, 2: 3, 3: 6, 4: 9, 5: 11 };
              fdr = fdrMap[baseFdr] || 6;
            }

            totalFDR += fdr;
            fixtureCount++;

            return {
              id: fixture.id,
              eventId: event.id,
              opponentTeam,
              isHome,
              fdr,
              kickoffTime: fixture.kickoff_time,
              finished: fixture.finished
            };
          });

          return {
            eventId: event.id,
            isBlank: false,
            fixtures: mappedFixtures
          };
        });

        const avgFDR = fixtureCount > 0 ? (totalFDR / fixtureCount).toFixed(2) : 0;

        return {
          ...team,
          avgFDR: parseFloat(avgFDR),
          teamFixtures
        };
      });

    // Sort teams
    if (sortOrder === 'easiest') {
      processedTeams.sort((a, b) => a.avgFDR - b.avgFDR);
    } else if (sortOrder === 'hardest') {
      processedTeams.sort((a, b) => b.avgFDR - a.avgFDR);
    } else {
      processedTeams.sort((a, b) => a.id - b.id);
    }

    return {
      teams: processedTeams,
      events: visibleEvents
    };
  }, [data, gwStart, gwEnd, hiddenTeams, sortOrder, fdrOverrides]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <RefreshCw className="w-12 h-12 text-blue-500 animate-spin" />
          <h2 className="text-xl font-semibold text-gray-200">Loading FPL Data...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 p-8 rounded-2xl shadow-2xl border border-red-500/30 flex flex-col items-center max-w-md text-center space-y-4">
          <AlertTriangle className="w-16 h-16 text-red-500" />
          <h2 className="text-2xl font-bold text-white">Oops!</h2>
          <p className="text-gray-400">{error}</p>
          <button
            onClick={loadData}
            className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-gray-100 font-sans selection:bg-blue-500/30">

      {/* Header */}
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800 shadow-sm">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <span className="font-bold text-white text-sm">FDR</span>
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-100 to-gray-400 tracking-tight hidden sm:block">
              Fantasy Premier League
            </h1>
          </div>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-gray-300 hover:text-white transition-all hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Settings"
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-[1920px] mx-auto p-4 sm:p-6 lg:p-8">

        {/* Lookahead Filter */}
        <div className="mb-4 flex space-x-2">
          <button onClick={() => handleLookahead('all')} className="px-3 py-1.5 text-xs font-semibold rounded-md bg-slate-900 border border-slate-800 text-gray-300 hover:bg-slate-800 transition-colors">All</button>
          <button onClick={() => handleLookahead(3)} className="px-3 py-1.5 text-xs font-semibold rounded-md bg-slate-900 border border-slate-800 text-gray-300 hover:bg-slate-800 transition-colors">Next 3</button>
          <button onClick={() => handleLookahead(5)} className="px-3 py-1.5 text-xs font-semibold rounded-md bg-slate-900 border border-slate-800 text-gray-300 hover:bg-slate-800 transition-colors">Next 5</button>
          <button onClick={() => handleLookahead(8)} className="px-3 py-1.5 text-xs font-semibold rounded-md bg-slate-900 border border-slate-800 text-gray-300 hover:bg-slate-800 transition-colors">Next 8</button>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-md rounded-3xl border border-slate-800/50 shadow-2xl overflow-hidden relative">
          <div className="overflow-x-auto pb-4 custom-scrollbar">
            <table className="w-full text-sm text-left border-collapse">

              {/* Table Head */}
              <thead className="text-[10px] text-gray-400 uppercase bg-slate-950/90 backdrop-blur-xl sticky top-0 z-20">
                <tr>
                  <th scope="col" className="px-2 py-2 font-bold tracking-wider sticky left-0 z-30 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800 min-w-[80px] shadow-[4px_0_12px_rgba(0,0,0,0.5)]">
                    Team
                  </th>
                  {processedData.events.map(event => (
                    <th key={event.id} scope="col" className="px-0 py-2 text-center font-bold tracking-wider border-b border-slate-800 w-12">
                      GW {event.id}
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-slate-800">
                {processedData.teams.map((team) => (
                  <tr key={team.id} className="transition-colors group">

                    {/* Sticky Left Column */}
                    <td className="px-2 py-2 whitespace-nowrap sticky left-0 z-10 bg-slate-950 backdrop-blur-md border-r border-slate-800 shadow-[4px_0_12px_rgba(0,0,0,0.3)]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <img
                            src={team.logoUrl}
                            alt={team.name}
                            className="w-6 h-6 object-contain drop-shadow-md"
                            loading="lazy"
                          />
                          <span className="font-bold text-gray-100 text-xs hidden sm:inline-block">{team.short_name}</span>
                        </div>
                        <div className="ml-1 px-1 py-0.5 bg-slate-900 rounded border border-slate-700 text-[10px] font-mono font-bold text-gray-300 shadow-inner">
                          {team.avgFDR}
                        </div>
                      </div>
                    </td>

                    {/* Gameweek Columns */}
                    {team.teamFixtures.map((gw, i) => (
                      <td key={`${team.id}-${gw.eventId}-${i}`} className="p-0 align-middle border-r border-slate-800 last:border-r-0">
                        <div className="w-12 h-12 mx-auto flex flex-col items-center justify-center p-0">
                          {gw.isBlank ? (
                            <div className="w-full h-full bg-black flex items-center justify-center">
                              <span className="text-gray-600 text-[10px] font-black uppercase">
                                Blank
                              </span>
                            </div>
                          ) : (
                            <div className={cn(
                              "w-full h-full flex flex-col items-center justify-center",
                              gw.fixtures.length > 1 ? "ring-2 ring-yellow-400 ring-inset" : ""
                            )}>
                              {gw.fixtures.map((fixture) => (
                                <div
                                  key={fixture.id}
                                  className={cn(
                                    "flex-1 w-full flex flex-col items-center justify-center",
                                    FDR_COLORS[fixture.fdr] || 'bg-slate-800',
                                    fixture.isHome ? 'font-bold' : 'italic font-medium',
                                    !fixture.isHome && fixture.fdr !== 6 && 'text-gray-300/80 drop-shadow-md',
                                    fixture.isHome && fixture.fdr !== 6 && 'text-white drop-shadow-md'
                                  )}
                                >
                                  <span className="text-[10px] sm:text-[10px] tracking-tight leading-none">
                                    {fixture.opponentTeam?.short_name || 'TBD'}
                                  </span>
                                  <span className="text-[8px] opacity-80 mt-0.5">
                                    ({fixture.isHome ? 'H' : 'A'})
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    ))}

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        gwStart={gwStart}
        setGwStart={setGwStart}
        gwEnd={gwEnd}
        setGwEnd={setGwEnd}
        hiddenTeams={hiddenTeams}
        toggleTeamVisibility={toggleTeamVisibility}
        teams={data.teams}
        fdrOverrides={fdrOverrides}
        setFdrOverrides={setFdrOverrides}
      />

    </div>
  );
}

export default App;
