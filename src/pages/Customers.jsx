import React, { useState, useMemo } from 'react';
import {
  Users,
  TriangleAlert,
  UserMinus,
  Crown,
  Sparkles,
  Download,
  Filter,
  Search,
  ChevronDown,
  X,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  ShoppingCart,
  FileText,
  Clock,
  ShieldCheck,
  Plus,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
  SlidersHorizontal,
  Upload,
  FileSpreadsheet,
  CheckCheck
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useApp } from '../context/AppContext';

// Badge styling map matching Base44 Cg and wg
const SEGMENT_CONFIG = {
  active: {
    label: 'Active',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: Users,
    tone: 'emerald'
  },
  at_risk: {
    label: 'At risk',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: TriangleAlert,
    tone: 'amber'
  },
  inactive: {
    label: 'Inactive',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: UserMinus,
    tone: 'rose'
  },
  high_value: {
    label: 'High value',
    badgeClass: 'bg-violet-50 text-violet-700 border-violet-200',
    icon: Crown,
    tone: 'violet'
  },
  new: {
    label: 'New customer',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
    icon: Sparkles,
    tone: 'sky'
  }
};

const TAB_OPTIONS = [
  { key: 'all', label: 'All customers' },
  { key: 'active', label: 'Active' },
  { key: 'at_risk', label: 'At Risk' },
  { key: 'inactive', label: 'Inactive' },
  { key: 'high_value', label: 'High Value' },
  { key: 'new', label: 'New Customer' }
];

