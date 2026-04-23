import { resolveFdr, strengthRange } from '../fdr.js';

/**
 * Build per-team rows of fixtures for the visible gameweek window.
 *
 * @param {Object} args
 * @param {import('../types.js').Team[]} args.teams
 * @param {import('../types.js').Event[]} args.events
 * @param {import('../types.js').Fixture[]} args.fixturesData
 * @param {number} args.gwStart
 * @param {number} args.gwEnd
 * @param {number[]} args.hiddenTeams
 * @param {number[]} args.pinnedTeams - ids pinned to the top of the grid
 * @param {Record<string, { h?: number, a?: number }>} args.fdrOverrides
 * @param {import('../types.js').SortOrder} args.sortOrder
 * @param {import('../types.js').FDRMode} args.mode
 * @param {import('../types.js').FDRAlgorithm} args.algorithm
 * @param {Record<number, number>} [args.formByTeam]
 */
export function processData({
  teams,
  events,
  fixturesData,
  gwStart,
  gwEnd,
  hiddenTeams,
  pinnedTeams,
  fdrOverrides,
  sortOrder,
  mode,
  algorithm,
  formByTeam,
}) {
  if (!teams.length || !events.length || !fixturesData.length) {
    return { teams: [], events: [] };
  }

  const visibleEvents = events.filter(e => e.id >= gwStart && e.id <= gwEnd);
  const range = strengthRange(teams, mode);
  const formValues = formByTeam ? Object.values(formByTeam) : [];
  const formRange = formValues.length
    ? { min: Math.min(...formValues), max: Math.max(...formValues) }
    : undefined;

  const fixturesByEventTeam = new Map();
  for (const fixture of fixturesData) {
    if (!fixture.event) continue;
    const key = (teamId) => `${fixture.event}:${teamId}`;
    const homeKey = key(fixture.team_h);
    const awayKey = key(fixture.team_a);
    if (!fixturesByEventTeam.has(homeKey)) fixturesByEventTeam.set(homeKey, []);
    if (!fixturesByEventTeam.has(awayKey)) fixturesByEventTeam.set(awayKey, []);
    fixturesByEventTeam.get(homeKey).push(fixture);
    fixturesByEventTeam.get(awayKey).push(fixture);
  }

  const processedTeams = teams
    .filter(team => !hiddenTeams.includes(team.id))
    .map(team => {
      let totalFDR = 0;
      let fixtureCount = 0;

      const teamFixtures = visibleEvents.map(event => {
        const eventFixtures = fixturesByEventTeam.get(`${event.id}:${team.id}`) || [];
        if (eventFixtures.length === 0) return { eventId: event.id, isBlank: true };

        const mappedFixtures = eventFixtures.map(fixture => {
          const { fdr, isHome, opp, overridden } = resolveFdr({
            fixture,
            teamId: team.id,
            teams,
            fdrOverrides,
            mode,
            algorithm,
            range,
            formByTeam,
            formRange,
          });
          totalFDR += fdr;
          fixtureCount++;
          return {
            id: fixture.id,
            eventId: event.id,
            opponentTeam: opp,
            isHome,
            fdr,
            overridden,
            kickoffTime: fixture.kickoff_time,
            finished: fixture.finished,
            team_h_score: fixture.team_h_score,
            team_a_score: fixture.team_a_score,
          };
        });

        return { eventId: event.id, isBlank: false, fixtures: mappedFixtures };
      });

      const avgFDR = fixtureCount > 0
        ? parseFloat((totalFDR / fixtureCount).toFixed(2))
        : 0;

      return { ...team, avgFDR, teamFixtures };
    });

  if (sortOrder === 'easiest') {
    processedTeams.sort((a, b) => a.avgFDR - b.avgFDR);
  } else if (sortOrder === 'hardest') {
    processedTeams.sort((a, b) => b.avgFDR - a.avgFDR);
  } else {
    processedTeams.sort((a, b) => a.id - b.id);
  }

  // Pinned teams float to the top, preserving relative order from the main sort.
  if (pinnedTeams && pinnedTeams.length) {
    const pinnedSet = new Set(pinnedTeams);
    const pinned = processedTeams.filter(t => pinnedSet.has(t.id));
    const rest = processedTeams.filter(t => !pinnedSet.has(t.id));
    return { teams: [...pinned, ...rest], events: visibleEvents, pinnedIds: pinnedTeams };
  }

  return { teams: processedTeams, events: visibleEvents, pinnedIds: [] };
}

/**
 * Per-gameweek average FDR across a processed grid (for the footer row).
 * @param {ReturnType<typeof processData>} processed
 */
export function columnAverages(processed) {
  const perEvent = processed.events.map(ev => {
    let total = 0;
    let count = 0;
    for (const team of processed.teams) {
      const slot = team.teamFixtures.find(t => t.eventId === ev.id);
      if (!slot || slot.isBlank) continue;
      for (const fx of slot.fixtures) {
        total += fx.fdr;
        count++;
      }
    }
    return count ? +(total / count).toFixed(2) : null;
  });
  return perEvent;
}
