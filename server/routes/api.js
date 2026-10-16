import express from 'express';
import {
  getAll,
  getById,
  insert,
  update,
  remove,
  getFullDB
} from '../db.js';

const router = express.Router();

// Helper to convert array of objects to CSV
function toCSV(items, fields) {
  if (!items || !items.length) return '';
  const headers = fields || Object.keys(items[0]);
  const rows = items.map((item) =>
    headers
      .map((header) => {
        let val = item[header] === undefined || item[header] === null ? '' : item[header];
        if (typeof val === 'object') val = JSON.stringify(val);
        val = String(val).replace(/"/g, '""');
        return `"${val}"`;
      })
      .join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

// -----------------------------------------------------------------------------
// 1. SYSTEM & OVERVIEW
// -----------------------------------------------------------------------------

router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    serverTime: new Date().toISOString(),
    name: 'Premier Polmarex ERP Backend',
    version: '1.0.0'
  });
});

// Full state payload for fast hydration & sync
router.get('/entities', (req, res) => {
  res.json(getFullDB());
});

// Overview KPI Statistics
router.get('/overview', (req, res) => {
  const orders = getAll('Order');
  const invoices = getAll('Invoice');
  const inventory = getAll('InventoryRecord');
  const customers = getAll('Customer');
  const leads = getAll('Lead');
  const tasks = getAll('Task');

  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const pendingOrders = orders.filter((o) => o.status === 'pending' || o.status === 'processing').length;
  const overdueInvoices = invoices.filter((i) => i.status === 'overdue' || (Number(i.days_overdue) || 0) > 0);
  const totalReceivables = invoices.reduce((sum, i) => sum + (Number(i.balance) || 0), 0);
  const lowStockCount = inventory.filter((i) => (Number(i.quantity_on_hand) || 0) <= (Number(i.reorder_point) || 0)).length;
  const pendingApprovals = tasks.filter((t) => t.approval_status === 'pending').length;

  res.json({
    kpi: {
      totalRevenue,
      pendingOrders,
      overdueInvoices: overdueInvoices.length,
      totalReceivables,
      lowStockCount,
      activeCustomers: customers.length,
      pipelineLeads: leads.length,
      pendingApprovals
    },
    recentOrders: orders.slice(0, 8),
    criticalAlerts: getAll('Notification').slice(0, 5)
  });
});

// -----------------------------------------------------------------------------
// 2. PRODUCTS
// -----------------------------------------------------------------------------

router.get('/products', (req, res) => {
  let products = getAll('Product');
  const { category, brand, movement, search } = req.query;

  if (category && category !== 'all') {
    products = products.filter((p) => p.category === category);
  }
  if (brand && brand !== 'all') {
    products = products.filter((p) => p.brand === brand);
  }
  if (movement && movement !== 'all') {
    products = products.filter((p) => (p.movement_class || '').toLowerCase() === movement.toLowerCase());
  }
  if (search) {
    const q = search.toLowerCase();
    products = products.filter(
      (p) =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.brand && p.brand.toLowerCase().includes(q))
    );
  }

  res.json(products);
});

router.post('/products', (req, res) => {
  const product = insert('Product', req.body);
  res.status(201).json(product);
});

