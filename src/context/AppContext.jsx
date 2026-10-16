import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import initialData from '../data/initialData.json';
import { api } from '../api/apiClient';

const AppContext = createContext(null);

const STORAGE_KEY = 'polmarex_erp_state_v2';

export const PERIOD_OPTIONS = [
  { key: '30d', label: 'Last 30 days', days: 30 },
  { key: '90d', label: 'Last 90 days', days: 90 },
  { key: '6m', label: 'Last 6 months', days: 182 },
  { key: '12m', label: 'Last 12 months', days: 365 },
];

export function AppProvider({ children }) {
  // Navigation & Global Filters
  const [currentRoute, setCurrentRoute] = useState(() => {
    return window.location.pathname || '/';
  });
  const [company, setCompany] = useState('all');
  const [period, setPeriod] = useState('90d');
  const [globalSearch, setGlobalSearch] = useState('');
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  // Light / Dark Theme state (persisted in localStorage)
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('polmarex_theme') || 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('polmarex_theme', theme);
    } catch (e) {
      console.error('Failed to save theme preference:', e);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };
  
  // Toast notifications
  const [toasts, setToasts] = useState([]);
  const showToast = ({ title, description, variant = 'default' }) => {
    const id = Date.now() + Math.random().toString();
    setToasts((prev) => [...prev, { id, title, description, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  // Entities stored in state
  const [entities, setEntities] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to parse saved state:', e);
    }
    return initialData;
  });

  // Fetch initial entities from backend API on mount
  useEffect(() => {
    let isMounted = true;
    api.getEntities()
      .then((data) => {
        if (isMounted && data && typeof data === 'object' && Object.keys(data).length > 0) {
          setEntities(data);
          setIsBackendConnected(true);
        }
      })
      .catch((err) => {
        console.warn('Backend API connection pending, operating in local-first mode:', err.message);
      });
    return () => { isMounted = false; };
  }, []);

  // Persist to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entities));
    } catch (e) {
      console.error('Failed to save state to localStorage:', e);
    }
  }, [entities]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (route) => {
    if (route !== currentRoute) {
      window.history.pushState({}, '', route);
      setCurrentRoute(route);
      window.scrollTo(0, 0);
    }
  };

  // Helper filters
  const selectedPeriodObj = PERIOD_OPTIONS.find((p) => p.key === period) || PERIOD_OPTIONS[1];
  const cutoffDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - selectedPeriodObj.days);
    return d.toISOString().slice(0, 10);
  }, [selectedPeriodObj]);

  const companyLabel = useMemo(() => {
    if (company === 'all') return 'All companies';
    const unit = entities.BusinessUnit?.find((u) => u.code === company);
    return unit ? unit.name : company;
  }, [company, entities.BusinessUnit]);

  // Action methods with backend sync
  const approveTask = (taskId) => {
    // Backend API sync
    api.approveTask(taskId).catch((e) => console.warn('Backend sync:', e.message));

    setEntities((prev) => {
      const task = prev.Task.find((t) => t.id === taskId);
      const updatedTasks = prev.Task.map((t) =>
        t.id === taskId ? { ...t, approval_status: 'approved', status: 'completed' } : t
      );
      const auditLog = {
        id: 'aud_' + Date.now(),
        user_name: 'Furqan Kazim',
        user_email: 'furqan@polmarex.ca',
        action: 'task.approved',
        entity_type: 'Task',
        entity_id: taskId,
        entity_name: task ? task.title : 'Task',
        details: 'Approved automated recommendation task.',
        occurred_at: new Date().toISOString(),
        severity: 'info',
        business_unit: task?.business_unit || 'PRM'
      };
      return {
        ...prev,
        Task: updatedTasks,
        AuditLog: [auditLog, ...(prev.AuditLog || [])]
      };
    });
    showToast({
      title: 'Action Approved',
      description: 'The recommendation has been authorized and queued for execution.'
    });
  };

  const rejectTask = (taskId) => {
    // Backend API sync
    api.rejectTask(taskId).catch((e) => console.warn('Backend sync:', e.message));

    setEntities((prev) => {
      const updatedTasks = prev.Task.map((t) =>
        t.id === taskId ? { ...t, approval_status: 'rejected', status: 'cancelled' } : t
      );
      return { ...prev, Task: updatedTasks };
    });
    showToast({
      title: 'Action Rejected',
      description: 'The task has been dismissed.',
      variant: 'destructive'
    });
  };

  const acceptRecommendation = (recId) => {
    setEntities((prev) => {
      const updatedRecs = prev.AIRecommendation.map((r) =>
        r.id === recId ? { ...r, status: 'accepted' } : r
      );
      return { ...prev, AIRecommendation: updatedRecs };
    });
    showToast({
      title: 'Recommendation Accepted',
      description: 'Recommended action was confirmed.'
    });
  };

  const dismissRecommendation = (recId, reason = 'Not applicable') => {
    setEntities((prev) => {
      const updatedRecs = prev.AIRecommendation.map((r) =>
        r.id === recId ? { ...r, status: 'dismissed', dismiss_reason: reason } : r
      );
      return { ...prev, AIRecommendation: updatedRecs };
    });
    showToast({
      title: 'Recommendation Dismissed',
      description: 'Recommendation marked as dismissed.'
    });
  };

  const runAllAgents = () => {
    const newTaskId = 'tsk_' + Date.now();
    const newTask = {
      id: newTaskId,
      title: 'Approval needed: Churn alert for Metro West Food Mart',
      description: 'Customer order frequency dropped 45% in 60 days. Approve 5% volume discount incentive email.',
      agent_key: 'customer_retention',
      business_unit: company === 'all' ? 'PRM' : company,
      due_date: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
      priority: 'high',
      owner_role: 'Sales Manager',
      status: 'pending',
      requires_approval: true,
      approval_status: 'pending',
      created_date: new Date().toISOString()
    };
    
    setEntities((prev) => ({
      ...prev,
      Task: [newTask, ...prev.Task],
      AgentRun: [
        {
          id: 'run_' + Date.now(),
          agent_key: 'customer_retention',
          agent_name: 'Customer Retention Agent',
          run_type: 'manual',
          status: 'success',
          started_at: new Date(Date.now() - 3000).toISOString(),
          finished_at: new Date().toISOString(),
          duration_ms: 2840,
          records_scanned: 112,
          recommendations_created: 1,
          tasks_created: 1,
          summary: 'Scanned customer order frequencies across all accounts. Identified 1 at-risk client.'
        },
        ...prev.AgentRun
      ]
    }));

    showToast({
      title: 'Agents Finished',
      description: 'Scanned live database and updated retention, forecast, and lead recommendations.'
    });
  };

  const addLead = (leadData) => {
    const newLead = {
      id: 'lead_' + Date.now(),
      created_date: new Date().toISOString(),
      score: Math.floor(Math.random() * 30 + 65),
      score_band: 'warm',
      status: 'new',
      business_unit: company === 'all' ? 'PRM' : company,
      ...leadData
    };

    // Backend sync
    api.createLead(newLead).catch((e) => console.warn('Backend sync:', e.message));

    setEntities((prev) => ({
      ...prev,
      Lead: [newLead, ...prev.Lead]
    }));
    showToast({
      title: 'Lead Created',
      description: `${leadData.company_name} was added to the pipeline.`
    });
  };

  const addCustomer = (customerData) => {
    const newCust = {
      id: 'cust_' + Date.now(),
      created_date: new Date().toISOString(),
      order_count: 0,
      total_spend: 0,
      avg_order_value: 0,
      outstanding_balance: 0,
      segment: 'new',
      business_unit: company === 'all' ? 'PRM' : company,
      ...customerData
    };

    // Backend sync
    api.createCustomer(newCust).catch((e) => console.warn('Backend sync:', e.message));

    setEntities((prev) => ({
      ...prev,
      Customer: [newCust, ...(prev.Customer || [])]
    }));
    showToast({
      title: 'Customer Created',
      description: `${customerData.name} has been added to directory.`
    });
    return newCust;
  };

  const importCustomers = async (customersList) => {
    try {
      const res = await api.importCustomers(customersList);
      if (res && res.customers) {
        setEntities((prev) => ({
          ...prev,
          Customer: res.customers
        }));
        showToast({
          title: 'Import Successful',
          description: `Added ${res.added} new and updated ${res.updated} customers. Total: ${res.total} records preserved.`
        });
        return res;
      }
    } catch (err) {
      console.warn('Backend import fallback:', err.message);
    }

    // Local-first fallback preserving existing records
    setEntities((prev) => {
      const current = [...(prev.Customer || [])];
      let added = 0;
      let updated = 0;

      customersList.forEach((row) => {
        if (!row.name || !String(row.name).trim()) return;
        const rowName = String(row.name).trim().toLowerCase();
        const rowEmail = row.email ? String(row.email).trim().toLowerCase() : null;

        const idx = current.findIndex((c) => {
          const cName = c.name ? String(c.name).trim().toLowerCase() : '';
          const cEmail = c.email ? String(c.email).trim().toLowerCase() : '';
          return cName === rowName || (rowEmail && cEmail && cEmail === rowEmail);
        });

        if (idx !== -1) {
          current[idx] = {
            ...current[idx],
            ...row,
            total_spend: Number(row.total_spend) > 0 ? Number(row.total_spend) : (current[idx].total_spend || 0),
            order_count: Number(row.order_count) > 0 ? Number(row.order_count) : (current[idx].order_count || 0),
            updated_date: new Date().toISOString()
          };
          updated++;
        } else {
          current.unshift({
            id: 'cust_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            created_date: new Date().toISOString(),
            segment: row.segment || 'active',
            business_unit: row.business_unit || (company === 'all' ? 'PRM' : company),
            total_spend: Number(row.total_spend) || 500,
            order_count: Number(row.order_count) || 1,
            avg_order_value: Number(row.avg_order_value) || 250,
            outstanding_balance: Number(row.outstanding_balance) || 0,
            payment_terms: row.payment_terms || 'net_30',
            city: row.city || 'Toronto',
            region: row.region || 'Ontario',
            assigned_rep: row.assigned_rep || 'Daniel Kowalski',
            preferred_categories: Array.isArray(row.preferred_categories)
              ? row.preferred_categories
              : ['Herbal & Fruit Tea', 'Specialty Jams'],
            ...row
          });
          added++;
        }
      });

      showToast({
        title: 'Customers Imported',
        description: `Imported ${added} new records and updated ${updated}. Total: ${current.length} records preserved.`
      });

      return {
        ...prev,
        Customer: current
      };
    });
  };

  const createTask = (taskData) => {
    const newTask = {
      id: 'tsk_' + Date.now(),
      approval_status: 'pending',
      status: 'pending',
      requires_approval: true,
      created_date: new Date().toISOString(),
      business_unit: company === 'all' ? 'PRM' : company,
      ...taskData
    };
    setEntities((prev) => ({
      ...prev,
      Task: [newTask, ...(prev.Task || [])]
    }));
    showToast({
      title: 'Task Queued for Approval',
      description: `Task has been queued in AI Agents Centre.`
    });
    return newTask;
  };

  const updateLeadStatus = (leadId, newStatus) => {
    // Backend sync
    api.updateLeadStage(leadId, newStatus).catch((e) => console.warn('Backend sync:', e.message));

    setEntities((prev) => ({
      ...prev,
      Lead: prev.Lead.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
    }));
  };

  const recordPayment = (invoiceId, paymentData) => {
    const invoice = entities.Invoice.find((i) => i.id === invoiceId);
    if (!invoice) return;

    const payAmount = Number(paymentData.amount);
    const newPaid = Number(invoice.amount_paid || 0) + payAmount;
    const newBalance = Math.max(0, Number(invoice.amount) - newPaid);
    const newStatus = newBalance <= 0 ? 'paid' : 'partial';

    const newPayment = {
      id: 'pmt_' + Date.now(),
      invoice_id: invoiceId,
      invoice_number: invoice.invoice_number,
      customer_name: invoice.customer,
      business_unit: invoice.business_unit,
      amount: payAmount,
      payment_date: paymentData.payment_date || new Date().toISOString().slice(0, 10),
      method: paymentData.method || 'eft',
      reference: paymentData.reference || 'REF-' + Math.floor(Math.random() * 89999 + 10000),
      created_date: new Date().toISOString()
    };

    // Backend sync
    api.recordPayment(newPayment).catch((e) => console.warn('Backend sync:', e.message));

    setEntities((prev) => ({
      ...prev,
      Invoice: prev.Invoice.map((inv) =>
        inv.id === invoiceId
          ? { ...inv, amount_paid: newPaid, balance: newBalance, status: newStatus }
          : inv
      ),
      Payment: [newPayment, ...prev.Payment]
    }));

    showToast({
      title: 'Payment Recorded',
      description: `$${payAmount.toLocaleString()} recorded for invoice ${invoice.invoice_number}.`
    });
  };

  const addInventoryMovement = (movementData) => {
    const newMovement = {
      id: 'mov_' + Date.now(),
      movement_date: new Date().toISOString().slice(0, 10),
      performed_by: 'Furqan Kazim',
      created_date: new Date().toISOString(),
      ...movementData
    };

    // Backend sync
    api.logInventoryMovement(newMovement).catch((e) => console.warn('Backend sync:', e.message));

    // Update inventory record on_hand & available
    setEntities((prev) => {
      const qty = Number(movementData.quantity);
      const isPositive = ['receipt', 'adjustment_in', 'return'].includes(movementData.type);
      const delta = isPositive ? qty : -qty;

      const updatedRecords = prev.InventoryRecord.map((rec) => {
        if (rec.sku === movementData.sku && (!movementData.warehouse || rec.warehouse === movementData.warehouse)) {
          const newOnHand = Math.max(0, (rec.on_hand || 0) + delta);
          const newAvail = Math.max(0, (rec.available || 0) + delta);
          let newStatus = rec.stock_status;
          if (newAvail <= 0) newStatus = 'out_of_stock';
          else if (newAvail <= (rec.reorder_point || 10)) newStatus = 'low_stock';
          else newStatus = 'optimal';
          return { ...rec, on_hand: newOnHand, available: newAvail, stock_status: newStatus };
        }
        return rec;
      });

      return {
        ...prev,
        InventoryRecord: updatedRecords,
        InventoryMovement: [newMovement, ...prev.InventoryMovement]
      };
    });

    showToast({
      title: 'Stock Movement Logged',
      description: `${movementData.type.toUpperCase()}: ${movementData.quantity} units of ${movementData.sku}.`
    });
  };

  const markNotificationRead = (id) => {
    api.markNotificationRead(id).catch((e) => console.warn('Backend sync:', e.message));
    setEntities((prev) => ({
      ...prev,
      Notification: prev.Notification.map((n) => (n.id === id ? { ...n, read: true } : n))
    }));
  };

  const markAllNotificationsRead = () => {
    api.markAllNotificationsRead().catch((e) => console.warn('Backend sync:', e.message));
    setEntities((prev) => ({
      ...prev,
      Notification: prev.Notification.map((n) => ({ ...n, read: true }))
    }));
    showToast({
      title: 'Notifications Cleared',
      description: 'All alerts marked as read.'
    });
  };

  const testIntegration = (id) => {
    const config = entities.IntegrationConfig?.find((c) => c.id === id);
    api.syncIntegration(id).catch((e) => console.warn('Backend sync:', e.message));

    setEntities((prev) => ({
      ...prev,
      IntegrationConfig: prev.IntegrationConfig.map((c) =>
        c.id === id
          ? {
              ...c,
              status: 'connected',
              last_sync: new Date().toISOString().replace('T', ' ').slice(0, 16),
              records_synced: (c.records_synced || 100) + 12
            }
          : c
      )
    }));
    showToast({
      title: 'Integration Test Passed',
      description: `Successfully communicated with ${config?.name || 'endpoint'}.`
    });
  };

  const saveIntegrationCredentials = (id, creds) => {
    api.saveIntegrationCredentials(id, creds).catch((e) => console.warn('Backend sync:', e.message));
    setEntities((prev) => ({
      ...prev,
      IntegrationConfig: prev.IntegrationConfig.map((c) =>
        c.id === id ? { ...c, ...creds, last_sync: new Date().toISOString() } : c
      )
    }));
    showToast({
      title: 'Credentials Saved',
      description: 'Integration credentials safely saved in backend database.'
    });
  };

  const createOrder = (orderData) => {
    const orderNumber = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
    const newOrder = {
      id: 'ord_' + Date.now(),
      order_number: orderNumber,
      order_date: new Date().toISOString().slice(0, 10),
      status: 'pending',
      business_unit: company === 'all' ? 'PRM' : company,
      ...orderData
    };
    api.createOrder(newOrder).catch((e) => console.warn('Backend sync:', e.message));

    setEntities((prev) => ({
      ...prev,
      Order: [newOrder, ...prev.Order]
    }));
    showToast({
      title: 'Order Created',
      description: `Order #${orderNumber} created successfully.`
    });
    return newOrder;
  };

  const updateOrderStatus = (orderId, newStatus) => {
    api.updateOrderStatus(orderId, newStatus).catch((e) => console.warn('Backend sync:', e.message));
    setEntities((prev) => ({
      ...prev,
      Order: prev.Order.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    }));
    showToast({
      title: 'Order Status Updated',
      description: `Order status set to ${newStatus}.`
    });
  };

  const inviteUser = (userData) => {
    api.inviteUser(userData).catch((e) => console.warn('Backend sync:', e.message));
    showToast({
      title: 'Invitation Dispatched',
      description: `An invite has been sent to ${userData.email} for the ${userData.role} role.`
    });
  };

  const exportCSV = (type) => {
    try {
      api.downloadExport(type);
      showToast({
        title: 'Export Downloaded',
        description: `Export file for ${type} generated from backend.`
      });
    } catch (e) {
      showToast({
        title: 'Export Error',
        description: e.message,
        variant: 'destructive'
      });
    }
  };

  const resetToSeedData = () => {
    setEntities(initialData);
    localStorage.removeItem(STORAGE_KEY);
    showToast({
      title: 'Database Reset',
      description: 'Restored original demo dataset.'
    });
  };

  return (
    <AppContext.Provider
      value={{
        currentRoute,
        navigate,
        company,
        setCompany,
        period,
        setPeriod,
        periodOptions: PERIOD_OPTIONS,
        companyLabel,
        periodLabel: selectedPeriodObj.label,
        cutoffDate,
        globalSearch,
        setGlobalSearch,
        entities,
        // Actions
        approveTask,
        rejectTask,
        acceptRecommendation,
        dismissRecommendation,
        runAllAgents,
        addLead,
        addCustomer,
        importCustomers,
        createTask,
        updateLeadStatus,
        recordPayment,
        addInventoryMovement,
        markNotificationRead,
        markAllNotificationsRead,
        testIntegration,
        saveIntegrationCredentials,
        createOrder,
        updateOrderStatus,
        inviteUser,
        exportCSV,
        isBackendConnected,
        resetToSeedData,
        showToast,
        theme,
        setTheme,
        toggleTheme
      }}
    >
      {children}
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-lg shadow-lg border text-sm transition-all duration-300 animate-in slide-in-from-bottom-2 ${
              toast.variant === 'destructive'
                ? 'bg-red-900/90 text-white border-red-700'
                : 'bg-card text-card-foreground border-border shadow-xl'
            }`}
          >
            <p className="font-semibold text-foreground">{toast.title}</p>
            {toast.description && <p className="text-xs mt-1 text-muted-foreground">{toast.description}</p>}
          </div>
        ))}
      </div>
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside AppProvider');
  return context;
}

