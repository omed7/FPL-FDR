import {
  Settings,
  RefreshCw,
  Sun,
  Moon,
  Share2,
  Download,
  Image as ImageIcon,
  Users,
  Repeat,
  BarChart3,
  Trophy,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../utils/cn.js';

export default function Header({
  theme,
  onToggleTheme,
  lastRefreshed,
  loading,
  onRefresh,
  onOpenSettings,
  onOpenMyTeam,
  onOpenTransferPlanner,
  onOpenPlayerLayer,
  onOpenHistorical,
  onShare,
  onExportCsv,
  onExportPng,
}) {
  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/20 flex-shrink-0">
            <span className="font-bold text-white text-sm">FDR</span>
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-gray-100 dark:to-gray-400 tracking-tight hidden sm:block truncate">
            Fantasy Premier League
          </h1>
        </div>

        <div className="flex items-center gap-1.5">
          {lastRefreshed && (
            <span className="hidden md:inline text-[11px] text-slate-500 dark:text-slate-400 mr-1">
              Updated {formatDistanceToNow(lastRefreshed, { addSuffix: true })}
            </span>
          )}
          <IconButton title="Refresh data" onClick={onRefresh}>
            <RefreshCw size={18} className={cn(loading && 'animate-spin')} />
          </IconButton>
          <IconButton title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} onClick={onToggleTheme}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </IconButton>
          <IconButton title="My Team" onClick={onOpenMyTeam}>
            <Users size={18} />
          </IconButton>
          <IconButton title="Transfer Planner" onClick={onOpenTransferPlanner}>
            <Repeat size={18} />
          </IconButton>
          <IconButton title="Players" onClick={onOpenPlayerLayer}>
            <BarChart3 size={18} />
          </IconButton>
          <IconButton title="Historical Accuracy" onClick={onOpenHistorical}>
            <Trophy size={18} />
          </IconButton>
          <IconButton title="Copy share link" onClick={onShare}>
            <Share2 size={18} />
          </IconButton>
          <IconButton title="Export CSV" onClick={onExportCsv}>
            <Download size={18} />
          </IconButton>
          <IconButton title="Export PNG" onClick={onExportPng}>
            <ImageIcon size={18} />
          </IconButton>
          <IconButton title="Settings (press s)" onClick={onOpenSettings}>
            <Settings size={18} />
          </IconButton>
        </div>
      </div>
    </header>
  );
}

function IconButton({ children, title, onClick }) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {children}
    </button>
  );
}