router.put('/products/:id', (req, res) => {
  const updated = update('Product', req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Product not found' });
  res.json(updated);
});

router.delete('/products/:id', (req, res) => {
  const ok = remove('Product', req.params.id);
  if (!ok) return res.status(404).json({ error: 'Product not found' });
  res.json({ success: true, id: req.params.id });
});

// -----------------------------------------------------------------------------
// 3. ORDERS
// -----------------------------------------------------------------------------

router.get('/orders', (req, res) => {
  let orders = getAll('Order');
  const { status, channel, rep, search } = req.query;

  if (status && status !== 'all') {
    orders = orders.filter((o) => o.status === status);
  }
  if (channel && channel !== 'all') {
    orders = orders.filter((o) => (o.channel || '').toLowerCase() === channel.toLowerCase());
  }
  if (rep && rep !== 'all') {
    orders = orders.filter((o) => o.assigned_rep === rep || o.rep_name === rep);
  }
  if (search) {
    const q = search.toLowerCase();
    orders = orders.filter(
      (o) =>
        (o.order_number && o.order_number.toLowerCase().includes(q)) ||
        (o.customer_name && o.customer_name.toLowerCase().includes(q))
    );
  }

  res.json(orders);
});

router.post('/orders', (req, res) => {
  const orderNumber = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
  const newOrder = insert('Order', {
    order_number: orderNumber,
    status: 'pending',
    order_date: new Date().toISOString().slice(0, 10),
    ...req.body
  });
  res.status(201).json(newOrder);
});

router.put('/orders/:id/status', (req, res) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'Missing status' });

  const updated = update('Order', req.params.id, { status });
  if (!updated) return res.status(404).json({ error: 'Order not found' });

  // Add audit log entry
  insert('AuditLog', {
    user_name: 'Furqan Kazim',
    action: `order.status.${status}`,
    entity_type: 'Order',
    entity_id: req.params.id,
    summary: `Order status changed to ${status}`
  });

  res.json(updated);
});

router.put('/orders/:id', (req, res) => {
  const updated = update('Order', req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Order not found' });
  res.json(updated);
});

// -----------------------------------------------------------------------------
// 4. INVENTORY & MOVEMENTS
// -----------------------------------------------------------------------------

router.get('/inventory', (req, res) => {
  let records = getAll('InventoryRecord');
  const { warehouse, status, brand, search } = req.query;

  if (warehouse && warehouse !== 'all') {
    records = records.filter((r) => r.warehouse === warehouse);
  }
  if (brand && brand !== 'all') {
    records = records.filter((r) => r.brand === brand);
  }
  if (status && status !== 'all') {
    records = records.filter((r) => {
      const q = Number(r.quantity_on_hand) || 0;
      const reorder = Number(r.reorder_point) || 0;
      if (status === 'out') return q <= 0;
      if (status === 'low') return q > 0 && q <= reorder;
      if (status === 'ok') return q > reorder && q <= reorder * 3;
      if (status === 'overstock') return q > reorder * 3;
      return true;
    });
  }
  if (search) {
    const q = search.toLowerCase();
    records = records.filter(
      (r) =>
        (r.product_name && r.product_name.toLowerCase().includes(q)) ||
        (r.sku && r.sku.toLowerCase().includes(q))
    );
  }

  res.json(records);
});

router.post('/inventory/movement', (req, res) => {
  const { sku, type, warehouse, quantity, reference, note } = req.body;
  if (!sku || !quantity) {
    return res.status(400).json({ error: 'Missing required fields (sku, quantity)' });
  }

  // 1. Record movement
  const movement = insert('InventoryMovement', {
    sku,
    type: type || 'adjustment',
    warehouse: warehouse || 'Toronto Main (Vaughan)',
    quantity: Number(quantity),
    reference: reference || 'MANUAL-' + Date.now(),
    note: note || 'Manual adjustment via ERP',
    timestamp: new Date().toISOString()
  });

  // 2. Update stock level in InventoryRecord
  const records = getAll('InventoryRecord');
  const target = records.find((r) => r.sku === sku && (!warehouse || r.warehouse === warehouse));
  if (target) {
    const delta = type === 'damage' || type === 'transfer_out' ? -Math.abs(Number(quantity)) : Number(quantity);
    const newQty = Math.max(0, (Number(target.quantity_on_hand) || 0) + delta);
    update('InventoryRecord', target.id, { quantity_on_hand: newQty });
  }

  res.status(201).json(movement);
});

// -----------------------------------------------------------------------------
// 5. RECEIVABLES & PAYMENTS
// -----------------------------------------------------------------------------

router.get('/receivables', (req, res) => {
  let invoices = getAll('Invoice');
  const { aging, status, rep, search } = req.query;

  if (status && status !== 'all') {
    invoices = invoices.filter((i) => i.status === status);
  }
  if (rep && rep !== 'all') {
    invoices = invoices.filter((i) => i.rep_name === rep);
  }
  if (search) {
    const q = search.toLowerCase();
    invoices = invoices.filter(
      (i) =>
        (i.invoice_number && i.invoice_number.toLowerCase().includes(q)) ||
        (i.customer_name && i.customer_name.toLowerCase().includes(q))
    );
  }

  res.json(invoices);
});

router.post('/receivables/payment', (req, res) => {
  const { invoice_id, amount, method, reference, payment_date } = req.body;
  if (!amount) {
    return res.status(400).json({ error: 'Payment amount is required' });
  }

  // Record payment
  const payment = insert('Payment', {
    invoice_id,
    amount: Number(amount),
    payment_method: method || 'e_transfer',
    reference: reference || 'PAY-' + Date.now(),
    payment_date: payment_date || new Date().toISOString().slice(0, 10),
    status: 'cleared'
  });

  // If applied to invoice, reduce balance
  if (invoice_id) {
    const inv = getById('Invoice', invoice_id);
    if (inv) {
      const newBalance = Math.max(0, (Number(inv.balance) || 0) - Number(amount));
      const newStatus = newBalance === 0 ? 'paid' : 'partial';
      update('Invoice', invoice_id, {
        balance: newBalance,
        status: newStatus
      });
    }
  }

  res.status(201).json(payment);
});

// -----------------------------------------------------------------------------
// 6. CUSTOMERS
// -----------------------------------------------------------------------------

router.get('/customers', (req, res) => {
  let customers = getAll('Customer');
  const { rep, type, search } = req.query;

  if (rep && rep !== 'all') {
    customers = customers.filter((c) => c.assigned_rep === rep);
  }
  if (type && type !== 'all') {
    customers = customers.filter((c) => c.customer_type === type);
  }
  if (search) {
    const q = search.toLowerCase();
    customers = customers.filter(
      (c) =>
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.city && c.city.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q))
    );
  }

  res.json(customers);
});

