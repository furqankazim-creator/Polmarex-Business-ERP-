// Premier Polmarex ERP API Client
const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error || `Request failed with status ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn(`[API] ${endpoint} error:`, err.message);
    throw err;
  }
}

export const api = {
  // System & Overview
  getHealth: () => request('/health'),
  getOverview: () => request('/overview'),
  getEntities: () => request('/entities'),

  // Products
  getProducts: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/products${query ? `?${query}` : ''}`);
  },
  createProduct: (data) => request('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id, data) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }),

  // Orders
  getOrders: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/orders${query ? `?${query}` : ''}`);
  },
  createOrder: (data) => request('/orders', { method: 'POST', body: JSON.stringify(data) }),
  updateOrderStatus: (id, status) =>
    request(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  updateOrder: (id, data) => request(`/orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Inventory
  getInventory: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/inventory${query ? `?${query}` : ''}`);
  },
  logInventoryMovement: (data) =>
    request('/inventory/movement', { method: 'POST', body: JSON.stringify(data) }),

  // Receivables & Invoices
  getReceivables: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/receivables${query ? `?${query}` : ''}`);
  },
  recordPayment: (data) =>
    request('/receivables/payment', { method: 'POST', body: JSON.stringify(data) }),

  // Customers
  getCustomers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/customers${query ? `?${query}` : ''}`);
  },
  createCustomer: (data) => request('/customers', { method: 'POST', body: JSON.stringify(data) }),
  updateCustomer: (id, data) => request(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  importCustomers: (customers) =>
    request('/customers/import', { method: 'POST', body: JSON.stringify({ customers }) }),

  // Wholesale Leads
  getLeads: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/leads${query ? `?${query}` : ''}`);
  },
  createLead: (data) => request('/leads', { method: 'POST', body: JSON.stringify(data) }),
  updateLeadStage: (id, status) =>
    request(`/leads/${id}/stage`, { method: 'PUT', body: JSON.stringify({ status }) }),

  // Sales Representatives
  getRepresentatives: () => request('/representatives'),

  // Tasks & Approvals
  getTasks: () => request('/tasks'),
  approveTask: (id) => request(`/tasks/${id}/approve`, { method: 'POST' }),
  rejectTask: (id) => request(`/tasks/${id}/reject`, { method: 'POST' }),

  // Notifications
  getNotifications: () => request('/notifications'),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () => request('/notifications/mark-all-read', { method: 'PUT' }),

  // Integrations
  getIntegrations: () => request('/integrations'),
  syncIntegration: (id) => request(`/integrations/${id}/sync`, { method: 'POST' }),
  saveIntegrationCredentials: (id, data) =>
    request(`/integrations/${id}/credentials`, { method: 'PUT', body: JSON.stringify(data) }),

  // Users & Invites
  inviteUser: (data) => request('/users/invite', { method: 'POST', body: JSON.stringify(data) }),

  // CSV Export Download
  downloadExport: (type) => {
    const link = document.createElement('a');
    link.href = `/api/export/${type}`;
    link.download = `${type}_export.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

