import React, { useState, useMemo } from 'react';
import {
  Target,
  Percent,
  Route,
  UserPlus,
  Users,
  SlidersHorizontal,
  Calendar,
  MapPin,
  CheckCircle2,
  Clock,
  Briefcase,
  ArrowUpDown,
  Share2,
  DollarSign,
  Sparkles,
  Info,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Building2,
  Mail,
  Send,
  Download
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  Legend
} from 'recharts';
import { useApp } from '../context/AppContext';

// Base44 brand palette
const BRAND_PALETTE = ['#e1241a', '#1e3a5f', '#f0a44a', '#7c5cbf', '#e2618a', '#3aa6a0', '#94a3b8'];

export default function Representatives() {
  const { company, companyLabel, periodLabel, cutoffDate, entities, showToast, exportCSV } = useApp();

  const [activeTab, setActiveTab] = useState('performance'); // 'performance' | 'routes'
  const [selectedRepName, setSelectedRepName] = useState('Sophie Tremblay');
  const [repFilter, setRepFilter] = useState('all');
  const [sortBy, setSortBy] = useState('sales'); // 'sales' | 'pct' | 'visits' | 'outstanding'
  const [isPublishing, setIsPublishing] = useState(false);

  const representatives = entities.Representative || [];
  const orders = entities.Order || [];
  const orderItems = entities.OrderItem || [];
  const visits = entities.CustomerVisit || [];
  const leads = entities.Lead || [];
  const customers = entities.Customer || [];
  const invoices = entities.Invoice || [];
  const salesTargets = entities.SalesTarget || [];

  // Anchor period target month
  const targetPeriodMonth = '2026-10';

  // Rep Stats Aggregation
  const repStatsList = useMemo(() => {
    return representatives
      .filter((r) => {
        if (company !== 'all' && r.business_unit && r.business_unit !== company) return false;
        return true;
      })
      .map((r) => {
        const name = r.full_name;

        // Scoped orders
        const rOrders = orders.filter((o) => {
          if (o.representative !== name) return false;
          if (o.status === 'cancelled') return false;
          if (company !== 'all' && o.business_unit && o.business_unit !== company) return false;
          if (cutoffDate && o.order_date && o.order_date < cutoffDate) return false;
          return true;
        });

        const sales = rOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
        const orderCount = rOrders.length;

        // Target for 2026-10
        const matchedTarget = salesTargets.find(
          (t) => t.representative === name && t.period === targetPeriodMonth && t.metric === 'sales'
        );
        const target = matchedTarget
          ? Number(matchedTarget.target_value) || 500
          : Number(r.monthly_target) || 500;

        const pct = target > 0 ? (sales / target) * 100 : 0;

        // Completed visits in period
        const rVisits = visits.filter((v) => {
          if (v.representative !== name) return false;
          if (v.status !== 'completed') return false;
          if (company !== 'all' && v.business_unit && v.business_unit !== company) return false;
          if (cutoffDate && v.visit_date && v.visit_date < cutoffDate) return false;
          return true;
        });
        const visitCount = rVisits.length;

        // Leads won / lost
        const rLeadsWon = leads.filter(
          (l) => l.assigned_rep === name && l.status === 'won' && (company === 'all' || l.business_unit === company)
        ).length;
        const rLeadsLost = leads.filter(
          (l) => l.assigned_rep === name && l.status === 'lost' && (company === 'all' || l.business_unit === company)
        ).length;
        const totalLeadsClosed = rLeadsWon + rLeadsLost;
        const conversion = totalLeadsClosed > 0 ? Math.round((rLeadsWon / totalLeadsClosed) * 100) : 0;

        // Repeat orders: customers assigned with order_count >= 2
        const repeatOrders = customers.filter(
          (c) => c.assigned_rep === name && (Number(c.order_count) || 0) >= 2 && (company === 'all' || c.business_unit === company)
        ).length;

        // Outstanding invoices balance
        const rInvoices = invoices.filter(
          (i) => i.representative === name && Number(i.balance) > 0 && (company === 'all' || i.business_unit === company)
        );
        const outstanding = rInvoices.reduce((sum, i) => sum + (Number(i.balance) || 0), 0);

        return {
          id: r.id,
          rep: name,
          company: r.business_unit,
          territory: r.territory || r.region,
          sales: Math.round(sales),
          orders: orderCount,
          target: Math.round(target),
          pct,
          visits: visitCount,
          newCustomers: rLeadsWon,
          conversion,
          repeatOrders,
          outstanding: Math.round(outstanding)
        };
      });
  }, [representatives, orders, visits, leads, customers, invoices, salesTargets, company, cutoffDate]);

  // Filtered & Sorted Reps
  const displayedReps = useMemo(() => {
    let list = [...repStatsList];
    if (repFilter !== 'all') {
      list = list.filter((r) => r.rep === repFilter);
    }
    return list.sort((a, b) => {
      if (sortBy === 'sales') return b.sales - a.sales;
      if (sortBy === 'pct') return b.pct - a.pct;
      if (sortBy === 'visits') return b.visits - a.visits;
      if (sortBy === 'outstanding') return b.outstanding - a.outstanding;
      return 0;
    });
  }, [repStatsList, repFilter, sortBy]);

  // Overall Totals
  const overallTotals = useMemo(() => {
    const totalSales = displayedReps.reduce((acc, r) => acc + r.sales, 0);
    const totalTarget = displayedReps.reduce((acc, r) => acc + r.target, 0);
    const totalVisits = displayedReps.reduce((acc, r) => acc + r.visits, 0);
    const totalWon = displayedReps.reduce((acc, r) => acc + r.newCustomers, 0);
    const totalOutstanding = displayedReps.reduce((acc, r) => acc + r.outstanding, 0);

    const overallAchievement = totalTarget > 0 ? Math.round((totalSales / totalTarget) * 100) : 0;

    return {
      sales: totalSales,
      target: totalTarget,
      achievement: overallAchievement,
      visits: totalVisits,
      newCustomers: totalWon,
      outstanding: totalOutstanding
    };
  }, [displayedReps]);

  // Active Selected Rep Data
  const currentRepData = useMemo(() => {
    return displayedReps.find((r) => r.rep === selectedRepName) || displayedReps[0] || null;
  }, [displayedReps, selectedRepName]);

  // Brand Breakdown for Selected Rep
  const repBrandMix = useMemo(() => {
    if (!currentRepData) return [];
    const repItems = orderItems.filter((item) => {
      if (item.representative !== currentRepData.rep) return false;
      if (company !== 'all' && item.business_unit && item.business_unit !== company) return false;
      if (cutoffDate && item.order_date && item.order_date < cutoffDate) return false;
      return true;
    });

    const brandMap = {};
    repItems.forEach((item) => {
      const b = item.brand || 'Other';
      brandMap[b] = (brandMap[b] || 0) + (Number(item.line_total) || 0);
    });

    return Object.entries(brandMap)
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value);
  }, [currentRepData, orderItems, company, cutoffDate]);

  // Planned Visits for Selected Rep
  const plannedVisits = useMemo(() => {
    if (!currentRepData) return [];
    return visits
      .filter((v) => v.representative === currentRepData.rep && v.status === 'planned')
      .sort((a, b) => (a.visit_date || '').localeCompare(b.visit_date || '') || (a.planned_sequence || 0) - (b.planned_sequence || 0));
  }, [currentRepData, visits]);

  // Group planned visits by date
  const groupedVisits = useMemo(() => {
    const map = {};
    plannedVisits.forEach((v) => {
      const date = v.visit_date || 'Upcoming';
      if (!map[date]) map[date] = [];
      map[date].push(v);
    });
    return map;
  }, [plannedVisits]);

  // Chart data for Target vs Actual
  const targetVsActualChartData = useMemo(() => {
    return displayedReps.map((r) => ({
      name: r.rep.split(' ')[0], // First name for clean x-axis
      fullName: r.rep,
      Target: r.target,
      Actual: r.sales
    }));
  }, [displayedReps]);

  // Publish Weekly Action Plan Action
  const handlePublishPlan = () => {
    if (!currentRepData) return;
    setIsPublishing(true);

    setTimeout(() => {
      setIsPublishing(false);
      showToast({
        title: 'Weekly Plan Published',
        description: `${plannedVisits.length} recommended customer visits were published to ${currentRepData.rep}'s calendar.`
      });
    }, 600);
  };

  function formatCurrency(val) {
    if (val === null || val === undefined) return '$0';
    return `$${Number(val).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }

  function formatCompactCurrency(val) {
    const num = Number(val) || 0;
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(1)}K`;
    return `$${num.toFixed(0)}`;
  }

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground">Sales representatives</h1>
          <p className="text-[13.5px] text-slate-700 font-normal leading-relaxed mt-1 max-w-3xl">
            Actual performance for {companyLabel.toLowerCase()} against targets, {periodLabel.toLowerCase()}. AI recommendations are shown separately from actual results.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportCSV('orders')}
            className="btn-secondary"
          >
            <Download className="w-3.5 h-3.5 text-muted-foreground mr-1.5" />
            <span>Export Sales CSV</span>
          </button>
          <span className="inline-flex items-center rounded-lg border border-border bg-card px-3 py-1.5 text-[11px] text-muted-foreground shadow-xs">
            Actuals from orders · targets from the target table
          </span>
        </div>
      </div>

      {/* 5 KPI Cards Matching Base44 & Screenshot */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {/* Total Sales */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[13px] font-medium text-muted-foreground">Total sales</p>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-[#e1241a] border border-red-100">
              <Target className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 font-heading text-2xl font-semibold tracking-tight text-foreground">
            {formatCompactCurrency(overallTotals.sales)}
          </p>
          <div className="mt-1.5 flex items-center gap-2 text-xs">
            <span className="truncate text-muted-foreground">{periodLabel.toLowerCase()}</span>
          </div>
        </div>

        {/* Target Achievement */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[13px] font-medium text-muted-foreground">Target achievement</p>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-[#e1241a] border border-red-100">
              <Percent className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 font-heading text-2xl font-semibold tracking-tight text-foreground">
            {overallTotals.achievement}%
          </p>
          <div className="mt-1.5 flex items-center gap-2 text-xs">
            <span className="truncate text-muted-foreground">
              {formatCompactCurrency(overallTotals.target)} target
            </span>
          </div>
        </div>

        {/* Customer Visits */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[13px] font-medium text-muted-foreground">Customer visits</p>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-[#e1241a] border border-red-100">
              <Route className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 font-heading text-2xl font-semibold tracking-tight text-foreground">
            {overallTotals.visits}
          </p>
          <div className="mt-1.5 flex items-center gap-2 text-xs">
            <span className="truncate text-muted-foreground">completed in period</span>
          </div>
        </div>

        {/* New Customers Won */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[13px] font-medium text-muted-foreground">New customers won</p>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-[#e1241a] border border-red-100">
              <UserPlus className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 font-heading text-2xl font-semibold tracking-tight text-foreground">
            {overallTotals.newCustomers}
          </p>
          <div className="mt-1.5 flex items-center gap-2 text-xs">
            <span className="truncate text-muted-foreground">leads closed won</span>
          </div>
        </div>

        {/* Outstanding Invoices */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[13px] font-medium text-muted-foreground">Outstanding invoices</p>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Users className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 font-heading text-2xl font-semibold tracking-tight text-foreground">
            {formatCompactCurrency(overallTotals.outstanding)}
          </p>
          <div className="mt-1.5 flex items-center gap-2 text-xs">
            <span className="truncate text-muted-foreground">on accounts they own</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="filter-bar-base44">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground shrink-0">
          <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Filters</span>
        </div>

        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          {/* Representative Filter */}
          <div className="w-full sm:w-52">
            <select
              value={repFilter}
              onChange={(e) => {
                setRepFilter(e.target.value);
                if (e.target.value !== 'all') setSelectedRepName(e.target.value);
              }}
              className="h-9.5 w-full rounded-lg border border-slate-300 bg-white px-3 text-[13.5px] font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-[#e1241a] focus:border-[#e1241a] shadow-2xs"
            >
              <option value="all">Representative (All)</option>
              {representatives.map((rep) => (
                <option key={rep.id || rep.full_name} value={rep.full_name}>
                  {rep.full_name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Filter */}
          <div className="w-full sm:w-52">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-9.5 w-full rounded-lg border border-slate-300 bg-white px-3 text-[13.5px] font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-[#e1241a] focus:border-[#e1241a] shadow-2xs"
            >
              <option value="sales">Sort: sales</option>
              <option value="pct">Sort: achievement %</option>
              <option value="visits">Sort: visits</option>
              <option value="outstanding">Sort: outstanding</option>
            </select>
          </div>

          <p className="text-[11px] text-muted-foreground ml-1 hidden sm:inline">
            Brand, territory, company and date filters apply from the top bar.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center rounded-full border border-slate-200/80 bg-slate-100 px-2.5 py-0.5 text-xs font-normal text-slate-600">
            {displayedReps.length} records
          </span>
          {repFilter !== 'all' && (
            <button
              onClick={() => setRepFilter('all')}
              className="btn-secondary h-8 px-2.5 text-xs font-medium"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Tabs Row */}
      <div className="inline-flex items-center rounded-lg bg-slate-100 p-0.5 border border-border w-fit">
        <button
          onClick={() => setActiveTab('performance')}
          className={`rounded-md px-3.5 py-1 text-xs font-semibold transition-all ${
            activeTab === 'performance' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Performance
        </button>
        <button
          onClick={() => setActiveTab('routes')}
          className={`rounded-md px-3.5 py-1 text-xs font-semibold transition-all ${
            activeTab === 'routes' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Route planning & weekly plan
        </button>
      </div>

      {/* Tab 1: Performance */}
      {activeTab === 'performance' && (
        <div className="space-y-4">
          {/* Target vs Actual Bar Chart */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-4">
              <h2 className="text-sm font-semibold font-heading text-foreground">Target vs actual</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Booked sales against the {targetPeriodMonth} target per representative
              </p>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={targetVsActualChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e6ebf1" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    width={56}
                    tickFormatter={(val) => formatCompactCurrency(val)}
                  />
                  <Tooltip
                    formatter={(val, name) => [formatCurrency(val), name]}
                    contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                  <Bar dataKey="Target" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={22} />
                  <Bar dataKey="Actual" fill="#e1241a" radius={[4, 4, 0, 0]} barSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Representatives Directory Table */}
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="py-3 px-4 font-semibold text-muted-foreground">Representative</th>
                    <th className="py-3 px-3 font-semibold text-muted-foreground">Territory</th>
                    <th className="py-3 px-3 font-semibold text-muted-foreground text-right">Sales</th>
                    <th className="py-3 px-3 font-semibold text-muted-foreground text-right">Target</th>
                    <th className="py-3 px-3 font-semibold text-muted-foreground w-[170px]">Achievement</th>
                    <th className="hidden lg:table-cell py-3 px-3 font-semibold text-muted-foreground text-right">Orders</th>
                    <th className="hidden lg:table-cell py-3 px-3 font-semibold text-muted-foreground text-right">Visits</th>
                    <th className="hidden xl:table-cell py-3 px-3 font-semibold text-muted-foreground text-right">New customers</th>
                    <th className="hidden xl:table-cell py-3 px-3 font-semibold text-muted-foreground text-right">Conversion</th>
                    <th className="hidden xl:table-cell py-3 px-3 font-semibold text-muted-foreground text-right">Repeat orders</th>
                    <th className="py-3 px-4 font-semibold text-muted-foreground text-right">Outstanding</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {displayedReps.map((r) => {
                    const isSelected = r.rep === selectedRepName;
                    const achievementPct = r.pct;

                    return (
                      <tr
                        key={r.id || r.rep}
                        onClick={() => setSelectedRepName(r.rep)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-red-500/10 font-medium' : 'hover:bg-muted/50'
                        }`}
                      >
                        {/* Name & Company */}
                        <td className="py-3 px-4">
                          <p className="font-medium text-foreground">{r.rep}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5 uppercase tracking-wide">
                            {r.company}
                          </p>
                        </td>

                        {/* Territory */}
                        <td className="py-3 px-3 text-xs text-muted-foreground">
                          {r.territory}
                        </td>

                        {/* Sales */}
                        <td className="py-3 px-3 text-right tabular-nums text-foreground font-medium">
                          {formatCurrency(r.sales)}
                        </td>

                        {/* Target */}
                        <td className="py-3 px-3 text-right tabular-nums text-muted-foreground">
                          {formatCurrency(r.target)}
                        </td>

                        {/* Achievement Bar & % */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-[90px] rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full bg-[#e1241a] rounded-full"
                                style={{ width: `${Math.min(100, achievementPct)}%` }}
                              />
                            </div>
                            <span
                              className={`text-xs font-medium tabular-nums ${
                                achievementPct >= 100
                                  ? 'text-emerald-600'
                                  : achievementPct >= 75
                                  ? 'text-foreground'
                                  : 'text-rose-600'
                              }`}
                            >
                              {achievementPct.toFixed(0)}%
                            </span>
                          </div>
                        </td>

                        {/* Orders */}
                        <td className="hidden lg:table-cell py-3 px-3 text-right tabular-nums text-muted-foreground">
                          {r.orders}
                        </td>

                        {/* Visits */}
                        <td className="hidden lg:table-cell py-3 px-3 text-right tabular-nums text-muted-foreground">
                          {r.visits}
                        </td>

                        {/* New customers */}
                        <td className="hidden xl:table-cell py-3 px-3 text-right tabular-nums text-muted-foreground">
                          {r.newCustomers}
                        </td>

                        {/* Conversion */}
                        <td className="hidden xl:table-cell py-3 px-3 text-right tabular-nums text-muted-foreground">
                          {r.conversion}%
                        </td>

                        {/* Repeat orders */}
                        <td className="hidden xl:table-cell py-3 px-3 text-right tabular-nums text-muted-foreground">
                          {r.repeatOrders}
                        </td>

                        {/* Outstanding Balance */}
                        <td className="py-3 px-4 text-right tabular-nums">
                          <span
                            className={
                              r.outstanding > 0 ? 'font-medium text-rose-600' : 'text-muted-foreground'
                            }
                          >
                            {formatCurrency(r.outstanding)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Deep-dive details for selected representative */}
          {currentRepData && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {/* Brand Mix Horizontal Bar Chart */}
                <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold font-heading text-foreground">
                      Brand mix · {currentRepData.rep}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Booked revenue per brand in the selected period
                    </p>
                  </div>

                  {repBrandMix.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-center p-6">
                      <p className="text-xs text-muted-foreground">No brand data recorded in this period</p>
                    </div>
                  ) : (
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={repBrandMix}
                          layout="vertical"
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e6ebf1" horizontal={false} />
                          <XAxis
                            type="number"
                            tick={{ fontSize: 11, fill: '#64748b' }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(val) => formatCompactCurrency(val)}
                          />
                          <YAxis
                            type="category"
                            dataKey="name"
                            tick={{ fontSize: 11, fill: '#334155' }}
                            axisLine={false}
                            tickLine={false}
                            width={110}
                          />
                          <Tooltip
                            formatter={(val) => [formatCurrency(val), 'Sales']}
                            contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }}
                          />
                          <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={16}>
                            {repBrandMix.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={BRAND_PALETTE[index % BRAND_PALETTE.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Sales Trend Weekly Line Chart or Empty State */}
                <div className="rounded-xl border border-border bg-card p-5 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-semibold font-heading text-foreground">
                      Sales trend · {currentRepData.rep}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Booked value per week</p>
                  </div>

                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 min-h-[220px]">
                    <div className="h-10 w-10 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground mb-3">
                      <Mail className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-semibold text-foreground">No data for this selection</p>
                    <p className="text-[11px] text-muted-foreground mt-1 max-w-xs">
                      Try a wider date range or a different company.
                    </p>
                  </div>
                </div>
              </div>

              {/* Actual results summary footer card */}
              <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <h3 className="font-heading text-sm font-semibold text-foreground">
                  Actual results for {currentRepData.rep}
                </h3>
                <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
                  <div className="rounded-lg border border-border/70 p-3 bg-muted/20">
                    <p className="text-[11px] text-muted-foreground">Sales booked</p>
                    <p className="mt-0.5 font-heading text-lg font-semibold text-foreground">
                      {formatCurrency(currentRepData.sales)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/70 p-3 bg-muted/20">
                    <p className="text-[11px] text-muted-foreground">Orders</p>
                    <p className="mt-0.5 font-heading text-lg font-semibold text-foreground">
                      {currentRepData.orders}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/70 p-3 bg-muted/20">
                    <p className="text-[11px] text-muted-foreground">Visits completed</p>
                    <p className="mt-0.5 font-heading text-lg font-semibold text-foreground">
                      {currentRepData.visits}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/70 p-3 bg-muted/20">
                    <p className="text-[11px] text-muted-foreground">Outstanding invoices</p>
                    <p className="mt-0.5 font-heading text-lg font-semibold text-rose-600">
                      {formatCurrency(currentRepData.outstanding)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Route Planning & Weekly Plan */}
      {activeTab === 'routes' && (
        <div className="space-y-4">
          {/* Action Header for Plan */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-heading text-sm font-semibold text-foreground">
                Weekly action plan · {selectedRepName}
              </h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {plannedVisits.length} recommended visits across {Object.keys(groupedVisits).length} days. Recommended sequence is ordered by priority, opportunity value and outstanding balance.
              </p>
            </div>

            <button
              onClick={handlePublishPlan}
              disabled={isPublishing || plannedVisits.length === 0}
              className="btn-primary"
            >
              <Send className="mr-1.5 h-3.5 w-3.5" />
              <span>{isPublishing ? 'Publishing...' : 'Publish plan to representative'}</span>
            </button>
          </div>

          {/* Grouped Visits List */}
          {plannedVisits.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <p className="text-sm font-medium text-foreground">No planned visits</p>
              <p className="text-xs text-muted-foreground mt-1">
                Run the Sales Intelligence Agent to build a recommended plan for this representative.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedVisits).map(([date, dayVisits]) => (
                <div key={date} className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <p className="flex items-center gap-2 font-heading text-xs font-bold text-foreground">
                    <Calendar className="h-4 w-4 text-primary" />
                    {date}
                  </p>

                  <div className="space-y-2">
                    {dayVisits.map((v, idx) => (
                      <div
                        key={v.id || idx}
                        className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 rounded-lg border border-border/70 p-3 bg-muted/20 hover:bg-muted/40 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                            {idx + 1}
                          </span>
                          <div>
                            <p className="font-semibold text-xs text-foreground">{v.customer}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {v.address || `${v.city}, ${v.region}`}
                            </p>
                            <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[10px]">
                              <span className="rounded bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 font-medium">
                                {v.purpose || 'Client Visit'}
                              </span>
                              <span
                                className={`rounded px-2 py-0.5 font-medium ${
                                  v.priority === 'high'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}
                              >
                                {v.priority ? `${v.priority.toUpperCase()} Priority` : 'Standard'}
                              </span>
                              {v.source === 'ai_recommended' && (
                                <span className="rounded bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 font-medium flex items-center gap-1">
                                  <Sparkles className="h-2.5 w-2.5" />
                                  AI Suggested
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right sm:max-w-xs">
                          {v.reason && (
                            <p className="text-[11px] text-muted-foreground italic">
                              "{v.reason}"
                            </p>
                          )}
                          {v.expected_outcome && (
                            <p className="text-[11px] font-medium text-foreground mt-1">
                              Goal: {v.expected_outcome}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Legal / Data Footnote Alert */}
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-3 text-[11px] text-muted-foreground">
            <Info className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            Routes, visit counts and balances shown here come from stored visits, orders and invoices. Nothing on this page predicts sales results.
          </div>
        </div>
      )}
    </div>
  );
}
