import React, { useState, useMemo, useEffect } from 'react';
import {
  Receipt,
  Search,
  Filter,
  DollarSign,
  Plus,
  Calendar,
  TriangleAlert,
  CheckCircle2,
  Clock,
  ChevronRight,
  X,
  CreditCard,
  FileText,
  AlertCircle,
  Sparkles,
  Send,
  Loader2,
  ChevronDown,
  SlidersHorizontal,
  BellRing,
  Download
} from 'lucide-react';
import { useApp } from '../context/AppContext';

// Aging bucket styling matching Base44 Nte
const AGING_CONFIG = {
  current: {
    label: 'Current',
    badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    cardClass: 'border-emerald-200 bg-emerald-50 text-emerald-700'
  },
  '1_30': {
    label: '1–30 days',
    badgeClass: 'border-sky-200 bg-sky-50 text-sky-700',
    cardClass: 'border-sky-200 bg-sky-50 text-sky-700'
  },
  '31_60': {
    label: '31–60 days',
    badgeClass: 'border-amber-200 bg-amber-50 text-amber-700',
    cardClass: 'border-amber-200 bg-amber-50 text-amber-700'
  },
  '61_90': {
    label: '61–90 days',
    badgeClass: 'border-amber-300 bg-amber-50 text-amber-800',
    cardClass: 'border-amber-300 bg-amber-50 text-amber-800'
  },
  over_90: {
    label: 'Over 90 days',
    badgeClass: 'border-rose-200 bg-rose-50 text-rose-700',
    cardClass: 'border-rose-200 bg-rose-50 text-rose-700'
  }
};

const AGING_BUCKETS = [
  { key: 'current', label: 'Current' },
  { key: '1_30', label: '1–30 days' },
  { key: '31_60', label: '31–60 days' },
  { key: '61_90', label: '61–90 days' },
  { key: 'over_90', label: 'Over 90 days' }
];

