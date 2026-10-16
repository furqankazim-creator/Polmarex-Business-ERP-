import React, { useState } from 'react';
import {
  UserPlus,
  ShieldCheck,
  Lock,
  CheckCircle2,
  Info,
  Key,
  Mail,
  Clock,
  X,
  Check,
  Building,
  User,
  Shield
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Settings() {
  const { entities, setEntities, showToast } = useApp();

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'Sales Representative',
    business_unit: 'All companies'
  });

  // Invited users state (starts empty matching screenshot)
  const [users, setUsers] = useState([]);

  // Full default audit trail entries matching screenshot
  const defaultAuditTrail = [
    {
      when: 'Oct 13, 2026',
      user: 'Operator',
      action: 'Integration.Tested',
      detail: 'Mock adapter connection test completed. No live data was transferred.',
      severity: 'Info'
    },
    {
      when: 'Oct 12, 2026',
      user: 'R. Ahmed (Inventory Manager)',
      action: 'Invoice.Updated',
      detail: 'Demo audit entry for invoice.updated.',
      severity: 'Info'
    },
    {
      when: 'Oct 6, 2026',
      user: 'D. Kowalski (Sales Rep)',
      action: 'Invoice.Viewed',
      detail: 'Demo audit entry for invoice.viewed.',
      severity: 'Info'
    },
    {
      when: 'Oct 5, 2026',
      user: 'System',
      action: 'Invoice.Updated',
      detail: 'Demo audit entry for invoice.updated.',
      severity: 'Info'
    },
    {
      when: 'Oct 5, 2026',
      user: 'S. Meyer (Sales Manager)',
      action: 'Price.Updated',
      detail: 'Demo audit entry for price.updated.',
      severity: 'Warning'
    },
    {
      when: 'Oct 4, 2026',
      user: 'R. Ahmed (Inventory Manager)',
      action: 'User.Role.Changed',
      detail: 'Demo audit entry for user.role_changed.',
      severity: 'Warning'
    },
    {
      when: 'Oct 4, 2026',
      user: 'R. Ahmed (Inventory Manager)',
      action: 'User.Role.Changed',
      detail: 'Demo audit entry for user.role_changed.',
      severity: 'Warning'
    },
    {
      when: 'Oct 3, 2026',
      user: 'A. Dias (Finance)',
      action: 'Payment.Recorded',
      detail: 'Demo audit entry for payment.recorded.',
      severity: 'Info'
    },
    {
      when: 'Oct 3, 2026',
      user: 'A. Dias (Finance)',
      action: 'Approval.Granted',
      detail: 'Demo audit entry for approval.granted.',
      severity: 'Info'
    },
    {
      when: 'Oct 1, 2026',
      user: 'A. Dias (Finance)',
      action: 'Invoice.Viewed',
      detail: 'Demo audit entry for invoice.viewed.',
      severity: 'Info'
    },
    {
      when: 'Sep 30, 2026',
      user: 'A. Dias (Finance)',
      action: 'Invoice.Viewed',
      detail: 'Demo audit entry for invoice.viewed.',
      severity: 'Info'
    },
    {
      when: 'Sep 29, 2026',
      user: 'R. Ahmed (Inventory Manager)',
      action: 'Payment.Recorded',
      detail: 'Demo audit entry for payment.recorded.',
      severity: 'Info'
    },
    {
      when: 'Sep 29, 2026',
      user: 'R. Ahmed (Inventory Manager)',
      action: 'Forecast.Approved',
      detail: 'Demo audit entry for forecast.approved.',
      severity: 'Info'
    },
    {
      when: 'Sep 28, 2026',
      user: 'A. Dias (Finance)',
      action: 'Forecast.Approved',
      detail: 'Demo audit entry for forecast.approved.',
      severity: 'Info'
    },
    {
      when: 'Sep 28, 2026',
      user: 'System',
      action: 'Invoice.Updated',
      detail: 'Demo audit entry for invoice.updated.',
      severity: 'Info'
    },
    {
      when: 'Sep 27, 2026',
      user: 'S. Meyer (Sales Manager)',
      action: 'Export.Customers',
      detail: 'Demo audit entry for export.customers.',
      severity: 'Info'
    },
    {
      when: 'Sep 27, 2026',
      user: 'S. Meyer (Sales Manager)',
      action: 'User.Role.Changed',
      detail: 'Demo audit entry for user.role_changed.',
      severity: 'Warning'
    },
    {
      when: 'Sep 26, 2026',
      user: 'R. Ahmed (Inventory Manager)',
      action: 'Payment.Recorded',
      detail: 'Demo audit entry for payment.recorded.',
      severity: 'Info'
    },
    {
      when: 'Sep 26, 2026',
      user: 'S. Meyer (Sales Manager)',
      action: 'User.Role.Changed',
      detail: 'Demo audit entry for user.role_changed.',
      severity: 'Warning'
    },
    {
      when: 'Sep 26, 2026',
      user: 'R. Ahmed (Inventory Manager)',
      action: 'Payment.Recorded',
      detail: 'Demo audit entry for payment.recorded.',
      severity: 'Info'
    },
    {
      when: 'Sep 23, 2026',
      user: 'System',
      action: 'Invoice.Viewed',
      detail: 'Demo audit entry for invoice.viewed.',
      severity: 'Info'
    },
    {
      when: 'Sep 22, 2026',
      user: 'System',
      action: 'Export.Customers',
      detail: 'Demo audit entry for export.customers.',
      severity: 'Info'
    },
    {
      when: 'Sep 21, 2026',
      user: 'D. Kowalski (Sales Rep)',
      action: 'Agent.Config.Changed',
      detail: 'Demo audit entry for agent.config_changed.',
      severity: 'Info'
    },
    {
      when: 'Sep 19, 2026',
      user: 'S. Meyer (Sales Manager)',
      action: 'Agent.Config.Changed',
      detail: 'Demo audit entry for agent.config_changed.',
      severity: 'Info'
    },
    {
      when: 'Sep 18, 2026',
      user: 'S. Meyer (Sales Manager)',
      action: 'Price.Updated',
      detail: 'Demo audit entry for price.updated.',
      severity: 'Warning'
    }
  ];

  const [auditLogs, setAuditLogs] = useState(defaultAuditTrail);

  const handleInviteUser = (e) => {
    e.preventDefault();
    if (!inviteForm.email.trim()) return;

    const newUser = {
      id: 'usr_' + Date.now(),
      email: inviteForm.email,
      role: inviteForm.role,
      business_unit: inviteForm.business_unit,
      status: 'Invited (Pending)',
      invited_at: 'Oct 14, 2026'
    };

    setUsers((prev) => [newUser, ...prev]);

    // Append audit log entry
    const newAudit = {
      when: 'Oct 14, 2026',
      user: 'Furqan Kazim (User)',
      action: 'User.Invited',
      detail: `Sent workspace invitation to ${inviteForm.email} as ${inviteForm.role}.`,
      severity: 'Info'
    };
    setAuditLogs((prev) => [newAudit, ...prev]);

    showToast({
      title: 'Invitation Sent',
      description: `Access invitation sent to ${inviteForm.email} with role ${inviteForm.role}.`
    });

    setIsInviteModalOpen(false);
    setInviteForm({
      email: '',
      role: 'Sales Representative',
      business_unit: 'All companies'
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground tracking-tight">
            Settings & user management
          </h1>
          <p className="text-[13.5px] text-slate-700 mt-1 max-w-3xl font-normal leading-relaxed">
            Your profile, the people who use this platform, what each role may do, and the audit trail for sensitive actions.
          </p>
        </div>

        {/* Top-Right Invite Button */}
        <button
          onClick={() => setIsInviteModalOpen(true)}
          className="btn-primary self-start shrink-0"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Invite user</span>
        </button>
      </div>

      {/* Top Grid: Your profile & Security data handling */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Your profile */}
        <div className="lg:col-span-4 rounded-xl border border-border bg-card p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <h2 className="text-xs font-bold text-foreground">Your profile</h2>
            <div className="flex items-center gap-3 mt-4">
              <div className="w-10 h-10 rounded-full bg-[#e1241a] text-white font-bold text-xs flex items-center justify-center shrink-0">
                FK
              </div>
              <div>
                <div className="font-bold text-xs text-foreground">Furqan Kazim</div>
                <div className="text-[11px] text-muted-foreground">furqankazim9@gmail.com</div>
                <div className="mt-1">
                  <span className="inline-block rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground font-normal">
                    User
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security & data handling */}
        <div className="lg:col-span-8 rounded-xl border border-border bg-card p-4 shadow-2xs space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            <span>Security & data handling</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5 pt-1">
            {/* Box 1 */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground">
                <Lock className="w-3 h-3 text-muted-foreground" />
                <span>Authentication</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Sign in, sessions, password resets and email verification are handled by the platform. Passwords are never stored or seen by the app.
              </p>
            </div>

            {/* Box 2 */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground">
                <CheckCircle2 className="w-3 h-3 text-muted-foreground" />
                <span>Role-based access</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Permissions are enforced on the server for every record, not just in the interface.
              </p>
            </div>

            {/* Box 3 */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground">
                <Info className="w-3 h-3 text-muted-foreground" />
                <span>Company Isolation</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Every record carries a company field so Premier Polmarex, Maple Mart and Nutro Gusto data can be separated when you turn on tenant isolation.
              </p>
            </div>

            {/* Box 4 */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground">
                <Key className="w-3 h-3 text-muted-foreground" />
                <span>Secrets</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                API keys and credentials live in environment variables and server-side functions — never in the browser code.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section: Users */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-2xs space-y-3">
        <div>
          <h2 className="text-xs font-bold text-foreground">Users</h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Only administrators can see and change this list. New users join through an invitation, then receive their business role here.
          </p>
        </div>

        {users.length === 0 ? (
          <div className="rounded-xl border border-border/80 bg-muted/10 p-8 flex flex-col items-center justify-center text-center space-y-1">
            <div className="w-7 h-7 rounded-full bg-muted/40 flex items-center justify-center text-muted-foreground mb-1">
              <Mail className="w-3.5 h-3.5" />
            </div>
            <p className="font-bold text-xs text-foreground">No users yet</p>
            <p className="text-[11px] text-muted-foreground">Invite a colleague to give them access.</p>
          </div>
        ) : (
          <div className="overflow-x-auto pt-1">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border text-muted-foreground text-[11px]">
                <tr>
                  <th className="py-2 px-3 font-medium">Email</th>
                  <th className="py-2 px-3 font-medium">Assigned Role</th>
                  <th className="py-2 px-3 font-medium">Business Unit</th>
                  <th className="py-2 px-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/30">
                    <td className="py-2.5 px-3 font-medium text-foreground">{u.email}</td>
                    <td className="py-2.5 px-3 text-muted-foreground">{u.role}</td>
                    <td className="py-2.5 px-3 text-muted-foreground">{u.business_unit}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium border border-amber-200 bg-amber-50 text-amber-700">
                        {u.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bottom Grid: Roles & permissions (Left) and Audit trail (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Roles & permissions (Left - 5 cols) */}
        <div className="lg:col-span-5 rounded-xl border border-border bg-card p-4 shadow-2xs space-y-4">
          <h2 className="text-xs font-bold text-foreground">Roles & permissions</h2>

          {/* 5 Role summary cards */}
          <div className="space-y-2">
            <div className="p-2.5 rounded-lg border border-border bg-muted/15">
              <div className="font-bold text-xs text-foreground">Administrator</div>
              <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                Full access: everything, including users, integrations and settings.
              </div>
            </div>

            <div className="p-2.5 rounded-lg border border-border bg-muted/15">
              <div className="font-bold text-xs text-foreground">Sales Manager</div>
              <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                Leads, CRM, representatives, orders, targets, agents and approvals.
              </div>
            </div>

            <div className="p-2.5 rounded-lg border border-border bg-muted/15">
              <div className="font-bold text-xs text-foreground">Sales Representative</div>
              <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                Own territory: leads, customers, visits, tasks and order lookup.
              </div>
            </div>

            <div className="p-2.5 rounded-lg border border-border bg-muted/15">
              <div className="font-bold text-xs text-foreground">Inventory Manager</div>
              <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                Products, stock, movements, forecasts and purchase approval.
              </div>
            </div>

            <div className="p-2.5 rounded-lg border border-border bg-muted/15">
              <div className="font-bold text-xs text-foreground">Finance</div>
              <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                Invoices, payments, receivables, reports and audit trail.
              </div>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="overflow-x-auto pt-1">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-[11px]">
                  <th className="py-2.5 font-medium">Area</th>
                  <th className="py-2.5 font-medium">Admin</th>
                  <th className="py-2.5 font-medium">Sales mgr</th>
                  <th className="py-2.5 font-medium">Rep</th>
                  <th className="py-2.5 font-medium">Inventory</th>
                  <th className="py-2.5 font-medium">Finance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-[11px]">
                <tr>
                  <td className="py-2.5 font-medium text-foreground">Leads & pipeline</td>
                  <td className="py-2.5 text-muted-foreground">Full</td>
                  <td className="py-2.5 text-muted-foreground">Full</td>
                  <td className="py-2.5 text-muted-foreground">Own records</td>
                  <td className="py-2.5 text-muted-foreground">Read</td>
                  <td className="py-2.5 text-muted-foreground">Read</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-medium text-foreground">Customers / CRM</td>
                  <td className="py-2.5 text-muted-foreground">Full</td>
                  <td className="py-2.5 text-muted-foreground">Full</td>
                  <td className="py-2.5 text-muted-foreground">Own accounts</td>
                  <td className="py-2.5 text-muted-foreground">Read</td>
                  <td className="py-2.5 text-muted-foreground">Read</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-medium text-foreground">Sales & orders</td>
                  <td className="py-2.5 text-muted-foreground">Full</td>
                  <td className="py-2.5 text-muted-foreground">Full + edit</td>
                  <td className="py-2.5 text-muted-foreground">Read</td>
                  <td className="py-2.5 text-muted-foreground">Read</td>
                  <td className="py-2.5 text-muted-foreground">Full</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-medium text-foreground">Products & brands</td>
                  <td className="py-2.5 text-muted-foreground">Full</td>
                  <td className="py-2.5 text-muted-foreground">Full</td>
                  <td className="py-2.5 text-muted-foreground">Read</td>
                  <td className="py-2.5 text-muted-foreground">Full</td>
                  <td className="py-2.5 text-muted-foreground">Read</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-medium text-foreground">Inventory & movements</td>
                  <td className="py-2.5 text-muted-foreground">Full</td>
                  <td className="py-2.5 text-muted-foreground">Read</td>
                  <td className="py-2.5 text-muted-foreground">—</td>
                  <td className="py-2.5 text-muted-foreground">Full</td>
                  <td className="py-2.5 text-muted-foreground">Read</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-medium text-foreground">Forecasts & purchase approvals</td>
                  <td className="py-2.5 text-muted-foreground">Full</td>
                  <td className="py-2.5 text-muted-foreground">Approve</td>
                  <td className="py-2.5 text-muted-foreground">—</td>
                  <td className="py-2.5 text-muted-foreground">Full</td>
                  <td className="py-2.5 text-muted-foreground">Read</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-medium text-foreground">Invoices & payments</td>
                  <td className="py-2.5 text-muted-foreground">Full</td>
                  <td className="py-2.5 text-muted-foreground">Read</td>
                  <td className="py-2.5 text-muted-foreground">Read</td>
                  <td className="py-2.5 text-muted-foreground">—</td>
                  <td className="py-2.5 text-muted-foreground">Full</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-medium text-foreground">AI agents & approvals</td>
                  <td className="py-2.5 text-muted-foreground">Full</td>
                  <td className="py-2.5 text-muted-foreground">Run + approve</td>
                  <td className="py-2.5 text-muted-foreground">Run</td>
                  <td className="py-2.5 text-muted-foreground">Run</td>
                  <td className="py-2.5 text-muted-foreground">Read</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-medium text-foreground">Users, integrations & settings</td>
                  <td className="py-2.5 text-muted-foreground">Full</td>
                  <td className="py-2.5 text-muted-foreground">—</td>
                  <td className="py-2.5 text-muted-foreground">—</td>
                  <td className="py-2.5 text-muted-foreground">—</td>
                  <td className="py-2.5 text-muted-foreground">—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit trail (Right - 7 cols) */}
        <div className="lg:col-span-7 rounded-xl border border-border bg-card p-4 shadow-2xs space-y-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>Audit trail</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
              Sensitive actions — approvals, payments, price changes, role changes and agent configuration — are recorded with who, what and when.
            </p>
          </div>

          <div className="overflow-x-auto pt-1">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-muted/20 text-muted-foreground text-[11px] font-medium">
                <tr>
                  <th className="px-3 py-2 font-medium">When</th>
                  <th className="px-3 py-2 font-medium">User</th>
                  <th className="px-3 py-2 font-medium">Action</th>
                  <th className="px-3 py-2 font-medium">Detail</th>
                  <th className="px-3 py-2 font-medium text-right">Severity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-[11px]">
                {auditLogs.map((log, index) => {
                  const isWarning = log.severity?.toLowerCase() === 'warning';
                  return (
                    <tr key={index} className="hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">
                        {log.when}
                      </td>
                      <td className="px-3 py-2.5 font-medium text-foreground whitespace-nowrap">
                        {log.user}
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground font-mono whitespace-nowrap">
                        {log.action}
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground max-w-xs truncate">
                        {log.detail}
                      </td>
                      <td className="px-3 py-2.5 text-right whitespace-nowrap">
                        {isWarning ? (
                          <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-medium border border-amber-200 bg-amber-50 text-amber-700">
                            Warning
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-medium border border-blue-200 bg-blue-50 text-blue-700">
                            Info
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bottom Disclaimer Banner matching screenshot */}
      <div className="flex items-start sm:items-center gap-2.5 p-3 rounded-lg border border-border bg-card text-xs text-muted-foreground">
        <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5 sm:mt-0" />
        <span>
          This prototype ships with clearly labelled demo data so every screen and calculation can be reviewed. Clearing it and loading your own records is done from the app dashboard once you are ready to go live.
        </span>
      </div>

      {/* Invite User Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Invite a user</h3>
              </div>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInviteUser} className="p-5 space-y-4 text-[13.5px]">
              <div>
                <label className="block text-[13px] font-medium text-foreground mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="colleague@polmarex.ca"
                  className="w-full h-10 rounded-lg border border-slate-300 bg-card px-3 py-2 text-[13.5px] font-medium text-foreground focus:outline-none focus:border-primary shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-foreground mb-1.5">
                  Business Role
                </label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm((prev) => ({ ...prev, role: e.target.value }))}
                  className="w-full h-10 rounded-lg border border-slate-300 bg-card px-3 py-2 text-[13.5px] font-medium text-foreground focus:outline-none focus:border-primary shadow-2xs"
                >
                  <option value="Administrator">Administrator</option>
                  <option value="Sales Manager">Sales Manager</option>
                  <option value="Sales Representative">Sales Representative</option>
                  <option value="Inventory Manager">Inventory Manager</option>
                  <option value="Finance">Finance</option>
                </select>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-foreground mb-1.5">
                  Company / Business Unit
                </label>
                <select
                  value={inviteForm.business_unit}
                  onChange={(e) => setInviteForm((prev) => ({ ...prev, business_unit: e.target.value }))}
                  className="w-full h-10 rounded-lg border border-slate-300 bg-card px-3 py-2 text-[13.5px] font-medium text-foreground focus:outline-none focus:border-primary shadow-2xs"
                >
                  <option value="All companies">All companies</option>
                  <option value="Premier Polmarex">Premier Polmarex</option>
                  <option value="Maple Mart">Maple Mart</option>
                  <option value="Nutro Gusto">Nutro Gusto</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Send Invitation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
