import React, { useState } from 'react';
import {
  Bell,
  CheckCheck,
  ChevronDown,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
  ExternalLink,
  SlidersHorizontal
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Notifications() {
  const { entities, markNotificationRead, markAllNotificationsRead, navigate } = useApp();

  const [priorityFilter, setPriorityFilter] = useState('all');
  const [readFilter, setReadFilter] = useState('all'); // 'all' | 'unread' | 'read'

  const allNotifications = entities.Notification || [];

  const filtered = allNotifications.filter((n) => {
    if (priorityFilter !== 'all' && n.priority !== priorityFilter) return false;
    if (readFilter === 'unread' && n.read) return false;
    if (readFilter === 'read' && !n.read) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground tracking-tight">Notifications</h1>
          <p className="text-[13.5px] text-slate-700 mt-1 max-w-3xl font-normal leading-relaxed">
            Operational alerts raised by modules and AI agents: stock, receivables, approvals, performance and integration health.
          </p>
        </div>

        <button
          onClick={markAllNotificationsRead}
          className="btn-secondary self-start shrink-0"
        >
          <CheckCheck className="w-3.5 h-3.5 text-[#e1241a]" />
          <span>Mark all read</span>
        </button>
      </div>

      {/* Filter Row matching standard toolbar */}
      <div className="rounded-xl border border-border bg-card p-2.5 shadow-2xs flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-1.5 text-xs font-normal text-muted-foreground">
            <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Filters</span>
          </div>

          {/* Status filter */}
          <div className="relative">
            <select
              value={readFilter}
              onChange={(e) => setReadFilter(e.target.value)}
              className="appearance-none h-9.5 bg-card border border-slate-300 rounded-lg pl-3 pr-8 text-[13.5px] font-medium text-foreground focus:outline-none focus:border-primary shadow-2xs min-w-[130px]"
            >
              <option value="all">All status</option>
              <option value="unread">Unread only</option>
              <option value="read">Read only</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>

          {/* Priority filter */}
          <div className="relative">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="appearance-none h-9.5 bg-card border border-slate-300 rounded-lg pl-3 pr-8 text-[13.5px] font-medium text-foreground focus:outline-none focus:border-primary shadow-2xs min-w-[130px]"
            >
              <option value="all">All priorities</option>
              <option value="high">High priority</option>
              <option value="medium">Medium priority</option>
              <option value="low">Low priority</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        <div className="rounded-md bg-muted/40 text-muted-foreground text-xs px-2.5 py-1 font-normal shrink-0">
          {filtered.length} alerts
        </div>
      </div>

      {/* Notification List */}
      <div className="rounded-xl border border-border bg-card shadow-2xs divide-y divide-border overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground space-y-1.5">
            <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-1" />
            <p className="text-xs font-bold text-foreground">No alerts match your filter</p>
            <p className="text-[11px] text-muted-foreground">All modules operating without pending alerts.</p>
          </div>
        ) : (
          filtered.map((item) => {
            const isUnread = !item.read;
            const isHigh = item.priority === 'high';
            const isMedium = item.priority === 'medium';

            return (
              <div
                key={item.id}
                className={`p-4 flex items-start justify-between gap-4 transition-colors ${
                  isUnread ? 'bg-muted/20' : 'hover:bg-muted/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`rounded-lg p-2 mt-0.5 border ${
                      isHigh
                        ? 'bg-rose-50 text-rose-600 border-rose-200'
                        : isMedium
                        ? 'bg-amber-50 text-amber-600 border-amber-200'
                        : 'bg-blue-50 text-blue-600 border-blue-200'
                    }`}
                  >
                    <Bell className="w-4 h-4" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-foreground">{item.title}</p>
                      {isUnread && (
                        <span className="h-2 w-2 rounded-full bg-[#e1241a]" title="Unread" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">{item.message}</p>
                    <div className="flex items-center gap-2 pt-1 text-[11px]">
                      {isHigh ? (
                        <span className="rounded-md border border-rose-200 bg-rose-50 text-rose-700 px-2 py-0.5 text-[10px] font-medium capitalize">
                          High
                        </span>
                      ) : isMedium ? (
                        <span className="rounded-md border border-amber-200 bg-amber-50 text-amber-700 px-2 py-0.5 text-[10px] font-medium capitalize">
                          Medium
                        </span>
                      ) : (
                        <span className="rounded-md border border-blue-200 bg-blue-50 text-blue-700 px-2 py-0.5 text-[10px] font-medium capitalize">
                          Low
                        </span>
                      )}
                      <span className="text-[11px] text-muted-foreground">
                        {item.created_date ? item.created_date.slice(0, 10) : 'Today'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {item.action_route && (
                    <button
                      onClick={() => navigate(item.action_route)}
                      className="btn-table"
                    >
                      <span>View</span>
                      <ExternalLink className="w-3 h-3 text-muted-foreground ml-0.5" />
                    </button>
                  )}
                  {isUnread && (
                    <button
                      onClick={() => markNotificationRead(item.id)}
                      className="btn-table"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
