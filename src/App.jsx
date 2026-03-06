import { useState, useEffect, useMemo } from 'react';
import { Settings, RefreshCw, AlertTriangle } from 'lucide-react';
import { fetchFPLData } from './api';
import SettingsModal from './components/SettingsModal';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

const FDR_COLORS = {
  1: 'bg-green-700 text-white shadow-[0_0_10px_rgba(21,128,61,0.5)]',
  2: 'bg-green-400 text-green-900 shadow-[0_0_10px_rgba(74,222,128,0.5)]',
  3: 'bg-gray-400 text-gray-900 shadow-[0_0_10px_rgba(156,163,175,0.5)]',
  4: 'bg-red-400 text-red-900 shadow-[0_0_10px_rgba(248,113,113,0.5)]',
  5: 'bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.5)]',
  6: 'bg-red-700 text-white shadow-[0_0_10px_rgba(185,28,28,0.5)]',
  7: 'bg-red-900 text-white shadow-[0_0_10px_rgba(127,29,29,0.5)]',
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
              fdr = isHome ? fixture.team_h_difficulty : fixture.team_a_difficulty;
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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <RefreshCw className="w-12 h-12 text-blue-500 animate-spin" />
          <h2 className="text-xl font-semibold text-gray-200">Loading FPL Data...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl border border-red-500/30 flex flex-col items-center max-w-md text-center space-y-4">
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
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans selection:bg-blue-500/30">

      {/* Header */}
      <header className="sticky top-0 z-30 bg-gray-900/80 backdrop-blur-xl border-b border-gray-800 shadow-sm">
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
            className="p-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-white transition-all hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Settings"
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-[1920px] mx-auto p-4 sm:p-6 lg:p-8">

        <div className="bg-gray-800/50 backdrop-blur-md rounded-3xl border border-gray-700/50 shadow-2xl overflow-hidden relative">
          <div className="overflow-x-auto pb-4 custom-scrollbar">
            <table className="w-full text-sm text-left border-collapse">

              {/* Table Head */}
              <thead className="text-[10px] text-gray-400 uppercase bg-gray-900/90 backdrop-blur-xl sticky top-0 z-20">
                <tr>
                  <th scope="col" className="px-3 py-2 font-bold tracking-wider sticky left-0 z-30 bg-gray-900/90 backdrop-blur-xl border-b border-gray-800 min-w-[120px] shadow-[4px_0_12px_rgba(0,0,0,0.5)]">
                    Team & Avg FDR
                  </th>
                  {processedData.events.map(event => (
                    <th key={event.id} scope="col" className="px-2 py-2 text-center font-bold tracking-wider border-b border-gray-800 min-w-[60px]">
                      GW {event.id}
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-gray-800/50">
                {processedData.teams.map((team) => (
                  <tr key={team.id} className="hover:bg-gray-800/80 transition-colors group">

                    {/* Sticky Left Column */}
                    <td className="px-3 py-2 whitespace-nowrap sticky left-0 z-10 bg-gray-800/95 group-hover:bg-gray-700/95 backdrop-blur-md border-r border-gray-800/50 shadow-[4px_0_12px_rgba(0,0,0,0.3)] transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <img
                            src={team.logoUrl}
                            alt={team.name}
                            className="w-6 h-6 object-contain drop-shadow-md"
                            loading="lazy"
                          />
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-100 text-sm">{team.short_name}</span>
                            <span className="text-[10px] text-gray-500 font-medium leading-none">{team.name}</span>
                          </div>
                        </div>
                        <div className="ml-2 px-1.5 py-0.5 bg-gray-900 rounded border border-gray-700 text-[10px] font-mono font-bold text-gray-300 shadow-inner">
                          {team.avgFDR}
                        </div>
                      </div>
                    </td>

                    {/* Gameweek Columns */}
                    {team.teamFixtures.map((gw, i) => (
                      <td key={`${team.id}-${gw.eventId}-${i}`} className="px-1 py-1 align-middle">
                        <div className="flex flex-col items-center justify-center gap-1 h-full min-h-[40px]">
                          {gw.isBlank ? (
                            <span className="text-gray-600 text-[10px] font-medium italic bg-gray-900/50 px-2 py-0.5 rounded border border-gray-800">
                              Blank
                            </span>
                          ) : (
                            gw.fixtures.map((fixture) => (
                              <div
                                key={fixture.id}
                                className={cn(
                                  "w-full max-w-[80px] px-1 py-1 rounded-md flex flex-col items-center justify-center",
                                  FDR_COLORS[fixture.fdr] || 'bg-gray-700 text-gray-300'
                                )}
                              >
                                <span className="text-xs font-black tracking-tight leading-none mb-0.5">
                                  {fixture.opponentTeam?.short_name || 'TBD'}
                                  <span className="text-[9px] font-medium opacity-80 ml-1">
                                    ({fixture.isHome ? 'H' : 'A'})
                                  </span>
                                </span>
                                <span className="text-[9px] font-bold opacity-90 border-t border-current/20 pt-0.5 w-full text-center">
                                  FDR {fixture.fdr}
                                </span>
                              </div>
                            ))
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