router.post('/customers', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Customer name is required' });

  const customer = insert('Customer', {
    total_spend: 0,
    outstanding_balance: 0,
    credit_limit: 10000,
    order_count: 0,
    status: 'active',
    ...req.body
  });

  res.status(201).json(customer);
});

router.put('/customers/:id', (req, res) => {
  const updated = update('Customer', req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Customer not found' });
  res.json(updated);
});

router.post('/customers/import', (req, res) => {
  const { customers } = req.body;
  if (!Array.isArray(customers) || customers.length === 0) {
    return res.status(400).json({ error: 'Valid customers array is required' });
  }

  const existingCustomers = getAll('Customer');
  let addedCount = 0;
  let updatedCount = 0;
  const processed = [];

  customers.forEach((row) => {
    if (!row.name || !String(row.name).trim()) return;

    const rowName = String(row.name).trim().toLowerCase();
    const rowEmail = row.email ? String(row.email).trim().toLowerCase() : null;

    // Find existing customer by exact or case-insensitive name or email
    const existingIndex = existingCustomers.findIndex((c) => {
      const cName = c.name ? String(c.name).trim().toLowerCase() : '';
      const cEmail = c.email ? String(c.email).trim().toLowerCase() : '';
      return cName === rowName || (rowEmail && cEmail && cEmail === rowEmail);
    });

    if (existingIndex !== -1) {
      // Customer already exists -> UPDATE / ENRICH details without removing previous data
      const existing = existingCustomers[existingIndex];
      const merged = {
        ...existing,
        ...row,
        // Preserve crucial metrics if imported row has null/0
        total_spend: Number(row.total_spend) > 0 ? Number(row.total_spend) : (existing.total_spend || 0),
        order_count: Number(row.order_count) > 0 ? Number(row.order_count) : (existing.order_count || 0),
        outstanding_balance: row.outstanding_balance !== undefined && row.outstanding_balance !== ''
          ? Number(row.outstanding_balance)
          : (existing.outstanding_balance || 0),
        preferred_categories: Array.isArray(row.preferred_categories) && row.preferred_categories.length > 0
          ? row.preferred_categories
          : (existing.preferred_categories || []),
        updated_date: new Date().toISOString()
      };
      existingCustomers[existingIndex] = merged;
      updatedCount++;
      processed.push(merged);
    } else {
      // New customer -> INSERT without removing anything
      const newCust = {
        id: 'cust_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        name: String(row.name).trim(),
        customer_type: row.customer_type || 'b2b',
        business_unit: row.business_unit || 'PRM',
        segment: row.segment || 'active',
        email: row.email || '',
        phone: row.phone || '',
        address: row.address || '',
        city: row.city || 'Toronto',
        region: row.region || 'Ontario',
        assigned_rep: row.assigned_rep || 'Daniel Kowalski',
        last_order_date: row.last_order_date || new Date().toISOString().slice(0, 10),
        order_count: Number(row.order_count) || 1,
        avg_order_value: Number(row.avg_order_value) || (Number(row.total_spend) ? Math.round(Number(row.total_spend) / Math.max(1, Number(row.order_count) || 1)) : 250),
        total_spend: Number(row.total_spend) || 500,
        outstanding_balance: Number(row.outstanding_balance) || 0,
        credit_limit: Number(row.credit_limit) || 10000,
        payment_terms: row.payment_terms || 'net_30',
        preferred_categories: Array.isArray(row.preferred_categories)
          ? row.preferred_categories
          : typeof row.preferred_categories === 'string'
            ? row.preferred_categories.split(',').map((s) => s.trim()).filter(Boolean)
            : ['Herbal & Fruit Tea', 'Specialty Jams'],
        notes: row.notes || 'Imported from Excel spreadsheet',
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString()
      };
      existingCustomers.unshift(newCust);
      addedCount++;
      processed.push(newCust);
    }
  });

  saveDB();

  res.json({
    success: true,
    added: addedCount,
    updated: updatedCount,
    total: existingCustomers.length,
    customers: existingCustomers
  });
});

// -----------------------------------------------------------------------------
// 7. WHOLESALE LEADS
// -----------------------------------------------------------------------------

router.get('/leads', (req, res) => {
  let leads = getAll('Lead');
  const { stage, source, type, rep, search } = req.query;

  if (stage && stage !== 'all') leads = leads.filter((l) => l.status === stage);
  if (source && source !== 'all') leads = leads.filter((l) => l.source === source);
  if (type && type !== 'all') leads = leads.filter((l) => l.customer_type === type);
  if (rep && rep !== 'all') leads = leads.filter((l) => l.assigned_rep === rep);
  if (search) {
    const q = search.toLowerCase();
    leads = leads.filter(
      (l) =>
        (l.company_name && l.company_name.toLowerCase().includes(q)) ||
        (l.contact_name && l.contact_name.toLowerCase().includes(q))
    );
  }

  res.json(leads);
});

router.post('/leads', (req, res) => {
  const { company_name } = req.body;
  if (!company_name) return res.status(400).json({ error: 'Company name is required' });

  const lead = insert('Lead', {
    status: 'new',
    score: Math.floor(60 + Math.random() * 35),
    ...req.body
  });

  res.status(201).json(lead);
});

router.put('/leads/:id/stage', (req, res) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'Status is required' });

  const updated = update('Lead', req.params.id, { status });
  if (!updated) return res.status(404).json({ error: 'Lead not found' });
  res.json(updated);
});

