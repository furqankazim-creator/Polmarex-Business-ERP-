import React, { useState, useMemo, useEffect } from 'react';
import {
  ShoppingCart,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  Clock,
  AlertCircle,
  Download,
  Calendar,
  Package,
  Building2,
  ChevronRight,
  X,
  CreditCard,
  Truck,
  CheckCircle2,
  FileText,
  SlidersHorizontal,
  Plus
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const STATUS_BADGES = {
  delivered: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  completed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  shipped: 'border-sky-200 bg-sky-50 text-sky-700',
  processing: 'border-sky-200 bg-sky-50 text-sky-700',
  pending: 'border-amber-200 bg-amber-50 text-amber-700',
  pending_approval: 'border-amber-200 bg-amber-50 text-amber-700',
  cancelled: 'border-rose-200 bg-rose-50 text-rose-700'
};

const PAYMENT_BADGES = {
  paid: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  partial: 'border-amber-200 bg-amber-50 text-amber-700',
  unpaid: 'border-rose-200 bg-rose-50 text-rose-700'
};

export default function Orders() {
  const { company, companyLabel, periodLabel, cutoffDate, entities, showToast, createOrder, updateOrderStatus } = useApp();

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [repFilter, setRepFilter] = useState('all');
  const [sortBy, setSortBy] = useState('-order_date');

  // Pagination (30 items initially)
  const [visibleCount, setVisibleCount] = useState(30);

  // Selected Order for drawer/modal
  const [selectedOrder, setSelectedOrder] = useState(null);

  // New Order Modal state
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
  const [orderForm, setOrderForm] = useState({
    customer: 'Starsky Fine Foods',
    total: 3450.0,
    channel: 'website',
    representative: 'Tomasz Nowak',
    payment_status: 'unpaid',
    items_count: 5
  });

  const allOrders = entities.Order || [];
  const allOrderItems = entities.OrderItem || [];
  const representatives = entities.Representative || [];
  const customers = entities.Customer || [];

  // Reset pagination on filter change
  useEffect(() => {
    setVisibleCount(30);
  }, [searchTerm, statusFilter, channelFilter, repFilter, sortBy, company]);

  // Company and date scoped orders
  const scopedOrders = useMemo(() => {
    return allOrders.filter((o) => {
      if (company !== 'all' && o.business_unit && o.business_unit !== company) return false;
      if (cutoffDate && o.order_date && o.order_date < cutoffDate) return false;
      return true;
    });
  }, [allOrders, company, cutoffDate]);

  // Top KPI calculations matching Base44 screenshot
  const kpiStats = useMemo(() => {
    const totalOrders = scopedOrders.length;
    const nonCancelled = scopedOrders.filter((o) => o.status !== 'cancelled');
    const bookedSales = nonCancelled.reduce((acc, o) => acc + (Number(o.total) || 0), 0);
    const aov = nonCancelled.length > 0 ? bookedSales / nonCancelled.length : 0;
    const pendingAndTransit = scopedOrders.filter((o) =>
      ['pending', 'processing', 'shipped', 'pending_approval'].includes(o.status)
    ).length;
    const cancelledCount = scopedOrders.filter((o) => o.status === 'cancelled').length;

    return {
      totalOrders,
      bookedSales,
      aov,
      pendingAndTransit,
      cancelledCount
    };
  }, [scopedOrders]);

  // Filtered & Sorted orders
  const filteredOrders = useMemo(() => {
    return scopedOrders
      .filter((o) => {
        if (statusFilter !== 'all' && o.status !== statusFilter) return false;
        if (channelFilter !== 'all' && (o.channel || '').toLowerCase() !== channelFilter.toLowerCase()) return false;
        if (repFilter !== 'all' && o.representative !== repFilter) return false;
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchNum = o.order_number?.toLowerCase().includes(q);
          const matchCust = o.customer?.toLowerCase().includes(q);
          const matchRep = o.representative?.toLowerCase().includes(q);
          if (!matchNum && !matchCust && !matchRep) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === '-order_date') return (b.order_date || '').localeCompare(a.order_date || '');
        if (sortBy === '-total') return (Number(b.total) || 0) - (Number(a.total) || 0);
        if (sortBy === 'total') return (Number(a.total) || 0) - (Number(b.total) || 0);
        if (sortBy === 'order_number') return (a.order_number || '').localeCompare(b.order_number || '');
        return 0;
      });
  }, [scopedOrders, statusFilter, channelFilter, repFilter, searchTerm, sortBy]);

  // Paginated visible list
  const displayedOrders = useMemo(() => {
    return filteredOrders.slice(0, visibleCount);
  }, [filteredOrders, visibleCount]);

  // Selected Order Line Items
  const selectedOrderItems = useMemo(() => {
    if (!selectedOrder) return [];
    return allOrderItems.filter(
      (item) => item.order_number === selectedOrder.order_number || item.order_id === selectedOrder.id
    );
  }, [selectedOrder, allOrderItems]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Order', 'Customer', 'Date', 'Status', 'Channel', 'Representative', 'Items', 'Total', 'Payment'];
    const rows = filteredOrders.map((o) => [
      `"${o.order_number || ''}"`,
      `"${(o.customer || '').replace(/"/g, '""')}"`,
      o.order_date || '',
      o.status || '',
      o.channel || '',
      `"${(o.representative || '').replace(/"/g, '""')}"`,
      o.items_count || 1,
      o.total || 0,
      o.payment_status || ''
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `orders-${company}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast({
      title: 'CSV Exported',
      description: `Downloaded ${filteredOrders.length} orders.`
    });
  };

  function formatCurrency(val) {
    if (val === null || val === undefined) return '$0.00';
    return `$${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function formatCompactCurrency(val) {
    const num = Number(val) || 0;
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(1)}K`;
    return `$${num.toFixed(0)}`;
  }

  const hasActiveFilters = statusFilter !== 'all' || channelFilter !== 'all' || repFilter !== 'all' || searchTerm.trim() !== '';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground">Sales & orders</h1>
          <p className="text-[13.5px] text-slate-700 mt-1 max-w-3xl font-normal leading-relaxed">
            Booked and historical order flow for {companyLabel.toLowerCase()}, {periodLabel.toLowerCase()}. All values reflect transaction amounts before tax and freight.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleExportCSV}
            disabled={filteredOrders.length === 0}
            className="btn-secondary h-9.5 px-3.5 text-[13px] font-medium"
            title="Download filtered orders CSV"
          >
            <Download className="mr-1.5 h-4 w-4 text-muted-foreground" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setIsCreateOrderOpen(true)}
            className="btn-primary h-9.5 px-3.5 text-[13px] font-medium"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            <span>New Order</span>
          </button>
        </div>
      </div>

      {/* 5 KPI Metric Cards Matching Screenshot */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {/* Total orders */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[13px] font-medium text-muted-foreground">Total orders</p>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-[#e1241a] border border-red-100">
              <ShoppingCart className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 font-heading text-2xl font-semibold tracking-tight text-foreground">
            {kpiStats.totalOrders}
          </p>
          <div className="mt-1.5 flex items-center gap-2 text-xs">
            <span className="truncate text-muted-foreground">{periodLabel.toLowerCase()}</span>
          </div>
        </div>

        {/* Booked sales value */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[13px] font-medium text-muted-foreground">Booked sales value</p>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-[#e1241a] border border-red-100">
              <DollarSign className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 font-heading text-2xl font-semibold tracking-tight text-foreground">
            {formatCompactCurrency(kpiStats.bookedSales)}
          </p>
          <div className="mt-1.5 flex items-center gap-2 text-xs">
            <span className="truncate text-muted-foreground">{periodLabel.toLowerCase()}</span>
          </div>
        </div>

        {/* Average order value */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[13px] font-medium text-muted-foreground">Average order value</p>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-[#e1241a] border border-red-100">
              <TrendingUp className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 font-heading text-2xl font-semibold tracking-tight text-foreground">
            ${Math.round(kpiStats.aov)}
          </p>
          <div className="mt-1.5 flex items-center gap-2 text-xs">
            <span className="truncate text-muted-foreground">excluding cancelled orders</span>
          </div>
        </div>

        {/* Pending & in transit */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[13px] font-medium text-muted-foreground">Pending & in transit</p>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Clock className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 font-heading text-2xl font-semibold tracking-tight text-foreground">
            {kpiStats.pendingAndTransit}
          </p>
          <div className="mt-1.5 flex items-center gap-2 text-xs">
            <span className="truncate text-muted-foreground">awaiting fulfillment</span>
          </div>
        </div>

        {/* Cancelled */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[13px] font-medium text-muted-foreground">Cancelled</p>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
              <AlertCircle className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 font-heading text-2xl font-semibold tracking-tight text-foreground">
            {kpiStats.cancelledCount}
          </p>
          <div className="mt-1.5 flex items-center gap-2 text-xs">
            <span className="truncate text-muted-foreground">voided or lost</span>
          </div>
        </div>
      </div>

      {/* Filters Toolbar Matching T5 */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 rounded-xl border border-border bg-card p-2.5 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="flex items-center gap-1.5 px-1 text-xs font-medium text-muted-foreground shrink-0">
            <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Filters</span>
          </div>

          {/* Search by order # or customer */}
          <div className="relative min-w-[190px] flex-1 max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by order # or customer…"
              className="h-9.5 w-full rounded-lg border border-slate-300 bg-card pl-9.5 pr-3 text-[13px] font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary shadow-2xs"
            />
          </div>

          {/* Status Filter */}
          <div className="w-36">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9.5 w-full rounded-lg border border-slate-300 bg-card px-2.5 text-[13px] font-medium text-foreground focus:outline-none focus:border-primary shadow-2xs"
            >
              <option value="all">Status (All)</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Channel Filter */}
          <div className="w-36">
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="h-9.5 w-full rounded-lg border border-slate-300 bg-card px-2.5 text-[13px] font-medium text-foreground focus:outline-none focus:border-primary shadow-2xs"
            >
              <option value="all">Channel (All)</option>
              <option value="website">Website</option>
              <option value="phone">Phone / Rep</option>
              <option value="edi">Inbound EDI</option>
              <option value="retail">Retail Network</option>
            </select>
          </div>

          {/* Representative Filter */}
          <div className="w-44">
            <select
              value={repFilter}
              onChange={(e) => setRepFilter(e.target.value)}
              className="h-9.5 w-full rounded-lg border border-slate-300 bg-card px-2.5 text-[13px] font-medium text-foreground focus:outline-none focus:border-primary shadow-2xs"
            >
              <option value="all">Representative (All)</option>
              {representatives.map((rep) => (
                <option key={rep.id || rep.full_name} value={rep.full_name}>
                  {rep.full_name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="w-44">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-9.5 w-full rounded-lg border border-slate-300 bg-card px-2.5 text-[13px] font-medium text-foreground focus:outline-none focus:border-primary shadow-2xs"
            >
              <option value="-order_date">Sort: newest order</option>
              <option value="-total">Sort: highest value</option>
              <option value="total">Sort: lowest value</option>
              <option value="order_number">Sort: order number</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
          <span className="inline-flex items-center rounded-full border border-border bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
            {filteredOrders.length} records
          </span>
          {hasActiveFilters && (
            <button
              onClick={() => {
                setStatusFilter('all');
                setChannelFilter('all');
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

      {/* Orders Directory Table Matching yte */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm font-medium text-foreground">No orders match these filters</p>
            <p className="text-xs text-muted-foreground mt-1">
              Adjust the status, channel, representative or search term.
            </p>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="py-3 px-4 font-semibold text-muted-foreground">Order</th>
                    <th className="py-3 px-3 font-semibold text-muted-foreground">Customer</th>
                    <th className="py-3 px-3 font-semibold text-muted-foreground">Date</th>
                    <th className="py-3 px-3 font-semibold text-muted-foreground">Status</th>
                    <th className="hidden md:table-cell py-3 px-3 font-semibold text-muted-foreground">Channel</th>
                    <th className="hidden lg:table-cell py-3 px-3 font-semibold text-muted-foreground">Representative</th>
                    <th className="py-3 px-3 font-semibold text-muted-foreground text-right">Items</th>
                    <th className="py-3 px-3 font-semibold text-muted-foreground text-right">Total</th>
                    <th className="py-3 px-4 font-semibold text-muted-foreground">Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {displayedOrders.map((order) => {
                    const statusClass = STATUS_BADGES[order.status] || 'border-border bg-muted/40 text-foreground';
                    const paymentClass = PAYMENT_BADGES[order.payment_status] || 'border-border bg-muted/40 text-foreground';

                    return (
                      <tr
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        className="cursor-pointer hover:bg-muted/40 transition-colors group"
                      >
                        {/* Order number */}
                        <td className="py-3 px-4 font-semibold text-primary group-hover:underline">
                          {order.order_number}
                        </td>

                        {/* Customer */}
                        <td className="py-3 px-3">
                          <p className="font-medium text-foreground">{order.customer}</p>
                          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
                            {(order.customer_segment || 'B2B Wholesale').replace('_', ' ')}
                          </p>
                        </td>

                        {/* Order Date */}
                        <td className="py-3 px-3 text-xs text-muted-foreground whitespace-nowrap">
                          {order.order_date || '—'}
                        </td>

                        {/* Order Status Badge */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${statusClass}`}
                          >
                            {order.status}
                          </span>
                        </td>

                        {/* Channel */}
                        <td className="hidden md:table-cell py-3 px-3 text-xs text-muted-foreground capitalize">
                          {order.channel?.replace('_', ' ') || 'Direct'}
                        </td>

                        {/* Representative */}
                        <td className="hidden lg:table-cell py-3 px-3 text-xs text-muted-foreground">
                          {order.representative || 'Unassigned'}
                        </td>

                        {/* Items count */}
                        <td className="py-3 px-3 text-right tabular-nums text-muted-foreground">
                          {order.items_count || 1}
                        </td>

                        {/* Total */}
                        <td className="py-3 px-3 text-right tabular-nums text-foreground font-semibold">
                          {formatCurrency(order.total)}
                        </td>

                        {/* Payment Status Badge */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${paymentClass}`}
                          >
                            {order.payment_status || 'unpaid'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Load More Button after 30 items */}
            {filteredOrders.length > visibleCount && (
              <div className="border-t border-border p-3 text-center bg-muted/20">
                <button
                  onClick={() => setVisibleCount((prev) => prev + 30)}
                  className="btn-secondary"
                >
                  Load more orders (Showing {visibleCount} of {filteredOrders.length})
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Order Detail Modal / Drawer */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="max-h-[90vh] max-w-2xl w-full rounded-xl border border-border bg-card p-6 shadow-2xl overflow-y-auto space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold font-heading text-foreground">
                    Order {selectedOrder.order_number}
                  </h2>
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${
                      STATUS_BADGES[selectedOrder.status] || ''
                    }`}
                  >
                    {selectedOrder.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Placed on {selectedOrder.order_date} · via {(selectedOrder.channel || 'direct').toUpperCase()} · Managed by {selectedOrder.representative || 'Unassigned'}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-[11px] text-muted-foreground">Order Total</p>
                <p className="font-bold text-foreground text-base mt-0.5">{formatCurrency(selectedOrder.total)}</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-[11px] text-muted-foreground">Payment Status</p>
                <p className="font-bold text-emerald-600 text-base mt-0.5 capitalize">{selectedOrder.payment_status || 'unpaid'}</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-[11px] text-muted-foreground">Line Items</p>
                <p className="font-bold text-foreground text-base mt-0.5">{selectedOrder.items_count || 1}</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-[11px] text-muted-foreground">Business Unit</p>
                <p className="font-bold text-foreground text-base mt-0.5 uppercase">{selectedOrder.business_unit || 'PRM'}</p>
              </div>
            </div>

            {/* Customer Information */}
            <div className="rounded-xl border border-border bg-card p-4 text-xs space-y-2">
              <p className="font-semibold uppercase tracking-wider text-muted-foreground text-[11px] flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                Customer & Shipping
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <div>
                  <span className="text-muted-foreground">Account Name:</span>
                  <p className="font-medium text-foreground">{selectedOrder.customer}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Account Segment:</span>
                  <p className="font-medium text-foreground uppercase">{(selectedOrder.customer_segment || 'b2b').replace('_', ' ')}</p>
                </div>
              </div>
            </div>

            {/* Order Items Table */}
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5" />
                Itemized Line Products ({selectedOrderItems.length || selectedOrder.items_count || 1})
              </p>
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-muted/40 border-b border-border text-muted-foreground">
                    <tr>
                      <th className="py-2 px-3 text-left">SKU</th>
                      <th className="py-2 px-3 text-left">Product Name</th>
                      <th className="py-2 px-3 text-left">Brand</th>
                      <th className="py-2 px-3 text-right">Qty</th>
                      <th className="py-2 px-3 text-right">Unit Price</th>
                      <th className="py-2 px-3 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {selectedOrderItems.length > 0 ? (
                      selectedOrderItems.map((item, idx) => (
                        <tr key={item.id || idx}>
                          <td className="py-2 px-3 font-mono font-medium text-foreground">{item.sku}</td>
                          <td className="py-2 px-3 text-foreground font-medium">{item.product_name}</td>
                          <td className="py-2 px-3 text-muted-foreground">{item.brand}</td>
                          <td className="py-2 px-3 text-right tabular-nums">{item.quantity}</td>
                          <td className="py-2 px-3 text-right tabular-nums">{formatCurrency(item.unit_price)}</td>
                          <td className="py-2 px-3 text-right tabular-nums font-semibold">{formatCurrency(item.line_total)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="py-2 px-3 font-mono font-medium text-foreground">POL-9921</td>
                        <td className="py-2 px-3 text-foreground font-medium">Standard Wholesale Assortment Package</td>
                        <td className="py-2 px-3 text-muted-foreground">Polmarex Import</td>
                        <td className="py-2 px-3 text-right tabular-nums">{selectedOrder.items_count || 1}</td>
                        <td className="py-2 px-3 text-right tabular-nums">{formatCurrency(selectedOrder.total)}</td>
                        <td className="py-2 px-3 text-right tabular-nums font-semibold">{formatCurrency(selectedOrder.total)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3.5 border-t border-border">
              <div className="flex items-center gap-2">
                {selectedOrder.status !== 'shipped' && selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
                  <button
                    onClick={() => {
                      updateOrderStatus(selectedOrder.id, 'shipped');
                      setSelectedOrder((prev) => ({ ...prev, status: 'shipped' }));
                    }}
                    className="btn-primary h-9 px-3.5 text-[13px]"
                  >
                    <Truck className="h-4 w-4" />
                    <span>Mark as Shipped</span>
                  </button>
                )}
                {selectedOrder.status === 'shipped' && (
                  <button
                    onClick={() => {
                      updateOrderStatus(selectedOrder.id, 'delivered');
                      setSelectedOrder((prev) => ({ ...prev, status: 'delivered' }));
                    }}
                    className="btn-primary h-9 px-3.5 text-[13px] bg-emerald-600 hover:bg-emerald-700"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Mark as Delivered</span>
                  </button>
                )}
                {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'delivered' && (
                  <button
                    onClick={() => {
                      updateOrderStatus(selectedOrder.id, 'cancelled');
                      setSelectedOrder((prev) => ({ ...prev, status: 'cancelled' }));
                    }}
                    className="btn-secondary h-9 px-3.5 text-[13px] text-rose-600 hover:bg-rose-50 border-rose-200"
                  >
                    <span>Cancel Order</span>
                  </button>
                )}
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="btn-secondary h-9 px-4 text-[13px] font-semibold"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Order Modal */}
      {isCreateOrderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-[#e1241a]">
                  <ShoppingCart className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="font-bold font-heading text-base text-foreground">Create Wholesale Order</h3>
                  <p className="text-xs text-muted-foreground">Book new sales order into backend system</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOrderOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createOrder({
                  customer: orderForm.customer,
                  total: Number(orderForm.total),
                  channel: orderForm.channel,
                  representative: orderForm.representative,
                  payment_status: orderForm.payment_status,
                  items_count: Number(orderForm.items_count)
                });
                setIsCreateOrderOpen(false);
              }}
              className="space-y-3.5 text-[13.5px]"
            >
              <div>
                <label className="block text-[13px] font-medium text-foreground mb-1">Customer Account *</label>
                <select
                  value={orderForm.customer}
                  onChange={(e) => setOrderForm({ ...orderForm, customer: e.target.value })}
                  className="w-full h-10 rounded-lg border border-slate-300 bg-background px-3 py-2 text-[13.5px] font-medium focus:ring-1 focus:ring-primary focus:outline-none shadow-2xs"
                >
                  {customers.map((c) => (
                    <option key={c.id || c.name} value={c.name}>{c.name}</option>
                  ))}
                  <option value="Starsky Fine Foods">Starsky Fine Foods</option>
                  <option value="Metro Ontario">Metro Ontario</option>
                  <option value="Highland Farms">Highland Farms</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-medium text-foreground mb-1">Sales Channel</label>
                  <select
                    value={orderForm.channel}
                    onChange={(e) => setOrderForm({ ...orderForm, channel: e.target.value })}
                    className="w-full h-10 rounded-lg border border-slate-300 bg-background px-3 py-2 text-[13.5px] font-medium focus:ring-1 focus:ring-primary focus:outline-none shadow-2xs"
                  >
                    <option value="website">Website / B2B Portal</option>
                    <option value="phone">Phone / Rep Order</option>
                    <option value="edi">Inbound EDI</option>
                    <option value="retail">Retail Distribution Network</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-foreground mb-1">Representative</label>
                  <select
                    value={orderForm.representative}
                    onChange={(e) => setOrderForm({ ...orderForm, representative: e.target.value })}
                    className="w-full h-10 rounded-lg border border-slate-300 bg-background px-3 py-2 text-[13.5px] font-medium focus:ring-1 focus:ring-primary focus:outline-none shadow-2xs"
                  >
                    {representatives.map((r) => (
                      <option key={r.id || r.full_name} value={r.full_name}>{r.full_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[13px] font-medium text-foreground mb-1">Total ($ CAD) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={orderForm.total}
                    onChange={(e) => setOrderForm({ ...orderForm, total: e.target.value })}
                    className="w-full h-10 rounded-lg border border-slate-300 bg-background px-3 py-2 text-[13.5px] font-medium focus:ring-1 focus:ring-primary focus:outline-none shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-foreground mb-1">Line Items</label>
                  <input
                    type="number"
                    required
                    value={orderForm.items_count}
                    onChange={(e) => setOrderForm({ ...orderForm, items_count: e.target.value })}
                    className="w-full h-10 rounded-lg border border-slate-300 bg-background px-3 py-2 text-[13.5px] font-medium focus:ring-1 focus:ring-primary focus:outline-none shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-foreground mb-1">Payment Status</label>
                  <select
                    value={orderForm.payment_status}
                    onChange={(e) => setOrderForm({ ...orderForm, payment_status: e.target.value })}
                    className="w-full h-10 rounded-lg border border-slate-300 bg-background px-3 py-2 text-[13.5px] font-medium focus:ring-1 focus:ring-primary focus:outline-none shadow-2xs"
                  >
                    <option value="unpaid">Unpaid (Net 30)</option>
                    <option value="paid">Paid (Prepaid)</option>
                    <option value="partial">Partially Paid</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsCreateOrderOpen(false)}
                  className="btn-secondary h-9 px-4 text-[13px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary h-9 px-4 text-[13px]"
                >
                  Confirm & Place Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
