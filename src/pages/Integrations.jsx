import React, { useState } from 'react';
import {
  Globe,
  RefreshCw,
  Info,
  Layers,
  Clock,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Lock,
  X,
  Check,
  ChevronRight,
  Link2,
  Send,
  SlidersHorizontal,
  Server
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Integrations() {
  const { entities, setEntities, showToast } = useApp();

  // Integrations configs
  const [configs, setConfigs] = useState(() => entities.IntegrationConfig || []);

  // Testing connection state
  const [testingId, setTestingId] = useState(null);
  // Credentials modal state
  const [editingConfig, setEditingConfig] = useState(null);
  const [credForm, setCredForm] = useState({
    apiKey: '',
    apiSecret: '',
    endpoint: ''
  });

  // Sync History log state
  const [syncHistory, setSyncHistory] = useState([
    {
      id: 'sync_1',
      when: 'Oct 13, 2026',
      connection: 'Maple Mart storefront',
      action: 'Integration.Tested',
      detail: 'Mock adapter connection test completed. No live data was transferred.',
      severity: 'Info'
    }
  ]);

  // Separate storefront connections from internal systems
  const storefrontConfigs = configs.filter((c) => c.integration_type === 'ecommerce_website');
  
  // Specific order for internal systems matching screenshot:
  // 1. Accounting and receivables (QuickBooks)
  // 2. Platform AI service (Built-in)
  // 3. Price list workbook (CSV / Sheets)
  // 4. Shipping and delivery (API)
  // 5. Transactional email (SMTP / API)
  // 6. Warehouse management system (REST API)
  const internalOrder = [
    'Accounting and receivables',
    'Platform AI service',
    'Price list workbook',
    'Shipping and delivery',
    'Transactional email',
    'Warehouse management system'
  ];

  const internalConfigs = [...configs.filter((c) => c.integration_type !== 'ecommerce_website')].sort((a, b) => {
    const idxA = internalOrder.indexOf(a.name);
    const idxB = internalOrder.indexOf(b.name);
    return (idxA !== -1 ? idxA : 99) - (idxB !== -1 ? idxB : 99);
  });

  // Test connection handler
  const handleTestConnection = (cfg) => {
    setTestingId(cfg.id);
    setTimeout(() => {
      setTestingId(null);
      const nowStr = 'Oct 14, 2026';
      
      // Update config last_sync
      setConfigs((prev) =>
        prev.map((c) => (c.id === cfg.id ? { ...c, last_sync: '2026-10-14' } : c))
      );

      // Add to sync history
      const newHistoryItem = {
        id: 'sync_' + Date.now(),
        when: nowStr,
        connection: cfg.name,
        action: 'Integration.Tested',
        detail: `Connection test successful for ${cfg.platform}. Response latency: 142ms. Mock sandbox verified.`,
        severity: 'Info'
      };
      setSyncHistory((prev) => [newHistoryItem, ...prev]);

      showToast({
        title: 'Connection Test Succeeded',
        description: `Successfully reached ${cfg.name} (${cfg.platform}). Mock sandbox verified.`
      });
    }, 900);
  };

  // Refresh status handler
  const handleRefreshStatus = () => {
    showToast({
      title: 'Status Refreshed',
      description: 'Checked adapter heartbeat across all 9 integrations. Mock adapters active.'
    });
  };

  // Open credentials modal
  const handleOpenCredentials = (cfg) => {
    setEditingConfig(cfg);
    setCredForm({
      apiKey: cfg.auth_type?.includes('OAuth') ? 'oauth_client_id_polmarex_prod' : 'pk_live_51Mzk0...89x',
      apiSecret: '••••••••••••••••••••••••••••••••',
      endpoint: cfg.base_url || 'https://api.internal-hub.polmarex.ca/v1'
    });
  };

  // Save credentials
  const handleSaveCredentials = (e) => {
    e.preventDefault();
    if (!editingConfig) return;

    setConfigs((prev) =>
      prev.map((c) =>
        c.id === editingConfig.id
          ? {
              ...c,
              error_message: '',
              status: c.status === 'disconnected' ? 'connected' : c.status
            }
          : c
      )
    );

    showToast({
      title: 'Credentials Saved',
      description: `Authentication keys updated for ${editingConfig.name}. Connection authorized.`
    });

    setEditingConfig(null);
  };

  return (
    <div className="space-y-6">
      {/* Page Header matching screenshot */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground tracking-tight">Integrations</h1>
          <p className="text-[13.5px] text-slate-700 mt-1 max-w-3xl font-normal leading-relaxed">
            Connections for all companies across the three storefronts and internal business systems. Live synchronization, SKU mapping, and customer identity rules.
          </p>
        </div>

        {/* Top-Right Buttons */}
        <div className="flex items-center gap-2 self-start shrink-0">
          <div className="px-3 py-1.5 rounded-lg border border-border bg-card text-muted-foreground text-xs font-normal shadow-2xs">
            Mock adapters active
          </div>

          <button
            onClick={handleRefreshStatus}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted/50 text-foreground text-xs font-medium shadow-2xs transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-foreground" />
            <span>Refresh status</span>
          </button>
        </div>
      </div>

      {/* Amber Notice Banner matching screenshot */}
      <div className="rounded-xl border border-amber-200/90 bg-amber-50/60 p-3.5 text-xs text-amber-900 leading-relaxed flex items-start gap-2.5">
        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <span>
          Each website is a separate system with its own database. Nothing is shared automatically between Premier Polmarex, Maple Mart and Nutro Gusto: each needs its own authenticated connection, and matching rules (SKU mapping, customer identity) before any sync runs.
        </span>
      </div>

      {/* Section 1: Storefront connections */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Globe className="w-4 h-4 text-[#e1241a]" />
          <span>Storefront connections</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {storefrontConfigs.map((cfg) => {
            const isTesting = testingId === cfg.id;

            return (
              <div
                key={cfg.id}
                className="rounded-xl border border-border bg-card p-4 shadow-2xs flex flex-col justify-between space-y-3.5"
              >
                <div className="space-y-2.5">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-red-50 text-[#e1241a] flex items-center justify-center border border-red-100 shrink-0">
                        <Link2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-foreground leading-snug">{cfg.name}</h3>
                        <p className="text-[11px] text-muted-foreground">{cfg.platform}</p>
                      </div>
                    </div>

                    <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium border border-blue-200 bg-blue-50 text-blue-700">
                      Mock Adapter
                    </span>
                  </div>

                  {/* URL */}
                  {cfg.base_url && (
                    <div className="text-[11px] text-muted-foreground font-mono">
                      {cfg.base_url}
                    </div>
                  )}

                  {/* Bullet details */}
                  <div className="space-y-1 text-[11px] text-muted-foreground pt-1">
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span>Syncs: {(cfg.entities_synced || []).join(', ')}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span>
                        {cfg.sync_frequency} · last {cfg.last_sync ? 'Oct 13, 2026' : 'never'} · next {cfg.next_sync ? 'Oct 14, 2026' : '—'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span>Auth: {cfg.auth_type}</span>
                    </div>
                  </div>

                  {/* Warning Box if error_message */}
                  {cfg.error_message && (
                    <div className="rounded-lg bg-amber-50/70 border border-amber-200 p-2 text-[11px] text-amber-800 leading-snug">
                      {cfg.error_message}
                    </div>
                  )}

                  {/* Notes */}
                  {cfg.notes && (
                    <p className="text-[11px] text-muted-foreground leading-relaxed pt-1">
                      {cfg.notes}
                    </p>
                  )}
                </div>

                {/* Card Actions */}
                <div className="pt-2 flex items-center justify-between gap-2">
                  {cfg.credentials_required ? (
                    <button
                      onClick={() => handleOpenCredentials(cfg)}
                      className="btn-table"
                    >
                      Credentials required
                    </button>
                  ) : (
                    <div />
                  )}

                  <button
                    onClick={() => handleTestConnection(cfg)}
                    disabled={isTesting}
                    className="btn-table disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 text-muted-foreground ${isTesting ? 'animate-spin text-primary' : ''}`} />
                    <span>{isTesting ? 'Testing…' : 'Test connection'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Internal systems */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Info className="w-4 h-4 text-[#e1241a]" />
          <span>Internal systems</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {internalConfigs.map((cfg) => {
            const isTesting = testingId === cfg.id;
            const isConnected = cfg.status === 'connected';
            const isMock = cfg.status === 'mock_adapter';
            const isDisconnected = cfg.status === 'disconnected';

            return (
              <div
                key={cfg.id}
                className="rounded-xl border border-border bg-card p-4 shadow-2xs flex flex-col justify-between space-y-3.5"
              >
                <div className="space-y-2.5">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-red-50 text-[#e1241a] flex items-center justify-center border border-red-100 shrink-0">
                        <Link2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-foreground leading-snug">{cfg.name}</h3>
                        <p className="text-[11px] text-muted-foreground">{cfg.platform}</p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    {isConnected ? (
                      <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium border border-emerald-200 bg-emerald-50 text-emerald-700">
                        Connected
                      </span>
                    ) : isMock ? (
                      <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium border border-blue-200 bg-blue-50 text-blue-700">
                        Mock Adapter
                      </span>
                    ) : (
                      <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium border border-slate-200 bg-slate-50 text-slate-600">
                        Disconnected
                      </span>
                    )}
                  </div>

                  {/* Bullet details */}
                  <div className="space-y-1 text-[11px] text-muted-foreground pt-1">
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span>Syncs: {(cfg.entities_synced || []).join(', ')}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span>
                        {cfg.sync_frequency} · last {cfg.last_sync ? 'Oct 13, 2026' : 'never'} · next {cfg.next_sync ? 'Oct 14, 2026' : '—'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span>Auth: {cfg.auth_type}</span>
                    </div>
                  </div>

                  {/* Error / Alert box */}
                  {cfg.error_message && (
                    <div className="rounded-lg bg-amber-50/70 border border-amber-200 p-2 text-[11px] text-amber-800 leading-snug">
                      {cfg.error_message}
                    </div>
                  )}

                  {/* Notes */}
                  {cfg.notes && (
                    <p className="text-[11px] text-muted-foreground leading-relaxed pt-1">
                      {cfg.notes}
                    </p>
                  )}
                </div>

                {/* Card Actions */}
                <div className="pt-2 flex items-center justify-between gap-2">
                  {cfg.credentials_required ? (
                    <button
                      onClick={() => handleOpenCredentials(cfg)}
                      className="btn-table"
                    >
                      Credentials required
                    </button>
                  ) : (
                    <div />
                  )}

                  <button
                    onClick={() => handleTestConnection(cfg)}
                    disabled={isTesting}
                    className="btn-table disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 text-muted-foreground ${isTesting ? 'animate-spin text-primary' : ''}`} />
                    <span>{isTesting ? 'Testing…' : 'Test connection'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 3: What we found on your websites */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-2xs space-y-3.5">
        <div>
          <h2 className="text-xs font-bold text-foreground">What we found on your websites</h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Assessed from the public storefronts. This is what a production integration would need from each platform.
          </p>
        </div>

        <div className="space-y-3">
          {/* Premier Polmarex */}
          <div className="rounded-lg border border-border bg-muted/15 p-3 space-y-1.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground text-xs">premierpolmarex.ca</span>
              <span className="px-2 py-0.2 rounded-md text-[10px] font-medium border border-border bg-card text-muted-foreground">
                WordPress + WooCommerce
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              The storefront runs WooCommerce with customer accounts (my-account, register) and a shop archive, so products, customers and orders can be read through the WooCommerce REST API once keys are generated. Order and stock writes need to be enabled explicitly on the API key.
            </p>
            <p className="text-[11px] font-semibold text-foreground">
              Needed: <span className="font-normal text-muted-foreground">Consumer key + secret with read (and optionally write) scope</span>
            </p>
          </div>

          {/* Maple Mart */}
          <div className="rounded-lg border border-border bg-muted/15 p-3 space-y-1.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground text-xs">maplemart.com</span>
              <span className="px-2 py-0.2 rounded-md text-[10px] font-medium border border-border bg-card text-muted-foreground">
                WordPress + WooCommerce
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Also WooCommerce, with the same product/order structure and additional promotional pricing. API access depends on the hosting configuration permitting REST access.
            </p>
            <p className="text-[11px] font-semibold text-foreground">
              Needed: <span className="font-normal text-muted-foreground">Consumer key + secret; confirm REST access is not blocked at the host</span>
            </p>
          </div>

          {/* Nutro Gusto */}
          <div className="rounded-lg border border-border bg-muted/15 p-3 space-y-1.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground text-xs">nutrogusto.com</span>
              <span className="px-2 py-0.2 rounded-md text-[10px] font-medium border border-border bg-card text-muted-foreground">
                Shopify
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              A Shopify storefront with collections, bundles and its own customer accounts. The Shopify Admin API covers products, customers, orders and inventory levels through a custom app.
            </p>
            <p className="text-[11px] font-semibold text-foreground">
              Needed: <span className="font-normal text-muted-foreground">Custom app with Admin API access token and the relevant read scopes</span>
            </p>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground leading-relaxed pt-1">
          Supported data: products, customers, orders and stock levels where the platform exposes them and you authorise access. Nothing is scraped, and no customer data is copied until you approve the connection and the mapping rules.
        </p>
      </div>

      {/* Section 4: Sync history */}
      <div className="rounded-xl border border-border bg-card shadow-2xs overflow-hidden">
        <div className="p-3.5 border-b border-border flex items-center gap-2 text-xs font-semibold text-foreground">
          <RefreshCw className="w-3.5 h-3.5 text-[#e1241a]" />
          <span>Sync history</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-muted/20 text-muted-foreground text-[11px] font-medium">
              <tr>
                <th className="px-4 py-2.5 font-medium">When</th>
                <th className="px-4 py-2.5 font-medium">Connection</th>
                <th className="px-4 py-2.5 font-medium">Action</th>
                <th className="px-4 py-2.5 font-medium">Detail</th>
                <th className="px-4 py-2.5 font-medium">Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {syncHistory.map((item) => (
                <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{item.when}</td>
                  <td className="px-4 py-3 font-semibold text-foreground whitespace-nowrap">{item.connection}</td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-[11px] whitespace-nowrap">{item.action}</td>
                  <td className="px-4 py-3 text-muted-foreground">{item.detail}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-medium border border-blue-200 bg-blue-50 text-blue-700">
                      {item.severity}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Credentials Configuration Modal */}
      {editingConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Configure Credentials</h3>
              </div>
              <button
                onClick={() => setEditingConfig(null)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCredentials} className="p-5 space-y-4 text-[13.5px]">
              <div>
                <label className="block text-[13px] font-medium text-muted-foreground mb-1.5">
                  Adapter / System
                </label>
                <input
                  type="text"
                  disabled
                  value={`${editingConfig.name} (${editingConfig.platform})`}
                  className="w-full h-10 rounded-lg border border-slate-300 bg-muted/40 px-3 py-2 text-[13.5px] font-medium text-foreground cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-foreground mb-1.5">
                  API Key / Client ID
                </label>
                <input
                  type="text"
                  required
                  value={credForm.apiKey}
                  onChange={(e) => setCredForm((prev) => ({ ...prev, apiKey: e.target.value }))}
                  placeholder="e.g. ck_xxxxxxxxxxxx"
                  className="w-full h-10 rounded-lg border border-slate-300 bg-card px-3 py-2 text-[13.5px] font-medium text-foreground focus:outline-none focus:border-primary shadow-2xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-foreground mb-1.5">
                  API Secret / Access Token
                </label>
                <input
                  type="password"
                  required
                  value={credForm.apiSecret}
                  onChange={(e) => setCredForm((prev) => ({ ...prev, apiSecret: e.target.value }))}
                  placeholder="e.g. cs_xxxxxxxxxxxx"
                  className="w-full h-10 rounded-lg border border-slate-300 bg-card px-3 py-2 text-[13.5px] font-medium text-foreground focus:outline-none focus:border-primary shadow-2xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-foreground mb-1.5">
                  Endpoint URL
                </label>
                <input
                  type="url"
                  value={credForm.endpoint}
                  onChange={(e) => setCredForm((prev) => ({ ...prev, endpoint: e.target.value }))}
                  placeholder="https://..."
                  className="w-full h-10 rounded-lg border border-slate-300 bg-card px-3 py-2 text-[13.5px] font-medium text-foreground focus:outline-none focus:border-primary shadow-2xs font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditingConfig(null)}
                  className="btn-secondary h-8 px-3 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary h-8 px-3.5 text-xs font-semibold"
                >
                  <Check className="w-3.5 h-3.5" />
                  Save Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