// -----------------------------------------------------------------------------
// 8. SALES REPRESENTATIVES & TARGETS
// -----------------------------------------------------------------------------

router.get('/representatives', (req, res) => {
  const reps = getAll('Representative');
  const targets = getAll('SalesTarget');
  const visits = getAll('CustomerVisit');

  const fullReps = reps.map((r) => {
    const repTarget = targets.find((t) => t.representative_id === r.id);
    const repVisits = visits.filter((v) => v.representative_id === r.id);
    return {
      ...r,
      target: repTarget || null,
      visits_count: repVisits.length
    };
  });

  res.json(fullReps);
});

// -----------------------------------------------------------------------------
// 9. TASKS & APPROVALS
// -----------------------------------------------------------------------------

router.get('/tasks', (req, res) => {
  res.json(getAll('Task'));
});

router.post('/tasks/:id/approve', (req, res) => {
  const updated = update('Task', req.params.id, {
    approval_status: 'approved',
    status: 'completed'
  });
  if (!updated) return res.status(404).json({ error: 'Task not found' });

  insert('AuditLog', {
    user_name: 'Furqan Kazim',
    action: 'task.approved',
    entity_type: 'Task',
    entity_id: req.params.id,
    summary: `Task ${req.params.id} approved`
  });

  res.json({ success: true, task: updated });
});

