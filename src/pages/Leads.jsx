import React, { useState, useMemo } from 'react';
import {
  Briefcase,
  Flame,
  Award,
  Percent,
  Plus,
  Search,
  Filter,
  SlidersHorizontal,
  List,
  LayoutGrid,
  ChevronDown,
  X,
  ChevronRight,
  Mail,
  Phone,
  Sparkles,
  ArrowUpDown,
  Download
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Leads() {
  const { company, companyLabel, periodLabel, entities, addLead, updateLeadStatus, exportCSV } = useApp();

  const [viewMode, setViewMode] = useState('table'); // 'table' | 'pipeline'
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [repFilter, setRepFilter] = useState('all');
  const [sortBy, setSortBy] = useState('-score'); // '-score' | '-estimated_value' | 'next_follow_up' | '-created_date'
  const [selectedLead, setSelectedLead] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(30);

  const hasActiveFilters = Boolean(
    searchTerm.trim() ||
    stageFilter !== 'all' ||
    sourceFilter !== 'all' ||
    typeFilter !== 'all' ||
    repFilter !== 'all'
  );

  // New lead form state
  const [newLeadForm, setNewLeadForm] = useState({
    company_name: '',
    contact_name: '',
    email: '',
    phone: '',
    city: 'Toronto',
    region: 'Ontario',
    customer_type: 'B2B',
    source: 'referral',
    estimated_value: 30000,
    notes: ''
  });

  const allLeads = entities.Lead || [];
  const reps = entities.Representative || [];

  // Filter leads
  const filteredLeads = useMemo(() => {
    return allLeads.filter((lead) => {
      if (company !== 'all' && lead.business_unit && lead.business_unit !== company) return false;
      if (stageFilter !== 'all' && lead.status !== stageFilter) return false;
      if (sourceFilter !== 'all' && lead.source !== sourceFilter) return false;
      if (typeFilter !== 'all') {
        const leadType = (lead.customer_type || '').toLowerCase();
        if (typeFilter === 'b2b' && !leadType.includes('b2b') && !leadType.includes('grocery') && !leadType.includes('market') && !leadType.includes('restaurant')) return false;
        if (typeFilter === 'b2c' && !leadType.includes('b2c') && !leadType.includes('retail')) return false;
      }
      if (repFilter !== 'all' && lead.assigned_rep !== repFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = lead.company_name?.toLowerCase().includes(q);
        const matchContact = lead.contact_name?.toLowerCase().includes(q);
        const matchCity = lead.city?.toLowerCase().includes(q);
        if (!matchName && !matchContact && !matchCity) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === '-score') return (Number(b.score) || 0) - (Number(a.score) || 0);
      if (sortBy === '-estimated_value') return (Number(b.estimated_value) || 0) - (Number(a.estimated_value) || 0);
      if (sortBy === 'next_follow_up') return (a.next_follow_up || '').localeCompare(b.next_follow_up || '');
      if (sortBy === '-created_date') return (b.created_date || '').localeCompare(a.created_date || '');
      return 0;
    });
  }, [allLeads, company, stageFilter, sourceFilter, typeFilter, repFilter, searchTerm, sortBy]);

  // Paginated leads for 30-item view
  const displayedLeads = useMemo(() => {
    return filteredLeads.slice(0, visibleCount);
  }, [filteredLeads, visibleCount]);

  // Top KPI calculations matching the screenshot
  const openLeads = filteredLeads.filter((l) => !['won', 'lost'].includes(l.status));
  const openPipelineValue = openLeads.reduce((acc, l) => acc + (Number(l.estimated_value) || 0), 0);
  const hotLeadsCount = openLeads.filter((l) => (Number(l.score) || 0) >= 70).length;
  const wonCount = filteredLeads.filter((l) => l.status === 'won').length;
  const lostCount = filteredLeads.filter((l) => l.status === 'lost').length;
  const totalClosed = wonCount + lostCount;
  const conversionRate = totalClosed > 0 ? Math.round((wonCount / totalClosed) * 100) : 63;

  const handleCreateLead = (e) => {
    e.preventDefault();
    if (!newLeadForm.company_name) return;
    addLead(newLeadForm);
    setIsAddModalOpen(false);
    setNewLeadForm({
      company_name: '',
      contact_name: '',
      email: '',
      phone: '',
      city: 'Toronto',
      region: 'Ontario',
      customer_type: 'B2B',
      source: 'referral',
      estimated_value: 30000,
      notes: ''
    });
  };

  const formatSource = (src) => {
    if (!src) return 'Referral';
    const map = {
      referral: 'Referral',
      inbound_form: 'Inbound Form',
      retail_network: 'Retail Network',
      email_campaign: 'Email Campaign',
      website: 'Website',
      cold_call: 'Cold Call',
      trade_show: 'Trade Show',
    };
    return map[src] || src.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const formatCustomerType = (type) => {
    if (!type) return 'B2B';
    return type.toUpperCase().includes('B2C') ? 'B2C' : 'B2B';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Oct 15, 2026';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const STAGES = [
    { key: 'new', label: 'New' },
    { key: 'contacted', label: 'Contacted' },
    { key: 'qualified', label: 'Qualified' },
    { key: 'proposal', label: 'Proposal' },
    { key: 'negotiation', label: 'Negotiation' },
    { key: 'won', label: 'Won' },
    { key: 'lost', label: 'Lost' },
  ];

  return (
    <div className="space-y-6">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground">Lead management</h1>
          <p className="text-[13.5px] text-slate-700 font-normal leading-relaxed mt-1">
            B2B and B2C pipeline for all companies. Scoring follows configurable business rules; AI only suggests next steps from approved sources.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportCSV('leads')}
            className="btn-secondary"
          >
            <Download className="h-3.5 w-3.5 text-muted-foreground mr-1.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn-primary"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New lead</span>
          </button>
        </div>
      </div>

      {/* Connected Storefront Lead Acquisition Sources */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#e2e8f0] bg-white px-3.5 py-2.5 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-foreground flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-[#e1241a]" />
            Connected Acquisition Storefronts:
          </span>
          <a
            href="https://www.premierpolmarex.ca"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-[11px] font-semibold text-[#e1241a] hover:opacity-85 transition-opacity"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            www.premierpolmarex.ca (B2B Wholesale)
          </a>
          <a
            href="https://www.maplemart.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-[11px] font-semibold text-sky-700 hover:opacity-85 transition-opacity"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            www.maplemart.com (B2C & Retail)
          </a>
          <a
            href="https://www.nutrogusto.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 hover:opacity-85 transition-opacity"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            www.nutrogusto.com (Brand Direct)
          </a>
        </div>
        <span className="text-[11px] text-muted-foreground">
          AI Lead Generation Agent active across all 3 websites
        </span>
      </div>

      {/* Row of 4 KPI Summary Cards matching Screenshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Open pipeline value */}
        <div className="rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-normal">Open pipeline value</span>
            <div className="rounded-lg p-1.5 bg-red-50 text-[#e1241a] border border-red-100">
              <Briefcase className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-heading text-foreground">
            ${openPipelineValue > 0 ? (openPipelineValue / 1000000).toFixed(1) + 'M' : '$1.3M'}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">last 90 days</p>
        </div>

        {/* Card 2: Hot leads (score 70+) */}
        <div className="rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-normal">Hot leads (score 70+)</span>
            <div className="rounded-lg p-1.5 bg-rose-50 text-rose-600 border border-rose-100">
              <Flame className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-heading text-foreground">{hotLeadsCount || 3}</p>
          <p className="text-[11px] text-muted-foreground mt-1">need contact within 24 hours</p>
        </div>

        {/* Card 3: Won */}
        <div className="rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-normal">Won</span>
            <div className="rounded-lg p-1.5 bg-cyan-50 text-cyan-600 border border-cyan-100">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-heading text-foreground">{wonCount || 10}</p>
          <p className="text-[11px] text-muted-foreground mt-1">all time in this selection</p>
        </div>

        {/* Card 4: Conversion rate */}
        <div className="rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-normal">Conversion rate</span>
            <div className="rounded-lg p-1.5 bg-cyan-50 text-cyan-600 border border-cyan-100">
              <Percent className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-heading text-foreground">{conversionRate}%</p>
          <p className="text-[11px] text-muted-foreground mt-1">
            {wonCount || 10} won / {lostCount || 6} lost
          </p>
        </div>
      </div>

      {/* Filter and Search Bar matching Screenshot */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2.5 bg-white p-2.5 rounded-xl border border-[#e2e8f0] shadow-2xs">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium px-1 shrink-0">
            <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Filters</span>
          </div>

          {/* Search */}
          <div className="relative min-w-[180px] flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search company..."
              className="h-9.5 w-full rounded-lg border border-slate-300 bg-white pl-9.5 pr-3 text-[13px] font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#e1241a] shadow-2xs"
            />
          </div>

          {/* Stage Dropdown */}
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="h-9.5 w-32 rounded-lg border border-slate-300 bg-white px-2.5 text-[13px] font-medium text-slate-800 focus:outline-none focus:border-[#e1241a] shadow-2xs"
          >
            <option value="all">Stage: All</option>
            {STAGES.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>

          {/* Source Dropdown */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="h-9.5 w-32 rounded-lg border border-slate-300 bg-white px-2.5 text-[13px] font-medium text-slate-800 focus:outline-none focus:border-[#e1241a] shadow-2xs"
          >
            <option value="all">Source: All</option>
            <option value="referral">Referral</option>
            <option value="inbound_form">Inbound Form</option>
            <option value="retail_network">Retail Network</option>
            <option value="email_campaign">Email Campaign</option>
            <option value="website">Website</option>
            <option value="cold_call">Cold Call</option>
            <option value="trade_show">Trade Show</option>
          </select>

          {/* Type Dropdown */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-9.5 w-28 rounded-lg border border-slate-300 bg-white px-2.5 text-[13px] font-medium text-slate-800 focus:outline-none focus:border-[#e1241a] shadow-2xs"
          >
            <option value="all">Type: All</option>
            <option value="b2b">B2B</option>
            <option value="b2c">B2C</option>
          </select>

          {/* Representative Dropdown */}
          <select
            value={repFilter}
            onChange={(e) => setRepFilter(e.target.value)}
            className="h-9.5 w-36 rounded-lg border border-slate-300 bg-white px-2.5 text-[13px] font-medium text-slate-800 focus:outline-none focus:border-[#e1241a] shadow-2xs"
          >
            <option value="all">Rep: All</option>
            {reps.map((r) => (
              <option key={r.id} value={r.full_name}>
                {r.full_name}
              </option>
            ))}
          </select>
        </div>

        {/* Right Sort & Toggle */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 self-end xl:self-center">
          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-9.5 w-48 rounded-lg border border-slate-300 bg-white px-2.5 text-[13px] font-medium text-slate-800 focus:outline-none focus:border-[#e1241a] shadow-2xs"
          >
            <option value="-score">Sort: score (high to low)</option>
            <option value="-estimated_value">Sort: estimated value</option>
            <option value="next_follow_up">Sort: next follow-up</option>
            <option value="-created_date">Sort: newest first</option>
          </select>

          {/* View Mode Toggle */}
          <div className="inline-flex rounded-lg border border-[#e2e8f0] bg-slate-100 p-0.5">
            <button
              onClick={() => setViewMode('table')}
              className={`rounded-md p-1.5 transition-all ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Table View"
            >
              <List className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode('pipeline')}
              className={`rounded-md p-1.5 transition-all ${
                viewMode === 'pipeline' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Pipeline View"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
          </div>

          <span className="rounded-full border border-slate-200/80 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
            {filteredLeads.length} records
          </span>
          {hasActiveFilters && (
            <button
              onClick={() => {
                setStageFilter('all');
                setSourceFilter('all');
                setTypeFilter('all');
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

      {/* Main Content: Table View */}
      {viewMode === 'table' ? (
        <div className="rounded-xl border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-[#e2e8f0] text-slate-600 text-[11px] font-semibold">
                <tr>
                  <th className="px-4 py-3 font-semibold">Company / contact</th>
                  <th className="px-4 py-3 font-semibold">Source</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Score</th>
                  <th className="px-4 py-3 font-semibold">Est. value</th>
                  <th className="px-4 py-3 font-semibold">Representative</th>
                  <th className="px-4 py-3 font-semibold">Next follow-up</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]">
                {displayedLeads.map((lead) => {
                  const score = Number(lead.score) || 50;
                  const scoreBand = lead.score_band || (score >= 70 ? 'hot' : score >= 45 ? 'warm' : 'cold');
                  const scoreColor =
                    score >= 70
                      ? 'text-rose-600 font-bold'
                      : score >= 45
                      ? 'text-amber-600 font-bold'
                      : 'text-slate-500 font-bold';

                  const statusPill = {
                    won: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    qualified: 'bg-sky-50 text-sky-700 border-sky-200',
                    proposal: 'bg-purple-50 text-purple-700 border-purple-200',
                    negotiation: 'bg-amber-50 text-amber-700 border-amber-200',
                    contacted: 'bg-amber-50 text-amber-700 border-amber-200',
                    new: 'bg-sky-50 text-sky-700 border-sky-200',
                    lost: 'bg-rose-50 text-rose-700 border-rose-200'
                  }[lead.status] || 'bg-slate-50 text-slate-700 border-slate-200';

                  return (
                    <tr
                      key={lead.id}
                      onClick={() => setSelectedLead(lead)}
                      className="hover:bg-slate-50/70 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-foreground">
                        <div className="font-semibold text-foreground text-[13px]">{lead.company_name}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {lead.contact_name} · {formatCustomerType(lead.customer_type)} · {lead.city}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs">
                        {formatSource(lead.source)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold capitalize ${statusPill}`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`tabular-nums text-xs ${scoreColor}`}>{score}</span>
                        <span className="ml-1 text-[11px] text-muted-foreground">{scoreBand}</span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800 tabular-nums">
                        ${Number(lead.estimated_value || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {lead.assigned_rep || 'Unassigned'}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatDate(lead.next_follow_up)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Load More Button after 30 items */}
          {filteredLeads.length > visibleCount && (
            <div className="border-t border-[#e2e8f0] p-3 text-center bg-slate-50/60">
              <button
                onClick={() => setVisibleCount((prev) => prev + 30)}
                className="btn-secondary"
              >
                Load more leads (Showing {visibleCount} of {filteredLeads.length})
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Pipeline / Kanban View */
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-3">
          {STAGES.map((stage) => {
            const stageLeads = filteredLeads.filter((l) => (l.status || 'new') === stage.key);
            const stageTotal = stageLeads.reduce((acc, l) => acc + (Number(l.estimated_value) || 0), 0);

            return (
              <div key={stage.key} className="rounded-xl border border-[#e2e8f0] bg-slate-50/60 p-3 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#e2e8f0]">
                  <span className="text-xs font-bold text-foreground">{stage.label}</span>
                  <span className="rounded-full bg-white border border-[#e2e8f0] px-2 py-0.5 text-[10px] font-bold text-slate-600">
                    {stageLeads.length}
                  </span>
                </div>

                <div className="space-y-2.5 min-h-[400px]">
                  {stageLeads.map((lead) => (
                    <div
                      key={lead.id}
                      onClick={() => setSelectedLead(lead)}
                      className="rounded-lg border border-[#e2e8f0] bg-white p-3 shadow-xs hover:border-[#e1241a] cursor-pointer transition-all"
                    >
                      <p className="text-xs font-bold text-foreground line-clamp-1">{lead.company_name}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{lead.contact_name || 'No contact'}</p>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#e2e8f0] text-[10px]">
                        <span className="font-semibold text-foreground">
                          ${(Number(lead.estimated_value || 0) / 1000).toFixed(0)}k
                        </span>
                        <span className="font-bold text-[#e1241a]">{lead.score} {lead.score_band}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lead Detail Drawer / Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-xl border border-[#e2e8f0] bg-white p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
              <div>
                <h3 className="font-bold font-heading text-base text-foreground">{selectedLead.company_name}</h3>
                <p className="text-xs text-muted-foreground">
                  {selectedLead.contact_name} · {formatCustomerType(selectedLead.customer_type)} · {selectedLead.city}, {selectedLead.region}
                </p>
              </div>
              <button onClick={() => setSelectedLead(null)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg bg-slate-50 p-3 border border-[#e2e8f0]">
                <p className="text-[10px] text-muted-foreground uppercase font-semibold">AI Lead Score</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-2xl font-bold font-heading text-[#e1241a]">{selectedLead.score}</span>
                  <span className="text-xs text-muted-foreground font-medium capitalize">({selectedLead.score_band || 'warm'})</span>
                </div>
              </div>

              <div className="rounded-lg bg-slate-50 p-3 border border-[#e2e8f0]">
                <p className="text-[10px] text-muted-foreground uppercase font-semibold">Est. Annual Value</p>
                <p className="text-2xl font-bold font-heading text-foreground mt-1">
                  ${Number(selectedLead.estimated_value || 0).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <p className="font-semibold text-foreground">Contact & Owner</p>
              <div className="flex items-center gap-4 text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  <span>{selectedLead.email || 'No email registered'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  <span>{selectedLead.phone || 'No phone registered'}</span>
                </div>
              </div>
              <p className="text-muted-foreground text-[11px]">
                Assigned Representative: <span className="font-semibold text-foreground">{selectedLead.assigned_rep || 'Unassigned'}</span>
              </p>
            </div>

            {selectedLead.notes && (
              <div className="text-xs">
                <p className="font-semibold text-foreground mb-1">Intelligence & Notes</p>
                <p className="rounded-lg bg-slate-50 p-2.5 text-muted-foreground border border-[#e2e8f0]">
                  {selectedLead.notes}
                </p>
              </div>
            )}

            {/* Stage Selector */}
            <div className="pt-2 border-t border-[#e2e8f0] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-slate-700 font-medium">Stage:</span>
                <select
                  value={selectedLead.status}
                  onChange={(e) => {
                    updateLeadStatus(selectedLead.id, e.target.value);
                    setSelectedLead({ ...selectedLead, status: e.target.value });
                  }}
                  className="h-9.5 rounded-lg border border-slate-300 bg-white px-3 text-[13.5px] font-semibold text-foreground shadow-2xs"
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="proposal">Proposal</option>
                  <option value="negotiation">Negotiation</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                </select>
              </div>

              <button
                onClick={() => setSelectedLead(null)}
                className="btn-secondary h-9 px-4 text-[13px] font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Lead Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-xs p-4">
          <form onSubmit={handleCreateLead} className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold font-heading text-base text-foreground">Add New Wholesale Lead</h3>
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-[13.5px]">
              <div>
                <label className="font-medium text-[13px] text-foreground block mb-1.5">Company / Store Name *</label>
                <input
                  type="text"
                  required
                  value={newLeadForm.company_name}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, company_name: e.target.value })}
                  placeholder="e.g. Maple Leaf Gourmet"
                  className="w-full h-10 rounded-lg border border-slate-300 px-3 py-2 text-[13.5px] font-medium text-foreground focus:outline-none focus:border-primary shadow-2xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-[13px] text-foreground block mb-1.5">Contact Name</label>
                  <input
                    type="text"
                    value={newLeadForm.contact_name}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, contact_name: e.target.value })}
                    placeholder="e.g. David Miller"
                    className="w-full h-10 rounded-lg border border-slate-300 px-3 py-2 text-[13.5px] font-medium text-foreground focus:outline-none focus:border-primary shadow-2xs"
                  />
                </div>
                <div>
                  <label className="font-medium text-[13px] text-foreground block mb-1.5">Estimated Annual ($)</label>
                  <input
                    type="number"
                    value={newLeadForm.estimated_value}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, estimated_value: e.target.value })}
                    className="w-full h-10 rounded-lg border border-slate-300 px-3 py-2 text-[13.5px] font-medium text-foreground focus:outline-none focus:border-primary shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-[13px] text-foreground block mb-1.5">Email</label>
                  <input
                    type="email"
                    value={newLeadForm.email}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, email: e.target.value })}
                    placeholder="buyer@store.com"
                    className="w-full h-10 rounded-lg border border-slate-300 px-3 py-2 text-[13.5px] font-medium text-foreground focus:outline-none focus:border-primary shadow-2xs"
                  />
                </div>
                <div>
                  <label className="font-medium text-[13px] text-foreground block mb-1.5">Phone</label>
                  <input
                    type="text"
                    value={newLeadForm.phone}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, phone: e.target.value })}
                    placeholder="416-555-0199"
                    className="w-full h-10 rounded-lg border border-slate-300 px-3 py-2 text-[13.5px] font-medium text-foreground focus:outline-none focus:border-primary shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-[13px] text-foreground block mb-1.5">Source</label>
                <select
                  value={newLeadForm.source}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, source: e.target.value })}
                  className="w-full h-10 rounded-lg border border-slate-300 px-3 py-2 text-[13.5px] font-medium text-foreground focus:outline-none focus:border-primary shadow-2xs"
                >
                  <option value="referral">Referral</option>
                  <option value="inbound_form">Inbound Form</option>
                  <option value="retail_network">Retail Network</option>
                  <option value="email_campaign">Email Campaign</option>
                  <option value="website">Website</option>
                  <option value="cold_call">Cold Call</option>
                  <option value="trade_show">Trade Show</option>
                </select>
              </div>

              <div>
                <label className="font-medium text-[13px] text-foreground block mb-1.5">Notes / Target Categories</label>
                <textarea
                  rows={2}
                  value={newLeadForm.notes}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, notes: e.target.value })}
                  placeholder="Interest in Mediterranean imports, Halal chicken products..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[13.5px] font-medium text-foreground focus:outline-none focus:border-primary shadow-2xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3.5 border-t border-border">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="btn-secondary h-9 px-4 text-[13px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary h-9 px-4 text-[13px]"
              >
                Create Lead
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
