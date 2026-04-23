import { OFFICIAL_FDR_MAP } from './constants.js';

/**
 * Scale a value in [minIn, maxIn] onto the 1..11 scale, clamped.
 * @param {number} v
 * @param {number} minIn
 * @param {number} maxIn
 * @returns {number}
 */
function scaleToEleven(v, minIn, maxIn) {
  if (maxIn === minIn) return 6;
  const t = (v - minIn) / (maxIn - minIn);
  const out = 1 + Math.round(t * 10);
  return Math.max(1, Math.min(11, out));
}

/**
 * Pick which opponent strength attribute applies based on FDR mode + where the
 * opponent is playing (home/away from their perspective).
 *
 * @param {import('./types.js').Team} opp
 * @param {boolean} oppIsHome - is the opponent playing at home in this fixture
 * @param {import('./types.js').FDRMode} mode
 */
function oppStrength(opp, oppIsHome, mode) {
  if (!opp) return null;
  if (mode === 'attack') {
    // Attacking returns depend on the opponent's defensive strength.
    return oppIsHome ? opp.strength_defence_home : opp.strength_defence_away;
  }
  if (mode === 'defence') {
    // Clean-sheet / defensive returns depend on the opponent's attack.
    return oppIsHome ? opp.strength_attack_home : opp.strength_attack_away;
  }
  return oppIsHome ? opp.strength_overall_home : opp.strength_overall_away;
}

/**
 * Compute min/max of the relevant strength attribute across all teams so we can
 * normalise onto the 1..11 scale.
 * @param {import('./types.js').Team[]} teams
 * @param {import('./types.js').FDRMode} mode
 */
export function strengthRange(teams, mode) {
  const values = [];
  for (const t of teams) {
    values.push(oppStrength(t, true, mode));
    values.push(oppStrength(t, false, mode));
  }
  const nums = values.filter(v => typeof v === 'number' && !Number.isNaN(v));
  if (nums.length === 0) return { min: 0, max: 1 };
  return { min: Math.min(...nums), max: Math.max(...nums) };
}

/**
 * Compute a base FDR (1..11) for a fixture according to the chosen algorithm.
 *
 * @param {Object} args
 * @param {import('./types.js').Fixture} args.fixture
 * @param {import('./types.js').Team} args.opp - opponent team
 * @param {boolean} args.isHome - is our team at home
 * @param {import('./types.js').FDRMode} args.mode
 * @param {import('./types.js').FDRAlgorithm} args.algorithm
 * @param {{ min: number, max: number }} [args.range] - precomputed strength range
 * @param {Record<number, number>} [args.formByTeam] - teamId -> avg recent points
 * @param {{ min: number, max: number }} [args.formRange]
 * @returns {number}
 */
export function baseFdr({
  fixture,
  opp,
  isHome,
  mode,
  algorithm,
  range,
  formByTeam,
  formRange,
}) {
  if (algorithm === 'official') {
    const raw = isHome ? fixture.team_h_difficulty : fixture.team_a_difficulty;
    return OFFICIAL_FDR_MAP[raw] || 6;
  }

  if (algorithm === 'linear') {
    // Keep FPL's 1–5 difficulty but spread evenly across 1..11.
    const raw = isHome ? fixture.team_h_difficulty : fixture.team_a_difficulty;
    const linearMap = { 1: 1, 2: 4, 3: 6, 4: 8, 5: 11 };
    return linearMap[raw] || 6;
  }

  if (algorithm === 'strength') {
    if (!opp || !range) return 6;
    const strength = oppStrength(opp, !isHome, mode);
    if (strength == null) return 6;
    return scaleToEleven(strength, range.min, range.max);
  }

  if (algorithm === 'form') {
    if (!opp || !formByTeam || !formRange) return 6;
    const f = formByTeam[opp.id];
    if (f == null) {
      // Fall back to strength when no form data (e.g. first GW of season).
      if (range) {
        const strength = oppStrength(opp, !isHome, mode);
        return strength == null ? 6 : scaleToEleven(strength, range.min, range.max);
      }
      return 6;
    }
    // Higher opponent form -> harder fixture.
    return scaleToEleven(f, formRange.min, formRange.max);
  }

  return 6;
}

/**
 * Resolve a per-fixture FDR taking user overrides into account.
 *
 * @param {Object} args
 * @param {import('./types.js').Fixture} args.fixture
 * @param {number} args.teamId - our team's id
 * @param {import('./types.js').Team[]} args.teams
 * @param {Record<string, { h?: number, a?: number }>} args.fdrOverrides
 * @param {import('./types.js').FDRMode} args.mode
 * @param {import('./types.js').FDRAlgorithm} args.algorithm
 * @param {{ min: number, max: number }} [args.range]
 * @param {Record<number, number>} [args.formByTeam]
 * @param {{ min: number, max: number }} [args.formRange]
 */
export function resolveFdr({
  fixture,
  teamId,
  teams,
  fdrOverrides,
  mode,
  algorithm,
  range,
  formByTeam,
  formRange,
}) {
  const isHome = fixture.team_h === teamId;
  const oppId = isHome ? fixture.team_a : fixture.team_h;
  const opp = teams.find(t => t.id === oppId);

  const override = fdrOverrides?.[oppId];
  if (override) {
    // Home team looks up opponent's *away* override, and vice versa.
    const side = isHome ? override.a : override.h;
    if (typeof side === 'number') {
      return { fdr: side, isHome, opp, overridden: true };
    }
  }

  const fdr = baseFdr({
    fixture,
    opp,
    isHome,
    mode,
    algorithm,
    range,
    formByTeam,
    formRange,
  });

  return { fdr, isHome, opp, overridden: false };
}

/**
 * Detect runs of consecutive low-FDR (easy) or high-FDR (hard) gameweeks for a
 * team. Used for heatmap streak highlighting.
 *
 * @param {import('./types.js').GameweekSlot[]} slots
 * @param {number} [minRun=3]
 * @returns {Array<{ start: number, end: number, kind: 'easy' | 'hard' }>}
 */
export function detectRuns(slots, minRun = 3) {
  const flags = slots.map(slot => {
    if (slot.isBlank) return null;
    const avg = slot.fixtures.reduce((s, f) => s + f.fdr, 0) / slot.fixtures.length;
    if (avg <= 4) return 'easy';
    if (avg >= 8) return 'hard';
    return null;
  });

  const runs = [];
  let i = 0;
  while (i < flags.length) {
    const f = flags[i];
    if (f == null) { i++; continue; }
    let j = i;
    while (j + 1 < flags.length && flags[j + 1] === f) j++;
    if (j - i + 1 >= minRun) runs.push({ start: i, end: j, kind: f });
    i = j + 1;
  }
  return runs;
}