export default function Receivables() {
  const { company, companyLabel, periodLabel, cutoffDate, entities, recordPayment, createTask, showToast, exportCSV } = useApp();

  // Filters & Sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [agingFilter, setAgingFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [repFilter, setRepFilter] = useState('all');
  const [sortBy, setSortBy] = useState('-days_overdue');

  // Pagination limit (30 items initially)
  const [visibleCount, setVisibleCount] = useState(30);

  // Statement & Payment Modals
  const [statementCustomer, setStatementCustomer] = useState(null);
  const [isStatementOpen, setIsStatementOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedInvoiceForPay, setSelectedInvoiceForPay] = useState(null);

  // Payment form state
  const [payForm, setPayForm] = useState({
    amount: '',
    payment_date: new Date().toISOString().slice(0, 10),
    method: 'e_transfer',
    reference: ''
  });

  const allInvoices = entities.Invoice || [];
  const allPayments = entities.Payment || [];
  const representatives = entities.Representative || [];

  // Reset pagination on filter changes
  useEffect(() => {
    setVisibleCount(30);
  }, [searchTerm, agingFilter, statusFilter, repFilter, sortBy, company]);

  // Company scoped invoices
  const scopedInvoices = useMemo(() => {
    return allInvoices.filter((inv) => {
      if (company !== 'all' && inv.business_unit && inv.business_unit !== company) return false;
      return true;
    });
  }, [allInvoices, company]);

  // Aging Summary stats
  const agingStats = useMemo(() => {
    const buckets = {
      current: { count: 0, balance: 0 },
      '1_30': { count: 0, balance: 0 },
      '31_60': { count: 0, balance: 0 },
      '61_90': { count: 0, balance: 0 },
      over_90: { count: 0, balance: 0 }
    };

    let totalOutstanding = 0;
    let openInvoicesCount = 0;
    let totalOverdue = 0;

    scopedInvoices.forEach((inv) => {
      const bal = Number(inv.balance) || 0;
      if (bal > 0) {
        totalOutstanding += bal;
        openInvoicesCount += 1;
        if (Number(inv.days_overdue) > 0) {
          totalOverdue += bal;
        }

        const b = inv.aging_bucket || 'current';
        if (buckets[b]) {
          buckets[b].count += 1;
          buckets[b].balance += bal;
        }
      }
    });

    // Total collected payments in period
    const scopedPayments = allPayments.filter((p) => {
      if (company !== 'all' && p.business_unit && p.business_unit !== company) return false;
      if (cutoffDate && p.payment_date && p.payment_date < cutoffDate) return false;
      return true;
    });
    const totalCollected = scopedPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    return {
      buckets,
      totalOutstanding,
      openInvoicesCount,
      totalOverdue,
      over90: buckets.over_90.balance,
      totalCollected
    };
  }, [scopedInvoices, allPayments, company, cutoffDate]);

  // Filtered & Sorted Invoices
  const filteredInvoices = useMemo(() => {
    return scopedInvoices
      .filter((inv) => {
        if (agingFilter !== 'all' && inv.aging_bucket !== agingFilter) return false;
        if (statusFilter !== 'all' && inv.status !== statusFilter) return false;
        if (repFilter !== 'all' && inv.representative !== repFilter) return false;
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchNum = inv.invoice_number?.toLowerCase().includes(q);
          const matchCust = inv.customer?.toLowerCase().includes(q);
          const matchOrder = inv.order_number?.toLowerCase().includes(q);
          if (!matchNum && !matchCust && !matchOrder) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === '-days_overdue') return (Number(b.days_overdue) || 0) - (Number(a.days_overdue) || 0);
        if (sortBy === '-balance') return (Number(b.balance) || 0) - (Number(a.balance) || 0);
        if (sortBy === '-invoice_date') return (b.invoice_date || '').localeCompare(a.invoice_date || '');
        if (sortBy === 'due_date') return (a.due_date || '').localeCompare(b.due_date || '');
        return 0;
      });
  }, [scopedInvoices, agingFilter, statusFilter, repFilter, searchTerm, sortBy]);

  // Paginated list (showing 30 items initially, expanding on "Load more")
  const displayedInvoices = useMemo(() => {
    return filteredInvoices.slice(0, visibleCount);
  }, [filteredInvoices, visibleCount]);

  // Open Statement for a customer
  const handleOpenStatement = (custName) => {
    setStatementCustomer(custName || (filteredInvoices[0]?.customer || 'Prime Food Centre'));
    setIsStatementOpen(true);
  };

  // Open Pay Modal
  const handleOpenPay = (inv) => {
    setSelectedInvoiceForPay(inv);
    setPayForm({
      amount: String(inv.balance || 0),
      payment_date: new Date().toISOString().slice(0, 10),
      method: 'e_transfer',
      reference: `EFT-${Math.floor(10000 + Math.random() * 90000)}`
    });
    setIsPayModalOpen(true);
  };

  // Submit Payment
  const handleSubmitPayment = (e) => {
    e.preventDefault();
    if (!selectedInvoiceForPay) return;
    recordPayment(selectedInvoiceForPay.id, {
      amount: Number(payForm.amount),
      payment_date: payForm.payment_date,
      method: payForm.method,
      reference: payForm.reference
    });
    setIsPayModalOpen(false);
  };

  // Create Follow-up Reminder Task in AI Agents Centre
  const handleCreateReminder = (inv) => {
    createTask({
      title: `Payment follow-up · ${inv.customer}`,
      description: `Invoice ${inv.invoice_number}: ${formatCurrency(inv.balance)} outstanding, ${inv.days_overdue} days past due (${(inv.aging_bucket || '').replace('_', '–')}).`,
      agent_key: 'customer_retention',
      business_unit: inv.business_unit || 'PRM',
      priority: Number(inv.days_overdue) > 60 ? 'high' : 'medium',
      due_date: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
      owner_role: inv.representative || 'Finance Team'
    });
  };

  // Customer Statement Data
  const statementInvoices = useMemo(() => {
    if (!statementCustomer) return [];
    return allInvoices.filter((i) => i.customer === statementCustomer);
  }, [statementCustomer, allInvoices]);

  const statementPayments = useMemo(() => {
    if (!statementCustomer) return [];
    return allPayments.filter((p) => p.customer_name === statementCustomer);
  }, [statementCustomer, allPayments]);

  const statementSummary = useMemo(() => {
    const totalInvoiced = statementInvoices.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
    const totalPaid = statementInvoices.reduce((sum, i) => sum + (Number(i.amount_paid) || 0), 0);
    const totalBalance = statementInvoices.reduce((sum, i) => sum + (Number(i.balance) || 0), 0);
    return { totalInvoiced, totalPaid, totalBalance };
  }, [statementInvoices]);

  function formatCurrency(val) {
    if (val === null || val === undefined) return '$0';
    return `$${Number(val).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }

  function formatCompactCurrency(val) {
    const num = Number(val) || 0;
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(1)}k`;
    return `$${num.toFixed(0)}`;
  }

  const hasActiveFilters = agingFilter !== 'all' || statusFilter !== 'all' || repFilter !== 'all' || searchTerm.trim() !== '';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground">Receivables & invoices</h1>
          <p className="text-[13.5px] text-slate-700 font-normal leading-relaxed mt-1 max-w-3xl">
            Aging and collection view for {companyLabel.toLowerCase()}. Outstanding balances come from invoice records less confirmed payments.
          </p>
        </div>

        <div>
          <span className="rounded-lg border border-border bg-card px-3 py-2 text-[11px] text-muted-foreground shadow-xs">
            Collected {periodLabel.toLowerCase()}: {formatCompactCurrency(agingStats.totalCollected)}
          </span>
        </div>
      </div>

      {/* Aging Schedule 6-Card Grid Matching Pte */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {/* Total Outstanding */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
            Total outstanding
          </p>
          <p className="mt-1 font-heading text-xl font-semibold text-foreground">
            {formatCompactCurrency(agingStats.totalOutstanding)}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {agingStats.openInvoicesCount} open invoices
          </p>
        </div>

        {/* 5 Aging Buckets */}
        {AGING_BUCKETS.map((b) => {
          const stats = agingStats.buckets[b.key] || { count: 0, balance: 0 };
          const config = AGING_CONFIG[b.key];

          return (
            <div
              key={b.key}
              onClick={() => setAgingFilter(agingFilter === b.key ? 'all' : b.key)}
              className={`rounded-xl border p-4 shadow-sm cursor-pointer transition-all hover:opacity-90 ${config.cardClass}`}
            >
              <p className="text-[11px] uppercase tracking-wide font-medium opacity-85">
                {b.label}
              </p>
              <p className="mt-1 font-heading text-xl font-semibold">
                {formatCompactCurrency(stats.balance)}
              </p>
              <p className="mt-0.5 text-[11px] opacity-85">
                {stats.count} invoices
              </p>
            </div>
          );
        })}
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {/* Open Invoices */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[13px] font-medium text-muted-foreground">Open invoices</p>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-[#e1241a] border border-red-100">
              <Receipt className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 font-heading text-2xl font-semibold tracking-tight text-foreground">
            {agingStats.openInvoicesCount}
          </p>
          <div className="mt-1.5 flex items-center gap-2 text-xs">
            <span className="truncate text-muted-foreground">with an outstanding balance</span>
          </div>
        </div>

        {/* Overdue Amount */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[13px] font-medium text-muted-foreground">Overdue amount</p>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
              <TriangleAlert className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 font-heading text-2xl font-semibold tracking-tight text-foreground">
            {formatCompactCurrency(agingStats.totalOverdue)}
          </p>
          <div className="mt-1.5 flex items-center gap-2 text-xs">
            <span className="truncate text-muted-foreground">past the due date</span>
          </div>
        </div>

        {/* Over 90 Days */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[13px] font-medium text-muted-foreground">Over 90 days</p>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
              <Clock className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 font-heading text-2xl font-semibold tracking-tight text-foreground">
            {formatCompactCurrency(agingStats.over90)}
          </p>
          <div className="mt-1.5 flex items-center gap-2 text-xs">
            <span className="truncate text-muted-foreground">highest collection risk</span>
          </div>
        </div>

        {/* Collected */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[13px] font-medium text-muted-foreground">Collected</p>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-[#e1241a] border border-red-100">
              <DollarSign className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 font-heading text-2xl font-semibold tracking-tight text-foreground">
            {formatCompactCurrency(agingStats.totalCollected)}
          </p>
          <div className="mt-1.5 flex items-center gap-2 text-xs">
            <span className="truncate text-muted-foreground">{periodLabel.toLowerCase()}</span>
          </div>
        </div>
      </div>

      {/* Filters Toolbar matching exact screenshot */}
      <div className="rounded-xl border border-border bg-card p-2.5 shadow-2xs flex flex-col xl:flex-row xl:items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Filters icon + text */}
          <div className="flex items-center gap-1.5 px-1 text-xs font-normal text-muted-foreground shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Filters</span>
          </div>

          {/* Search Input */}
          <div className="relative min-w-[190px] flex-1 max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search invoice or customer..."
              className="h-9.5 w-full rounded-lg border border-slate-300 bg-card pl-9.5 pr-3 text-[13px] font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary shadow-2xs"
            />
          </div>

          {/* Dropdown 1: Aging bucket */}
          <div className="relative w-32">
            <select
              value={agingFilter}
              onChange={(e) => setAgingFilter(e.target.value)}
              className="appearance-none h-9.5 w-full bg-card border border-slate-300 rounded-lg pl-3 pr-7 text-[13px] font-medium text-foreground focus:outline-none focus:border-primary shadow-2xs"
            >
              <option value="all">Aging (All)</option>
              {AGING_BUCKETS.map((b) => (
                <option key={b.key} value={b.key}>
                  {b.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          </div>

          {/* Dropdown 2: Status */}
          <div className="relative w-32">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none h-9.5 w-full bg-card border border-slate-300 rounded-lg pl-3 pr-7 text-[13px] font-medium text-foreground focus:outline-none focus:border-primary shadow-2xs"
            >
              <option value="all">Status (All)</option>
              <option value="unpaid">Unpaid</option>
              <option value="partial">Partially paid</option>
              <option value="overdue">Overdue</option>
              <option value="paid">Paid</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          </div>

          {/* Dropdown 3: Representative */}
          <div className="relative w-40">
            <select
              value={repFilter}
              onChange={(e) => setRepFilter(e.target.value)}
              className="appearance-none h-9.5 w-full bg-card border border-slate-300 rounded-lg pl-3 pr-7 text-[13px] font-medium text-foreground focus:outline-none focus:border-primary shadow-2xs"
            >
              <option value="all">Representative (All)</option>
              {representatives.map((rep) => (
                <option key={rep.id || rep.full_name} value={rep.full_name}>
                  {rep.full_name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          </div>

          {/* Dropdown 4: Sort */}
          <div className="relative w-44">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none h-9.5 w-full bg-card border border-slate-300 rounded-lg pl-3 pr-7 text-[13px] font-medium text-foreground focus:outline-none focus:border-primary shadow-2xs"
            >
              <option value="-days_overdue">Sort: most overdue</option>
              <option value="-balance">Sort: largest balance</option>
              <option value="-invoice_date">Sort: newest invoice</option>
              <option value="due_date">Sort: earliest due date</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Actions & Records count on right */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 self-end xl:self-center">
          {/* Statement button */}
          <button
            onClick={() => handleOpenStatement(null)}
            className="btn-secondary h-9.5 text-xs px-3"
          >
            <BellRing className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Open a statement</span>
          </button>

          {/* Export CSV button */}
          <button
            onClick={() => exportCSV('receivables')}
            className="btn-secondary h-9.5 text-xs px-3"
          >
            <Download className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Export CSV</span>
          </button>

          <span className="inline-flex items-center rounded-full border border-slate-200/80 bg-slate-100 px-2.5 py-1 text-xs font-normal text-slate-600">
            {filteredInvoices.length} records
          </span>
          {hasActiveFilters && (
            <button
              onClick={() => {
                setAgingFilter('all');
                setStatusFilter('all');
                setRepFilter('all');
                setSearchTerm('');
              }}
              className="rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Invoices Directory Table Matching Fte */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {filteredInvoices.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm font-medium text-foreground">No invoices match these filters</p>
            <p className="text-xs text-muted-foreground mt-1">
              Adjust the aging bucket, payment status, representative or search query.
            </p>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="py-3 px-4 font-semibold text-muted-foreground">Invoice</th>
                    <th className="py-3 px-3 font-semibold text-muted-foreground">Customer</th>
                    <th className="hidden md:table-cell py-3 px-3 font-semibold text-muted-foreground">Issued</th>
                    <th className="hidden md:table-cell py-3 px-3 font-semibold text-muted-foreground">Due</th>
                    <th className="py-3 px-3 font-semibold text-muted-foreground text-right">Amount</th>
                    <th className="py-3 px-3 font-semibold text-muted-foreground text-right">Paid</th>
                    <th className="py-3 px-3 font-semibold text-muted-foreground text-right">Balance</th>
                    <th className="py-3 px-3 font-semibold text-muted-foreground">Status</th>
                    <th className="py-3 px-3 font-semibold text-muted-foreground text-right">Days overdue</th>
                    <th className="py-3 px-4 font-semibold text-muted-foreground text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {displayedInvoices.map((inv) => {
                    const agingKey = inv.aging_bucket || 'current';
                    const config = AGING_CONFIG[agingKey] || AGING_CONFIG.current;
                    const isOverdue = Number(inv.days_overdue) > 0;
                    const balance = Number(inv.balance) || 0;

                    return (
                      <tr key={inv.id} className="hover:bg-muted/40 transition-colors">
                        {/* Invoice & Order Number */}
                        <td className="py-3 px-4">
                          <p className="font-semibold text-foreground">{inv.invoice_number}</p>
                          <p className="text-[11px] text-muted-foreground">{inv.order_number || 'Direct'}</p>
                        </td>

                        {/* Customer & Rep */}
                        <td className="py-3 px-3">
                          <p className="font-medium text-foreground">{inv.customer}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {inv.representative || 'Unassigned'} · {(inv.payment_terms || 'net_30').replace('_', ' ')}
                          </p>
                        </td>

                        {/* Issued Date */}
                        <td className="hidden md:table-cell py-3 px-3 text-xs text-muted-foreground">
                          {inv.invoice_date || '—'}
                        </td>

                        {/* Due Date */}
                        <td className="hidden md:table-cell py-3 px-3 text-xs text-muted-foreground">
                          {inv.due_date || '—'}
                        </td>

                        {/* Total Amount */}
                        <td className="py-3 px-3 text-right tabular-nums text-foreground font-medium">
                          {formatCurrency(inv.amount)}
                        </td>

                        {/* Paid Amount */}
                        <td className="py-3 px-3 text-right tabular-nums text-muted-foreground">
                          {formatCurrency(inv.amount_paid)}
                        </td>

                        {/* Outstanding Balance */}
                        <td className="py-3 px-3 text-right tabular-nums font-semibold">
                          <span className={balance > 0 ? (isOverdue ? 'text-rose-600' : 'text-foreground') : 'text-muted-foreground'}>
                            {formatCurrency(balance)}
                          </span>
                        </td>

                        {/* Status / Aging Badge */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                              inv.status === 'paid'
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                : config.badgeClass
                            }`}
                          >
                            {inv.status === 'paid' ? 'Paid' : config.label}
                          </span>
                        </td>

                        {/* Days overdue */}
                        <td className="py-3 px-3 text-right tabular-nums">
                          <span className={isOverdue ? 'font-semibold text-rose-600' : 'text-muted-foreground'}>
                            {inv.days_overdue || 0}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {balance > 0 && (
                              <button
                                onClick={() => handleOpenPay(inv)}
                                className="btn-table-primary"
                              >
                                Pay
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenStatement(inv.customer)}
                              className="btn-table"
                            >
                              Statement
                            </button>
                            {balance > 0 && (
                              <button
                                onClick={() => handleCreateReminder(inv)}
                                title="Queue payment reminder in AI Centre"
                                className="btn-icon"
                              >
                                <Sparkles className="h-3 w-3 text-primary" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Load More Button after 30 items */}
            {filteredInvoices.length > visibleCount && (
              <div className="border-t border-border p-3 text-center bg-muted/20">
                <button
                  onClick={() => setVisibleCount((prev) => prev + 30)}
                  className="btn-secondary"
                >
                  Load more invoices (Showing {visibleCount} of {filteredInvoices.length})
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Customer Statement Modal Matching Lte */}
      {isStatementOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="max-h-[90vh] max-w-4xl w-full rounded-xl border border-border bg-card p-6 shadow-2xl overflow-y-auto space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold font-heading text-foreground">
                  Customer statement · {statementCustomer}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Balances are calculated from invoice and payment records only. An invoice is never treated as paid without a payment.
                </p>
              </div>
              <button
                onClick={() => setIsStatementOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-[11px] font-medium text-muted-foreground">Invoiced</p>
                <p className="mt-1 font-heading text-lg font-semibold text-foreground">
                  {formatCurrency(statementSummary.totalInvoiced)}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-[11px] font-medium text-muted-foreground">Paid</p>
                <p className="mt-1 font-heading text-lg font-semibold text-emerald-600">
                  {formatCurrency(statementSummary.totalPaid)}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-[11px] font-medium text-muted-foreground">Outstanding</p>
                <p className="mt-1 font-heading text-lg font-semibold text-rose-600">
                  {formatCurrency(statementSummary.totalBalance)}
                </p>
              </div>
            </div>

            {/* Invoices List */}
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Receipt className="h-3.5 w-3.5" />
                Invoices on Account ({statementInvoices.length})
              </p>
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-muted/40 border-b border-border text-muted-foreground">
                    <tr>
                      <th className="py-2 px-3 text-left">Invoice</th>
                      <th className="py-2 px-3 text-left">Issued</th>
                      <th className="py-2 px-3 text-left">Due</th>
                      <th className="py-2 px-3 text-right">Amount</th>
                      <th className="py-2 px-3 text-right">Balance</th>
                      <th className="py-2 px-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {statementInvoices.map((i) => (
                      <tr key={i.id} className="hover:bg-muted/20">
                        <td className="py-2 px-3 font-medium text-foreground">{i.invoice_number}</td>
                        <td className="py-2 px-3 text-muted-foreground">{i.invoice_date}</td>
                        <td className="py-2 px-3 text-muted-foreground">{i.due_date}</td>
                        <td className="py-2 px-3 text-right">{formatCurrency(i.amount)}</td>
                        <td className="py-2 px-3 text-right font-medium text-rose-600">{formatCurrency(i.balance)}</td>
                        <td className="py-2 px-3">
                          <span className="capitalize">{i.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payments List */}
            {statementPayments.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5" />
                  Confirmed Payments ({statementPayments.length})
                </p>
                <div className="rounded-lg border border-border overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/40 border-b border-border text-muted-foreground">
                      <tr>
                        <th className="py-2 px-3 text-left">Date</th>
                        <th className="py-2 px-3 text-left">Invoice</th>
                        <th className="py-2 px-3 text-left">Method</th>
                        <th className="py-2 px-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {statementPayments.map((p) => (
                        <tr key={p.id}>
                          <td className="py-2 px-3 text-muted-foreground">{p.payment_date}</td>
                          <td className="py-2 px-3 font-medium text-foreground">{p.invoice_number}</td>
                          <td className="py-2 px-3 uppercase text-muted-foreground">{p.method?.replace('_', ' ')}</td>
                          <td className="py-2 px-3 text-right text-emerald-600 font-medium">
                            {formatCurrency(p.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-border">
              <button
                onClick={() => setIsStatementOpen(false)}
                className="btn-secondary h-8 px-4 text-xs font-semibold"
              >
                Close Statement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {isPayModalOpen && selectedInvoiceForPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="max-w-md w-full rounded-xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-bold font-heading text-foreground">
                  Record Payment · {selectedInvoiceForPay.invoice_number}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedInvoiceForPay.customer} · Current balance {formatCurrency(selectedInvoiceForPay.balance)}
                </p>
              </div>
              <button
                onClick={() => setIsPayModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPayment} className="space-y-4 pt-2 text-[13.5px]">
              <div>
                <label className="block font-medium text-foreground mb-1.5 text-[13px]">Payment Amount ($ CAD) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={payForm.amount}
                  onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                  className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13.5px] font-medium text-foreground focus:ring-1 focus:ring-[#e1241a] focus:border-[#e1241a] shadow-2xs"
                />
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1.5 text-[13px]">Payment Date</label>
                <input
                  type="date"
                  required
                  value={payForm.payment_date}
                  onChange={(e) => setPayForm({ ...payForm, payment_date: e.target.value })}
                  className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13.5px] font-medium text-foreground focus:ring-1 focus:ring-[#e1241a] focus:border-[#e1241a] shadow-2xs"
                />
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1.5 text-[13px]">Payment Method</label>
                <select
                  value={payForm.method}
                  onChange={(e) => setPayForm({ ...payForm, method: e.target.value })}
                  className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13.5px] font-medium text-foreground focus:ring-1 focus:ring-[#e1241a] focus:border-[#e1241a] shadow-2xs"
                >
                  <option value="e_transfer">Interac e-Transfer</option>
                  <option value="eft">EFT / Direct Deposit</option>
                  <option value="cheque">Cheque</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="wire">Wire Transfer</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1.5 text-[13px]">Reference / Transaction Number</label>
                <input
                  type="text"
                  value={payForm.reference}
                  onChange={(e) => setPayForm({ ...payForm, reference: e.target.value })}
                  placeholder="e.g. EFT-99281"
                  className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13.5px] font-medium text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-[#e1241a] focus:border-[#e1241a] shadow-2xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3.5 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="btn-secondary h-9 px-4 text-[13px] font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary h-8 px-3.5 text-xs font-medium"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
