import React from 'react';
import { Search, Building2, Calendar, Bell, ChevronDown, Menu, Sun, Moon } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function Header({ onToggleSidebar }) {
  const {
    company,
    setCompany,
    period,
    setPeriod,
    periodOptions,
    globalSearch,
    setGlobalSearch,
    navigate,
    entities,
    theme,
    toggleTheme
  } = useApp();

  const unreadCount = entities.Notification?.filter((n) => !n.read)?.length || 0;
  const pendingApprovals = entities.Task?.filter((t) => t.approval_status === 'pending')?.length || 0;

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-card px-4 sm:px-6 shadow-sm transition-colors duration-200">
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onToggleSidebar}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary lg:hidden"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <img
          src={theme === 'dark' ? '/premier-polmarex-logo-dark.png' : '/premier-polmarex-logo.png'}
          alt="Premier Polmarex"
          onClick={() => navigate('/')}
          className="h-11 w-auto max-w-[170px] object-contain cursor-pointer hidden sm:block lg:hidden shrink-0"
        />

        {/* Global Search Bar */}
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="Search leads, customers, products..."
            className="w-full h-10 rounded-lg border border-slate-300 bg-card pl-10 pr-4 py-2 text-[13.5px] text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none shadow-2xs transition-all font-medium"
          />
        </div>
      </div>

      {/* Global Filter Selectors & User Info */}
      <div className="flex items-center gap-2 sm:gap-3 ml-4">
        {/* Company Selector */}
        <div className="relative hidden md:flex items-center">
          <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <select
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="h-10 appearance-none rounded-lg border border-slate-300 bg-card pl-9 pr-9 py-2 text-[13.5px] font-medium text-foreground focus:border-primary focus:outline-none hover:bg-muted/50 cursor-pointer shadow-2xs transition-colors"
          >
            <option value="all">All companies</option>
            <option value="PRM">Premier Polmarex</option>
            <option value="MML">Maple Mart</option>
            <option value="NUG">Nutro Gusto</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>

        {/* Date Selector */}
        <div className="relative flex items-center">
          <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="h-10 appearance-none rounded-lg border border-slate-300 bg-card pl-9 pr-9 py-2 text-[13.5px] font-medium text-foreground focus:border-primary focus:outline-none hover:bg-muted/50 cursor-pointer shadow-2xs transition-colors"
          >
            {periodOptions.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>

        {/* Light / Dark Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-all shadow-2xs"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle color theme"
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4 text-amber-400 transition-transform duration-200 hover:rotate-45" />
          ) : (
            <Moon className="h-4 w-4 text-slate-600 transition-transform duration-200 hover:-rotate-12" />
          )}
        </button>

        {/* Notifications Icon with Badge */}
        <button
          onClick={() => navigate('/notifications')}
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shadow-2xs"
          title={`${unreadCount} unread alerts`}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#e1241a] text-[10px] font-bold text-white shadow-2xs">
              {unreadCount}
            </span>
          )}
        </button>

        {/* User Avatar */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-border cursor-pointer select-none" onClick={() => navigate('/settings')}>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e1241a] text-xs font-bold text-white shadow-2xs">
            FK
          </div>
          <div className="hidden text-left xl:block leading-tight">
            <p className="text-xs font-semibold text-foreground">Furqan Kazim</p>
            <p className="text-[9px] font-bold tracking-wider text-muted-foreground uppercase">USER</p>
          </div>
          <ChevronDown className="h-3 w-3 text-muted-foreground hidden xl:block" />
        </div>
      </div>
    </header>
  );
}

