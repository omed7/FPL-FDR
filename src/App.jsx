import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

import Header from './components/Header.jsx';
import LookaheadBar from './components/LookaheadBar.jsx';
import FixtureGrid from './components/FixtureGrid.jsx';
import MobileFixtureCards from './components/MobileFixtureCards.jsx';
import FixtureTicker from './components/FixtureTicker.jsx';
import SettingsModal from './components/SettingsModal.jsx';
import MyTeamModal from './components/MyTeamModal.jsx';
import TransferPlannerModal from './components/TransferPlannerModal.jsx';
import PlayerLayerModal from './components/PlayerLayerModal.jsx';
import HistoricalAccuracyModal from './components/HistoricalAccuracyModal.jsx';

import { useFPLData } from './hooks/useFPLData.js';
import { useLocalStorage } from './hooks/useLocalStorage.js';
import { useTheme } from './hooks/useTheme.js';
import { useHashState } from './hooks/useHashState.js';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts.js';
import { processData } from './utils/processData.js';
import { toCsv, downloadText, exportPng } from './utils/export.js';

export default function App() {
  const [theme, toggleTheme] = useTheme();
  const { data, loading, error, lastRefreshed, refresh } = useFPLData();

  // Persisted user settings.
  const [sortOrder, setSortOrder] = useLocalStorage('sortOrder', 'default');
  const [gwStart, setGwStart] = useLocalStorage('gwStart', 1);
  const [gwEnd, setGwEnd] = useLocalStorage('gwEnd', 38);
  const [fdrOverrides, setFdrOverrides] = useLocalStorage('fdrOverrides', {});
  const [hiddenTeams, setHiddenTeams] = useLocalStorage('hiddenTeams', []);
  const [pinnedTeams, setPinnedTeams] = useLocalStorage('pinnedTeams', []);
  const [fdrMode, setFdrMode] = useLocalStorage('fdrMode', 'overall');
  const [fdrAlgorithm, setFdrAlgorithm] = useLocalStorage('fdrAlgorithm', 'official');
  const [showRuns, setShowRuns] = useLocalStorage('showRuns', true);
  const [highlightedPlayerIds, setHighlightedPlayerIds] = useLocalStorage('highlightedPlayerIds', []);

  // Modal state.
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMyTeamOpen, setIsMyTeamOpen] = useState(false);
  const [isPlannerOpen, setIsPlannerOpen] = useState(false);
  const [isPlayersOpen, setIsPlayersOpen] = useState(false);
  const [isHistoricalOpen, setIsHistoricalOpen] = useState(false);

  // One-time default window once events are loaded.
  const didAutoSetWindowRef = useRef(false);
  useEffect(() => {
    if (didAutoSetWindowRef.current) return;
    if (!data.events.length) return;
    didAutoSetWindowRef.current = true;
    if (!localStorage.getItem('gwStart')) {
      const nextEvent = data.events.find(e => !e.finished) || data.events[0];
      setGwStart(nextEvent.id);
      setGwEnd(Math.min(nextEvent.id + 5, 38));
    }
  }, [data.events, setGwStart, setGwEnd]);

  // Form-by-team approximated from summed player `form` values.
  const formByTeam = useMemo(() => {
    const acc = {};
    for (const el of data.elements) {
      const f = parseFloat(el.form);
      if (Number.isNaN(f)) continue;
      acc[el.team] = (acc[el.team] || 0) + f;
    }
    return acc;
  }, [data.elements]);

  const processed = useMemo(() => processData({
    teams: data.teams,
    events: data.events,
    fixturesData: data.fixturesData,
    gwStart, gwEnd, hiddenTeams, pinnedTeams, fdrOverrides, sortOrder,
    mode: fdrMode, algorithm: fdrAlgorithm, formByTeam,
  }), [data, gwStart, gwEnd, hiddenTeams, pinnedTeams, fdrOverrides, sortOrder, fdrMode, fdrAlgorithm, formByTeam]);

  const currentEventId = useMemo(() => {
    const current = (data.allEvents || []).find(e => e.is_current) || (data.allEvents || []).find(e => e.is_next);
    return current?.id ?? gwStart;
  }, [data.allEvents, gwStart]);

  // Share link state shape.
  const shareState = { gwStart, gwEnd, sortOrder, fdrMode, fdrAlgorithm, hiddenTeams, pinnedTeams, fdrOverrides, showRuns };
  const { buildShareUrl } = useHashState(shareState, (incoming) => {
    if (incoming.gwStart != null) setGwStart(incoming.gwStart);
    if (incoming.gwEnd != null) setGwEnd(incoming.gwEnd);
    if (incoming.sortOrder) setSortOrder(incoming.sortOrder);
    if (incoming.fdrMode) setFdrMode(incoming.fdrMode);
    if (incoming.fdrAlgorithm) setFdrAlgorithm(incoming.fdrAlgorithm);
    if (Array.isArray(incoming.hiddenTeams)) setHiddenTeams(incoming.hiddenTeams);
    if (Array.isArray(incoming.pinnedTeams)) setPinnedTeams(incoming.pinnedTeams);
    if (incoming.fdrOverrides) setFdrOverrides(incoming.fdrOverrides);
    if (typeof incoming.showRuns === 'boolean') setShowRuns(incoming.showRuns);
  });

  // Actions
  const toggleTeamVisibility = (teamId) => {
    setHiddenTeams(prev => prev.includes(teamId) ? prev.filter(id => id !== teamId) : [...prev, teamId]);
  };
  const togglePin = (teamId) => {
    setPinnedTeams(prev => prev.includes(teamId) ? prev.filter(id => id !== teamId) : [...prev, teamId]);
  };
  const handleLookahead = (count) => {
    if (count === 'all') setGwEnd(38);
    else setGwEnd(Math.min(gwStart + count - 1, 38));
    if (sortOrder !== 'easiest') setSortOrder('easiest');
  };
  const shiftWindow = useCallback((delta) => {
    const nextStart = Math.max(1, Math.min(38, gwStart + delta));
    const size = Math.max(1, gwEnd - gwStart + 1);
    setGwStart(nextStart);
    setGwEnd(Math.min(38, nextStart + size - 1));
  }, [gwStart, gwEnd, setGwStart, setGwEnd]);

  const onShare = useCallback(async () => {
    const url = buildShareUrl();
    try {
      await navigator.clipboard.writeText(url);
      // Minimal feedback via browser title flash — avoid bringing in a toast dep.
      const prev = document.title;
      document.title = 'Link copied!';
      setTimeout(() => { document.title = prev; }, 1200);
    } catch {
      window.prompt('Copy this link:', url);
    }
  }, [buildShareUrl]);

  const gridRef = useRef(null);
  const onExportCsv = useCallback(() => {
    if (!processed.teams.length) return;
    downloadText(`fpl-fdr-gw${gwStart}-${gwEnd}.csv`, toCsv(processed), 'text/csv');
  }, [processed, gwStart, gwEnd]);
  const onExportPng = useCallback(() => {
    if (gridRef.current) exportPng(gridRef.current, `fpl-fdr-gw${gwStart}-${gwEnd}.png`);
  }, [gwStart, gwEnd]);

  // Keyboard shortcuts.
  useKeyboardShortcuts(useMemo(() => [
    { key: 's', handler: () => setIsSettingsOpen(v => !v) },
    { key: 'r', handler: () => refresh() },
    { key: 'ArrowLeft', handler: () => shiftWindow(-(gwEnd - gwStart + 1)) },
    { key: 'ArrowRight', handler: () => shiftWindow(gwEnd - gwStart + 1) },
    { key: 't', handler: () => toggleTheme() },
    { key: '?', handler: () => alert('Shortcuts: s settings · r refresh · ←/→ shift window · t theme') },
  ], [gwStart, gwEnd, refresh, toggleTheme, shiftWindow]));

  const highlightPlayerTeamIds = useMemo(() => {
    if (!highlightedPlayerIds?.length) return null;
    const set = new Set();
    for (const id of highlightedPlayerIds) {
      const el = data.elements.find(e => e.id === id);
      if (el) set.add(el.team);
    }
    return set;
  }, [highlightedPlayerIds, data.elements]);

  if (loading && data.teams.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <RefreshCw className="w-12 h-12 text-blue-500 animate-spin" />
          <h2 className="text-xl font-semibold text-slate-700 dark:text-gray-200">Loading FPL Data…</h2>
        </div>
      </div>
    );
  }

  if (error && data.teams.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-2xl border border-red-500/30 flex flex-col items-center max-w-md text-center space-y-4">
          <AlertTriangle className="w-16 h-16 text-red-500" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Oops!</h2>
          <p className="text-slate-500 dark:text-gray-400">{error}</p>
          <button onClick={refresh} className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-gray-100 font-sans selection:bg-blue-500/30">
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        lastRefreshed={lastRefreshed}
        loading={loading}
        onRefresh={refresh}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenMyTeam={() => setIsMyTeamOpen(true)}
        onOpenTransferPlanner={() => setIsPlannerOpen(true)}
        onOpenPlayerLayer={() => setIsPlayersOpen(true)}
        onOpenHistorical={() => setIsHistoricalOpen(true)}
        onShare={onShare}
        onExportCsv={onExportCsv}
        onExportPng={onExportPng}
      />

      <main className="max-w-[1920px] mx-auto p-4 sm:p-6 lg:p-8">
        <FixtureTicker fixtures={data.fixturesData} teams={data.teams} />
        <LookaheadBar
          onLookahead={handleLookahead}
          gwStart={gwStart}
          gwEnd={gwEnd}
          onShiftWindow={shiftWindow}
        />

        {/* Desktop / tablet grid */}
        <div className="hidden sm:block">
          <FixtureGrid
            ref={gridRef}
            processedData={processed}
            pinnedTeams={pinnedTeams}
            togglePin={togglePin}
            highlightPlayerTeamIds={highlightPlayerTeamIds}
            showRuns={showRuns}
          />
        </div>

        {/* Mobile */}
        <MobileFixtureCards
          processedData={processed}
          pinnedTeams={pinnedTeams}
          togglePin={togglePin}
        />
      </main>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        sortOrder={sortOrder} setSortOrder={setSortOrder}
        gwStart={gwStart} setGwStart={setGwStart}
        gwEnd={gwEnd} setGwEnd={setGwEnd}
        hiddenTeams={hiddenTeams} toggleTeamVisibility={toggleTeamVisibility}
        teams={data.teams}
        fdrOverrides={fdrOverrides} setFdrOverrides={setFdrOverrides}
        fdrMode={fdrMode} setFdrMode={setFdrMode}
        fdrAlgorithm={fdrAlgorithm} setFdrAlgorithm={setFdrAlgorithm}
        showRuns={showRuns} setShowRuns={setShowRuns}
        pinnedTeams={pinnedTeams} togglePin={togglePin}
      />

      <MyTeamModal
        isOpen={isMyTeamOpen}
        onClose={() => setIsMyTeamOpen(false)}
        teams={data.teams}
        elements={data.elements}
        currentEventId={currentEventId}
        onSquadChange={(teamIds, playerIds) => {
          // When squad is loaded, auto-highlight its players.
          setHighlightedPlayerIds(playerIds);
          // Also auto-pin their teams for quick scanning.
          setPinnedTeams(prev => Array.from(new Set([...prev, ...teamIds])));
        }}
        processedData={processed}
      />

      <TransferPlannerModal
        isOpen={isPlannerOpen}
        onClose={() => setIsPlannerOpen(false)}
        elements={data.elements}
        teams={data.teams}
        processedData={processed}
      />

      <PlayerLayerModal
        isOpen={isPlayersOpen}
        onClose={() => setIsPlayersOpen(false)}
        elements={data.elements}
        teams={data.teams}
        onHighlight={setHighlightedPlayerIds}
        highlightedPlayerIds={highlightedPlayerIds}
      />

      <HistoricalAccuracyModal
        isOpen={isHistoricalOpen}
        onClose={() => setIsHistoricalOpen(false)}
        allEvents={data.allEvents}
        fixturesData={data.fixturesData}
        elements={data.elements}
        teams={data.teams}
      />
    </div>
  );
}
