import React, { useState } from 'react';
import {
  DollarSign,
  Package,
  Percent,
  ShoppingCart,
  Receipt,
  FileText,
  Download,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Boxes,
  ArrowUpRight,
  ChevronRight
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

export default function Reports() {
  const { company, companyLabel, periodLabel, navigate, showToast } = useApp();

  // Default to 'low' matching screenshot media_1792042592552_1e9de30b.png
  const [productTab, setProductTab] = useState('low'); // 'top' | 'low'

  // 12 Months sales trend data matching screenshot
  const salesTrendData = [
    { month: 'Nov 25', sales: 26000 },
    { month: 'Dec 25', sales: 13500 },
    { month: 'Jan 26', sales: 12000 },
    { month: 'Feb 26', sales: 15500 },
    { month: 'Mar 26', sales: 17500 },
    { month: 'Apr 26', sales: 16000 },
    { month: 'May 26', sales: 18500 },
    { month: 'Jun 26', sales: 24500 },
    { month: 'Jul 26', sales: 14500 },
    { month: 'Aug 26', sales: 25500 },
    { month: 'Sep 26', sales: 21000 },
    { month: 'Oct 26', sales: 10500 },
  ];

  // Revenue by Brand (15 brands) matching sequence
  const brandRevenueData = [
    { brand: 'Nutro Gusto', revenue: 14947, color: '#e1241a' },
    { brand: 'Canachef', revenue: 7622, color: '#1e293b' },
    { brand: 'Europicks', revenue: 6726, color: '#e59f42' },
    { brand: 'PastaCo', revenue: 5242, color: '#7c5cbf' },
    { brand: 'Nostra Gourmet', revenue: 4196, color: '#e2618a' },
    { brand: 'Mezan', revenue: 3144, color: '#2da89b' },
    { brand: 'Jacobs', revenue: 2880, color: '#94a3b8' },
    { brand: 'Ogusto', revenue: 2115, color: '#e1241a' },
    { brand: 'Sante', revenue: 1505, color: '#1e293b' },
    { brand: 'Milka', revenue: 1396, color: '#e59f42' },
    { brand: 'Unilever', revenue: 1348, color: '#7c5cbf' },
    { brand: 'Biofix', revenue: 1340, color: '#e2618a' },
    { brand: 'Crispico', revenue: 1324, color: '#2da89b' },
    { brand: 'Shezan', revenue: 723, color: '#94a3b8' },
    { brand: 'Lowicz', revenue: 321, color: '#e1241a' },
  ];

  // Revenue by Representative matching screenshot
  const repRevenueData = [
    { rep: 'Sophie T', revenue: 15200, color: '#e1241a' },
    { rep: 'Alisha R', revenue: 11400, color: '#1e293b' },
    { rep: 'Lena N', revenue: 9200, color: '#e59f42' },
    { rep: 'Daniel K', revenue: 6800, color: '#7c5cbf' },
    { rep: 'Maryam Q', revenue: 5400, color: '#e2618a' },
    { rep: 'Marco D', revenue: 4200, color: '#2da89b' },
    { rep: 'Ivan P', revenue: 2400, color: '#94a3b8' },
    { rep: 'Priya K', revenue: 1600, color: '#e1241a' },
  ];

  // Revenue by Segment matching screenshot
  const segmentRevenueData = [
    { segment: 'Active', revenue: 22400, color: '#e1241a' },
    { segment: 'High-Value', revenue: 22800, color: '#1e293b' },
    { segment: 'At-Risk', revenue: 14600, color: '#e59f42' },
  ];

  // Revenue by Channel matching screenshot
  const channelRevenueData = [
    { channel: 'Rep Visit', revenue: 12500, color: '#e1241a' },
    { channel: 'Phone', revenue: 14800, color: '#1e293b' },
    { channel: 'Email', revenue: 11200, color: '#e59f42' },
    { channel: 'Website', revenue: 21500, color: '#7c5cbf' },
  ];

  // Revenue by Company matching screenshot
  const companyRevenueData = [
    { company: 'PRM', revenue: 36200, color: '#e1241a' },
    { company: 'NUG', revenue: 2400, color: '#1e293b' },
    { company: 'MML', revenue: 16200, color: '#e59f42' },
  ];

  // Receivables Aging matching exact chart in media_1792042592552_1e9de30b.png ($19,664 total)
  const agingData = [
    { bucket: 'Current', amount: 8000, color: '#e1241a' },
    { bucket: '1-30 days', amount: 6000, color: '#2da89b' },
    { bucket: '31-60 days', amount: 1600, color: '#e59f42' },
    { bucket: '61-90 days', amount: 1800, color: '#e2618a' },
    { bucket: 'Over 90 days', amount: 2264, color: '#be123c' },
  ];

  // Brand margin analysis table data matching screenshot
  const brandMarginData = [
    { brand: 'Nutro Gusto', revenue: 14947, cost: 8415, margin: 43.7 },
    { brand: 'Canachef', revenue: 7622, cost: 4484, margin: 41.2 },
    { brand: 'Europicks', revenue: 6726, cost: 4041, margin: 39.9 },
    { brand: 'PastaCo', revenue: 5242, cost: 3047, margin: 41.9 },
    { brand: 'Nostra Gourmet', revenue: 4196, cost: 2412, margin: 42.5 },
    { brand: 'Mezan', revenue: 3144, cost: 1850, margin: 41.1 },
    { brand: 'Jacobs', revenue: 2880, cost: 2111, margin: 26.7 },
    { brand: 'Ogusto', revenue: 2115, cost: 1154, margin: 45.4 },
    { brand: 'Sante', revenue: 1505, cost: 891, margin: 40.8 },
    { brand: 'Milka', revenue: 1396, cost: 852, margin: 38.9 },
    { brand: 'Unilever', revenue: 1348, cost: 855, margin: 36.6 },
    { brand: 'Biofix', revenue: 1340, cost: 775, margin: 42.2 },
    { brand: 'Crispico', revenue: 1324, cost: 753, margin: 43.2 },
    { brand: 'Shezan', revenue: 723, cost: 405, margin: 44.0 },
    { brand: 'Lowicz', revenue: 321, cost: 180, margin: 43.8 },
  ];

  // Product Performance list matching exact screenshots
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

  // CSV Export handler
  const handleExportCSV = () => {
    let csv = 'Brand,Revenue,Cost of Goods,Gross Margin %\n';
    brandMarginData.forEach((b) => {
      csv += `"${b.brand}",$${b.revenue.toLocaleString()},$${b.cost.toLocaleString()},${b.margin}%\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `polmarex_reports_analytics_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast({
      title: 'Report Exported',
      description: 'Downloaded complete performance analysis CSV file.'
    });
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground tracking-tight">
            Reports & analytics
          </h1>
          <p className="text-[13.5px] text-slate-700 mt-1 max-w-3xl font-normal leading-relaxed">
            Cross-company analysis for all companies over last 90 days. Aggregations run on the server from stored order, invoice and stock records.
          </p>
        </div>

        {/* Top-Right Buttons */}
        <div className="flex items-center gap-2 self-start shrink-0">
          <div className="hidden md:block px-3 py-1.5 rounded-lg border border-border bg-card text-muted-foreground text-xs font-normal shadow-2xs">
            Gross margin = revenue less recorded cost of goods
          </div>

          <button
            onClick={handleExportCSV}
            className="btn-secondary"
          >
            <Download className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Export report (CSV)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row (6 Cards) matching screenshot */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Revenue */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground">Revenue</span>
            <div className="w-6 h-6 rounded-md bg-red-50 text-[#e1241a] flex items-center justify-center border border-red-100">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-heading text-foreground">$54.8K</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">last 90 days</div>
          </div>
        </div>

        {/* Cost of goods */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground">Cost of goods</span>
            <div className="w-6 h-6 rounded-md bg-red-50 text-[#e1241a] flex items-center justify-center border border-red-100">
              <Package className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-heading text-foreground">$32.2K</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">recorded cost prices</div>
          </div>
        </div>

        {/* Gross margin */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground">Gross margin</span>
            <div className="w-6 h-6 rounded-md bg-red-50 text-[#e1241a] flex items-center justify-center border border-red-100">
              <Percent className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-heading text-foreground">41.2%</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">revenue less cost</div>
          </div>
        </div>

        {/* Orders */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground">Orders</span>
            <div className="w-6 h-6 rounded-md bg-red-50 text-[#e1241a] flex items-center justify-center border border-red-100">
              <ShoppingCart className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-heading text-foreground">80</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">last 90 days</div>
          </div>
        </div>

        {/* Average order value */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground">Average order value</span>
            <div className="w-6 h-6 rounded-md bg-red-50 text-[#e1241a] flex items-center justify-center border border-red-100">
              <Receipt className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-heading text-foreground">$685</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">booked revenue / orders</div>
          </div>
        </div>

        {/* Outstanding receivables */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground">Outstanding receivables</span>
            <div className="w-6 h-6 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <FileText className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-heading text-foreground">$19.7K</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">open balances</div>
          </div>
        </div>
      </div>

      {/* Row 1: Sales trend & Revenue by brand matching media_1792042613004_f7c9d8e0.png */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Sales trend */}
        <div className="lg:col-span-7 rounded-xl border border-border bg-card p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <h2 className="text-xs font-bold text-foreground">Sales trend</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">Monthly booked value, last 12 months</p>
          </div>

          <div className="h-[460px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrendData} margin={{ top: 12, right: 12, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesTrendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e1241a" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#e1241a" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e6ebf1" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10.5, fill: '#64748b' }}
                />
                <YAxis
                  domain={[0, 30000]}
                  ticks={[0, 7500, 15000, 22500, 30000]}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `$${val === 0 ? '0' : val >= 1000 ? `${val / 1000}K` : val}`}
                  tick={{ fontSize: 10.5, fill: '#94a3b8' }}
                />
                <Tooltip
                  formatter={(val) => [`$${val.toLocaleString()}`, 'Booked Sales']}
                  contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '11px' }}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#e1241a"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#salesTrendGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue by brand (Horizontal Bar) matching media_1792042613004_f7c9d8e0.png */}
        <div className="lg:col-span-5 rounded-xl border border-border bg-card p-5 shadow-2xs space-y-2">
          <div>
            <h2 className="text-xs font-bold text-foreground">Revenue by brand</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">Last 90 days</p>
          </div>

          <div className="h-[460px] w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={brandRevenueData}
                layout="vertical"
                margin={{ top: 0, right: 16, left: 24, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e6ebf1" />
                <XAxis
                  type="number"
                  domain={[0, 16000]}
                  ticks={[0, 4000, 8000, 12000, 16000]}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `$${val === 0 ? '0' : `${val / 1000}K`}`}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                />
                <YAxis
                  type="category"
                  dataKey="brand"
                  tickLine={false}
                  axisLine={false}
                  width={90}
                  tick={{ fontSize: 10.5, fill: '#334155' }}
                />
                <Tooltip
                  formatter={(val) => [`$${val.toLocaleString()}`, 'Revenue']}
                  contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '11px' }}
                />
                <Bar dataKey="revenue" radius={[0, 8, 8, 0]} barSize={14}>
                  {brandRevenueData.map((entry, index) => (
                    <Cell key={`brand-cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Revenue by representative & Revenue by segment */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Revenue by representative */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-2xs space-y-3">
          <div>
            <h2 className="text-xs font-bold text-foreground">Revenue by representative</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">Last 90 days</p>
          </div>

          <div className="h-64 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={repRevenueData}
                layout="vertical"
                margin={{ top: 0, right: 16, left: 16, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e6ebf1" />
                <XAxis
                  type="number"
                  domain={[0, 16000]}
                  ticks={[0, 4000, 8000, 12000, 16000]}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `$${val === 0 ? '0' : `${val / 1000}K`}`}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                />
                <YAxis
                  type="category"
                  dataKey="rep"
                  tickLine={false}
                  axisLine={false}
                  width={70}
                  tick={{ fontSize: 10.5, fill: '#334155' }}
                />
                <Tooltip
                  formatter={(val) => [`$${val.toLocaleString()}`, 'Rep Revenue']}
                  contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '11px' }}
                />
                <Bar dataKey="revenue" radius={[0, 6, 6, 0]} barSize={16}>
                  {repRevenueData.map((entry, index) => (
                    <Cell key={`rep-cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue by segment */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-2xs space-y-3">
          <div>
            <h2 className="text-xs font-bold text-foreground">Revenue by segment</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">CRM segment split</p>
          </div>

          <div className="h-64 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={segmentRevenueData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e6ebf1" />
                <XAxis
                  dataKey="segment"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />
                <YAxis
                  domain={[0, 24000]}
                  ticks={[0, 6000, 12000, 18000, 24000]}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `$${val === 0 ? '0' : `${val / 1000}K`}`}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                />
                <Tooltip
                  formatter={(val) => [`$${val.toLocaleString()}`, 'Revenue']}
                  contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '11px' }}
                />
                <Bar dataKey="revenue" radius={[4, 4, 0, 0]} barSize={34}>
                  {segmentRevenueData.map((entry, index) => (
                    <Cell key={`seg-cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Revenue by channel & Revenue by company */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Revenue by channel */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-2xs space-y-3">
          <div>
            <h2 className="text-xs font-bold text-foreground">Revenue by channel</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">Order source split</p>
          </div>

          <div className="h-64 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelRevenueData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e6ebf1" />
                <XAxis
                  dataKey="channel"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />
                <YAxis
                  domain={[0, 25000]}
                  ticks={[0, 5000, 10000, 15000, 20000, 25000]}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `$${val === 0 ? '0' : `${val / 1000}K`}`}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                />
                <Tooltip
                  formatter={(val) => [`$${val.toLocaleString()}`, 'Channel Revenue']}
                  contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '11px' }}
                />
                <Bar dataKey="revenue" radius={[4, 4, 0, 0]} barSize={34}>
                  {channelRevenueData.map((entry, index) => (
                    <Cell key={`chan-cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue by company */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-2xs space-y-3">
          <div>
            <h2 className="text-xs font-bold text-foreground">Revenue by company</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">Revenue split across companies</p>
          </div>

          <div className="h-64 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={companyRevenueData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e6ebf1" />
                <XAxis
                  dataKey="company"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />
                <YAxis
                  domain={[0, 60000]}
                  ticks={[0, 15000, 30000, 45000, 60000]}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `$${val === 0 ? '0' : `${val / 1000}K`}`}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                />
                <Tooltip
                  formatter={(val) => [`$${val.toLocaleString()}`, 'Company Revenue']}
                  contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '11px' }}
                />
                <Bar dataKey="revenue" radius={[4, 4, 0, 0]} barSize={34}>
                  {companyRevenueData.map((entry, index) => (
                    <Cell key={`comp-cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 4: Receivables aging & Inventory status matching media_1792042592552_1e9de30b.png */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Receivables aging */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-2xs space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-2xl font-bold font-heading text-foreground tracking-tight">$19,664</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Outstanding balance by bucket</div>
            </div>
            <div className="text-xs text-muted-foreground text-right">
              Calculated from invoice and payment records
            </div>
          </div>

          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agingData} margin={{ top: 12, right: 12, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e6ebf1" />
                <XAxis
                  dataKey="bucket"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />
                <YAxis
                  domain={[0, 10000]}
                  ticks={[0, 2500, 5000, 7500, 10000]}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => {
                    if (val === 0) return '$0';
                    if (val === 2500) return '$2.5K';
                    if (val === 5000) return '$5K';
                    if (val === 7500) return '$7.5K';
                    if (val === 10000) return '$10K';
                    return `$${val}`;
                  }}
                  tick={{ fontSize: 10.5, fill: '#94a3b8' }}
                />
                <Tooltip
                  formatter={(val) => [`$${val.toLocaleString()}`, 'Balance Due']}
                  contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '11px' }}
                />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]} barSize={36}>
                  {agingData.map((entry, index) => (
                    <Cell key={`aging-cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Inventory status (2x2 Grid) */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-2xs space-y-3 flex flex-col justify-between">
          <div>
            <h2 className="text-xs font-bold text-foreground">Inventory status</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">Stock records by status</p>

            <div className="grid grid-cols-2 gap-3.5 mt-4">
              {/* Out of stock */}
              <div className="rounded-lg border border-border bg-muted/15 p-3 space-y-1">
                <div className="w-6 h-6 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 mb-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
                <div className="text-xl font-bold font-heading text-foreground">6</div>
                <div className="text-[11px] text-muted-foreground">Out of stock</div>
              </div>

              {/* Low stock */}
              <div className="rounded-lg border border-border bg-muted/15 p-3 space-y-1">
                <div className="w-6 h-6 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 mb-1">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div className="text-xl font-bold font-heading text-foreground">12</div>
                <div className="text-[11px] text-muted-foreground">Low stock</div>
              </div>

              {/* Healthy cover */}
              <div className="rounded-lg border border-border bg-muted/15 p-3 space-y-1">
                <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div className="text-xl font-bold font-heading text-foreground">34</div>
                <div className="text-[11px] text-muted-foreground">Healthy cover</div>
              </div>

              {/* Overstock */}
              <div className="rounded-lg border border-border bg-muted/15 p-3 space-y-1">
                <div className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 mb-1">
                  <Boxes className="w-3.5 h-3.5" />
                </div>
                <div className="text-xl font-bold font-heading text-foreground">30</div>
                <div className="text-[11px] text-muted-foreground">Overstock</div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>82 stock records across all warehouses</span>
            <button
              onClick={() => navigate('/inventory')}
              className="text-[#e1241a] hover:underline font-semibold flex items-center gap-1 text-[11px]"
            >
              <span>open inventory</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Row 5: Product performance & Brand margin analysis matching media_1792042592552_1e9de30b.png */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {/* Product performance */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-2xs flex flex-col justify-between">
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

        {/* Brand margin analysis table */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-2xs space-y-3">
          <div>
            <h2 className="text-xs font-bold text-foreground">Brand margin analysis</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">Revenue against recorded cost of goods, last 90 days</p>
          </div>

          <div className="overflow-x-auto pt-1">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border text-muted-foreground text-[11px] font-medium">
                <tr>
                  <th className="py-2.5 px-2 font-medium">Brand</th>
                  <th className="py-2.5 px-2 font-medium text-right">Revenue</th>
                  <th className="py-2.5 px-2 font-medium text-right">Cost</th>
                  <th className="py-2.5 px-2 font-medium text-right">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-[11px]">
                {brandMarginData.map((b, index) => (
                  <tr key={index} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 px-2 font-medium text-foreground">{b.brand}</td>
                    <td className="py-2.5 px-2 text-right text-foreground font-mono">
                      ${b.revenue.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-2 text-right text-muted-foreground font-mono">
                      ${b.cost.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-2 text-right text-emerald-600 font-semibold font-mono">
                      {b.margin.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
