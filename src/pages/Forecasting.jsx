import React, { useState, useMemo } from 'react';
import {
  Package,
  CalendarCheck2,
  AlertTriangle,
  Clock,
  Sparkles,
  SlidersHorizontal,
  Eye,
  Check,
  X,
  Info,
  ChevronDown,
  Layers,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Download
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Forecasting() {
  const { company, companyLabel, entities, setEntities, showToast, exportCSV } = useApp();

  // Local state for forecast records
  const [forecasts, setForecasts] = useState(() => {
    const list = entities.Forecast || [];
    // Sort by recommended_qty descending to match exact reference order
    return [...list].sort((a, b) => (Number(b.recommended_qty) || 0) - (Number(a.recommended_qty) || 0));
  });

  // Filter dropdown states
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [confidenceFilter, setConfidenceFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');

  // Selected forecast for modal/drawer
  const [selectedForecast, setSelectedForecast] = useState(null);
  // Show historical basis modal
  const [showBasisModal, setShowBasisModal] = useState(false);
  // Running agent state
  const [isRunningAgent, setIsRunningAgent] = useState(false);

  // Pagination (load more after 30 items)
  const [visibleCount, setVisibleCount] = useState(30);

  // Extract unique options for dropdowns
  const uniqueWarehouses = useMemo(() => {
    const set = new Set();
    forecasts.forEach((f) => {
      if (f.warehouse) set.add(f.warehouse);
    });
    return Array.from(set).sort();
  }, [forecasts]);

  const uniqueBrands = useMemo(() => {
    const set = new Set();
    forecasts.forEach((f) => {
      if (f.brand) set.add(f.brand);
    });
    return Array.from(set).sort();
  }, [forecasts]);

  // Filtered forecasts
  const filteredForecasts = useMemo(() => {
    return forecasts.filter((f) => {
      if (company !== 'all' && f.business_unit && f.business_unit !== company) return false;
      if (warehouseFilter !== 'all' && f.warehouse !== warehouseFilter) return false;
      if (riskFilter !== 'all' && f.stockout_risk?.toLowerCase() !== riskFilter.toLowerCase()) return false;
      if (confidenceFilter !== 'all' && f.confidence?.toLowerCase() !== confidenceFilter.toLowerCase()) return false;
      if (brandFilter !== 'all' && f.brand !== brandFilter) return false;
      return true;
    });
  }, [forecasts, company, warehouseFilter, riskFilter, confidenceFilter, brandFilter]);

  // Overall KPIs (calculated across open recommendations)
  const totalSKUs = forecasts.length;
  const totalRecommended = forecasts.reduce((acc, f) => acc + (Number(f.recommended_qty) || 0), 0);
  const highRiskCount = forecasts.filter((f) => f.stockout_risk?.toLowerCase() === 'high').length;
  const awaitingApprovalCount = forecasts.filter((f) => f.status === 'pending_approval' || !f.status).length;

  // Actions
  const handleApprove = (forecastId) => {
    const item = forecasts.find((f) => f.id === forecastId);
    if (!item) return;

    setForecasts((prev) =>
      prev.map((f) => (f.id === forecastId ? { ...f, status: 'approved' } : f))
    );

    // Also persist in global entities (Task & AuditLog)
    if (setEntities) {
      setEntities((prev) => {
        const updatedForecasts = (prev.Forecast || []).map((f) =>
          f.id === forecastId ? { ...f, status: 'approved' } : f
        );
        const newTask = {
          id: 'tsk_po_' + Date.now(),
          title: `Create PO: ${item.recommended_qty} units of ${item.product_name}`,
          description: `Replenishment recommendation approved for ${item.warehouse}. Lead time: ${item.supplier_lead_time} days.`,
          agent_key: 'inventory_forecasting',
          business_unit: item.business_unit || 'PRM',
          due_date: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
          priority: item.stockout_risk === 'high' ? 'high' : 'medium',
          owner_role: 'Procurement Specialist',
          status: 'pending',
          requires_approval: false,
          created_date: new Date().toISOString()
        };
        const auditLog = {
          id: 'aud_' + Date.now(),
          user_name: 'Furqan Kazim',
          user_email: 'furqan@polmarex.ca',
          action: 'forecast.approved',
          entity_type: 'Forecast',
          entity_id: forecastId,
          entity_name: item.product_name,
          details: `Approved recommended purchase order quantity of ${item.recommended_qty} units.`,
          occurred_at: new Date().toISOString(),
          severity: 'info',
          business_unit: item.business_unit || 'PRM'
        };
        return {
          ...prev,
          Forecast: updatedForecasts,
          Task: [newTask, ...(prev.Task || [])],
          AuditLog: [auditLog, ...(prev.AuditLog || [])]
        };
      });
    }

    showToast({
      title: 'Recommendation Approved',
      description: `Purchase order task created for ${item.recommended_qty} units of ${item.product_name}.`
    });

    if (selectedForecast && selectedForecast.id === forecastId) {
      setSelectedForecast((prev) => ({ ...prev, status: 'approved' }));
    }
  };

  const handleReject = (forecastId) => {
    const item = forecasts.find((f) => f.id === forecastId);
    if (!item) return;

    setForecasts((prev) =>
      prev.map((f) => (f.id === forecastId ? { ...f, status: 'dismissed' } : f))
    );

    if (setEntities) {
      setEntities((prev) => ({
        ...prev,
        Forecast: (prev.Forecast || []).map((f) =>
          f.id === forecastId ? { ...f, status: 'dismissed' } : f
        )
      }));
    }

    showToast({
      title: 'Recommendation Dismissed',
      description: `Replenishment recommendation for ${item.product_name} was dismissed.`
    });

    if (selectedForecast && selectedForecast.id === forecastId) {
      setSelectedForecast((prev) => ({ ...prev, status: 'dismissed' }));
    }
  };

  const handleRunAgent = () => {
    setIsRunningAgent(true);
    setTimeout(() => {
      setIsRunningAgent(false);
      showToast({
        title: 'Inventory Agent Finished',
        description: 'Analyzed 18 SKUs across 3 warehouses. Demand predictions & replenishment units are up to date.'
      });
    }, 1200);
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground tracking-tight">Demand forecasting</h1>
          <p className="text-[13.5px] text-slate-700 mt-1 max-w-3xl font-normal leading-relaxed">
            Forecasts for all companies built from order-item sales history, seasonality, supplier lead times and current stock. Every suggestion shows its assumptions, confidence and reason.
          </p>
        </div>

        {/* Top-Right Action Buttons */}
        <div className="flex items-center gap-2 self-start shrink-0">
          <button
            onClick={() => exportCSV('inventory')}
            className="btn-secondary"
          >
            <Download className="w-3.5 h-3.5 text-muted-foreground mr-1.5" />
            <span>Export Forecast CSV</span>
          </button>

          <button
            onClick={() => setShowBasisModal(true)}
            className="btn-secondary"
          >
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            <span>All rows use historical basis</span>
          </button>

          <button
            onClick={handleRunAgent}
            disabled={isRunningAgent}
            className="btn-primary"
          >
            {isRunningAgent ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>{isRunningAgent ? 'Running Agent…' : 'Run Inventory agent'}</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* SKUs in forecast */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground">SKUs in forecast</span>
            <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <Package className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-heading text-foreground">{totalSKUs}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">low or out of stock items</div>
          </div>
        </div>

        {/* Recommended units */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground">Recommended units</span>
            <div className="w-6 h-6 rounded-md bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
              <CalendarCheck2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-heading text-foreground">
              {totalRecommended.toLocaleString()}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">across all open recommendations</div>
          </div>
        </div>

        {/* High stockout risk */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground">High stockout risk</span>
            <div className="w-6 h-6 rounded-md bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-heading text-foreground">{highRiskCount}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">cover below supplier lead time</div>
          </div>
        </div>

        {/* Awaiting approval */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground">Awaiting approval</span>
            <div className="w-6 h-6 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-heading text-foreground">{awaitingApprovalCount}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">manager decision required</div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar matching screenshot */}
      <div className="rounded-xl border border-border bg-card p-2.5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 text-xs font-medium text-foreground">
            <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Filters</span>
          </div>

          {/* Dropdown 1: Warehouse */}
          <div className="relative">
            <select
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              className="h-9.5 appearance-none bg-card border border-slate-300 rounded-lg pl-3 pr-8 text-[13.5px] font-medium text-foreground focus:outline-none focus:border-primary shadow-2xs min-w-[125px]"
            >
              <option value="all">Warehouse (All)</option>
              {uniqueWarehouses.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>

          {/* Dropdown 2: Stockout Risk */}
          <div className="relative">
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="h-9.5 appearance-none bg-card border border-slate-300 rounded-lg pl-3 pr-8 text-[13.5px] font-medium text-foreground focus:outline-none focus:border-primary shadow-2xs min-w-[125px]"
            >
              <option value="all">Risk (All)</option>
              <option value="high">High Risk</option>
              <option value="low">Low Risk</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>

          {/* Dropdown 3: Confidence */}
          <div className="relative">
            <select
              value={confidenceFilter}
              onChange={(e) => setConfidenceFilter(e.target.value)}
              className="h-9.5 appearance-none bg-card border border-slate-300 rounded-lg pl-3 pr-8 text-[13.5px] font-medium text-foreground focus:outline-none focus:border-primary shadow-2xs min-w-[125px]"
            >
              <option value="all">Confidence (All)</option>
              <option value="high">High Confidence</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>

          {/* Dropdown 4: Brand */}
          <div className="relative">
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="h-9.5 appearance-none bg-card border border-slate-300 rounded-lg pl-3 pr-8 text-[13.5px] font-medium text-foreground focus:outline-none focus:border-primary shadow-2xs min-w-[125px]"
            >
              <option value="all">Brand (All)</option>
              {uniqueBrands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Records count on right */}
        <div className="text-xs text-muted-foreground px-2">
          {filteredForecasts.length} records
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-xl border border-border bg-card shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-muted/20 text-muted-foreground font-medium text-[11px]">
              <tr>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Warehouse</th>
                <th className="px-4 py-3 font-medium text-right">Cover</th>
                <th className="px-4 py-3 font-medium text-right">Predicted demand</th>
                <th className="px-4 py-3 font-medium text-right">Recommended</th>
                <th className="px-4 py-3 font-medium text-center">Stockout risk</th>
                <th className="px-4 py-3 font-medium text-center">Confidence</th>
                <th className="px-4 py-3 font-medium text-center">Status</th>
                <th className="px-4 py-3 font-medium text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredForecasts.slice(0, visibleCount).map((f) => {
                const isHighRisk = f.stockout_risk?.toLowerCase() === 'high';
                const isApproved = f.status === 'approved';
                const isDismissed = f.status === 'dismissed';

                return (
                  <tr key={f.id} className="hover:bg-muted/30 transition-colors">
                    {/* Product */}
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground text-xs leading-snug">
                        {f.product_name}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {f.sku} · {f.brand} · lead time {f.supplier_lead_time} d
                      </div>
                    </td>

                    {/* Warehouse */}
                    <td className="px-4 py-3 text-foreground whitespace-nowrap">
                      {f.warehouse}
                    </td>

                    {/* Cover */}
                    <td className="px-4 py-3 text-right font-medium text-foreground whitespace-nowrap">
                      {f.days_of_cover !== undefined ? `${f.days_of_cover} d` : '—'}
                    </td>

                    {/* Predicted demand */}
                    <td className="px-4 py-3 text-right text-foreground font-medium whitespace-nowrap">
                      {f.predicted_demand}
                    </td>

                    {/* Recommended */}
                    <td className="px-4 py-3 text-right font-bold text-foreground whitespace-nowrap">
                      {f.recommended_qty}
                    </td>

                    {/* Stockout risk badge */}
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      {isHighRisk ? (
                        <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-medium border border-rose-200 bg-rose-50 text-rose-700">
                          High
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-medium border border-amber-200 bg-amber-50 text-amber-700">
                          Low
                        </span>
                      )}
                    </td>

                    {/* Confidence badge */}
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-medium border border-amber-200 bg-amber-50 text-amber-700 capitalize">
                        {f.confidence || 'Medium'}
                      </span>
                    </td>

                    {/* Status badge */}
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      {isApproved ? (
                        <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-medium border border-emerald-200 bg-emerald-50 text-emerald-700">
                          Approved
                        </span>
                      ) : isDismissed ? (
                        <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-medium border border-slate-200 bg-slate-50 text-slate-600">
                          Dismissed
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-medium border border-amber-200 bg-amber-50 text-amber-700">
                          Pending Approval
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right whitespace-nowrap pr-6">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        {/* Eye icon to view details */}
                        <button
                          onClick={() => setSelectedForecast(f)}
                          title="View forecast calculation details"
                          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Approve button */}
                        {isApproved ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 px-2 py-0.5">
                            <Check className="w-3 h-3" /> Approved
                          </span>
                        ) : isDismissed ? (
                          <span className="text-[11px] text-muted-foreground italic px-2">Dismissed</span>
                        ) : (
                          <button
                            onClick={() => handleApprove(f.id)}
                            className="btn-table"
                          >
                            <Check className="w-3 h-3 text-[#e1241a]" />
                            <span>Approve</span>
                          </button>
                        )}

                        {/* Dismiss button */}
                        {!isApproved && !isDismissed && (
                          <button
                            onClick={() => handleReject(f.id)}
                            title="Dismiss recommendation"
                            className="p-1 rounded text-muted-foreground hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
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

        {/* Load more if records exceed visibleCount */}
        {filteredForecasts.length > visibleCount && (
          <div className="border-t border-border p-3 text-center bg-muted/20">
            <button
              onClick={() => setVisibleCount((prev) => prev + 30)}
              className="btn-secondary"
            >
              Load more forecasts ({filteredForecasts.length - visibleCount} remaining)
            </button>
          </div>
        )}
      </div>

      {/* Bottom Disclaimer Banner matching screenshot */}
      <div className="flex items-start sm:items-center gap-2.5 p-3 rounded-lg border border-border bg-card text-xs text-muted-foreground">
        <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5 sm:mt-0" />
        <span>
          Approving a recommendation records the decision, writes an audit entry and creates a purchase-order task. No order is transmitted automatically — that needs the ERP or accounting integration, which is not connected in this prototype.
        </span>
      </div>

      {/* Detail Drawer / Modal for Eye Icon */}
      {selectedForecast && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-4 border-b border-border flex items-start justify-between bg-muted/20">
              <div>
                <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
                  {selectedForecast.sku} · {selectedForecast.brand}
                </span>
                <h3 className="text-base font-bold text-foreground mt-0.5">
                  {selectedForecast.product_name}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Warehouse: <span className="font-semibold text-foreground">{selectedForecast.warehouse}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedForecast(null)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4 text-xs">
              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-2.5 rounded-lg border border-border bg-muted/20">
                  <span className="text-[10px] text-muted-foreground block">Days of Cover</span>
                  <span className="text-sm font-bold text-foreground mt-0.5 block font-mono">
                    {selectedForecast.days_of_cover} days
                  </span>
                </div>
                <div className="p-2.5 rounded-lg border border-border bg-muted/20">
                  <span className="text-[10px] text-muted-foreground block">Historical Daily</span>
                  <span className="text-sm font-bold text-foreground mt-0.5 block font-mono">
                    {selectedForecast.historical_avg_daily} / day
                  </span>
                </div>
                <div className="p-2.5 rounded-lg border border-border bg-muted/20">
                  <span className="text-[10px] text-muted-foreground block">30d Demand</span>
                  <span className="text-sm font-bold text-foreground mt-0.5 block font-mono">
                    {selectedForecast.predicted_demand} units
                  </span>
                </div>
                <div className="p-2.5 rounded-lg border border-border bg-muted/20">
                  <span className="text-[10px] text-muted-foreground block">Recommended PO</span>
                  <span className="text-sm font-bold text-primary mt-0.5 block font-mono">
                    {selectedForecast.recommended_qty} units
                  </span>
                </div>
              </div>

              {/* Rationale & Reason */}
              <div className="space-y-3 pt-1">
                <div>
                  <h4 className="font-semibold text-foreground flex items-center gap-1.5 mb-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    Agent Reason & Urgency
                  </h4>
                  <p className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-200/80 text-amber-900 leading-relaxed text-[11px]">
                    {selectedForecast.reason}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground flex items-center gap-1.5 mb-1">
                    <Layers className="w-3.5 h-3.5 text-sky-600" />
                    Model Assumptions
                  </h4>
                  <p className="p-2.5 rounded-lg bg-muted/30 border border-border text-foreground leading-relaxed text-[11px]">
                    {selectedForecast.assumptions}
                  </p>
                </div>

                {selectedForecast.seasonality_note && (
                  <div>
                    <h4 className="font-semibold text-foreground flex items-center gap-1.5 mb-1">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                      Seasonality Factor
                    </h4>
                    <p className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200/80 text-emerald-900 leading-relaxed text-[11px]">
                      {selectedForecast.seasonality_note}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border flex items-center justify-between bg-muted/20">
              <span className="text-[11px] text-muted-foreground">
                Lead time: <strong className="text-foreground">{selectedForecast.supplier_lead_time} days</strong>
              </span>
              <div className="flex items-center gap-2">
                {selectedForecast.status === 'pending_approval' && (
                  <>
                    <button
                      onClick={() => handleReject(selectedForecast.id)}
                      className="px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-medium text-foreground transition-colors"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={() => handleApprove(selectedForecast.id)}
                      className="px-3.5 py-1.5 rounded-lg bg-[#e1241a] hover:bg-[#c91a11] text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Approve & Create PO Task
                    </button>
                  </>
                )}
                {selectedForecast.status === 'approved' && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                    <Check className="w-3.5 h-3.5" /> Approved
                  </span>
                )}
                {selectedForecast.status === 'dismissed' && (
                  <span className="text-xs text-muted-foreground italic">Dismissed</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Historical Basis Info Modal */}
      {showBasisModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Forecast Calculation Methodology</h3>
              </div>
              <button
                onClick={() => setShowBasisModal(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3 text-xs text-muted-foreground leading-relaxed">
              <p>
                All 18 recommendation rows are generated using <strong>12 months of rolling order-item sales history</strong> cross-referenced against real-time warehouse inventory balances.
              </p>
              <div className="rounded-lg bg-muted/30 border border-border p-3 space-y-1.5 text-[11px] text-foreground">
                <div className="font-semibold">Calculation Factors:</div>
                <div className="flex items-center gap-1.5">
                  <ArrowRight className="w-3 h-3 text-primary shrink-0" />
                  <span><strong>Historical run rate:</strong> 90-day daily velocity</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ArrowRight className="w-3 h-3 text-primary shrink-0" />
                  <span><strong>Seasonality index:</strong> 1.18 Q4 holiday uplift</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ArrowRight className="w-3 h-3 text-primary shrink-0" />
                  <span><strong>Lead time buffer:</strong> Supplier-specific shipping days</span>
                </div>
              </div>
              <p className="text-[11px]">
                Replenishment POs are calculated to ensure a 45-day safety stock buffer above the supplier lead time.
              </p>
            </div>
            <div className="p-3 border-t border-border flex justify-end bg-muted/20">
              <button
                onClick={() => setShowBasisModal(false)}
                className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-xs"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