export default function Customers() {
  const { company, companyLabel, entities, addCustomer, importCustomers, createTask, showToast, exportCSV } = useApp();

  // Filter states
  const [segmentTab, setSegmentTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [repFilter, setRepFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('-total_spend');
  const [visibleCount, setVisibleCount] = useState(30);

  // Modals / Drawers
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [followUpCustomer, setFollowUpCustomer] = useState(null);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Excel / CSV Import States
  const [importFile, setImportFile] = useState(null);
  const [parsedCustomers, setParsedCustomers] = useState([]);
  const [isImporting, setIsImporting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [importError, setImportError] = useState('');

  // Follow-up generator state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDraft, setGeneratedDraft] = useState(null);
  const [draftSubject, setDraftSubject] = useState('');
  const [draftBody, setDraftBody] = useState('');
  const [isQueueing, setIsQueueing] = useState(false);

  // New customer form state
  const [newCustForm, setNewCustForm] = useState({
    name: '',
    customer_type: 'b2b',
    assigned_rep: 'Daniel Kowalski',
    city: 'Toronto',
    region: 'Ontario',
    address: '100 King St W',
    email: '',
    phone: '',
    payment_terms: 'net_30',
    preferred_categories: 'Herbal & Fruit Tea, Specialty Jams'
  });

  const allCustomers = entities.Customer || [];
  const representatives = entities.Representative || [];

  // Business unit scoping
  const scopedCustomers = useMemo(() => {
    return allCustomers.filter((c) => {
      if (company !== 'all' && c.business_unit && c.business_unit !== company) return false;
      return true;
    });
  }, [allCustomers, company]);

  // KPI Calculations across current company scope
  const kpiStats = useMemo(() => {
    const counts = {
      active: { count: 0, spend: 0 },
      at_risk: { count: 0, spend: 0 },
      inactive: { count: 0, spend: 0 },
      high_value: { count: 0, spend: 0 },
      new: { count: 0, spend: 0 }
    };

    scopedCustomers.forEach((c) => {
      const seg = c.segment || 'inactive';
      if (counts[seg]) {
        counts[seg].count += 1;
        counts[seg].spend += Number(c.total_spend) || 0;
      }
    });

    return counts;
  }, [scopedCustomers]);

  // Filtered & Sorted Customer List
  const filteredCustomers = useMemo(() => {
    return scopedCustomers
      .filter((c) => {
        if (segmentTab !== 'all' && c.segment !== segmentTab) return false;
        if (repFilter !== 'all' && c.assigned_rep !== repFilter) return false;
        if (typeFilter !== 'all' && (c.customer_type || '').toLowerCase() !== typeFilter.toLowerCase()) return false;
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchName = c.name?.toLowerCase().includes(q);
          const matchCity = c.city?.toLowerCase().includes(q);
          const matchRep = c.assigned_rep?.toLowerCase().includes(q);
          const matchEmail = c.email?.toLowerCase().includes(q);
          if (!matchName && !matchCity && !matchRep && !matchEmail) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === '-total_spend') return (Number(b.total_spend) || 0) - (Number(a.total_spend) || 0);
        if (sortBy === '-lifetime_value_estimate') return (Number(b.lifetime_value_estimate) || 0) - (Number(a.lifetime_value_estimate) || 0);
        if (sortBy === '-outstanding_balance') return (Number(b.outstanding_balance) || 0) - (Number(a.outstanding_balance) || 0);
        if (sortBy === 'last_order_date') return (a.last_order_date || '').localeCompare(b.last_order_date || '');
        if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
        return 0;
      });
  }, [scopedCustomers, segmentTab, repFilter, typeFilter, searchTerm, sortBy]);

  // Paginated customers for 30-item view
  const displayedCustomers = useMemo(() => {
    return filteredCustomers.slice(0, visibleCount);
  }, [filteredCustomers, visibleCount]);

  // CSV Export
  const handleExportCSV = () => {
    if (exportCSV) {
      exportCSV('customers');
      return;
    }
    const headers = ['Customer', 'Segment', 'Representative', 'Orders', 'Total spend', 'Avg order', 'Last order', 'Outstanding'];
    const rows = filteredCustomers.map((c) => [
      `"${(c.name || '').replace(/"/g, '""')}"`,
      c.segment || '',
      `"${(c.assigned_rep || '').replace(/"/g, '""')}"`,
      c.order_count || 0,
      c.total_spend || 0,
      c.avg_order_value || 0,
      c.last_order_date || '',
      c.outstanding_balance || 0
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `customers-${company}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast({
      title: 'CSV Exported',
      description: `Downloaded ${filteredCustomers.length} customer records.`
    });
  };

  // Open Follow-up Modal
  const openFollowUp = (customer, e) => {
    if (e) e.stopPropagation();
    setFollowUpCustomer(customer);
    setGeneratedDraft(null);
    setDraftSubject('');
    setDraftBody('');
  };

  // Trigger AI Follow-up Generation
  const handleGenerateFollowUp = () => {
    if (!followUpCustomer) return;
    setIsGenerating(true);

    setTimeout(() => {
      const cust = followUpCustomer;
      const isOverdue = Number(cust.outstanding_balance) > 0;
      const lastOrder = cust.last_order_date || 'recently';
      const avgVal = formatCurrency(cust.avg_order_value);

      let subject = `Polmarex Partnership Update & Seasonal Catalogue - ${cust.name}`;
      let body = `Dear ${cust.name} Team,\n\nI hope you're having a productive week. We noticed it has been a short while since your last wholesale replenishment on ${lastOrder}.\n\nBased on your previous order frequency and volume (averaging ${avgVal} per shipment), we have reserved allocation for your upcoming reorder window. In addition, our seasonal catalogue includes high-demand items tailored to your preferred categories:\n- Herbapol Fruit Syrups & Herbal Teas (250ml / 500ml)\n- Krakus Sweet Gherkins & Speciality Preserves\n- Polmarex Confectionery & Wafer Selection\n\nWould you have 10 minutes this week for a brief check-in, or would you like us to generate a draft replenishment order directly based on your standard assortment?\n\nWarm regards,\n${cust.assigned_rep || 'The Polmarex Sales Team'}\nPremier Polmarex Inc.`;

      let rationale = `Customer order velocity decreased over the past reorder cycle. Account lifetime spend is ${formatCurrency(cust.total_spend)}. Prompting replenishment with preferred categories prevents churn risk.`;

      if (cust.segment === 'inactive') {
        subject = `We miss working with ${cust.name} - Special Reactivation Allowance`;
        body = `Dear Purchasing Team at ${cust.name},\n\nWe wanted to reconnect and share some exciting new additions to our direct European import distribution catalogue.\n\nTo help reactivate your ordering schedule, we are pleased to offer a 5% promotional volume allowance on your next purchase order of $2,500 or more, along with priority refrigerated freight handling.\n\nPlease let us know if we can deliver updated wholesale pricing and sample batches to your location at ${cust.address || cust.city}.\n\nBest regards,\n${cust.assigned_rep || 'Account Management'}`;
        rationale = `Inactive account with over 90 days of dormancy. Reconnect with reactivation volume allowance and priority freight.`;
      }

      setGeneratedDraft({
        rationale,
        recommended_products: cust.preferred_categories || [
          'Herbapol Syrups',
          'Krakus Speciality Pickles',
          'Bio Polish Herbal Infusions',
          'Wawel Chocolate Confections'
        ]
      });
      setDraftSubject(subject);
      setDraftBody(body);
      setIsGenerating(false);
    }, 600);
  };

  // Queue Task for Approval
  const handleQueueTask = () => {
    if (!followUpCustomer) return;
    setIsQueueing(true);

    setTimeout(() => {
      createTask({
        title: `Approve follow-up message for ${followUpCustomer.name}`,
        description: `Drafted by Customer Retention Agent: "${draftSubject}". Total lifetime spend: ${formatCurrency(followUpCustomer.total_spend)}.`,
        agent_key: 'customer_retention',
        business_unit: followUpCustomer.business_unit || 'PRM',
        priority: followUpCustomer.segment === 'high_value' ? 'high' : 'medium',
        due_date: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
        owner_role: 'Account Representative'
      });
      setIsQueueing(false);
      setFollowUpCustomer(null);
    }, 400);
  };

  // Add new customer submission
  const handleCreateCustomer = (e) => {
    e.preventDefault();
    if (!newCustForm.name.trim()) return;

    const categoriesArray = newCustForm.preferred_categories
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    addCustomer({
      name: newCustForm.name,
      customer_type: newCustForm.customer_type,
      assigned_rep: newCustForm.assigned_rep,
      city: newCustForm.city,
      region: newCustForm.region,
      address: newCustForm.address,
      email: newCustForm.email || `orders@${newCustForm.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.ca`,
      phone: newCustForm.phone || '(416) 555-0199',
      payment_terms: newCustForm.payment_terms,
      preferred_categories: categoriesArray,
      notes: 'New account registered through CRM portal.'
    });

    setIsAddCustomerOpen(false);
    setNewCustForm({
      name: '',
      customer_type: 'b2b',
      assigned_rep: 'Daniel Kowalski',
      city: 'Toronto',
      region: 'Ontario',
      address: '100 King St W',
      email: '',
      phone: '',
      payment_terms: 'net_30',
      preferred_categories: 'Herbal & Fruit Tea, Specialty Jams'
    });
  };

  // Helper to normalize keys from Excel / CSV files
  const normalizeCustomerRow = (raw) => {
    const findVal = (keys) => {
      for (const k of Object.keys(raw)) {
        const cleanKey = k.toLowerCase().replace(/[^a-z0-9]/g, '');
        for (const target of keys) {
          if (cleanKey === target.toLowerCase().replace(/[^a-z0-9]/g, '')) {
            return raw[k];
          }
        }
      }
      return '';
    };

    const name = findVal(['name', 'customername', 'company', 'companyname', 'customer', 'client', 'account', 'businessname']);
    if (!name || !String(name).trim()) return null;

    const email = findVal(['email', 'contactemail', 'emailaddress', 'mail']);
    const phone = findVal(['phone', 'phonenumber', 'telephone', 'tel', 'mobile', 'cell']);
    const address = findVal(['address', 'street', 'streetaddress', 'location']);
    const city = findVal(['city', 'town', 'municipality']) || 'Toronto';
    const region = findVal(['region', 'province', 'state', 'prov']) || 'Ontario';
    const rep = findVal(['assignedrep', 'rep', 'representative', 'salesrep', 'accountmanager']) || 'Daniel Kowalski';
    const segRaw = String(findVal(['segment', 'status', 'tier', 'customersegment']) || 'active').toLowerCase().replace(/\s+/g, '_');
    const segment = ['active', 'at_risk', 'inactive', 'high_value', 'new'].includes(segRaw) ? segRaw : 'active';
    const typeRaw = String(findVal(['customertype', 'type', 'businesstype']) || 'b2b').toLowerCase();
    const customer_type = typeRaw.includes('b2c') ? 'b2c' : 'b2b';
    const termsRaw = String(findVal(['paymentterms', 'terms', 'term', 'paymentterm']) || 'net_30').toLowerCase().replace(/\s+/g, '_');
    const payment_terms = ['net_30', 'net_15', 'net_60', 'due_on_receipt'].includes(termsRaw) ? termsRaw : 'net_30';
    const total_spend = Number(findVal(['totalspend', 'spend', 'revenue', 'sales', 'lifetimespend'])) || 0;
    const order_count = Number(findVal(['ordercount', 'orders', 'totalorders'])) || 1;
    const outstanding_balance = Number(findVal(['outstandingbalance', 'balance', 'outstanding', 'arbalance', 'unpaid'])) || 0;
    const categoriesRaw = findVal(['preferredcategories', 'categories', 'category', 'products']);
    const notes = findVal(['notes', 'note', 'comments', 'comment']) || 'Imported from Excel spreadsheet';

    let preferred_categories = ['Herbal & Fruit Tea', 'Specialty Jams'];
    if (categoriesRaw) {
      if (Array.isArray(categoriesRaw)) preferred_categories = categoriesRaw;
      else preferred_categories = String(categoriesRaw).split(',').map((s) => s.trim()).filter(Boolean);
    }

    return {
      name: String(name).trim(),
      customer_type,
      business_unit: company === 'all' ? 'PRM' : company,
      segment,
      email: String(email).trim(),
      phone: String(phone).trim(),
      address: String(address).trim(),
      city: String(city).trim(),
      region: String(region).trim(),
      assigned_rep: String(rep).trim(),
      last_order_date: new Date().toISOString().slice(0, 10),
      order_count: Math.max(1, order_count),
      avg_order_value: order_count > 0 && total_spend > 0 ? Math.round(total_spend / order_count) : 250,
      total_spend,
      outstanding_balance,
      payment_terms,
      preferred_categories,
      notes: String(notes).trim()
    };
  };

  // Process Excel (.xlsx, .xls) or .csv file
  const handleProcessFile = (file) => {
    if (!file) return;
    setImportError('');
    setImportFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!jsonRows || jsonRows.length === 0) {
          setImportError('The selected file appears to be empty.');
          setParsedCustomers([]);
          return;
        }

        const valid = [];
        jsonRows.forEach((row) => {
          const parsed = normalizeCustomerRow(row);
          if (parsed && parsed.name) {
            valid.push(parsed);
          }
        });

        if (valid.length === 0) {
          setImportError('No valid customer rows found. Ensure the file contains a "Customer Name" or "Name" column.');
          setParsedCustomers([]);
          return;
        }

        setParsedCustomers(valid);
      } catch (err) {
        console.error('Error parsing file:', err);
        setImportError('Failed to read the file. Please verify it is a valid Excel (.xlsx, .xls) or CSV file.');
        setParsedCustomers([]);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Download Sample Excel Template
  const handleDownloadTemplate = () => {
    const sampleData = [
      {
        'Customer Name': 'Starsky Fine Foods Mississauga',
        'Customer Type': 'B2B',
        'Email': 'purchasing@starskycanada.com',
        'Phone': '(905) 858-3777',
        'Address': '2040 Dundas St E',
        'City': 'Mississauga',
        'Region': 'Ontario',
        'Assigned Rep': 'Daniel Kowalski',
        'Segment': 'high_value',
        'Payment Terms': 'net_30',
        'Total Spend': 18500,
        'Order Count': 12,
        'Outstanding Balance': 1250,
        'Preferred Categories': 'Herbal & Fruit Tea, Specialty Jams, Confectionery',
        'Notes': 'High-volume European supermarket chain location.'
      },
      {
        'Customer Name': 'Yummy Market Inc North York',
        'Customer Type': 'B2B',
        'Email': 'orders@yummymarket.com',
        'Phone': '(416) 665-0040',
        'Address': '4400 Dufferin St',
        'City': 'Toronto',
        'Region': 'Ontario',
        'Assigned Rep': 'Sophie Tremblay',
        'Segment': 'active',
        'Payment Terms': 'net_30',
        'Total Spend': 14200,
        'Order Count': 9,
        'Outstanding Balance': 0,
        'Preferred Categories': 'Spreads & Breakfast, Organic Jams, Pickles',
        'Notes': 'Weekly distribution schedule confirmed.'
      },
      {
        'Customer Name': 'Baltyk Deli & Supermarket',
        'Customer Type': 'B2B',
        'Email': 'baltykdeli@rogers.com',
        'Phone': '(416) 762-8888',
        'Address': '380 Roncesvalles Ave',
        'City': 'Toronto',
        'Region': 'Ontario',
        'Assigned Rep': 'Marek Wiśniewski',
        'Segment': 'active',
        'Payment Terms': 'net_15',
        'Total Spend': 8950,
        'Order Count': 6,
        'Outstanding Balance': 420,
        'Preferred Categories': 'Herbapol Syrups, Krakus Preserves',
        'Notes': 'Direct store delivery every Tuesday.'
      },
      {
        'Customer Name': 'European Gourmet Montreal',
        'Customer Type': 'B2B',
        'Email': 'contact@europeangourmet.qc.ca',
        'Phone': '(514) 274-1234',
        'Address': '5412 Boulevard Saint-Laurent',
        'City': 'Montreal',
        'Region': 'Quebec',
        'Assigned Rep': 'Sophie Tremblay',
        'Segment': 'new',
        'Payment Terms': 'due_on_receipt',
        'Total Spend': 2400,
        'Order Count': 2,
        'Outstanding Balance': 0,
        'Preferred Categories': 'Specialty Confectionery, Tea',
        'Notes': 'New accounts opened via trade show.'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers');
    XLSX.writeFile(workbook, 'Premier_Polmarex_Customer_Import_Template.xlsx');
    showToast({
      title: 'Template Downloaded',
      description: 'Customer import Excel template saved to your downloads.'
    });
  };

  // Confirm and Execute Import (Appends without removing previous)
  const handleConfirmImport = async () => {
    if (parsedCustomers.length === 0) return;
    setIsImporting(true);

    try {
      await importCustomers(parsedCustomers);
      setIsImportModalOpen(false);
      setImportFile(null);
      setParsedCustomers([]);
      setImportError('');
    } catch (err) {
      console.error('Import failed:', err);
      setImportError('Import failed: ' + (err.message || 'Unknown error'));
    } finally {
      setIsImporting(false);
    }
  };

  // Formatters
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

  const hasActiveFilters = segmentTab !== 'all' || repFilter !== 'all' || typeFilter !== 'all' || searchTerm.trim() !== '';

  return (
    <div className="space-y-5">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground">Customers / CRM</h1>
          <p className="text-xs text-muted-foreground mt-1 max-w-3xl">
            Segments, purchase history and retention signals for {companyLabel.toLowerCase()}. Inactivity thresholds: at risk after 45 days, inactive after 90 days without an order.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIsImportModalOpen(true);
              setImportFile(null);
              setParsedCustomers([]);
              setImportError('');
            }}
            className="btn-secondary"
          >
            <Upload className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
            <span>Import Excel / CSV</span>
          </button>
          <button
            onClick={() => setIsAddCustomerOpen(true)}
            className="btn-primary"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            <span>New customer</span>
          </button>
          <button
            onClick={handleExportCSV}
            disabled={filteredCustomers.length === 0}
            className="btn-secondary"
          >
            <Download className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
            <span>Download CSV</span>
          </button>
        </div>
      </div>

      {/* 5 KPI Metric Cards Matching T7 & Screenshot */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {/* 1. Active */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[13px] font-medium text-muted-foreground">Active</p>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Users className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 font-heading text-2xl font-semibold tracking-tight text-foreground">
            {kpiStats.active.count}
          </p>
          <div className="mt-1.5 flex items-center gap-2 text-xs">
            <span className="truncate text-muted-foreground">
              {formatCompactCurrency(kpiStats.active.spend)} lifetime spend
            </span>
          </div>
        </div>

        {/* 2. At risk */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[13px] font-medium text-muted-foreground">At risk</p>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <TriangleAlert className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 font-heading text-2xl font-semibold tracking-tight text-foreground">
            {kpiStats.at_risk.count}
          </p>
          <div className="mt-1.5 flex items-center gap-2 text-xs">
            <span className="truncate text-muted-foreground">
              {formatCompactCurrency(kpiStats.at_risk.spend)} lifetime spend
            </span>
          </div>
        </div>

        {/* 3. Inactive */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[13px] font-medium text-muted-foreground">Inactive</p>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
              <UserMinus className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 font-heading text-2xl font-semibold tracking-tight text-foreground">
            {kpiStats.inactive.count}
          </p>
          <div className="mt-1.5 flex items-center gap-2 text-xs">
            <span className="truncate text-muted-foreground">
              {formatCompactCurrency(kpiStats.inactive.spend)} lifetime spend
            </span>
          </div>
        </div>

        {/* 4. High value */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[13px] font-medium text-muted-foreground">High value</p>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
              <Crown className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 font-heading text-2xl font-semibold tracking-tight text-foreground">
            {kpiStats.high_value.count}
          </p>
          <div className="mt-1.5 flex items-center gap-2 text-xs">
            <span className="truncate text-muted-foreground">
              {formatCompactCurrency(kpiStats.high_value.spend)} lifetime spend
            </span>
          </div>
        </div>

        {/* 5. New customers */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[13px] font-medium text-muted-foreground">New customers</p>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
              <Sparkles className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 font-heading text-2xl font-semibold tracking-tight text-foreground">
            {kpiStats.new.count}
          </p>
          <div className="mt-1.5 flex items-center gap-2 text-xs">
            <span className="truncate text-muted-foreground">
              {formatCompactCurrency(kpiStats.new.spend)} lifetime spend
            </span>
          </div>
        </div>
      </div>

      {/* Segment Tabs Bar Matching yg */}
      <div className="flex h-auto w-full flex-wrap justify-start gap-1 bg-muted p-1 rounded-lg border border-border">
        {TAB_OPTIONS.map((tab) => {
          const isActive = segmentTab === tab.key;
          let count = scopedCustomers.length;
          if (tab.key !== 'all') {
            count = kpiStats[tab.key]?.count || 0;
          }
          return (
            <button
              key={tab.key}
              onClick={() => setSegmentTab(tab.key)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                isActive
                  ? 'bg-card text-foreground shadow-sm font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-card/40'
              }`}
            >
              {tab.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Filters Toolbar Matching T5 */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 rounded-xl border border-border bg-card p-2.5 shadow-2xs">
        {/* Filters label */}
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="flex items-center gap-1.5 px-1 text-xs font-medium text-muted-foreground shrink-0">
            <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Filters</span>
          </div>

          {/* Search customer */}
          <div className="relative min-w-[190px] flex-1 max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search customer…"
              className="h-9.5 w-full rounded-lg border border-slate-300 bg-card pl-9.5 pr-3 text-[13px] font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary shadow-2xs"
            />
          </div>

          {/* Representative filter */}
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

          {/* Customer Type filter */}
          <div className="w-40">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-9.5 w-full rounded-lg border border-slate-300 bg-card px-2.5 text-[13px] font-medium text-foreground focus:outline-none focus:border-primary shadow-2xs"
            >
              <option value="all">Customer Type (All)</option>
              <option value="b2b">B2B Wholesale</option>
              <option value="b2c">B2C Retail</option>
            </select>
          </div>

          {/* Sort dropdown */}
          <div className="w-48">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-9.5 w-full rounded-lg border border-slate-300 bg-card px-2.5 text-[13px] font-medium text-foreground focus:outline-none focus:border-primary shadow-2xs"
            >
              <option value="-total_spend">Sort: total spend</option>
              <option value="-lifetime_value_estimate">Sort: lifetime value</option>
              <option value="-outstanding_balance">Sort: outstanding balance</option>
              <option value="last_order_date">Sort: oldest last order</option>
              <option value="name">Sort: name (A–Z)</option>
            </select>
          </div>
        </div>

        {/* Count & Clear actions */}
        <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
          <span className="inline-flex items-center rounded-full border border-border bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
            {filteredCustomers.length} records
          </span>
          {hasActiveFilters && (
            <button
              onClick={() => {
                setSegmentTab('all');
                setRepFilter('all');
                setTypeFilter('all');
                setSearchTerm('');
              }}
              className="rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Customer Directory Table Matching D7 */}
      <div className="rounded-xl border border-border bg-card shadow-2xs overflow-hidden">
        {filteredCustomers.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm font-medium text-foreground">No customers match these filters</p>
            <p className="text-xs text-muted-foreground mt-1">
              Try a different segment, representative or search term.
            </p>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="py-3 px-4 font-semibold text-muted-foreground">Customer</th>
                  <th className="py-3 px-3 font-semibold text-muted-foreground">Segment</th>
                  <th className="hidden lg:table-cell py-3 px-3 font-semibold text-muted-foreground">Representative</th>
                  <th className="py-3 px-3 font-semibold text-muted-foreground text-right">Orders</th>
                  <th className="py-3 px-3 font-semibold text-muted-foreground text-right">Total spend</th>
                  <th className="hidden sm:table-cell py-3 px-3 font-semibold text-muted-foreground text-right">Avg order</th>
                  <th className="hidden lg:table-cell py-3 px-3 font-semibold text-muted-foreground">Last order</th>
                  <th className="py-3 px-3 font-semibold text-muted-foreground text-right">Outstanding</th>
                  <th className="py-3 px-4 font-semibold text-muted-foreground text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {displayedCustomers.map((cust) => {
                  const segConfig = SEGMENT_CONFIG[cust.segment] || SEGMENT_CONFIG.inactive;
                  const hasOverdue = Number(cust.outstanding_balance) > 0;

                  return (
                    <tr
                      key={cust.id}
                      onClick={() => setSelectedCustomer(cust)}
                      className="cursor-pointer transition-colors hover:bg-muted/50 group"
                    >
                      {/* Customer name & details */}
                      <td className="py-3 px-4">
                        <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                          {cust.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {cust.city}, {cust.region} · {(cust.customer_type || 'B2B').toUpperCase()}
                          {cust.unsubscribed ? ' · unsubscribed' : ''}
                        </p>
                      </td>

                      {/* Segment pill */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${segConfig.badgeClass}`}
                        >
                          {segConfig.label}
                        </span>
                      </td>

                      {/* Representative */}
                      <td className="hidden lg:table-cell py-3 px-3 text-xs text-muted-foreground">
                        {cust.assigned_rep || 'Unassigned'}
                      </td>

                      {/* Order Count */}
                      <td className="py-3 px-3 text-right tabular-nums text-foreground font-medium">
                        {cust.order_count || 0}
                      </td>

                      {/* Total Spend */}
                      <td className="py-3 px-3 text-right tabular-nums text-foreground font-medium">
                        {formatCurrency(cust.total_spend)}
                      </td>

                      {/* Avg Order */}
                      <td className="hidden sm:table-cell py-3 px-3 text-right tabular-nums text-muted-foreground">
                        {formatCurrency(cust.avg_order_value)}
                      </td>

                      {/* Last Order Date */}
                      <td className="hidden lg:table-cell py-3 px-3 text-xs text-muted-foreground">
                        {cust.last_order_date || '—'}
                      </td>

                      {/* Outstanding Balance */}
                      <td className="py-3 px-3 text-right tabular-nums">
                        <span
                          className={
                            hasOverdue
                              ? 'font-medium text-rose-600'
                              : 'text-muted-foreground'
                          }
                        >
                          {formatCurrency(cust.outstanding_balance)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCustomer(cust);
                            }}
                            className="btn-table"
                          >
                            <Eye className="mr-1 h-3 w-3 text-muted-foreground" />
                            <span>360 view</span>
                          </button>
                          <button
                            onClick={(e) => openFollowUp(cust, e)}
                            className="btn-table"
                          >
                            <Sparkles className="mr-1 h-3 w-3 text-primary" />
                            <span>Follow-up</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Load More Button after 30 items */}
          {filteredCustomers.length > visibleCount && (
            <div className="border-t border-border p-3 text-center bg-muted/20">
              <button
                onClick={() => setVisibleCount((prev) => prev + 30)}
                className="btn-secondary"
              >
                Load more customers (Showing {visibleCount} of {filteredCustomers.length})
              </button>
            </div>
          )}
        </div>
      )}
    </div>

      {/* Customer Profile & Purchase History Drawer */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in">
          <div className="h-full w-full max-w-xl bg-card border-l border-border shadow-2xl overflow-y-auto p-6 space-y-6 flex flex-col">
            {/* Drawer Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold font-heading text-foreground">
                    {selectedCustomer.name}
                  </h2>
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                      (SEGMENT_CONFIG[selectedCustomer.segment] || SEGMENT_CONFIG.inactive).badgeClass
                    }`}
                  >
                    {(SEGMENT_CONFIG[selectedCustomer.segment] || SEGMENT_CONFIG.inactive).label}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {(selectedCustomer.customer_type || 'B2B').toUpperCase()} account · {selectedCustomer.city}, {selectedCustomer.region} · Served by {selectedCustomer.assigned_rep || 'Unassigned'}
                </p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-[11px] font-medium text-muted-foreground">Lifetime Spend</p>
                <p className="text-base font-bold text-foreground mt-0.5">{formatCurrency(selectedCustomer.total_spend)}</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-[11px] font-medium text-muted-foreground">Avg Order</p>
                <p className="text-base font-bold text-foreground mt-0.5">{formatCurrency(selectedCustomer.avg_order_value)}</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-[11px] font-medium text-muted-foreground">Orders</p>
                <p className="text-base font-bold text-foreground mt-0.5">{selectedCustomer.order_count || 0}</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-[11px] font-medium text-muted-foreground">Outstanding</p>
                <p className={`text-base font-bold mt-0.5 ${Number(selectedCustomer.outstanding_balance) > 0 ? 'text-rose-600' : 'text-foreground'}`}>
                  {formatCurrency(selectedCustomer.outstanding_balance)}
                </p>
              </div>
            </div>

            {/* Account Information */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Account Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground">Email:</span>
                  <p className="font-medium text-foreground mt-0.5">{selectedCustomer.email || 'orders@domain.ca'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Phone:</span>
                  <p className="font-medium text-foreground mt-0.5">{selectedCustomer.phone || '(416) 555-0100'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Address:</span>
                  <p className="font-medium text-foreground mt-0.5">{selectedCustomer.address || 'Standard Delivery Route'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Payment Terms:</span>
                  <p className="font-medium text-foreground mt-0.5 uppercase">
                    {(selectedCustomer.payment_terms || 'net_30').replace('_', ' ')}
                  </p>
                </div>
              </div>
            </div>

            {/* Preferred Categories */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Preferred Categories & Brands
              </h3>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {(selectedCustomer.preferred_categories || ['Herbal & Fruit Tea', 'Spreads & Preserves', 'Polish Confectionery']).map(
                  (cat, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center rounded-md border border-border bg-muted/50 px-2 py-0.5 text-xs text-foreground"
                    >
                      {cat}
                    </span>
                  )
                )}
              </div>
            </div>

            {/* Notes / Route info */}
            {selectedCustomer.notes && (
              <div className="rounded-xl border border-border bg-card p-4 space-y-1 text-xs">
                <span className="font-semibold text-muted-foreground uppercase tracking-wider text-[11px]">
                  Account Notes
                </span>
                <p className="text-foreground pt-1">{selectedCustomer.notes}</p>
              </div>
            )}

            {/* Drawer Actions */}
            <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const cust = selectedCustomer;
                  setSelectedCustomer(null);
                  openFollowUp(cust);
                }}
                className="inline-flex items-center rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
              >
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Personalised Follow-up
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Personalised Follow-up Modal Matching O7 */}
      {followUpCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="max-h-[90vh] max-w-2xl w-full rounded-xl border border-border bg-card p-6 shadow-2xl overflow-y-auto space-y-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold font-heading text-foreground">
                  Personalised follow-up · {followUpCustomer.name}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {followUpCustomer.order_count || 0} orders · average {formatCurrency(followUpCustomer.avg_order_value)} · last order {followUpCustomer.last_order_date || '—'} · outstanding {formatCurrency(followUpCustomer.outstanding_balance)}
                </p>
              </div>
              <button
                onClick={() => setFollowUpCustomer(null)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Marketing Consent Warning */}
            {followUpCustomer.unsubscribed || followUpCustomer.consent_marketing === false ? (
              <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                This customer has withdrawn marketing consent or unsubscribed. No automated message can be drafted or sent for this account.
              </div>
            ) : (
              <>
                {/* Generation triggers & badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleGenerateFollowUp}
                    disabled={isGenerating}
                    className="inline-flex items-center justify-center rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                        Generating draft...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-3.5 w-3.5" />
                        {generatedDraft ? 'Regenerate draft' : 'Generate personalised message'}
                      </>
                    )}
                  </button>
                  <span className="inline-flex items-center rounded-md border border-border bg-muted/40 px-2.5 py-1 text-[11px] font-normal text-muted-foreground">
                    <ShieldCheck className="mr-1 h-3.5 w-3.5 text-emerald-600" />
                    Consent checked
                  </span>
                  <span className="inline-flex items-center rounded-md border border-border bg-muted/40 px-2.5 py-1 text-[11px] font-normal text-muted-foreground">
                    Never sent automatically
                  </span>
                </div>

                {/* AI Draft Result */}
                {generatedDraft && (
                  <div className="space-y-4">
                    {/* Why this message rationale */}
                    {generatedDraft.rationale && (
                      <div className="rounded-lg bg-muted/60 p-3 border border-border">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Why this message
                        </p>
                        <p className="mt-1 text-[13px] text-foreground">
                          {generatedDraft.rationale}
                        </p>
                      </div>
                    )}

                    {/* Recommended products */}
                    {(generatedDraft.recommended_products || []).length > 0 && (
                      <div className="rounded-lg border border-border p-3 bg-card">
                        <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          <ShoppingCart className="h-3.5 w-3.5 text-primary" />
                          Recommended from their purchase history
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {generatedDraft.recommended_products.map((item, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center rounded-md border border-border bg-muted/50 px-2.5 py-1 text-xs text-foreground"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Draft Subject & Message Body */}
                    <div className="rounded-lg border border-border p-3 bg-card space-y-2">
                      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        <Mail className="h-3.5 w-3.5 text-primary" />
                        Draft (not sent)
                      </p>
                      <input
                        type="text"
                        value={draftSubject}
                        onChange={(e) => setDraftSubject(e.target.value)}
                        placeholder="Subject"
                        className="w-full h-10 rounded-lg border border-slate-300 bg-background px-3 py-2 text-[13.5px] font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
                      />
                      <textarea
                        rows={7}
                        value={draftBody}
                        onChange={(e) => setDraftBody(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-background p-3 text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono leading-relaxed shadow-2xs"
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                onClick={() => setFollowUpCustomer(null)}
                className="rounded-lg border border-border px-3.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
              >
                Cancel
              </button>
              {generatedDraft && !(followUpCustomer.unsubscribed || followUpCustomer.consent_marketing === false) && (
                <button
                  onClick={handleQueueTask}
                  disabled={isQueueing}
                  className="inline-flex items-center rounded-lg bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
                >
                  {isQueueing ? (
                    <>
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      Queueing...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-3.5 w-3.5" />
                      Queue for approval
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* + New Customer Modal */}
      {isAddCustomerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="max-w-xl w-full rounded-xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold font-heading text-foreground">Add New Customer Account</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Register a verified retail store, supermarket, or foodservice client into Polmarex CRM.
                </p>
              </div>
              <button
                onClick={() => setIsAddCustomerOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-4 pt-2 text-[13.5px]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-medium text-foreground mb-1.5 text-[13px]">Company / Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={newCustForm.name}
                    onChange={(e) => setNewCustForm({ ...newCustForm, name: e.target.value })}
                    placeholder="e.g. Starsky Fine Foods"
                    className="w-full h-10 rounded-lg border border-slate-300 bg-background px-3 py-2 text-[13.5px] font-medium focus:ring-1 focus:ring-primary focus:outline-none shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block font-medium text-foreground mb-1.5 text-[13px]">Customer Type</label>
                  <select
                    value={newCustForm.customer_type}
                    onChange={(e) => setNewCustForm({ ...newCustForm, customer_type: e.target.value })}
                    className="w-full h-10 rounded-lg border border-slate-300 bg-background px-3 py-2 text-[13.5px] font-medium focus:ring-1 focus:ring-primary focus:outline-none shadow-2xs"
                  >
                    <option value="b2b">B2B Wholesale</option>
                    <option value="b2c">B2C Retail</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-medium text-foreground mb-1.5 text-[13px]">Assigned Representative</label>
                  <select
                    value={newCustForm.assigned_rep}
                    onChange={(e) => setNewCustForm({ ...newCustForm, assigned_rep: e.target.value })}
                    className="w-full h-10 rounded-lg border border-slate-300 bg-background px-3 py-2 text-[13.5px] font-medium focus:ring-1 focus:ring-primary focus:outline-none shadow-2xs"
                  >
                    {representatives.map((rep) => (
                      <option key={rep.id || rep.full_name} value={rep.full_name}>
                        {rep.full_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-foreground mb-1.5 text-[13px]">Payment Terms</label>
                  <select
                    value={newCustForm.payment_terms}
                    onChange={(e) => setNewCustForm({ ...newCustForm, payment_terms: e.target.value })}
                    className="w-full h-10 rounded-lg border border-slate-300 bg-background px-3 py-2 text-[13.5px] font-medium focus:ring-1 focus:ring-primary focus:outline-none shadow-2xs"
                  >
                    <option value="net_15">Net 15 Days</option>
                    <option value="net_30">Net 30 Days</option>
                    <option value="net_60">Net 60 Days</option>
                    <option value="prepaid">Prepaid / COD</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block font-medium text-foreground mb-1.5 text-[13px]">City</label>
                  <input
                    type="text"
                    value={newCustForm.city}
                    onChange={(e) => setNewCustForm({ ...newCustForm, city: e.target.value })}
                    placeholder="Toronto"
                    className="w-full h-10 rounded-lg border border-slate-300 bg-background px-3 py-2 text-[13.5px] font-medium focus:ring-1 focus:ring-primary focus:outline-none shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block font-medium text-foreground mb-1.5 text-[13px]">Region / Province</label>
                  <input
                    type="text"
                    value={newCustForm.region}
                    onChange={(e) => setNewCustForm({ ...newCustForm, region: e.target.value })}
                    placeholder="Ontario"
                    className="w-full h-10 rounded-lg border border-slate-300 bg-background px-3 py-2 text-[13.5px] font-medium focus:ring-1 focus:ring-primary focus:outline-none shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block font-medium text-foreground mb-1.5 text-[13px]">Street Address</label>
                  <input
                    type="text"
                    value={newCustForm.address}
                    onChange={(e) => setNewCustForm({ ...newCustForm, address: e.target.value })}
                    placeholder="100 King St W"
                    className="w-full h-10 rounded-lg border border-slate-300 bg-background px-3 py-2 text-[13.5px] font-medium focus:ring-1 focus:ring-primary focus:outline-none shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-medium text-foreground mb-1.5 text-[13px]">Contact Email</label>
                  <input
                    type="email"
                    value={newCustForm.email}
                    onChange={(e) => setNewCustForm({ ...newCustForm, email: e.target.value })}
                    placeholder="orders@starsky.ca"
                    className="w-full h-10 rounded-lg border border-slate-300 bg-background px-3 py-2 text-[13.5px] font-medium focus:ring-1 focus:ring-primary focus:outline-none shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block font-medium text-foreground mb-1.5 text-[13px]">Contact Phone</label>
                  <input
                    type="text"
                    value={newCustForm.phone}
                    onChange={(e) => setNewCustForm({ ...newCustForm, phone: e.target.value })}
                    placeholder="(416) 555-0199"
                    className="w-full h-10 rounded-lg border border-slate-300 bg-background px-3 py-2 text-[13.5px] font-medium focus:ring-1 focus:ring-primary focus:outline-none shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1.5 text-[13px]">Preferred Product Categories (comma separated)</label>
                <input
                  type="text"
                  value={newCustForm.preferred_categories}
                  onChange={(e) => setNewCustForm({ ...newCustForm, preferred_categories: e.target.value })}
                  placeholder="Herbal & Fruit Tea, Specialty Jams, Pickles"
                  className="w-full h-10 rounded-lg border border-slate-300 bg-background px-3 py-2 text-[13.5px] font-medium focus:ring-1 focus:ring-primary focus:outline-none shadow-2xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3.5 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsAddCustomerOpen(false)}
                  className="btn-secondary h-9 px-4 text-[13px] font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary h-9 px-4 text-[13px] font-medium"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excel / CSV Customer Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold font-heading text-foreground">Import Customers from Excel / CSV</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Upload your client spreadsheet. New customers are safely appended to your directory without deleting previous records.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportFile(null);
                  setParsedCustomers([]);
                  setImportError('');
                }}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(92vh-140px)]">
              {/* Informational Guidance & Download Template */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-emerald-200/70 bg-emerald-50/60 text-emerald-900 text-xs">
                <div className="flex items-start gap-2.5">
                  <CheckCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Safe Cumulative Import:</span> Previous customers and order histories remain completely safe and are never overwritten or removed. If you import again later with another file, new clients continue to add on.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-300 bg-white text-emerald-800 font-medium text-xs hover:bg-emerald-50 shrink-0 shadow-2xs transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Excel Template</span>
                </button>
              </div>

              {/* Drag & Drop File Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleProcessFile(e.dataTransfer.files[0]);
                  }
                }}
                className={`relative flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed transition-all ${
                  isDragging
                    ? 'border-primary bg-primary/5'
                    : 'border-slate-300 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-400'
                }`}
              >
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleProcessFile(e.target.files[0]);
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />

                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
                  <Upload className="h-6 w-6" />
                </div>

                <p className="text-sm font-semibold text-foreground">
                  {importFile ? importFile.name : 'Click to select or drag and drop your spreadsheet here'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supports Excel spreadsheets (.xlsx, .xls) and CSV (.csv)
                </p>

                <div className="flex items-center gap-2 mt-4 text-[11px] text-muted-foreground">
                  <span className="px-2 py-0.5 rounded bg-white border border-slate-200">Customer Name</span>
                  <span className="px-2 py-0.5 rounded bg-white border border-slate-200">Email & Phone</span>
                  <span className="px-2 py-0.5 rounded bg-white border border-slate-200">City & Address</span>
                  <span className="px-2 py-0.5 rounded bg-white border border-slate-200">Assigned Rep</span>
                  <span className="px-2 py-0.5 rounded bg-white border border-slate-200">Terms</span>
                </div>
              </div>

              {/* Error Display */}
              {importError && (
                <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{importError}</span>
                </div>
              )}

              {/* Parsed Preview Table */}
              {parsedCustomers.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                        {parsedCustomers.length} Customers Detected
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Ready to add onto existing {allCustomers.length} records
                      </span>
                    </div>
                    <span className="text-xs font-medium text-slate-700">
                      Showing preview of first {Math.min(5, parsedCustomers.length)} records
                    </span>
                  </div>

                  <div className="rounded-xl border border-border overflow-hidden bg-white shadow-2xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-[12px]">
                        <thead>
                          <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                            <th className="py-2.5 px-3">Customer Name</th>
                            <th className="py-2.5 px-3">Contact</th>
                            <th className="py-2.5 px-3">Location</th>
                            <th className="py-2.5 px-3">Assigned Rep</th>
                            <th className="py-2.5 px-3">Segment</th>
                            <th className="py-2.5 px-3">Payment Terms</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {parsedCustomers.slice(0, 5).map((row, idx) => (
                            <tr key={idx} className="hover:bg-muted/20">
                              <td className="py-2 px-3 font-medium text-foreground">
                                {row.name}
                                <span className="block text-[11px] text-muted-foreground">
                                  {row.customer_type.toUpperCase()}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-muted-foreground">
                                <div>{row.email || '—'}</div>
                                <div className="text-[11px]">{row.phone || '—'}</div>
                              </td>
                              <td className="py-2 px-3 text-muted-foreground">
                                {row.city}{row.region ? `, ${row.region}` : ''}
                              </td>
                              <td className="py-2 px-3 text-foreground font-medium">
                                {row.assigned_rep}
                              </td>
                              <td className="py-2 px-3">
                                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium bg-slate-100 text-slate-700 capitalize">
                                  {row.segment.replace('_', ' ')}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-muted-foreground uppercase text-[11px]">
                                {row.payment_terms.replace('_', ' ')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {parsedCustomers.length > 5 && (
                      <div className="py-2 px-3 bg-muted/20 text-center text-xs text-muted-foreground border-t border-border">
                        + {parsedCustomers.length - 5} additional customer records will be imported
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t border-border bg-muted/20">
              <span className="text-xs text-muted-foreground">
                Current directory: <strong className="text-foreground">{allCustomers.length} customers</strong>
                {parsedCustomers.length > 0 && (
                  <> → After import: <strong className="text-emerald-700">~{allCustomers.length + parsedCustomers.length} customers</strong></>
                )}
              </span>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsImportModalOpen(false);
                    setImportFile(null);
                    setParsedCustomers([]);
                    setImportError('');
                  }}
                  className="btn-secondary h-9 px-4 text-[13px] font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={parsedCustomers.length === 0 || isImporting}
                  className="btn-primary h-9 px-4 text-[13px] font-medium disabled:opacity-50 flex items-center gap-2"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Importing...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      <span>Import {parsedCustomers.length > 0 ? `${parsedCustomers.length} Customers` : ''}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