router.post('/tasks/:id/reject', (req, res) => {
  const updated = update('Task', req.params.id, {
    approval_status: 'rejected',
    status: 'cancelled'
  });
  if (!updated) return res.status(404).json({ error: 'Task not found' });

  insert('AuditLog', {
    user_name: 'Furqan Kazim',
    action: 'task.rejected',
    entity_type: 'Task',
    entity_id: req.params.id,
    summary: `Task ${req.params.id} rejected`
  });

  res.json({ success: true, task: updated });
});

// -----------------------------------------------------------------------------
// 10. NOTIFICATIONS
// -----------------------------------------------------------------------------

router.get('/notifications', (req, res) => {
  res.json(getAll('Notification'));
});

router.put('/notifications/:id/read', (req, res) => {
  const updated = update('Notification', req.params.id, { read: true });
  if (!updated) return res.status(404).json({ error: 'Notification not found' });
  res.json(updated);
});

router.put('/notifications/mark-all-read', (req, res) => {
  const notifs = getAll('Notification');
  notifs.forEach((n) => {
    n.read = true;
  });
  res.json({ success: true, count: notifs.length });
});

// -----------------------------------------------------------------------------
// 11. INTEGRATIONS
// -----------------------------------------------------------------------------

router.get('/integrations', (req, res) => {
  res.json(getAll('IntegrationConfig'));
});

router.post('/integrations/:id/sync', (req, res) => {
  const config = getById('IntegrationConfig', req.params.id);
  if (!config) return res.status(404).json({ error: 'Integration not found' });

  const updated = update('IntegrationConfig', req.params.id, {
    last_sync: new Date().toISOString(),
    sync_status: 'success'
  });

  insert('AuditLog', {
    user_name: 'Furqan Kazim',
    action: 'integration.synced',
    entity_type: 'IntegrationConfig',
    entity_id: req.params.id,
    summary: `Triggered sync for ${config.name}`
  });

  res.json({ success: true, integration: updated });
});

router.put('/integrations/:id/credentials', (req, res) => {
  const { apiKey, endpoint } = req.body;
  const updated = update('IntegrationConfig', req.params.id, {
    api_key: apiKey ? '••••••••' + apiKey.slice(-4) : undefined,
    endpoint: endpoint || undefined,
    sync_status: 'connected',
    last_sync: new Date().toISOString()
  });

  if (!updated) return res.status(404).json({ error: 'Integration not found' });
  res.json({ success: true, integration: updated });
});

// -----------------------------------------------------------------------------
// 12. USERS & INVITES
// -----------------------------------------------------------------------------

router.post('/users/invite', (req, res) => {
  const { email, role, business_unit } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const invite = {
    id: 'inv_' + Date.now(),
    email,
    role: role || 'Sales Representative',
    business_unit: business_unit || 'All companies',
    invited_by: 'Furqan Kazim',
    status: 'pending',
    sent_date: new Date().toISOString()
  };

  insert('AuditLog', {
    user_name: 'Furqan Kazim',
    action: 'user.invited',
    entity_type: 'User',
    summary: `Invited ${email} as ${role}`
  });

  res.status(201).json({ success: true, invite });
});

// -----------------------------------------------------------------------------
// 13. CSV EXPORTS
// -----------------------------------------------------------------------------

router.get('/export/:type', (req, res) => {
  const type = req.params.type.toLowerCase();
  let items = [];
  let filename = `${type}_export_${new Date().toISOString().slice(0, 10)}.csv`;

  switch (type) {
    case 'products':
      items = getAll('Product');
      break;
    case 'orders':
      items = getAll('Order');
      break;
    case 'inventory':
      items = getAll('InventoryRecord');
      break;
    case 'receivables':
    case 'invoices':
      items = getAll('Invoice');
      break;
    case 'customers':
      items = getAll('Customer');
      break;
    case 'leads':
      items = getAll('Lead');
      break;
    default:
      return res.status(400).json({ error: 'Unknown export type' });
  }

  const csv = toCSV(items);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
});

export default router;

