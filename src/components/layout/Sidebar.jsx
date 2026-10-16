import React from 'react';
import {
  LayoutDashboard,
  Bot,
  Target,
  Users,
  UserCheck,
  ShoppingCart,
  Package,
  Boxes,
  TrendingUp,
  Receipt,
  BarChart3,
  Bell,
  Share2,
  Settings,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const NAVIGATION_GROUPS = [
  {
    label: 'OVERVIEW',
    items: [
      { label: 'Overview Dashboard', path: '/', icon: LayoutDashboard },
      { label: 'AI Agents', path: '/ai-agents', icon: Bot, badgeKey: 'pendingApprovals' },
    ],
  },
  {
    label: 'GROWTH',
    items: [
      { label: 'Lead Management', path: '/leads', icon: Target },
      { label: 'Customers / CRM', path: '/customers', icon: Users },
      { label: 'Sales Representatives', path: '/representatives', icon: UserCheck },
    ],
  },
  {
    label: 'OPERATIONS',
    items: [
      { label: 'Sales & Orders', path: '/orders', icon: ShoppingCart },
      { label: 'Brands & Products', path: '/products', icon: Package },
      { label: 'Inventory Management', path: '/inventory', icon: Boxes },
      { label: 'Demand Forecasting', path: '/forecasting', icon: TrendingUp },
    ],
  },
  {
    label: 'FINANCE',
    items: [
      { label: 'Receivables & Invoices', path: '/receivables', icon: Receipt },
      { label: 'Reports & Analytics', path: '/reports', icon: BarChart3 },
    ],
  },
  {
    label: 'SYSTEM',
    items: [
      { label: 'Notifications', path: '/notifications', icon: Bell, badgeKey: 'unreadAlerts' },
      { label: 'Integrations', path: '/integrations', icon: Share2 },
      { label: 'Settings & Users', path: '/settings', icon: Settings },
    ],
  },
];

export default function Sidebar({ isOpen, onClose }) {
  const { currentRoute, navigate, entities, theme } = useApp();

  const pendingApprovals = entities.Task?.filter((t) => t.approval_status === 'pending')?.length || 0;
  const unreadAlerts = entities.Notification?.filter((n) => !n.read)?.length || 0;

  const handleNav = (path) => {
    navigate(path);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar aside */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[268px] flex-col border-r border-sidebar-border bg-sidebar transition-all duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-24 items-center justify-between border-b border-sidebar-border px-4 py-2 bg-sidebar">
          <div
            onClick={() => handleNav('/')}
            className="flex items-center cursor-pointer group w-full"
          >
            <img
              src={theme === 'dark' ? '/premier-polmarex-logo-dark.png' : '/premier-polmarex-logo.png'}
              alt="Premier Polmarex"
              className="h-[76px] w-auto max-w-[228px] object-contain group-hover:scale-[1.03] transition-transform"
            />
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary lg:hidden shrink-0 ml-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Navigation Groups */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6">
          {NAVIGATION_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-2 mb-2 text-[10px] font-bold tracking-wider text-muted-foreground/80 uppercase">
                {group.label}
              </p>
              <nav className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentRoute === item.path || (item.path !== '/' && currentRoute.startsWith(item.path));
                  const badgeCount =
                    item.badgeKey === 'pendingApprovals'
                      ? pendingApprovals
                      : item.badgeKey === 'unreadAlerts'
                      ? unreadAlerts
                      : 0;

                  return (
                    <button
                      key={item.path}
                      onClick={() => handleNav(item.path)}
                      className={`group relative flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-[#e1241a] text-white shadow-2xs font-semibold'
                          : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`h-4 w-4 shrink-0 transition-colors ${
                            isActive
                              ? 'text-white'
                              : 'text-muted-foreground group-hover:text-foreground'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {badgeCount > 0 && (
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-[#e1241a]/15 text-[#e1241a]'
                          }`}
                        >
                          {badgeCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}

