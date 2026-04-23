/**
 * Build a CSV string from a processed team/fixture grid.
 *
 * @param {{ events: Array<{id:number}>, teams: Array<{short_name:string, avgFDR:number, teamFixtures: any[]}> }} processedData
 */
export function toCsv(processedData) {
  const header = ['Team', 'Avg FDR', ...processedData.events.map(e => `GW${e.id}`)];
  const rows = [header.join(',')];

  for (const team of processedData.teams) {
    const cells = team.teamFixtures.map(slot => {
      if (slot.isBlank) return 'BLANK';
      return slot.fixtures
        .map(f => `${f.opponentTeam?.short_name ?? 'TBD'}(${f.isHome ? 'H' : 'A'})[${f.fdr}]`)
        .join(' & ');
    });
    rows.push([team.short_name, team.avgFDR, ...cells].map(csvEscape).join(','));
  }
  return rows.join('\n');
}

function csvEscape(v) {
  const s = String(v ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function downloadText(name, content, mime = 'text/plain') {
  const blob = new Blob([content], { type: `${mime};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Render a DOM node to a PNG via html2canvas and trigger a download.
 * @param {HTMLElement} node
 * @param {string} filename
 */
export async function exportPng(node, filename = 'fpl-fdr.png') {
  if (!node) return;
  const { default: html2canvas } = await import('html2canvas');
  const canvas = await html2canvas(node, {
    backgroundColor: null,
    scale: window.devicePixelRatio || 2,
    useCORS: true,
  });
  const url = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
