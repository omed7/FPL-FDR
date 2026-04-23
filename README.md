# FPL Fixture Difficulty (FDR)

A Fantasy Premier League fixture difficulty rating grid, with colour-coded FDR ratings, custom algorithms, and planning tools for transfers and chips.

Live: https://omed7.github.io/FPL-FDR/

## Features

**Core grid**
- Colour-coded 1–11 FDR scale with home/away styling
- Per-team average FDR and per-gameweek column averages
- Double-gameweek (DGW) highlighting + blank-gameweek (BGW) cells
- Kickoff-time tooltips (with live score once finished)

**Windowing / filtering**
- Start/End gameweek window with one-click Next 3 / 5 / 8 / All presets
- Window shift with ◀ / ▶ buttons or `←` / `→` keyboard arrows
- Hide teams, pin teams to the top of the grid

**FDR modes**
- **Mode**: overall, attack (vs opponent defence), defence (vs opponent attack)
- **Algorithm**: official FPL 1–5, linear 1–11, data-driven (strength), form-adjusted
- Per-team home/away overrides

**Heatmap & highlights**
- Automatic run detection: 3+ consecutive easy (green) or hard (red) gameweeks are outlined
- Player-level highlight layer: filter by name/position/team/price, and their club's fixtures get outlined in the grid

**My team & planning**
- Enter your FPL manager ID to pull your live squad → highlighted in the grid with captain/bench badges
- Chip-planner hints: best GW for Bench Boost / Triple Captain, and Free Hit windows
- Lightweight transfer planner: pick up to 15 players, see combined fixture score

**Historical accuracy**
- For finished GWs, compare official FDR against actual points per position to calibrate the mapping

**Sharing & export**
- "Copy share link" encodes current settings into the URL hash
- Export the current grid to CSV or PNG

**DX / infra**
- Dark / light mode (persisted, with no flash on load)
- Progressive Web App with offline caching via `vite-plugin-pwa`
- Keyboard shortcuts: `s` settings, `r` refresh, `←/→` shift window, `t` theme, `?` help
- Vitest + Testing Library unit tests for FDR calculation and data processing
- GitHub Actions CI running lint, tests, and build on every PR
- Optional Cloudflare Worker cache proxy (see [`server/README.md`](./server/README.md))

## Development

```bash
npm install
npm run dev        # vite dev server
npm run lint       # eslint
npm test           # vitest run
npm run build      # production build
npm run preview    # preview production bundle
```

### Environment

- `VITE_FPL_PROXY` — optional CORS proxy override. If unset, falls back to `https://corsproxy.io/?url=`. Set this to your own Cloudflare Worker URL (see `server/`) for a more reliable cache.

## Tech

- React 19 + Vite
- Tailwind CSS (class-based dark mode)
- `axios`, `date-fns`, `lucide-react`, `clsx` / `tailwind-merge`
- `html2canvas` for PNG export
- `vite-plugin-pwa` for installable / offline support
- Vitest + `@testing-library/react` for tests
