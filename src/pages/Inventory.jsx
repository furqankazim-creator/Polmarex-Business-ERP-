import React, { useState, useMemo, useEffect } from 'react';
import {
  Boxes,
  Search,
  Filter,
  Plus,
  TrendingDown,
  Package,
  ArrowRightLeft,
  Warehouse as WarehouseIcon,
  X,
  History,
  Layers,
  Calendar,
  AlertCircle,
  Clock,
  ShieldAlert,
  ChevronDown,
  Check,
  FileText,
  ArrowUpRight,
  ArrowDownLeft,
  SlidersHorizontal,
  Download
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const STATUS_CONFIG = {
  out: {
    label: 'Out',
    pillClass: 'border-rose-200 bg-rose-50 text-rose-700'
  },
  low: {
    label: 'Low',
    pillClass: 'border-amber-200 bg-amber-50 text-amber-700'
  },
  overstock: {
    label: 'Overstock',
    pillClass: 'border-amber-200 bg-amber-50 text-amber-700'
  },
  ok: {
    label: 'In stock',
    pillClass: 'border-emerald-200 bg-emerald-50 text-emerald-700'
  }
};

const MOVEMENT_TYPE_BADGES = {
  receipt: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  issue: 'border-sky-200 bg-sky-50 text-sky-700',
  transfer: 'border-purple-200 bg-purple-50 text-purple-700',
  adjustment: 'border-amber-200 bg-amber-50 text-amber-700',
  damage: 'border-rose-200 bg-rose-50 text-rose-700'
};

export default function Inventory() {
  const { company, companyLabel, entities, addInventoryMovement, showToast, exportCSV } = useApp();

  // Active view tab ('inventory' | 'movements')
  const [activeTab, setActiveTab] = useState('inventory');

  // Search & Filter state matching screenshot
  const [searchTerm, setSearchTerm] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [visibleCount, setVisibleCount] = useState(30);
  const [movementVisibleCount, setMovementVisibleCount] = useState(30);

  // Selected item for drawer
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);

  // Stock movement adjustment form state
  const [movementForm, setMovementForm] = useState({
    sku: 'PRM-1008',
    product_name: 'Ogusto Fruity Lollipops 200g',
    warehouse: 'Toronto Distribution Centre',
    type: 'receipt',
    quantity: 50,
    unit_cost: 5.0,
    reference: 'PO-2026-99',
    note: 'Inbound shipment receipt'
  });

  const allRecords = entities.InventoryRecord || [];
  const allMovements = entities.InventoryMovement || [];
  const allWarehouses = entities.Warehouse || [];
  const allProducts = entities.Product || [];

  // Reset pagination on filter change
  useEffect(() => {
    setVisibleCount(30);
    setMovementVisibleCount(30);
  }, [searchTerm, warehouseFilter, statusFilter, brandFilter, company]);

  // Company scoped inventory records
  const scopedRecords = useMemo(() => {
    return allRecords.filter((r) => {
      if (company !== 'all' && r.business_unit && r.business_unit !== company) return false;
      return true;
    });
  }, [allRecords, company]);

  // Company scoped movements
  const scopedMovements = useMemo(() => {
    return allMovements.filter((m) => {
      if (company !== 'all' && m.business_unit && m.business_unit !== company) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          m.product_name?.toLowerCase().includes(q) ||
          m.sku?.toLowerCase().includes(q) ||
          m.reference?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allMovements, company, searchTerm]);

  // 5 Top KPI Cards matching screenshot
  const kpiStats = useMemo(() => {
    const totalRecords = scopedRecords.length;
    const totalOnHand = scopedRecords.reduce((sum, r) => sum + (Number(r.on_hand) || 0), 0);
    const totalIncoming = scopedRecords.reduce((sum, r) => sum + (Number(r.incoming) || 0), 0);
    const lowStockCount = scopedRecords.filter((r) => r.stock_status === 'low').length;
    const outOfStockCount = scopedRecords.filter((r) => r.stock_status === 'out' || Number(r.available) === 0).length;
    const overstockCount = scopedRecords.filter((r) => r.stock_status === 'overstock').length;

    return {
      totalRecords,
      totalOnHand,
      totalIncoming,
      lowStockCount,
      outOfStockCount,
      overstockCount
    };
  }, [scopedRecords]);

  // Unique brands list for Dropdown 3
  const uniqueBrands = useMemo(() => {
    const brandsSet = new Set(scopedRecords.map((r) => r.brand).filter(Boolean));
    return Array.from(brandsSet).sort();
  }, [scopedRecords]);

  // Unique warehouse list for Dropdown 1
  const uniqueWarehouses = useMemo(() => {
    const whSet = new Set(scopedRecords.map((r) => r.warehouse).filter(Boolean));
    return Array.from(whSet).sort();
  }, [scopedRecords]);

  // Filtered & Sorted Records (Out of stock and low stock at the top, matching screenshot)
  const filteredRecords = useMemo(() => {
    return scopedRecords
      .filter((r) => {
        if (warehouseFilter !== 'all' && r.warehouse !== warehouseFilter) return false;
        if (statusFilter !== 'all' && r.stock_status !== statusFilter) return false;
        if (brandFilter !== 'all' && r.brand !== brandFilter) return false;
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchName = r.product_name?.toLowerCase().includes(q);
          const matchSku = r.sku?.toLowerCase().includes(q);
          const matchBrand = r.brand?.toLowerCase().includes(q);
          const matchWh = r.warehouse?.toLowerCase().includes(q);
          if (!matchName && !matchSku && !matchBrand && !matchWh) return false;
        }
        return true;
      })
      .sort((a, b) => {
        // Priority order: out first (0 available), then low, then by available ascending
        const aStatusScore = a.stock_status === 'out' ? 0 : a.stock_status === 'low' ? 1 : 2;
        const bStatusScore = b.stock_status === 'out' ? 0 : b.stock_status === 'low' ? 1 : 2;
        if (aStatusScore !== bStatusScore) return aStatusScore - bStatusScore;
        return (Number(a.available) || 0) - (Number(b.available) || 0);
      });
  }, [scopedRecords, warehouseFilter, statusFilter, brandFilter, searchTerm]);

  // Visible records (30 items initially)
  const displayedRecords = useMemo(() => {
    return filteredRecords.slice(0, visibleCount);
  }, [filteredRecords, visibleCount]);

  const displayedMovements = useMemo(() => {
    return scopedMovements.slice(0, movementVisibleCount);
  }, [scopedMovements, movementVisibleCount]);

  const handleOpenMovementModal = (record) => {
    setMovementForm({
      sku: record?.sku || 'PRM-1008',
      product_name: record?.product_name || 'Product Item',
      warehouse: record?.warehouse || 'Toronto Distribution Centre',
      type: 'receipt',
      quantity: 50,
      unit_cost: 5.0,
      reference: 'PO-2026-99',
      note: 'Inbound shipment receipt'
    });
    setIsMovementModalOpen(true);
  };

  const handleLogMovement = (e) => {
    e.preventDefault();
    addInventoryMovement(movementForm);
    setIsMovementModalOpen(false);
  };

  const hasActiveFilters = warehouseFilter !== 'all' || statusFilter !== 'all' || brandFilter !== 'all' || searchTerm.trim() !== '';

  return (
    <div className="space-y-5">
      {/* Page Header with Action Tabs and + Log Movement Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground">Inventory Management</h1>
          <p className="text-[13.5px] text-slate-700 font-normal leading-relaxed mt-1 max-w-3xl">
            Warehouse inventory levels, safety thresholds and live stock adjustments for {companyLabel.toLowerCase()}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab Switcher: Stock on Hand vs Movements */}
          <div className="flex items-center rounded-lg bg-muted p-1 border border-border">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                activeTab === 'inventory'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Stock on Hand ({scopedRecords.length})
            </button>
            <button
              onClick={() => setActiveTab('movements')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                activeTab === 'movements'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Movements ({allMovements.length})
            </button>
          </div>

          {/* Export CSV & Log Movement Buttons */}
          <button
            onClick={() => exportCSV('inventory')}
            className="btn-secondary h-9.5 px-3.5 text-[13px] font-medium"
            title="Download inventory levels CSV from backend"
          >
            <Download className="mr-1.5 h-4 w-4 text-muted-foreground" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => handleOpenMovementModal(null)}
            className="btn-primary h-9.5 px-3.5 text-[13px] font-medium"
          >
            <Plus className="h-4 w-4" />
            <span>Log Movement</span>
          </button>
        </div>
      </div>

      {/* 5 KPI Metric Cards Matching Screenshot Exactly */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {/* 1. Stock records */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[13px] font-medium text-muted-foreground">Stock records</p>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-[#e1241a] border border-red-100">
              <Boxes className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 font-heading text-2xl font-semibold tracking-tight text-foreground">
            {kpiStats.totalRecords}
          </p>
          <div className="mt-1.5 flex items-center gap-2 text-xs">
            <span className="truncate text-muted-foreground">SKU per warehouse</span>
          </div>
        </div>

        {/* 2. Units on hand */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[13px] font-medium text-muted-foreground">Units on hand</p>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-[#e1241a] border border-red-100">
              <WarehouseIcon className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 font-heading text-2xl font-semibold tracking-tight text-foreground">
            {kpiStats.totalOnHand.toLocaleString()}
          </p>
          <div className="mt-1.5 flex items-center gap-2 text-xs">
            <span className="truncate text-muted-foreground">
              {kpiStats.totalIncoming.toLocaleString()} incoming
            </span>
          </div>
        </div>

        {/* 3. Low stock */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[13px] font-medium text-muted-foreground">Low stock</p>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <TrendingDown className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 font-heading text-2xl font-semibold tracking-tight text-foreground">
            {kpiStats.lowStockCount}
          </p>
          <div className="mt-1.5 flex items-center gap-2 text-xs">
            <span className="truncate text-muted-foreground">at or below reorder point</span>
          </div>
        </div>

        {/* 4. Out of stock */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[13px] font-medium text-muted-foreground">Out of stock</p>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
              <Package className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 font-heading text-2xl font-semibold tracking-tight text-foreground">
            {kpiStats.outOfStockCount}
          </p>
          <div className="mt-1.5 flex items-center gap-2 text-xs">
            <span className="truncate text-muted-foreground">zero available units</span>
          </div>
        </div>

        {/* 5. Overstock */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[13px] font-medium text-muted-foreground">Overstock</p>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <ArrowRightLeft className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 font-heading text-2xl font-semibold tracking-tight text-foreground">
            {kpiStats.overstockCount}
          </p>
          <div className="mt-1.5 flex items-center gap-2 text-xs">
            <span className="truncate text-muted-foreground">above maximum level</span>
          </div>
        </div>
      </div>

      {/* Exact Filters & Search Toolbar Matching Screenshots 1 & 2 */}
      <div className="flex flex-col gap-2.5 rounded-xl border border-border bg-card p-2.5 shadow-2xs sm:flex-row sm:flex-wrap sm:items-center">
        {/* Filters label */}
        <div className="flex items-center gap-1.5 px-1 text-xs font-medium text-muted-foreground">
          <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Filters</span>
        </div>

        {/* Filter inputs */}
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          {/* Search product or SKU... */}
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search product or SKU..."
              className="h-9.5 w-full rounded-lg border border-slate-300 bg-card pl-9.5 pr-3 text-[13.5px] font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary shadow-2xs"
            />
          </div>

          {/* Dropdown 1: Warehouse */}
          <div className="w-full sm:w-48">
            <select
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              className="h-9.5 w-full rounded-lg border border-slate-300 bg-card px-3 text-[13.5px] font-medium text-foreground focus:outline-none focus:border-primary shadow-2xs"
            >
              <option value="all">Warehouse (All)</option>
              {uniqueWarehouses.map((wh) => (
                <option key={wh} value={wh}>
                  {wh}
                </option>
              ))}
            </select>
          </div>

          {/* Dropdown 2: Stock Status */}
          <div className="w-full sm:w-44">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9.5 w-full rounded-lg border border-slate-300 bg-card px-3 text-[13.5px] font-medium text-foreground focus:outline-none focus:border-primary shadow-2xs"
            >
              <option value="all">Status (All)</option>
              <option value="ok">In stock</option>
              <option value="low">Low stock</option>
              <option value="out">Out of stock</option>
              <option value="overstock">Overstock</option>
            </select>
          </div>

          {/* Dropdown 3: Brand */}
          <div className="w-full sm:w-48">
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="h-9.5 w-full rounded-lg border border-slate-300 bg-card px-3 text-[13.5px] font-medium text-foreground focus:outline-none focus:border-primary shadow-2xs"
            >
              <option value="all">Brand (All)</option>
              {uniqueBrands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Counter badge & Clear action */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full border border-border bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
            {activeTab === 'inventory' ? filteredRecords.length : scopedMovements.length} records
          </span>
          {hasActiveFilters && (
            <button
              onClick={() => {
                setWarehouseFilter('all');
                setStatusFilter('all');
                setBrandFilter('all');
                setSearchTerm('');
              }}
              className="rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area based on Tab */}
      {activeTab === 'inventory' ? (
        /* Inventory Management Table Matching Screenshot */
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          {filteredRecords.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm font-medium text-foreground">No stock records match these filters</p>
              <p className="text-xs text-muted-foreground mt-1">
                Adjust the warehouse, stock status, brand or search query.
              </p>
            </div>
          ) : (
            <div>
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="py-3 px-4 font-semibold text-muted-foreground">Product</th>
                      <th className="py-3 px-3 font-semibold text-muted-foreground">Warehouse</th>
                      <th className="py-3 px-3 font-semibold text-muted-foreground text-right">On hand</th>
                      <th className="py-3 px-3 font-semibold text-muted-foreground text-right">Reserved</th>
                      <th className="py-3 px-3 font-semibold text-muted-foreground text-right">Available</th>
                      <th className="py-3 px-3 font-semibold text-muted-foreground text-right">Reorder point</th>
                      <th className="py-3 px-3 font-semibold text-muted-foreground text-right">Cover</th>
                      <th className="py-3 px-3 font-semibold text-muted-foreground">Status</th>
                      <th className="py-3 px-4 font-semibold text-muted-foreground">Expiry</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {displayedRecords.map((r) => {
                      const statusConfig = STATUS_CONFIG[r.stock_status] || STATUS_CONFIG.ok;
                      const isZero = Number(r.available) === 0;

                      return (
                        <tr
                          key={r.id}
                          onClick={() => setSelectedRecord(r)}
                          className="cursor-pointer hover:bg-muted/40 transition-colors group"
                        >
                          {/* Product & Subtext */}
                          <td className="py-3 px-4">
                            <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                              {r.product_name}
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {r.sku} · {r.brand}
                            </p>
                          </td>

                          {/* Warehouse & Bin */}
                          <td className="py-3 px-3 text-muted-foreground whitespace-nowrap">
                            {r.warehouse} {r.bin_location || ''}
                          </td>

                          {/* On hand */}
                          <td className="py-3 px-3 text-right tabular-nums text-foreground font-medium">
                            {Math.round(r.on_hand || 0)}
                          </td>

                          {/* Reserved */}
                          <td className="py-3 px-3 text-right tabular-nums text-muted-foreground">
                            {Math.round(r.reserved || 0)}
                          </td>

                          {/* Available */}
                          <td className="py-3 px-3 text-right tabular-nums font-semibold">
                            <span className={isZero ? 'text-rose-600 font-bold' : 'text-foreground'}>
                              {Math.round(r.available || 0)}
                            </span>
                          </td>

                          {/* Reorder point */}
                          <td className="py-3 px-3 text-right tabular-nums text-muted-foreground">
                            {Math.round(r.reorder_point || 0)}
                          </td>

                          {/* Cover days */}
                          <td className="py-3 px-3 text-right tabular-nums text-muted-foreground">
                            {Math.round(r.days_of_cover || 0)} d
                          </td>

                          {/* Status Badge */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium capitalize ${statusConfig.pillClass}`}
                            >
                              {statusConfig.label}
                            </span>
                          </td>

                          {/* Expiry Date */}
                          <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">
                            {r.expiry_date || '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Load More Button after 30 items */}
              {filteredRecords.length > visibleCount && (
                <div className="border-t border-border p-3 text-center bg-muted/20">
                  <button
                    onClick={() => setVisibleCount((prev) => prev + 30)}
                    className="btn-secondary"
                  >
                    Load more records (Showing {visibleCount} of {filteredRecords.length})
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Movements Log Tab */
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          {scopedMovements.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm font-medium text-foreground">No inventory movements recorded</p>
              <p className="text-xs text-muted-foreground mt-1">
                Log receipts, transfers or adjustments using the "Log Movement" button above.
              </p>
            </div>
          ) : (
            <div>
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="py-3 px-4 font-semibold text-muted-foreground">Date</th>
                      <th className="py-3 px-3 font-semibold text-muted-foreground">Type</th>
                      <th className="py-3 px-3 font-semibold text-muted-foreground">SKU / Product</th>
                      <th className="py-3 px-3 font-semibold text-muted-foreground">Warehouse</th>
                      <th className="py-3 px-3 font-semibold text-muted-foreground text-right">Quantity</th>
                      <th className="py-3 px-3 font-semibold text-muted-foreground">Reference</th>
                      <th className="py-3 px-4 font-semibold text-muted-foreground">Notes / Agent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {displayedMovements.map((m) => {
                      const typeBadge = MOVEMENT_TYPE_BADGES[m.type] || 'border-border bg-muted/40 text-foreground';
                      const isPositive = ['receipt', 'adjustment'].includes(m.type);

                      return (
                        <tr key={m.id} className="hover:bg-muted/40 transition-colors">
                          <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">
                            {m.movement_date || '—'}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${typeBadge}`}>
                              {m.type}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <p className="font-semibold text-foreground">{m.product_name}</p>
                            <p className="text-[11px] text-muted-foreground font-mono">{m.sku}</p>
                          </td>
                          <td className="py-3 px-3 text-muted-foreground whitespace-nowrap">
                            {m.warehouse}
                          </td>
                          <td className="py-3 px-3 text-right tabular-nums font-semibold">
                            <span className={isPositive ? 'text-emerald-600' : 'text-foreground'}>
                              {isPositive ? '+' : '-'}{Math.round(m.quantity || 0)}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-xs font-mono text-muted-foreground">
                            {m.reference || '—'}
                          </td>
                          <td className="py-3 px-4 text-xs text-muted-foreground">
                            <p>{m.note || 'Manual movement entry'}</p>
                            <p className="text-[10px] text-muted-foreground opacity-80">{m.performed_by || 'Warehouse Team'}</p>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Load More Button for Movements */}
              {scopedMovements.length > movementVisibleCount && (
                <div className="border-t border-border p-3 text-center bg-muted/20">
                  <button
                    onClick={() => setMovementVisibleCount((prev) => prev + 30)}
                    className="btn-secondary"
                  >
                    Load more movements (Showing {movementVisibleCount} of {scopedMovements.length})
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Stock Record Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="max-h-[90vh] max-w-xl w-full rounded-xl border border-border bg-card p-6 shadow-2xl overflow-y-auto space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold font-heading text-foreground">
                    {selectedRecord.product_name}
                  </h2>
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${
                      (STATUS_CONFIG[selectedRecord.stock_status] || STATUS_CONFIG.ok).pillClass
                    }`}
                  >
                    {(STATUS_CONFIG[selectedRecord.stock_status] || STATUS_CONFIG.ok).label}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  SKU: {selectedRecord.sku} · Brand: {selectedRecord.brand} · Warehouse: {selectedRecord.warehouse}
                </p>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-[11px] text-muted-foreground">Available</p>
                <p className="font-bold text-foreground text-base mt-0.5">{Math.round(selectedRecord.available || 0)}</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-[11px] text-muted-foreground">On Hand</p>
                <p className="font-bold text-foreground text-base mt-0.5">{Math.round(selectedRecord.on_hand || 0)}</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-[11px] text-muted-foreground">Reserved</p>
                <p className="font-bold text-foreground text-base mt-0.5">{Math.round(selectedRecord.reserved || 0)}</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-[11px] text-muted-foreground">Incoming POs</p>
                <p className="font-bold text-emerald-600 text-base mt-0.5">{Math.round(selectedRecord.incoming || 0)}</p>
              </div>
            </div>

            {/* Location & Thresholds */}
            <div className="rounded-xl border border-border bg-card p-4 text-xs space-y-2">
              <p className="font-semibold uppercase tracking-wider text-muted-foreground text-[11px]">
                Warehouse Bin & Replenishment Thresholds
              </p>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-muted-foreground">Bin Location:</span>
                  <p className="font-medium text-foreground">{selectedRecord.bin_location || 'Standard Pallet Bay'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Reorder Point:</span>
                  <p className="font-medium text-foreground">{Math.round(selectedRecord.reorder_point || 0)} units</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Days of Cover:</span>
                  <p className="font-medium text-foreground">{Math.round(selectedRecord.days_of_cover || 0)} days</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Expiry Date:</span>
                  <p className="font-medium text-foreground">{selectedRecord.expiry_date || 'Non-perishable / Not tracked'}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <button
                onClick={() => {
                  const rec = selectedRecord;
                  setSelectedRecord(null);
                  handleOpenMovementModal(rec);
                }}
                className="inline-flex items-center rounded-lg border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
              >
                <ArrowRightLeft className="mr-1.5 h-3.5 w-3.5" />
                Record Stock Movement
              </button>

              <button
                onClick={() => setSelectedRecord(null)}
                className="rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Stock Movement Modal */}
      {isMovementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="max-w-md w-full rounded-xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-bold font-heading text-foreground">Record Inventory Movement</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Log receipts, transfers, cycle count write-offs or adjustments.
                </p>
              </div>
              <button
                onClick={() => setIsMovementModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleLogMovement} className="space-y-4 pt-2 text-[13.5px]">
              <div>
                <label className="block font-medium text-foreground mb-1.5 text-[13px]">Product SKU / Code</label>
                <input
                  type="text"
                  required
                  value={movementForm.sku}
                  onChange={(e) => setMovementForm({ ...movementForm, sku: e.target.value })}
                  className="w-full h-10 rounded-lg border border-slate-300 bg-background px-3 py-2 text-[13.5px] font-medium focus:ring-1 focus:ring-primary focus:outline-none shadow-2xs"
                />
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1.5 text-[13px]">Movement Type</label>
                <select
                  value={movementForm.type}
                  onChange={(e) => setMovementForm({ ...movementForm, type: e.target.value })}
                  className="w-full h-10 rounded-lg border border-slate-300 bg-background px-3 py-2 text-[13.5px] font-medium focus:ring-1 focus:ring-primary focus:outline-none shadow-2xs"
                >
                  <option value="receipt">Inbound Receipt (PO)</option>
                  <option value="transfer">Inter-warehouse Transfer</option>
                  <option value="adjustment">Cycle Count Adjustment</option>
                  <option value="damage">Damage / Write-off</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-medium text-foreground mb-1.5 text-[13px]">Warehouse</label>
                  <select
                    value={movementForm.warehouse}
                    onChange={(e) => setMovementForm({ ...movementForm, warehouse: e.target.value })}
                    className="w-full h-10 rounded-lg border border-slate-300 bg-background px-3 py-2 text-[13.5px] font-medium focus:ring-1 focus:ring-primary focus:outline-none shadow-2xs"
                  >
                    {uniqueWarehouses.map((wh) => (
                      <option key={wh} value={wh}>
                        {wh}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-foreground mb-1.5 text-[13px]">Quantity (Units)</label>
                  <input
                    type="number"
                    required
                    value={movementForm.quantity}
                    onChange={(e) => setMovementForm({ ...movementForm, quantity: Number(e.target.value) })}
                    className="w-full h-10 rounded-lg border border-slate-300 bg-background px-3 py-2 text-[13.5px] font-medium focus:ring-1 focus:ring-primary focus:outline-none shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1.5 text-[13px]">Reference / PO #</label>
                <input
                  type="text"
                  value={movementForm.reference}
                  onChange={(e) => setMovementForm({ ...movementForm, reference: e.target.value })}
                  className="w-full h-10 rounded-lg border border-slate-300 bg-background px-3 py-2 text-[13.5px] font-medium focus:ring-1 focus:ring-primary focus:outline-none shadow-2xs"
                />
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1.5 text-[13px]">Notes / Reason</label>
                <input
                  type="text"
                  value={movementForm.note}
                  onChange={(e) => setMovementForm({ ...movementForm, note: e.target.value })}
                  className="w-full h-10 rounded-lg border border-slate-300 bg-background px-3 py-2 text-[13.5px] font-medium focus:ring-1 focus:ring-primary focus:outline-none shadow-2xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3.5 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsMovementModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-[13px] font-medium text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
                >
                  Save Movement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
