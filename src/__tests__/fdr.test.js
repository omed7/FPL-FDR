import { describe, it, expect } from 'vitest';
import { baseFdr, resolveFdr, strengthRange, detectRuns } from '../fdr.js';

const TEAMS = [
  { id: 1, name: 'A', short_name: 'A', strength_overall_home: 1100, strength_overall_away: 1090, strength_attack_home: 1200, strength_attack_away: 1150, strength_defence_home: 1050, strength_defence_away: 1000 },
  { id: 2, name: 'B', short_name: 'B', strength_overall_home: 1300, strength_overall_away: 1280, strength_attack_home: 1350, strength_attack_away: 1300, strength_defence_home: 1250, strength_defence_away: 1200 },
  { id: 3, name: 'C', short_name: 'C', strength_overall_home: 1200, strength_overall_away: 1180, strength_attack_home: 1250, strength_attack_away: 1220, strength_defence_home: 1150, strength_defence_away: 1100 },
];

describe('baseFdr', () => {
  it('maps the official 1-5 scale into 1/3/6/9/11 buckets', () => {
    const f = { team_h: 1, team_a: 2, team_h_difficulty: 5, team_a_difficulty: 2 };
    expect(baseFdr({ fixture: f, opp: TEAMS[1], isHome: true, mode: 'overall', algorithm: 'official' })).toBe(11);
    expect(baseFdr({ fixture: f, opp: TEAMS[0], isHome: false, mode: 'overall', algorithm: 'official' })).toBe(3);
  });

  it('strength algorithm clamps to 1-11', () => {
    const range = strengthRange(TEAMS, 'overall');
    const f = { team_h: 1, team_a: 2, team_h_difficulty: 3, team_a_difficulty: 3 };
    const weakest = baseFdr({ fixture: f, opp: TEAMS[0], isHome: false, mode: 'overall', algorithm: 'strength', range });
    const strongest = baseFdr({ fixture: f, opp: TEAMS[1], isHome: false, mode: 'overall', algorithm: 'strength', range });
    expect(weakest).toBeGreaterThanOrEqual(1);
    expect(strongest).toBeLessThanOrEqual(11);
    expect(strongest).toBeGreaterThan(weakest);
  });
});

describe('resolveFdr', () => {
  const fixture = { id: 100, team_h: 1, team_a: 2, team_h_difficulty: 4, team_a_difficulty: 2, kickoff_time: '', finished: false };

  it('uses override for home team looking up opponent away value', () => {
    const { fdr, overridden, isHome, opp } = resolveFdr({
      fixture,
      teamId: 1,
      teams: TEAMS,
      fdrOverrides: { 2: { a: 7 } },
      mode: 'overall',
      algorithm: 'official',
    });
    expect(isHome).toBe(true);
    expect(opp.id).toBe(2);
    expect(overridden).toBe(true);
    expect(fdr).toBe(7);
  });

  it('falls back to algorithm when override missing', () => {
    const { fdr, overridden } = resolveFdr({
      fixture,
      teamId: 1,
      teams: TEAMS,
      fdrOverrides: {},
      mode: 'overall',
      algorithm: 'official',
    });
    expect(overridden).toBe(false);
    expect(fdr).toBe(9);
  });

  it('away team reads opponent home override', () => {
    const { fdr } = resolveFdr({
      fixture,
      teamId: 2,
      teams: TEAMS,
      fdrOverrides: { 1: { h: 10 } },
      mode: 'overall',
      algorithm: 'official',
    });
    expect(fdr).toBe(10);
  });
});

describe('detectRuns', () => {
  it('detects 3+ consecutive easy fixtures', () => {
    const slots = [
      { isBlank: false, fixtures: [{ fdr: 3 }] },
      { isBlank: false, fixtures: [{ fdr: 2 }] },
      { isBlank: false, fixtures: [{ fdr: 4 }] },
      { isBlank: false, fixtures: [{ fdr: 7 }] },
    ];
    const runs = detectRuns(slots);
    expect(runs).toEqual([{ start: 0, end: 2, kind: 'easy' }]);
  });

  it('skips blanks rather than spanning runs across them', () => {
    const slots = [
      { isBlank: false, fixtures: [{ fdr: 2 }] },
      { isBlank: false, fixtures: [{ fdr: 3 }] },
      { isBlank: true },
      { isBlank: false, fixtures: [{ fdr: 2 }] },
    ];
    const runs = detectRuns(slots);
    expect(runs).toEqual([]);
  });

  it('detects hard runs', () => {
    const slots = [
      { isBlank: false, fixtures: [{ fdr: 9 }] },
      { isBlank: false, fixtures: [{ fdr: 10 }] },
      { isBlank: false, fixtures: [{ fdr: 11 }] },
    ];
    expect(detectRuns(slots)).toEqual([{ start: 0, end: 2, kind: 'hard' }]);
  });
});
