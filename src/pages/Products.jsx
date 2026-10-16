import React, { useState, useMemo, useEffect } from 'react';
import {
  Package,
  Search,
  SlidersHorizontal,
  DollarSign,
  TrendingUp,
  Tag,
  Building2,
  Boxes,
  Layers,
  ChevronRight,
  X,
  Sparkles,
  ArrowUpDown,
  Barcode,
  Truck,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Download,
  Plus,
  Check,
  Thermometer,
  Snowflake,
  Sun,
  Printer,
  Scale,
  Calendar,
  BadgeCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../api/apiClient';

export default function Products() {
  const { company, companyLabel, periodLabel, cutoffDate, entities, exportCSV, showToast } = useApp();

  const [selectedBrand, setSelectedBrand] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [movementFilter, setMovementFilter] = useState('all');
  const [storageTempFilter, setStorageTempFilter] = useState('all');
  const [visibleCount, setVisibleCount] = useState(30);

  // Selected product for detail drawer & Sell Sheet modal
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [sellSheetProduct, setSellSheetProduct] = useState(null);

  // Add Product Modal state
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [newProductForm, setNewProductForm] = useState({
    sku: '',
    name: '',
    brand: 'Premier Polmarex',
    category: 'Snacks',
    pack_size: '12 × 500g',
    cost_price: 3.5,
    selling_price: 6.99,
    movement_class: 'fast',
    storage_temp: 'ambient',
    case_weight_kg: 4.8,
    pallet_ti: 10,
    pallet_hi: 8,
    country_of_origin: 'Poland',
    barcode: '590' + Math.floor(1000000000 + Math.random() * 9000000000)
  });

  const allProducts = entities.Product || [];
  const allBrands = entities.Brand || [];
  const allOrderItems = entities.OrderItem || [];
  const allInventory = entities.InventoryRecord || [];

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const created = await api.createProduct({
        ...newProductForm,
        business_unit: company === 'all' ? 'PRM' : company,
        cost_price: Number(newProductForm.cost_price),
        selling_price: Number(newProductForm.selling_price),
        case_weight_kg: Number(newProductForm.case_weight_kg) || 4.8,
        pallet_ti: Number(newProductForm.pallet_ti) || 10,
        pallet_hi: Number(newProductForm.pallet_hi) || 8
      });
      // Update local entities
      allProducts.unshift(created);
      setIsAddProductOpen(false);
      showToast({
        title: 'Product Added to Catalogue',
        description: `${created.name} (${created.sku}) created and synced with backend.`
      });
      setNewProductForm({
        sku: '',
        name: '',
        brand: 'Premier Polmarex',
        category: 'Snacks',
        pack_size: '12 × 500g',
        cost_price: 3.5,
        selling_price: 6.99,
        movement_class: 'fast',
        storage_temp: 'ambient',
        case_weight_kg: 4.8,
        pallet_ti: 10,
        pallet_hi: 8,
        country_of_origin: 'Poland',
        barcode: '590' + Math.floor(1000000000 + Math.random() * 9000000000)
      });
    } catch (err) {
      showToast({
        title: 'Failed to Add Product',
        description: err.message,
        variant: 'destructive'
      });
    }
  };

  // Reset pagination on filter change
  useEffect(() => {
    setVisibleCount(30);
  }, [selectedBrand, searchTerm, categoryFilter, movementFilter, company]);

  // Company scoped products
  const scopedProducts = useMemo(() => {
    return allProducts.filter((p) => {
      if (company !== 'all' && p.business_unit && p.business_unit !== company) return false;
      return true;
    });
  }, [allProducts, company]);

  // Stock availability map by SKU
  const stockMap = useMemo(() => {
    const map = {};
    allInventory.forEach((inv) => {
      const sku = inv.sku;
      if (sku) {
        const avail = inv.available !== undefined ? Number(inv.available) : Number(inv.on_hand) || 0;
        map[sku] = (map[sku] || 0) + avail;
      }
    });
    return map;
  }, [allInventory]);

  // Revenue by brand in period
  const brandRevenueMap = useMemo(() => {
    const map = {};
    allOrderItems.forEach((item) => {
      if (company !== 'all' && item.business_unit && item.business_unit !== company) return false;
      if (cutoffDate && item.order_date && item.order_date < cutoffDate) return false;
      const b = item.brand;
      if (b) {
        map[b] = (map[b] || 0) + (Number(item.line_total) || 0);
      }
    });
    return map;
  }, [allOrderItems, company, cutoffDate]);

  // Brand Cards Data
  const brandCardsData = useMemo(() => {
    return allBrands
      .filter((b) => {
        if (company !== 'all' && b.business_unit && b.business_unit !== company) return false;
        return true;
      })
      .map((b) => {
        const brandProducts = scopedProducts.filter((p) => p.brand === b.name);
        const revenue = brandRevenueMap[b.name] || 0;

        return {
          id: b.id,
          name: b.name,
          category: b.category || 'General',
          business_unit: b.business_unit || 'PRM',
          skuCount: brandProducts.length,
          revenue
        };
      })
      .sort((a, b) => b.revenue - a.revenue);
  }, [allBrands, scopedProducts, brandRevenueMap, company]);

  // Official categories from premierpolmarex.ca/categories/
  const OFFICIAL_CATEGORIES = useMemo(() => [
    'All',
    'Snacks',
    'Sweets & Confectionery',
    'Beverages',
    'Preserved Vegetables & Fruits',
    'Sugar & Spices',
    'Condiments',
    'Frozen',
    'Breakfast',
    'Rice, Grains & Pasta',
    'Personal Care'
  ], []);

  // Category counts map
  const categoryCounts = useMemo(() => {
    const counts = { All: scopedProducts.length };
    scopedProducts.forEach((p) => {
      if (p.category) {
        counts[p.category] = (counts[p.category] || 0) + 1;
      }
    });
    return counts;
  }, [scopedProducts]);

  // Unique categories for filter dropdown
  const uniqueCategories = useMemo(() => {
    return Array.from(new Set(scopedProducts.map((p) => p.category).filter(Boolean))).sort();
  }, [scopedProducts]);

  // Logistics & Cold-Chain Helper
  const getStorageTemp = (p) => {
    if (p.storage_temp) return p.storage_temp;
    const cat = (p.category || '').toLowerCase();
    const name = (p.name || '').toLowerCase();
    if (cat.includes('frozen') || name.includes('frozen') || name.includes('ice cream')) return 'frozen';
    if (cat.includes('personal') || name.includes('fresh') || name.includes('cheese') || name.includes('butter')) return 'chilled';
    return 'ambient';
  };

  const getLogisticsSpecs = (p) => {
    const temp = getStorageTemp(p);
    let units = 12;
    if (p.pack_size) {
      const match = p.pack_size.match(/^(\d+)/);
      if (match) units = parseInt(match[1], 10);
    }
    const caseWeight = p.case_weight_kg || (units * 0.45).toFixed(1);
    const ti = p.pallet_ti || (units > 12 ? 8 : 10);
    const hi = p.pallet_hi || 8;
    const totalCases = ti * hi;
    const palletGrossWeight = Math.round(totalCases * Number(caseWeight)) + 25;
    const lotNumber = p.lot_number || `LOT-2026-${(p.sku || 'PRM').replace(/[^0-9]/g, '').slice(-3) || '108'}`;
    const bestBefore = p.best_before || '2027-06-30';
    const origin = p.country_of_origin || (p.brand === 'Nutro Gusto' ? 'Canada' : 'Poland');

    return {
      temp,
      units,
      caseWeight,
      ti,
      hi,
      totalCases,
      palletGrossWeight,
      lotNumber,
      bestBefore,
      origin
    };
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return scopedProducts.filter((p) => {
      if (selectedBrand !== 'all' && p.brand !== selectedBrand) return false;
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
      if (movementFilter !== 'all' && p.movement_class !== movementFilter) return false;
      if (storageTempFilter !== 'all' && getStorageTemp(p) !== storageTempFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = p.name?.toLowerCase().includes(q);
        const matchSku = p.sku?.toLowerCase().includes(q);
        const matchBrand = p.brand?.toLowerCase().includes(q);
        const matchCategory = p.category?.toLowerCase().includes(q);
        const matchSupplier = p.supplier?.toLowerCase().includes(q);
        if (!matchName && !matchSku && !matchBrand && !matchCategory && !matchSupplier) return false;
      }
      return true;
    });
  }, [scopedProducts, selectedBrand, categoryFilter, movementFilter, storageTempFilter, searchTerm]);

  // Visible Products (30 items initially)
  const displayedProducts = useMemo(() => {
    return filteredProducts.slice(0, visibleCount);
  }, [filteredProducts, visibleCount]);

  function formatCurrency(val) {
    if (val === null || val === undefined) return '$0.00';
    return `$${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function formatCompactCurrency(val) {
    const num = Number(val) || 0;
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(1)}K`;
    if (num > 0) return `$${Math.round(num)}`;
    return '$0';
  }

  const hasActiveFilters =
    selectedBrand !== 'all' ||
    categoryFilter !== 'all' ||
    movementFilter !== 'all' ||
    storageTempFilter !== 'all' ||
    searchTerm.trim() !== '';

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground">Brands & products</h1>
          <p className="text-[13.5px] text-slate-700 mt-1 max-w-3xl font-normal leading-relaxed">
            Catalogue, pricing and margin for {companyLabel.toLowerCase()}. Stock levels come from the inventory records; revenue is {periodLabel.toLowerCase()}.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => exportCSV('products')}
            className="btn-secondary h-9.5 px-3.5 text-[13px] font-medium"
            title="Download product catalogue CSV from backend"
          >
            <Download className="h-4 w-4 text-muted-foreground" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setIsAddProductOpen(true)}
            className="btn-primary h-9.5 px-3.5 text-[13px] font-medium"
          >
            <Plus className="h-4 w-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Top 4-Column Brands Grid Matching Screenshot */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
        {/* All brands Card */}
        <div
          onClick={() => setSelectedBrand('all')}
          className={`rounded-xl border p-4 shadow-sm cursor-pointer transition-all ${
            selectedBrand === 'all'
              ? 'border-primary bg-primary/5 ring-1 ring-primary'
              : 'border-border bg-card hover:bg-muted/40'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="font-heading text-sm font-semibold text-foreground">All brands</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {brandCardsData.length} brands in this selection
              </p>
            </div>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-[#e1241a]">
              <Package className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>

        {/* Individual Brand Cards */}
        {brandCardsData.map((b) => {
          const isSelected = selectedBrand === b.name;

          return (
            <div
              key={b.id || b.name}
              onClick={() => setSelectedBrand(isSelected ? 'all' : b.name)}
              className={`rounded-xl border p-4 shadow-sm cursor-pointer transition-all ${
                isSelected
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'border-border bg-card hover:bg-muted/40'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-heading text-sm font-semibold text-foreground">{b.name}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {b.category} · {b.business_unit}
                  </p>
                </div>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-[#e1241a]">
                  <Boxes className="h-3.5 w-3.5" />
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-[11px] text-muted-foreground">{b.skuCount} SKUs</span>
                <span className="font-semibold text-foreground">{formatCompactCurrency(b.revenue)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Official Categories Bar matching premierpolmarex.ca/categories/ */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Tag className="h-3.5 w-3.5 text-[#e1241a]" />
            Official Categories (premierpolmarex.ca/categories/)
          </span>
          <span className="text-[11px] text-muted-foreground">
            {OFFICIAL_CATEGORIES.length - 1} catalogue categories
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scroll-smooth no-scrollbar scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {OFFICIAL_CATEGORIES.map((cat) => {
            const isSelected = (cat === 'All' && categoryFilter === 'all') || categoryFilter === cat;
            const count = categoryCounts[cat] || 0;
            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat === 'All' ? 'all' : cat)}
                className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 ${
                  isSelected
                    ? 'bg-[#e1241a] text-white shadow-2xs font-semibold'
                    : 'bg-card border border-[#e2e8f0] text-muted-foreground hover:bg-muted hover:text-foreground shadow-2xs'
                }`}
              >
                <span>{cat}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters Toolbar Matching Base44 */}
      <div className="filter-bar-base44">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground shrink-0">
          <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Filters</span>
        </div>

        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          {/* Search product or SKU */}
          <div className="relative min-w-[200px] flex-1 max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search product or SKU…"
              className="h-9.5 w-full rounded-lg border border-slate-300 bg-white pl-9.5 pr-3 text-[13px] font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[#e1241a] focus:border-[#e1241a] shadow-2xs"
            />
          </div>

          {/* Category Filter */}
          <div className="w-44">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-9.5 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-[13px] font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-[#e1241a] focus:border-[#e1241a] shadow-2xs"
            >
              <option value="all">Category (All)</option>
              {uniqueCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Movement Class Filter */}
          <div className="w-36">
            <select
              value={movementFilter}
              onChange={(e) => setMovementFilter(e.target.value)}
              className="h-9.5 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-[13px] font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-[#e1241a] focus:border-[#e1241a] shadow-2xs"
            >
              <option value="all">Movement (All)</option>
              <option value="fast">Fast (Class A)</option>
              <option value="medium">Medium (Class B)</option>
              <option value="slow">Slow (Class C)</option>
            </select>
          </div>

          {/* Cold-Chain / Storage Temp Filter */}
          <div className="w-44">
            <select
              value={storageTempFilter}
              onChange={(e) => setStorageTempFilter(e.target.value)}
              className="h-9.5 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-[13px] font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-[#e1241a] focus:border-[#e1241a] shadow-2xs"
            >
              <option value="all">Storage Temp (All)</option>
              <option value="ambient">Ambient / Dry Storage</option>
              <option value="chilled">Chilled (+2°C to +4°C)</option>
              <option value="frozen">Deep Frozen (-18°C)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center rounded-full border border-slate-200/80 bg-slate-100 px-2.5 py-0.5 text-xs font-normal text-slate-600">
            {filteredProducts.length} records
          </span>
          {hasActiveFilters && (
            <button
              onClick={() => {
                setSelectedBrand('all');
                setCategoryFilter('all');
                setMovementFilter('all');
                setStorageTempFilter('all');
                setSearchTerm('');
              }}
              className="btn-secondary h-8 px-2.5 text-xs font-medium"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Products Directory Table Matching Screenshot */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm font-medium text-foreground">No products match these filters</p>
            <p className="text-xs text-muted-foreground mt-1">
              Try selecting a different brand, category or adjusting your search term.
            </p>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="py-3 px-4 font-semibold text-muted-foreground">Product</th>
                    <th className="py-3 px-3 font-semibold text-muted-foreground">Brand</th>
                    <th className="py-3 px-3 font-semibold text-muted-foreground">Category</th>
                    <th className="py-3 px-3 font-semibold text-muted-foreground">Cold-Chain</th>
                    <th className="py-3 px-3 font-semibold text-muted-foreground">Pack & Pallet</th>
                    <th className="py-3 px-3 font-semibold text-muted-foreground text-right">Cost</th>
                    <th className="py-3 px-3 font-semibold text-muted-foreground text-right">Selling</th>
                    <th className="py-3 px-3 font-semibold text-muted-foreground text-right">Margin</th>
                    <th className="py-3 px-3 font-semibold text-muted-foreground text-right">Available</th>
                    <th className="py-3 px-3 font-semibold text-muted-foreground">Movement</th>
                    <th className="py-3 px-4 font-semibold text-muted-foreground text-right">Wholesale Spec</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {displayedProducts.map((p) => {
                    const cost = Number(p.cost_price) || 0;
                    const selling = Number(p.selling_price) || 0;
                    const margin =
                      selling > 0 ? Math.round(((selling - cost) / selling) * 100) : 0;
                    const stock = stockMap[p.sku] !== undefined ? stockMap[p.sku] : 0;
                    const logistics = getLogisticsSpecs(p);

                    return (
                      <tr
                        key={p.id}
                        onClick={() => setSelectedProduct(p)}
                        className="cursor-pointer hover:bg-muted/40 transition-colors group"
                      >
                        {/* Product Name & Subtitle */}
                        <td className="py-3 px-4">
                          <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {p.name}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {p.sku} · {p.barcode || '0000000000000'} · {p.supplier || 'Polmarex Logistics'}
                          </p>
                        </td>

                        {/* Brand */}
                        <td className="py-3 px-3 text-foreground font-medium whitespace-nowrap">
                          {p.brand}
                        </td>

                        {/* Category */}
                        <td className="py-3 px-3 text-muted-foreground whitespace-nowrap">
                          {p.category}
                        </td>

                        {/* Cold-Chain Storage Badge */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          {logistics.temp === 'frozen' ? (
                            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              <Snowflake className="h-3 w-3" />
                              Frozen -18°C
                            </span>
                          ) : logistics.temp === 'chilled' ? (
                            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200">
                              <Thermometer className="h-3 w-3" />
                              Chilled +2°C
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                              <Sun className="h-3 w-3" />
                              Ambient Dry
                            </span>
                          )}
                        </td>

                        {/* Pack & Pallet Specs */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="font-medium text-foreground">{p.pack_size || '1 × unit'}</span>
                          <span className="block text-[10.5px] text-muted-foreground">
                            {logistics.ti}×{logistics.hi} ({logistics.totalCases} cs/pl)
                          </span>
                        </td>

                        {/* Cost */}
                        <td className="py-3 px-3 text-right tabular-nums text-muted-foreground">
                          {formatCurrency(cost)}
                        </td>

                        {/* Selling Price */}
                        <td className="py-3 px-3 text-right tabular-nums font-semibold text-foreground">
                          {formatCurrency(selling)}
                        </td>

                        {/* Margin % */}
                        <td className="py-3 px-3 text-right tabular-nums text-muted-foreground font-medium">
                          {margin}%
                        </td>

                        {/* Available Stock */}
                        <td className="py-3 px-3 text-right tabular-nums font-medium">
                          <span className={stock === 0 ? 'text-rose-600 font-bold' : 'text-foreground'}>
                            {Math.round(stock)}
                          </span>
                        </td>

                        {/* Movement Badge */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-medium capitalize ${
                              p.movement_class === 'fast'
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                : p.movement_class === 'slow'
                                ? 'border-amber-200 bg-amber-50 text-amber-700'
                                : 'border-border bg-muted/40 text-muted-foreground'
                            }`}
                          >
                            {p.movement_class || 'medium'}
                          </span>
                        </td>

                        {/* Sell Sheet Action */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSellSheetProduct(p);
                            }}
                            className="btn-secondary h-7 px-2.5 text-[11px] font-medium inline-flex items-center gap-1.5 shadow-2xs hover:border-[#e1241a] hover:text-[#e1241a] transition-all"
                            title="Generate and print wholesale sell sheet"
                          >
                            <Printer className="h-3 w-3" />
                            <span>Sell Sheet</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Load More Button after 30 items */}
            {filteredProducts.length > visibleCount && (
              <div className="border-t border-border p-3 text-center bg-muted/20">
                <button
                  onClick={() => setVisibleCount((prev) => prev + 30)}
                  className="btn-secondary h-8 px-4 text-xs font-semibold"
                >
                  Load more products (Showing {visibleCount} of {filteredProducts.length})
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Product Detail Drawer / Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="max-h-[90vh] max-w-2xl w-full rounded-xl border border-border bg-card p-6 shadow-2xl overflow-y-auto space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold font-heading text-foreground">
                    {selectedProduct.name}
                  </h2>
                  <span className="inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase">
                    {selectedProduct.business_unit}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  SKU: {selectedProduct.sku} · Barcode: {selectedProduct.barcode} · Brand: {selectedProduct.brand}
                </p>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-[11px] text-muted-foreground">Wholesale Selling</p>
                <p className="font-bold text-foreground text-base mt-0.5">{formatCurrency(selectedProduct.selling_price)}</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-[11px] text-muted-foreground">Unit Cost</p>
                <p className="font-bold text-foreground text-base mt-0.5">{formatCurrency(selectedProduct.cost_price)}</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-[11px] text-muted-foreground">Gross Margin</p>
                <p className="font-bold text-emerald-600 text-base mt-0.5">
                  {selectedProduct.selling_price > 0
                    ? `${Math.round(((selectedProduct.selling_price - selectedProduct.cost_price) / selectedProduct.selling_price) * 100)}%`
                    : '0%'}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-[11px] text-muted-foreground">Total Available</p>
                <p className="font-bold text-foreground text-base mt-0.5">{Math.round(stockMap[selectedProduct.sku] || 0)}</p>
              </div>
            </div>

            {/* Supply & Replenishment Parameters */}
            <div className="rounded-xl border border-border bg-card p-4 text-xs space-y-3">
              <p className="font-semibold uppercase tracking-wider text-muted-foreground text-[11px] flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5" />
                Supply & Replenishment Settings
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-muted-foreground">Primary Supplier:</span>
                  <p className="font-medium text-foreground mt-0.5">{selectedProduct.supplier || 'Direct Import'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Pack Configuration:</span>
                  <p className="font-medium text-foreground mt-0.5">{selectedProduct.pack_size || 'Standard Unit'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Lead Time:</span>
                  <p className="font-medium text-foreground mt-0.5">{selectedProduct.lead_time_days || 30} days</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Min Stock Level:</span>
                  <p className="font-medium text-foreground mt-0.5">{selectedProduct.min_stock || 50}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Reorder Point:</span>
                  <p className="font-medium text-foreground mt-0.5">{selectedProduct.reorder_point || 100}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Movement Class:</span>
                  <p className="font-medium text-foreground mt-0.5 uppercase">{selectedProduct.movement_class || 'Medium'}</p>
                </div>
              </div>
            </div>

            {/* Cold-Chain & Freight Logistics Card */}
            {(() => {
              const specs = getLogisticsSpecs(selectedProduct);
              return (
                <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 text-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold uppercase tracking-wider text-blue-900 text-[11px] flex items-center gap-1.5">
                      <Snowflake className="h-3.5 w-3.5 text-blue-600" />
                      Cold-Chain & Freight Logistics Specifications
                    </p>
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold bg-white border border-blue-200 text-blue-800">
                      <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" />
                      CFIA Safe Food Compliant
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <span className="text-muted-foreground">Storage Zone:</span>
                      <p className="font-bold text-slate-800 mt-0.5 capitalize">
                        {specs.temp === 'frozen'
                          ? 'Deep Frozen (-18°C)'
                          : specs.temp === 'chilled'
                          ? 'Chilled (+2°C to +4°C)'
                          : 'Ambient / Dry Storage'}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Pallet Pattern (Ti/Hi):</span>
                      <p className="font-bold text-slate-800 mt-0.5">
                        {specs.ti} Ti × {specs.hi} Hi ({specs.totalCases} cs/pl)
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Case Gross Weight:</span>
                      <p className="font-bold text-slate-800 mt-0.5">{specs.caseWeight} kg</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Pallet Gross Weight:</span>
                      <p className="font-bold text-slate-800 mt-0.5">{specs.palletGrossWeight} kg</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Batch Lot #:</span>
                      <p className="font-bold text-slate-800 mt-0.5 font-mono">{specs.lotNumber}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Best Before / Expiry:</span>
                      <p className="font-bold text-slate-800 mt-0.5">{specs.bestBefore}</p>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => {
                  setSellSheetProduct(selectedProduct);
                  setSelectedProduct(null);
                }}
                className="btn-primary h-9 px-4 text-[13px] font-semibold flex items-center gap-2 shadow-sm"
              >
                <Printer className="h-4 w-4" />
                <span>Print Wholesale Sell Sheet</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="btn-secondary h-9 px-4 text-[13px] font-semibold"
              >
                Close Catalogue Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-[#e1241a]">
                  <Package className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="font-bold font-heading text-base text-foreground">Add New Product</h3>
                  <p className="text-xs text-muted-foreground">Add official SKU into Premier Polmarex catalogue</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddProductOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-3.5 text-[13.5px]">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-medium text-foreground mb-1">SKU Code *</label>
                  <input
                    type="text"
                    required
                    value={newProductForm.sku}
                    onChange={(e) => setNewProductForm({ ...newProductForm, sku: e.target.value })}
                    placeholder="e.g. PRM-2045"
                    className="w-full h-10 rounded-lg border border-slate-300 bg-background px-3 py-2 text-[13.5px] font-medium focus:ring-1 focus:ring-primary focus:outline-none shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-foreground mb-1">Brand Name *</label>
                  <input
                    type="text"
                    required
                    value={newProductForm.brand}
                    onChange={(e) => setNewProductForm({ ...newProductForm, brand: e.target.value })}
                    placeholder="e.g. Premier Polmarex"
                    className="w-full h-10 rounded-lg border border-slate-300 bg-background px-3 py-2 text-[13.5px] font-medium focus:ring-1 focus:ring-primary focus:outline-none shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-foreground mb-1">Product Title / Description *</label>
                <input
                  type="text"
                  required
                  value={newProductForm.name}
                  onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })}
                  placeholder="e.g. Bio-Fix Chamomile Herbal Tea 50g"
                  className="w-full h-10 rounded-lg border border-slate-300 bg-background px-3 py-2 text-[13.5px] font-medium focus:ring-1 focus:ring-primary focus:outline-none shadow-2xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-medium text-foreground mb-1">Official Category</label>
                  <select
                    value={newProductForm.category}
                    onChange={(e) => setNewProductForm({ ...newProductForm, category: e.target.value })}
                    className="w-full h-10 rounded-lg border border-slate-300 bg-background px-3 py-2 text-[13.5px] font-medium focus:ring-1 focus:ring-primary focus:outline-none shadow-2xs"
                  >
                    {OFFICIAL_CATEGORIES.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-foreground mb-1">Pack Size</label>
                  <input
                    type="text"
                    value={newProductForm.pack_size}
                    onChange={(e) => setNewProductForm({ ...newProductForm, pack_size: e.target.value })}
                    placeholder="12 × 500g"
                    className="w-full h-10 rounded-lg border border-slate-300 bg-background px-3 py-2 text-[13.5px] font-medium focus:ring-1 focus:ring-primary focus:outline-none shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[13px] font-medium text-foreground mb-1">Cost Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newProductForm.cost_price}
                    onChange={(e) => setNewProductForm({ ...newProductForm, cost_price: e.target.value })}
                    className="w-full h-10 rounded-lg border border-slate-300 bg-background px-3 py-2 text-[13.5px] font-medium focus:ring-1 focus:ring-primary focus:outline-none shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-foreground mb-1">Selling Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newProductForm.selling_price}
                    onChange={(e) => setNewProductForm({ ...newProductForm, selling_price: e.target.value })}
                    className="w-full h-10 rounded-lg border border-slate-300 bg-background px-3 py-2 text-[13.5px] font-medium focus:ring-1 focus:ring-primary focus:outline-none shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-foreground mb-1">Movement Class</label>
                  <select
                    value={newProductForm.movement_class}
                    onChange={(e) => setNewProductForm({ ...newProductForm, movement_class: e.target.value })}
                    className="w-full h-10 rounded-lg border border-slate-300 bg-background px-3 py-2 text-[13.5px] font-medium focus:ring-1 focus:ring-primary focus:outline-none shadow-2xs"
                  >
                    <option value="fast">Fast (Class A)</option>
                    <option value="medium">Medium (Class B)</option>
                    <option value="slow">Slow (Class C)</option>
                  </select>
                </div>
              </div>

              {/* Logistics & Cold-Chain Fields */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[13px] font-medium text-foreground mb-1">Cold-Chain Storage Temp</label>
                  <select
                    value={newProductForm.storage_temp}
                    onChange={(e) => setNewProductForm({ ...newProductForm, storage_temp: e.target.value })}
                    className="w-full h-10 rounded-lg border border-slate-300 bg-background px-3 py-2 text-[13.5px] font-medium focus:ring-1 focus:ring-primary focus:outline-none shadow-2xs"
                  >
                    <option value="ambient">Ambient / Dry Storage</option>
                    <option value="chilled">Chilled (+2°C to +4°C)</option>
                    <option value="frozen">Deep Frozen (-18°C)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-foreground mb-1">Country of Origin</label>
                  <input
                    type="text"
                    value={newProductForm.country_of_origin}
                    onChange={(e) => setNewProductForm({ ...newProductForm, country_of_origin: e.target.value })}
                    placeholder="Poland"
                    className="w-full h-10 rounded-lg border border-slate-300 bg-background px-3 py-2 text-[13.5px] font-medium focus:ring-1 focus:ring-primary focus:outline-none shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[13px] font-medium text-foreground mb-1">Case Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newProductForm.case_weight_kg}
                    onChange={(e) => setNewProductForm({ ...newProductForm, case_weight_kg: e.target.value })}
                    className="w-full h-10 rounded-lg border border-slate-300 bg-background px-3 py-2 text-[13.5px] font-medium focus:ring-1 focus:ring-primary focus:outline-none shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-foreground mb-1">Pallet Ti (Cases/Tier)</label>
                  <input
                    type="number"
                    value={newProductForm.pallet_ti}
                    onChange={(e) => setNewProductForm({ ...newProductForm, pallet_ti: e.target.value })}
                    className="w-full h-10 rounded-lg border border-slate-300 bg-background px-3 py-2 text-[13.5px] font-medium focus:ring-1 focus:ring-primary focus:outline-none shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-foreground mb-1">Pallet Hi (Tiers High)</label>
                  <input
                    type="number"
                    value={newProductForm.pallet_hi}
                    onChange={(e) => setNewProductForm({ ...newProductForm, pallet_hi: e.target.value })}
                    className="w-full h-10 rounded-lg border border-slate-300 bg-background px-3 py-2 text-[13.5px] font-medium focus:ring-1 focus:ring-primary focus:outline-none shadow-2xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsAddProductOpen(false)}
                  className="btn-secondary h-9 px-4 text-[13px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary h-9 px-4 text-[13px]"
                >
                  Save Product to Catalogue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Wholesale Sell Sheet Modal */}
      {sellSheetProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white border border-slate-300 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Top Toolbar (hidden during print) */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50 no-print">
              <div className="flex items-center gap-2">
                <Printer className="h-4 w-4 text-[#e1241a]" />
                <h3 className="font-bold font-heading text-sm text-slate-800">
                  Wholesale Sell Sheet Preview
                </h3>
                <span className="text-xs text-slate-500">· Ready for sales reps & retail buyers</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn-primary h-8 px-3.5 text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print / Save PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSellSheetProduct(null)}
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Printable Document Body */}
            <div id="printable-sell-sheet" className="p-8 overflow-y-auto max-h-[calc(92vh-70px)] bg-white text-slate-900 font-sans space-y-6">
              {/* Header with logo & address */}
              <div className="flex items-start justify-between border-b-2 border-[#e1241a] pb-4">
                <div className="flex items-center gap-4">
                  <img
                    src="/premier-polmarex-logo.png"
                    alt="Premier Polmarex Inc."
                    className="h-14 w-auto object-contain"
                  />
                  <div>
                    <h1 className="text-xl font-bold font-heading text-[#e1241a]">PREMIER POLMAREX INC.</h1>
                    <p className="text-xs text-slate-600 font-medium">European Food Import & Logistics Distribution</p>
                  </div>
                </div>
                <div className="text-right text-xs text-slate-600 space-y-0.5">
                  <p className="font-semibold text-slate-800">2475 Tedlo Street, Mississauga, ON L5A 4A8</p>
                  <p>Order Desk: <strong>905-624-5111</strong></p>
                  <p>Email: <span className="text-[#e1241a]">orders@premierpolmarex.ca</span></p>
                  <p>Web: <strong>premierpolmarex.ca</strong></p>
                </div>
              </div>

              {/* Product Title & Cold-Chain Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#e1241a]">
                    {sellSheetProduct.brand} · {sellSheetProduct.category}
                  </span>
                  <h2 className="text-2xl font-bold font-heading text-slate-900 mt-0.5">
                    {sellSheetProduct.name}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 font-mono">
                    SKU: {sellSheetProduct.sku} · UPC / EAN: {sellSheetProduct.barcode || '5901239557546'}
                  </p>
                </div>
                <div className="shrink-0 text-left sm:text-right">
                  {(() => {
                    const s = getLogisticsSpecs(sellSheetProduct);
                    return s.temp === 'frozen' ? (
                      <span className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300">
                        <Snowflake className="h-4 w-4 text-blue-600" />
                        DEEP FROZEN (-18°C)
                      </span>
                    ) : s.temp === 'chilled' ? (
                      <span className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold bg-cyan-100 text-cyan-900 border border-cyan-300">
                        <Thermometer className="h-4 w-4 text-cyan-600" />
                        CHILLED (+2°C to +4°C)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        <Sun className="h-4 w-4 text-amber-600" />
                        AMBIENT / DRY STORAGE
                      </span>
                    );
                  })()}
                </div>
              </div>

              {/* Wholesale Pricing Structure */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Wholesale Pricing & Margins
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="rounded-xl border border-slate-200 p-3 bg-slate-50">
                    <p className="text-xs text-slate-500">Unit Wholesale Cost</p>
                    <p className="text-xl font-bold text-slate-900 mt-1">
                      {formatCurrency(sellSheetProduct.selling_price)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3 bg-slate-50">
                    <p className="text-xs text-slate-500">Case Wholesale Price</p>
                    <p className="text-xl font-bold text-[#e1241a] mt-1">
                      {formatCurrency(Number(sellSheetProduct.selling_price) * (getLogisticsSpecs(sellSheetProduct).units || 12))}
                    </p>
                    <p className="text-[10px] text-slate-500">({getLogisticsSpecs(sellSheetProduct).units} units/case)</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3 bg-slate-50">
                    <p className="text-xs text-slate-500">Suggested Retail (MSRP)</p>
                    <p className="text-xl font-bold text-slate-900 mt-1">
                      {formatCurrency(Number(sellSheetProduct.selling_price) * 1.54)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-emerald-200 p-3 bg-emerald-50">
                    <p className="text-xs text-emerald-800 font-semibold">Retailer Margin</p>
                    <p className="text-xl font-bold text-emerald-700 mt-1">35.0%</p>
                    <p className="text-[10px] text-emerald-600">High Volume Velocity</p>
                  </div>
                </div>
              </div>

              {/* Logistics, Freight & Packaging Specs Table */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Packaging & Pallet Freight Specifications
                </h3>
                {(() => {
                  const s = getLogisticsSpecs(sellSheetProduct);
                  return (
                    <div className="rounded-xl border border-slate-200 overflow-hidden">
                      <table className="w-full text-xs text-left">
                        <tbody className="divide-y divide-slate-200">
                          <tr className="bg-slate-50/50">
                            <td className="py-2.5 px-4 font-semibold text-slate-600 w-1/3">Pack Size & Format</td>
                            <td className="py-2.5 px-4 text-slate-900 font-medium">{sellSheetProduct.pack_size || '12 × 500g'}</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-4 font-semibold text-slate-600">Units Per Master Case</td>
                            <td className="py-2.5 px-4 text-slate-900 font-medium">{s.units} units</td>
                          </tr>
                          <tr className="bg-slate-50/50">
                            <td className="py-2.5 px-4 font-semibold text-slate-600">Gross Case Weight</td>
                            <td className="py-2.5 px-4 text-slate-900 font-medium">{s.caseWeight} kg</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-4 font-semibold text-slate-600">Pallet Configuration (Ti × Hi)</td>
                            <td className="py-2.5 px-4 text-slate-900 font-medium">
                              {s.ti} cases per tier × {s.hi} tiers high = <strong>{s.totalCases} cases per pallet</strong>
                            </td>
                          </tr>
                          <tr className="bg-slate-50/50">
                            <td className="py-2.5 px-4 font-semibold text-slate-600">Full Pallet Gross Weight</td>
                            <td className="py-2.5 px-4 text-slate-900 font-medium">{s.palletGrossWeight} kg (includes 25kg standard 48x40 wooden GMA pallet)</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-4 font-semibold text-slate-600">Country of Origin</td>
                            <td className="py-2.5 px-4 text-slate-900 font-medium">{s.origin} (Direct European Import)</td>
                          </tr>
                          <tr className="bg-slate-50/50">
                            <td className="py-2.5 px-4 font-semibold text-slate-600">CFIA Regulatory Compliance</td>
                            <td className="py-2.5 px-4 text-emerald-700 font-semibold flex items-center gap-1.5">
                              <BadgeCheck className="h-4 w-4" />
                              Safe Food for Canadians Regulations (SFCR) Compliant
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-4 font-semibold text-slate-600">Batch Lot & Best Before</td>
                            <td className="py-2.5 px-4 text-slate-900 font-medium">
                              Batch: <span className="font-mono">{s.lotNumber}</span> · Best Before: <strong>{s.bestBefore}</strong>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>

              {/* Barcode & Ordering Information */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50/70">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-900">Ordering & Distribution Instructions:</p>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Orders accepted by case or full pallet quantities. Delivery routes service the Greater Toronto Area, Montreal metropolitan, and Western Canada hubs on scheduled weekly dispatch.
                  </p>
                </div>
                <div className="text-center shrink-0 border border-slate-300 bg-white p-2 rounded-lg">
                  <div className="font-mono tracking-widest text-xs font-bold text-slate-800">
                    ||||| | |||| ||| |||||||
                  </div>
                  <div className="text-[10px] font-mono text-slate-600 mt-0.5">
                    {sellSheetProduct.barcode || '5901239557546'}
                  </div>
                </div>
              </div>

              {/* Sell sheet footer */}
              <div className="text-center text-[10.5px] text-slate-400 pt-4 border-t border-slate-200">
                Premier Polmarex Inc. · 2475 Tedlo St, Mississauga, Ontario · Canada's Premier Food Partner · All rights reserved.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
