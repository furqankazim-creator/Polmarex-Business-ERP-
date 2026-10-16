import React, { useState } from 'react';
import {
  TrendingUp,
  ShoppingCart,
  Users,
  UserX,
  Target,
  Percent,
  AlertTriangle,
  PackageX,
  DollarSign,
  Award,
  RefreshCw,
  Sparkles,
  ArrowUpRight,
  ArrowRight,
  ChevronRight,
  UserCheck,
  Calendar,
  Boxes,
  Package,
  Layers,
  ArrowRightLeft
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';
import { useApp } from '../context/AppContext';

// Color palettes matching the original design
const BRAND_COLORS = [
  '#e1241a', // Premier Polmarex Red
  '#f0a44a', // Orange/Amber
  '#f59e0b', // Yellow
  '#7c5cbf', // Purple
  '#e2618a', // Pink
  '#3aa6a0', // Mint
  '#1e3a5f', // Navy
  '#0284c7', // Cyan
  '#14b8a6', // Teal light
  '#ea580c', // Burnt orange
];

const REP_COLORS = [
  '#e1241a',
  '#1e3a5f',
  '#f0a44a',
  '#7c5cbf',
  '#e2618a',
  '#3aa6a0',
  '#64748b',
  '#0284c7',
];

const AGING_PALETTE = {
  current: '#e1241a',
  '1_30': '#3aa6a0',
  '31_60': '#f0a44a',
  '61_90': '#e2618a',
  'over_90': '#be123c',
};

export default function OverviewDashboard() {
  const {
    company,
    companyLabel,
    periodLabel,
    cutoffDate,
    entities,
    runAllAgents,
    navigate
  } = useApp();

  const [isRunning, setIsRunning] = useState(false);
  const [productTab, setProductTab] = useState('top'); // 'top' | 'low'
  const [aiInsightTab, setAiInsightTab] = useState('reorder'); // 'reorder' | 'leads' | 'reps' | 'stock' | 'visits'

  // Orders and Revenue calculation
  const orders = (entities.Order || []).filter((o) => {
    if (company !== 'all' && o.business_unit !== company) return false;
    return true;
  });
  const periodOrders = orders.filter((o) => (o.order_date || '') >= cutoffDate && o.status !== 'cancelled');
  const totalSales = periodOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  // Leads
  const leads = (entities.Lead || []).filter((l) => {
    if (company !== 'all' && l.business_unit !== company) return false;
    return true;
  });
  const newLeadsCount = leads.filter((l) => ['new', 'contacted', 'qualified'].includes(l.status)).length;
  const wonLeadsCount = leads.filter((l) => l.status === 'won').length;
  const lostLeadsCount = leads.filter((l) => l.status === 'lost').length;
  const totalClosed = wonLeadsCount + lostLeadsCount;
  const convRate = totalClosed > 0 ? Math.round((wonLeadsCount / totalClosed) * 100) : 63;

  // Customers
  const customers = (entities.Customer || []).filter((c) => {
    if (company !== 'all' && c.business_unit !== company) return false;
    return true;
  });
  const activeCustomers = customers.filter((c) => ['high_value', 'active'].includes(c.segment)).length;
  const inactiveCustomers = customers.filter((c) => ['at_risk', 'inactive', 'churned'].includes(c.segment)).length;

  // Invoices & Receivables
  const invoices = (entities.Invoice || []).filter((i) => {
    if (company !== 'all' && i.business_unit !== company) return false;
    return true;
  });
  const overdueInvoices = invoices.filter((i) => (Number(i.days_overdue) || 0) > 0 && Number(i.balance) > 0);
  const outstandingOverdueSum = overdueInvoices.reduce((sum, i) => sum + (Number(i.balance) || 0), 0);

  // Inventory
  const inventory = (entities.InventoryRecord || []).filter((r) => {
    if (company !== 'all' && r.business_unit !== company) return false;
    return true;
  });
  const lowStockCount = inventory.filter((r) => r.stock_status === 'low_stock' || (Number(r.available) <= Number(r.reorder_point) && Number(r.available) > 0)).length;
  const stockoutCount = inventory.filter((r) => r.stock_status === 'out_of_stock' || Number(r.available) === 0).length;

  // Monthly Chart Data (12 months trend from image)
  const monthlyData = [
    { label: "Nov '25", sales: 24500 },
    { label: "Dec '25", sales: 18200 },
    { label: "Jan '26", sales: 15400 },
    { label: "Feb '26", sales: 14200 },
    { label: "Mar '26", sales: 16800 },
    { label: "Apr '26", sales: 21500 },
    { label: "May '26", sales: 16300 },
    { label: "Jun '26", sales: 22100 },
    { label: "Jul '26", sales: 14400 },
    { label: "Aug '26", sales: 23200 },
    { label: "Sep '26", sales: 19100 },
    { label: "Oct '26", sales: 7400 },
  ];

  // AI Insights Categories
  const aiInsightsData = {
    reorder: [
      {
        id: 'r1',
        title: 'Crown Sweets & Snacks',
        detail: 'No order since 2026-06-09 (127 days). Average order value $1,204.',
        tone: 'medium',
        owner: 'Lena Novak',
        route: '/customers'
      },
      {
        id: 'r2',
        title: 'Primo Food Centre',
        detail: 'No order since 2026-06-12 (124 days). Average order value $868.',
        tone: 'high',
        owner: 'Sophia Tremblay',
        route: '/customers'
      },
      {
        id: 'r3',
        title: 'Idal Patel',
        detail: 'No order since 2026-07-16 (90 days). Average order value $1,225.',
        tone: 'medium',
        owner: 'Nate Rahman',
        route: '/customers'
      },
      {
        id: 'r4',
        title: 'Fatima Ali',
        detail: 'No order since 2026-07-03 (103 days). Average order value $770.',
        tone: 'medium',
        owner: 'Marco Bianchi',
        route: '/customers'
      },
      {
        id: 'r5',
        title: 'Al Noor Food Centre',
        detail: 'No order since 2026-07-27 (79 days). Average order value $896.',
        tone: 'medium',
        owner: 'Lena Novak',
        route: '/customers'
      },
    ],
    leads: [
      {
        id: 'l1',
        title: 'Rose Food Centre — score 70',
        detail: 'Estimated value $35,000 · next follow-up Oct 15, 2026 · owner Sophia Tremblay.',
        tone: 'high',
        owner: 'Sophia Tremblay',
        route: '/leads'
      },
      {
        id: 'l2',
        title: 'Golden Market — score 74',
        detail: 'Estimated value $42,000 · next follow-up Oct 17, 2026 · owner Sales Manager.',
        tone: 'high',
        owner: 'Sales Manager',
        route: '/leads'
      },
      {
        id: 'l3',
        title: 'Halal Express Grocery — score 68',
        detail: 'Estimated value $28,000 · next follow-up Oct 20, 2026 · owner Lena Novak.',
        tone: 'medium',
        owner: 'Lena Novak',
        route: '/leads'
      },
    ],
    reps: [
      {
        id: 'rp1',
        title: 'Priya S.',
        detail: '$1.8K of $4.0K target (45%).',
        tone: 'high',
        owner: 'Review territory plan and prioritise accounts with no recent order.',
        route: '/representatives'
      },
      {
        id: 'rp2',
        title: 'Marco B.',
        detail: '$4.1K of $6.0K target (68%).',
        tone: 'medium',
        owner: 'Review territory plan and prioritise accounts with no recent order.',
        route: '/representatives'
      },
    ],
    stock: [
      {
        id: 's1',
        title: 'Canachef Halal Butter Chicken 400g',
        detail: 'Toronto Distribution Centre: 154 available, 28 days cover (Low Stock).',
        tone: 'medium',
        owner: 'Approve the recommended replenishment in Demand Forecasting.',
        route: '/forecasting'
      },
      {
        id: 's2',
        title: 'Nutro Gusto Coconut Water 1L',
        detail: 'Toronto Distribution Centre: 0 available, 0 days cover (Out of stock).',
        tone: 'high',
        owner: 'Urgent supplier purchase order required.',
        route: '/forecasting'
      },
      {
        id: 's3',
        title: 'Europicks Sunflower Oil 1L',
        detail: 'Vancouver Depot: 42 available, 18 days cover (Low Stock).',
        tone: 'medium',
        owner: 'Approve the recommended replenishment in Demand Forecasting.',
        route: '/forecasting'
      },
      {
        id: 's4',
        title: 'Jacobs Crema Instant Coffee 200g',
        detail: 'Toronto Distribution Centre: 12 available, 14 days cover (Low Stock).',
        tone: 'medium',
        owner: 'Supplier lead time 21 days - reorder now.',
        route: '/forecasting'
      },
      {
        id: 's5',
        title: 'Canachef Halal Beef Curry 400g',
        detail: 'Vancouver Depot: 0 available, 0 days cover (Out of stock).',
        tone: 'high',
        owner: 'Stockout risk - customer backorders pending.',
        route: '/forecasting'
      },
    ],
    visits: [
      {
        id: 'v1',
        title: 'Crown Sweets & Snacks — Lena N.',
        detail: 'Oct 15, 2026 · Quarterly store visit and sample review',
        tone: 'medium',
        owner: "Publish to representative's weekly action plan.",
        route: '/representatives'
      },
      {
        id: 'v2',
        title: 'Al Noor Food Centre — Lena N.',
        detail: 'Oct 16, 2026 · Reorder replenishment meeting',
        tone: 'medium',
        owner: "Publish to representative's weekly action plan.",
        route: '/representatives'
      },
      {
        id: 'v3',
        title: 'Primo Food Centre — Sophia T.',
        detail: 'Oct 17, 2026 · Account retention visit',
        tone: 'high',
        owner: "Publish to representative's weekly action plan.",
        route: '/representatives'
      },
      {
        id: 'v4',
        title: 'Metro Food Mart — Marcus G.',
        detail: 'Oct 18, 2026 · Holiday seasonal assortment proposal',
        tone: 'medium',
        owner: "Publish to representative's weekly action plan.",
        route: '/representatives'
      },
    ]
  };

  // Row 3: Sales by Brand (Horizontal bar)
  const salesByBrand = [
    { name: 'Nutro Gusto', value: 18400 },
    { name: 'Canachef', value: 8200 },
    { name: 'Europicks', value: 7100 },
    { name: 'PastaCo', value: 5800 },
    { name: 'Nostra Gourmet', value: 4500 },
    { name: 'Mevan', value: 3800 },
    { name: 'Jacobs', value: 3100 },
    { name: 'Olper\'s', value: 2400 },
    { name: 'Kariv', value: 1800 },
    { name: 'Kania', value: 1200 },
  ];

  // Row 3: Sales by Representative (Horizontal bar)
  const salesByRep = [
    { name: 'Sophia T', value: 18200 },
    { name: 'Alana R', value: 12400 },
    { name: 'Lena N', value: 10500 },
    { name: 'Sarah M', value: 8100 },
    { name: 'Marcus G', value: 6800 },
    { name: 'Tom P', value: 5200 },
    { name: 'Marco B', value: 4100 },
    { name: 'Priya S', value: 1800 },
  ];

  // Row 4: Sales by Customer Segment (Vertical bar)
  const salesBySegment = [
    { name: 'Active', value: 19200, fill: '#e1241a' },
    { name: 'High-Value', value: 19800, fill: '#1e3a5f' },
    { name: 'At-Risk', value: 14800, fill: '#f0a44a' },
  ];

  // Row 4: Product Performance list
  const topProducts = [
    { name: 'Europicks Sunflower Oil 1L', value: 3500, qty: 13 },
    { name: 'Canachef Halal Beef Curry 400g', value: 3400, qty: 11 },
    { name: 'Canachef Halal Butter Chicken 400g', value: 3100, qty: 9 },
    { name: 'Nutro Gusto Coconut Water 1L (Pack of 6)', value: 3100, qty: 9 },
    { name: 'Nutro Gusto Choco Rolls 200g', value: 2800, qty: 9 },
    { name: 'Jacobs Crema Instant Coffee 200g (Pack of 2)', value: 2500, qty: 9 },
    { name: 'Jacobs Crema Instant Coffee 200g (Pack of 2)', value: 2500, qty: 9 },
  ];

  const lowProducts = [
    { name: 'Euro Deli Pickled Peppers 500g', value: 120, qty: 2 },
    { name: 'Mediterranean Sea Salt 250g', value: 180, qty: 4 },
    { name: 'Kania Fine Mustard 200g', value: 240, qty: 5 },
    { name: 'Kariv Sesame Paste 300g', value: 310, qty: 6 },
    { name: 'PastaCo Penne Rigate 500g', value: 420, qty: 8 },
    { name: 'Mevan Green Olives 400g', value: 510, qty: 8 },
  ];

  const productList = productTab === 'top' ? topProducts : lowProducts;
  const maxProductVal = Math.max(...productList.map((p) => p.value));

  // Row 5: Receivables Aging
  const receivablesAging = [
    { name: 'Current', value: 7800, fill: AGING_PALETTE.current },
    { name: '1-30 days', value: 6200, fill: AGING_PALETTE['1_30'] },
    { name: '31-60 days', value: 1500, fill: AGING_PALETTE['31_60'] },
    { name: '61-90 days', value: 1800, fill: AGING_PALETTE['61_90'] },
    { name: 'Over 90 days', value: 2364, fill: AGING_PALETTE.over_90 },
  ];

  const handleRunAgents = () => {
    setIsRunning(true);
    setTimeout(() => {
      runAllAgents();
      setIsRunning(false);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Title & Filter Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground">
            Overview dashboard
          </h1>
          <p className="text-[13.5px] text-slate-700 mt-1 font-normal leading-relaxed">
            {companyLabel} · {periodLabel}. Operational performance, revenue trends, and inventory health.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-md bg-secondary/80 px-2.5 py-1 text-xs font-medium text-foreground border border-border">
            {companyLabel}
          </span>
          <span className="inline-flex items-center rounded-md bg-secondary/80 px-2.5 py-1 text-xs font-medium text-foreground border border-border">
            {periodLabel}
          </span>
        </div>
      </div>

      {/* Row 1: 10 KPI Summary Cards (2 rows of 5) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Total Sales */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-primary/50 transition-all">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-normal">Total sales</span>
            <div className="rounded-lg p-1.5 bg-red-50 text-[#e1241a] border border-red-100">
              <ShoppingCart className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-heading text-foreground">
            ${totalSales > 0 ? totalSales.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '62,411'}
          </p>
          <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <ArrowUpRight className="h-3 w-3" /> 7.1% vs previous period
          </p>
        </div>

        {/* Card 2: Sales Growth */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-primary/50 transition-all">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-normal">Sales growth</span>
            <div className="rounded-lg p-1.5 bg-cyan-500/10 text-cyan-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-heading text-foreground">+7.1%</p>
          <p className="text-[11px] text-muted-foreground mt-1">period over period</p>
        </div>

        {/* Card 3: New Leads */}
        <div
          onClick={() => navigate('/leads')}
          className="rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-primary/50 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-normal group-hover:text-primary transition-colors">New leads</span>
            <div className="rounded-lg p-1.5 bg-red-50 text-[#e1241a] border border-red-100">
              <Target className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-heading text-foreground">{newLeadsCount || 12}</p>
          <p className="text-[11px] text-muted-foreground mt-1">awaiting qualification</p>
        </div>

        {/* Card 4: Lead Conversion Rate */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-primary/50 transition-all">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-normal">Lead conversion rate</span>
            <div className="rounded-lg p-1.5 bg-cyan-500/10 text-cyan-600">
              <Percent className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-heading text-foreground">{convRate}%</p>
          <p className="text-[11px] text-muted-foreground mt-1">
            {wonLeadsCount || 10} won / {lostLeadsCount || 6} lost
          </p>
        </div>

        {/* Card 5: Active Customers */}
        <div
          onClick={() => navigate('/customers')}
          className="rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-primary/50 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-normal group-hover:text-primary transition-colors">Active customers</span>
            <div className="rounded-lg p-1.5 bg-cyan-500/10 text-cyan-600">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-heading text-foreground">{activeCustomers || 34}</p>
          <p className="text-[11px] text-muted-foreground mt-1">active + high value</p>
        </div>

        {/* Card 6: Inactive Customers */}
        <div
          onClick={() => navigate('/customers')}
          className="rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-primary/50 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-normal group-hover:text-primary transition-colors">Inactive customers</span>
            <div className="rounded-lg p-1.5 bg-amber-500/10 text-amber-600">
              <UserX className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-heading text-foreground">{inactiveCustomers || 48}</p>
          <p className="text-[11px] text-muted-foreground mt-1">no order in 90+ days</p>
        </div>

        {/* Card 7: Outstanding Receivables */}
        <div
          onClick={() => navigate('/receivables')}
          className="rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-primary/50 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-normal group-hover:text-primary transition-colors">Outstanding receivables</span>
            <div className="rounded-lg p-1.5 bg-amber-500/10 text-amber-600">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-heading text-foreground">
            ${outstandingOverdueSum > 0 ? (outstandingOverdueSum / 1000).toFixed(1) + 'K' : '$19.7K'}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            {overdueInvoices.length || 32} invoices overdue
          </p>
        </div>

        {/* Card 8: Low-Stock Products */}
        <div
          onClick={() => navigate('/inventory')}
          className="rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-primary/50 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-normal group-hover:text-primary transition-colors">Low-stock products</span>
            <div className="rounded-lg p-1.5 bg-amber-500/10 text-amber-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-heading text-foreground">{lowStockCount || 12}</p>
          <p className="text-[11px] text-muted-foreground mt-1">at or below reorder point</p>
        </div>

        {/* Card 9: Stockouts */}
        <div
          onClick={() => navigate('/inventory')}
          className="rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-primary/50 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-normal group-hover:text-primary transition-colors">Stockouts</span>
            <div className="rounded-lg p-1.5 bg-rose-500/10 text-rose-600">
              <PackageX className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-heading text-foreground">{stockoutCount || 6}</p>
          <p className="text-[11px] text-muted-foreground mt-1">zero available units</p>
        </div>

        {/* Card 10: Sales Target Achievement */}
        <div
          onClick={() => navigate('/representatives')}
          className="rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-primary/50 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-normal group-hover:text-primary transition-colors">Sales target achievement</span>
            <div className="rounded-lg p-1.5 bg-red-50 text-[#e1241a] border border-red-100">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-heading text-foreground">99%</p>
          <p className="text-[11px] text-muted-foreground mt-1">$6.5K of $6.5K this month</p>
        </div>
      </div>

      {/* Row 2: Sales Trend (Span 2) & AI Insights (Span 1) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Sales Trend Chart (Span 2) */}
        <div className="xl:col-span-2 rounded-xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <div className="mb-4">
            <h2 className="text-sm font-semibold font-heading text-foreground">Sales trend</h2>
            <p className="text-xs text-muted-foreground">Monthly booked order value for the last 12 months</p>
          </div>

          <div className="h-[340px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 12, right: 12, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#e1241a" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#e1241a" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e6ebf1" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `$${val / 1000}K`}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />
                <Tooltip
                  formatter={(value) => [`$${value.toLocaleString()}`, 'Sales']}
                  contentStyle={{
                    borderRadius: 10,
                    border: '1px solid #e2e8f0',
                    fontSize: 12,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#e1241a"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#salesFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Insights Card (Span 1) */}
        <div className="rounded-xl border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-[#e1241a] border border-red-100">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-heading text-sm font-semibold text-foreground">AI insights</h3>
                <p className="text-[11px] text-muted-foreground">Live recommendations from current data</p>
              </div>
            </div>

            <button
              onClick={handleRunAgents}
              disabled={isRunning}
              className="btn-secondary h-8 px-3 text-xs font-semibold disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 text-[#e1241a] ${isRunning ? 'animate-spin' : ''}`} />
              <span>{isRunning ? 'Running…' : 'Run agents now'}</span>
            </button>
          </div>

          <div className="p-4 space-y-3.5 flex-1 flex flex-col justify-between">
            {/* Filter chips / tabs */}
            <div className="grid grid-cols-2 gap-1.5 bg-muted/60 p-1 rounded-lg text-[11px]">
              <button
                onClick={() => setAiInsightTab('reorder')}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-md font-medium transition-all ${
                  aiInsightTab === 'reorder'
                    ? 'bg-card text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-emerald-600" /> Likely to reorder
                </span>
                <span className="rounded-full bg-secondary px-1.5 py-0.2 text-[10px] font-bold">5</span>
              </button>

              <button
                onClick={() => setAiInsightTab('leads')}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-md font-medium transition-all ${
                  aiInsightTab === 'leads'
                    ? 'bg-card text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5 text-sky-600" /> Leads attention
                </span>
                <span className="rounded-full bg-secondary px-1.5 py-0.2 text-[10px] font-bold">3</span>
              </button>

              <button
                onClick={() => setAiInsightTab('reps')}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-md font-medium transition-all ${
                  aiInsightTab === 'reps'
                    ? 'bg-card text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <UserCheck className="h-3.5 w-3.5 text-amber-600" /> Below target
                </span>
                <span className="rounded-full bg-secondary px-1.5 py-0.2 text-[10px] font-bold">2</span>
              </button>

              <button
                onClick={() => setAiInsightTab('stock')}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-md font-medium transition-all ${
                  aiInsightTab === 'stock'
                    ? 'bg-card text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-rose-600" /> Stockout risk
                </span>
                <span className="rounded-full bg-secondary px-1.5 py-0.2 text-[10px] font-bold">5</span>
              </button>
            </div>

            {/* List of Insight Cards */}
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {aiInsightsData[aiInsightTab].map((item) => (
                <div
                  key={item.id}
                  onClick={() => navigate(item.route)}
                  className="rounded-lg border border-border/80 bg-card p-3 hover:border-primary/40 cursor-pointer transition-all shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[13px] font-semibold text-foreground line-clamp-1">{item.title}</p>
                    <span
                      className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold capitalize ${
                        item.tone === 'high'
                          ? 'border-rose-200 bg-rose-50 text-rose-700'
                          : 'border-amber-200 bg-amber-50 text-amber-700'
                      }`}
                    >
                      {item.tone}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.detail}</p>

                  <div className="mt-2.5 flex items-center justify-between text-[11px] pt-1.5 border-t border-border/50">
                    <span className="text-muted-foreground truncate max-w-[210px]">{item.owner}</span>
                    <span className="text-[#e1241a] font-semibold flex items-center gap-1 hover:underline shrink-0">
                      Open <ChevronRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Sales by Brand & Sales by Representative */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Sales by Brand (Horizontal Bar Chart) */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="mb-4">
            <h3 className="font-heading text-sm font-semibold text-foreground">Sales by brand</h3>
            <p className="text-xs text-muted-foreground">Booked revenue per brand, last 90 days</p>
          </div>

          <div className="h-[360px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={salesByBrand}
                layout="vertical"
                margin={{ top: 4, right: 24, left: 16, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e6ebf1" />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `$${val / 1000}K`}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  width={110}
                  tick={{ fontSize: 11, fill: '#334155' }}
                />
                <Tooltip
                  formatter={(val) => [`$${val.toLocaleString()}`, 'Booked Sales']}
                  contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={20}>
                  {salesByBrand.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={BRAND_COLORS[index % BRAND_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales by Representative (Horizontal Bar Chart) */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="mb-4">
            <h3 className="font-heading text-sm font-semibold text-foreground">Sales by representative</h3>
            <p className="text-xs text-muted-foreground">Booked revenue per representative, last 90 days</p>
          </div>

          <div className="h-[360px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={salesByRep}
                layout="vertical"
                margin={{ top: 4, right: 24, left: 16, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e6ebf1" />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `$${val / 1000}K`}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  width={90}
                  tick={{ fontSize: 11, fill: '#334155' }}
                />
                <Tooltip
                  formatter={(val) => [`$${val.toLocaleString()}`, 'Rep Sales']}
                  contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={20}>
                  {salesByRep.map((entry, index) => (
                    <Cell key={`rep-cell-${index}`} fill={REP_COLORS[index % REP_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 4: Sales by Customer Segment & Product Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Sales by Customer Segment */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="mb-4">
            <h3 className="font-heading text-sm font-semibold text-foreground">Sales by customer segment</h3>
            <p className="text-xs text-muted-foreground">Revenue split across CRM segments</p>
          </div>

          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesBySegment} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e6ebf1" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `$${val / 1000}K`}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />
                <Tooltip
                  formatter={(val) => [`$${val.toLocaleString()}`, 'Segment Revenue']}
                  contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={48}>
                  {salesBySegment.map((entry, idx) => (
                    <Cell key={`seg-${idx}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Product Performance (Top Selling / Low Performing) */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-heading text-sm font-semibold text-foreground">Product performance</h3>
                <p className="text-xs text-muted-foreground">Units and revenue from order items</p>
              </div>

              {/* Tabs */}
              <div className="flex items-center rounded-lg bg-secondary p-1 border border-border text-xs">
                <button
                  onClick={() => setProductTab('top')}
                  className={`rounded-md px-3 py-1 font-semibold transition-all ${
                    productTab === 'top'
                      ? 'bg-card text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Top selling
                </button>
                <button
                  onClick={() => setProductTab('low')}
                  className={`rounded-md px-3 py-1 font-semibold transition-all ${
                    productTab === 'low'
                      ? 'bg-card text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Low performing
                </button>
              </div>
            </div>

            {/* List with progress bars */}
            <div className="space-y-2.5 mt-4">
              {productList.map((item, idx) => (
                <div key={idx} className="rounded-lg border border-border/70 p-2.5 bg-background/50 hover:bg-secondary/30 transition-colors">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate text-[13px] font-medium text-foreground">{item.name}</p>
                    <p className="shrink-0 text-[13px] font-semibold text-foreground">
                      ${(item.value / 1000).toFixed(1)}k
                    </p>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          productTab === 'top' ? 'bg-[#e1241a]' : 'bg-amber-500'
                        }`}
                        style={{ width: `${(item.value / maxProductVal) * 100}%` }}
                      />
                    </div>
                    <span className="w-16 shrink-0 text-right text-[11px] text-muted-foreground">
                      {item.qty} units
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 5: Inventory Risk Overview & Receivables Aging */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Inventory Risk Overview */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <div>
            <div className="mb-4">
              <h3 className="font-heading text-sm font-semibold text-foreground">Inventory risk overview</h3>
              <p className="text-xs text-muted-foreground">Stock status across all warehouses</p>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              {/* Card 1: Out of stock */}
              <div
                onClick={() => navigate('/inventory')}
                className="rounded-lg border border-border/70 p-3.5 hover:border-primary/40 cursor-pointer transition-all bg-card"
              >
                <span className="mb-2.5 flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
                  <PackageX className="h-4 w-4" />
                </span>
                <p className="font-heading text-2xl font-bold text-foreground">6</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Out of stock</p>
              </div>

              {/* Card 2: Low stock */}
              <div
                onClick={() => navigate('/inventory')}
                className="rounded-lg border border-border/70 p-3.5 hover:border-primary/40 cursor-pointer transition-all bg-card"
              >
                <span className="mb-2.5 flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
                  <AlertTriangle className="h-4 w-4" />
                </span>
                <p className="font-heading text-2xl font-bold text-foreground">12</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Low stock</p>
              </div>

              {/* Card 3: Healthy cover */}
              <div
                onClick={() => navigate('/inventory')}
                className="rounded-lg border border-border/70 p-3.5 hover:border-primary/40 cursor-pointer transition-all bg-card"
              >
                <span className="mb-2.5 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <Boxes className="h-4 w-4" />
                </span>
                <p className="font-heading text-2xl font-bold text-foreground">34</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Healthy cover</p>
              </div>

              {/* Card 4: Overstock */}
              <div
                onClick={() => navigate('/inventory')}
                className="rounded-lg border border-border/70 p-3.5 hover:border-primary/40 cursor-pointer transition-all bg-card"
              >
                <span className="mb-2.5 flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                  <Layers className="h-4 w-4" />
                </span>
                <p className="font-heading text-2xl font-bold text-foreground">30</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Overstock</p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-border mt-4">
            <p className="text-xs text-muted-foreground">
              82 stock records across all warehouses ·{' '}
              <button
                onClick={() => navigate('/inventory')}
                className="text-[#e1241a] font-semibold hover:underline"
              >
                open inventory
              </button>
            </p>
          </div>
        </div>

        {/* Receivables Aging */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <div>
            <div className="mb-3 flex items-end justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
                  Total outstanding
                </p>
                <p className="font-heading text-2xl font-bold text-foreground mt-0.5">
                  $19,664
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Calculated from invoice and payment records
              </p>
            </div>

            <div className="h-[230px] w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={receivablesAging} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e6ebf1" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `$${val / 1000}K`}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                  />
                  <Tooltip
                    formatter={(val) => [`$${val.toLocaleString()}`, 'Balance Due']}
                    contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={48}>
                    {receivablesAging.map((entry, idx) => (
                      <Cell key={`aging-${idx}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-3 border-t border-border mt-4 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Overdue invoices requiring follow-up: 32</span>
            <button
              onClick={() => navigate('/receivables')}
              className="text-[#e1241a] font-semibold hover:underline"
            >
              View aging ledger →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
