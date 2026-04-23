import { describe, it, expect } from 'vitest';
import { processData, columnAverages } from '../utils/processData.js';

const TEAMS = [
  { id: 1, name: 'A', short_name: 'A', code: 1, strength: 3, strength_overall_home: 1100, strength_overall_away: 1090, strength_attack_home: 1200, strength_attack_away: 1150, strength_defence_home: 1050, strength_defence_away: 1000 },
  { id: 2, name: 'B', short_name: 'B', code: 2, strength: 4, strength_overall_home: 1300, strength_overall_away: 1280, strength_attack_home: 1350, strength_attack_away: 1300, strength_defence_home: 1250, strength_defence_away: 1200 },
];
const EVENTS = [{ id: 1 }, { id: 2 }];
const FIXTURES = [
  { id: 10, event: 1, team_h: 1, team_a: 2, team_h_difficulty: 4, team_a_difficulty: 2, kickoff_time: '', finished: false },
  { id: 11, event: 2, team_h: 2, team_a: 1, team_h_difficulty: 2, team_a_difficulty: 4, kickoff_time: '', finished: false },
];

describe('processData', () => {
  it('builds rows for visible events with fixtures', () => {
    const out = processData({
      teams: TEAMS, events: EVENTS, fixturesData: FIXTURES,
      gwStart: 1, gwEnd: 2, hiddenTeams: [], pinnedTeams: [], fdrOverrides: {},
      sortOrder: 'default', mode: 'overall', algorithm: 'official',
    });
    expect(out.teams).toHaveLength(2);
    expect(out.events).toHaveLength(2);
    const teamA = out.teams.find(t => t.id === 1);
    expect(teamA.teamFixtures).toHaveLength(2);
    expect(teamA.teamFixtures[0].isBlank).toBe(false);
    // H vs difficulty=4 -> 9 on 1..11
    expect(teamA.teamFixtures[0].fixtures[0].fdr).toBe(9);
  });

  it('pins teams to the top', () => {
    const out = processData({
      teams: TEAMS, events: EVENTS, fixturesData: FIXTURES,
      gwStart: 1, gwEnd: 2, hiddenTeams: [], pinnedTeams: [2], fdrOverrides: {},
      sortOrder: 'default', mode: 'overall', algorithm: 'official',
    });
    expect(out.teams[0].id).toBe(2);
  });

  it('hides teams', () => {
    const out = processData({
      teams: TEAMS, events: EVENTS, fixturesData: FIXTURES,
      gwStart: 1, gwEnd: 2, hiddenTeams: [2], pinnedTeams: [], fdrOverrides: {},
      sortOrder: 'default', mode: 'overall', algorithm: 'official',
    });
    expect(out.teams).toHaveLength(1);
    expect(out.teams[0].id).toBe(1);
  });
});

describe('columnAverages', () => {
  it('averages fixture FDRs per event', () => {
    const processed = processData({
      teams: TEAMS, events: EVENTS, fixturesData: FIXTURES,
      gwStart: 1, gwEnd: 2, hiddenTeams: [], pinnedTeams: [], fdrOverrides: {},
      sortOrder: 'default', mode: 'overall', algorithm: 'official',
    });
    const avgs = columnAverages(processed);
    expect(avgs).toHaveLength(2);
    // GW1: team A home (fdr 9) and team B away (fdr 3) -> (9+3)/2 = 6
    expect(avgs[0]).toBe(6);
  });
});
