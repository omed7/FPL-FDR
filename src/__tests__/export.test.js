import { describe, it, expect } from 'vitest';
import { toCsv } from '../utils/export.js';

describe('toCsv', () => {
  it('formats a basic grid', () => {
    const processed = {
      events: [{ id: 1 }, { id: 2 }],
      teams: [{
        short_name: 'ARS',
        avgFDR: 5.5,
        teamFixtures: [
          { isBlank: false, fixtures: [{ opponentTeam: { short_name: 'MCI' }, isHome: true, fdr: 9 }] },
          { isBlank: true },
        ],
      }],
    };
    const csv = toCsv(processed);
    const lines = csv.split('\n');
    expect(lines[0]).toBe('Team,Avg FDR,GW1,GW2');
    expect(lines[1]).toBe('ARS,5.5,MCI(H)[9],BLANK');
  });

  it('quotes cells containing commas', () => {
    const processed = {
      events: [{ id: 1 }],
      teams: [{
        short_name: 'A,B',
        avgFDR: 1,
        teamFixtures: [
          { isBlank: false, fixtures: [
            { opponentTeam: { short_name: 'X' }, isHome: true, fdr: 5 },
            { opponentTeam: { short_name: 'Y' }, isHome: false, fdr: 5 },
          ] },
        ],
      }],
    };
    const csv = toCsv(processed);
    expect(csv).toContain('"A,B"');
    expect(csv).toContain('X(H)[5] & Y(A)[5]');
  });
});
