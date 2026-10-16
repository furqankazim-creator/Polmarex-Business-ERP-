import React, { useState } from 'react';
import {
  Bot,
  ShieldCheck,
  Sparkles,
  Info,
  Check,
  X,
  RefreshCw,
  Clock,
  ArrowRight,
  ChevronRight,
  TrendingUp,
  Target,
  HeartHandshake,
  Boxes,
  Play
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function AIAgents() {
  const {
    company,
    companyLabel,
    entities,
    approveTask,
    rejectTask,
    acceptRecommendation,
    dismissRecommendation,
    runAllAgents,
    showToast
  } = useApp();

  const [activeTab, setActiveTab] = useState('open'); // 'open' | 'history'
  const [selectedAgentDetail, setSelectedAgentDetail] = useState(null);
  const [runningAgentKey, setRunningAgentKey] = useState(null);

  // Default tasks matching the exact screenshot
  const initialScreenshotTasks = [
    {
      id: 'task_1',
      title: 'Approval needed: Hot lead: Rose Food Centre (score 70)',
      description: 'Call within 24 hours, then send the tailored follow-up email draft for approval.',
      priority: 'High',
      owner_role: 'Owner: Finance',
      due_date: 'Due Oct 13, 2026',
      agent_label: 'Lead Generation',
      badge_type: 'Approval',
      status: 'pending'
    },
    {
      id: 'task_2',
      title: 'Approval needed: Hot lead: Golden Market (score 74)',
      description: 'Call within 24 hours, then send the tailored follow-up email draft for approval.',
      priority: 'High',
      owner_role: 'Owner: Sales Manager',
      due_date: 'Due Oct 17, 2026',
      agent_label: 'Lead Generation',
      badge_type: 'Approval',
      status: 'pending'
    },
    {
      id: 'task_3',
      title: 'Approval needed: Hot lead: Urban Supermarket (score 71)',
      description: 'Call within 24 hours, then send the tailored follow-up email draft for approval.',
      priority: 'High',
      owner_role: 'Owner: Finance',
      due_date: 'Due Oct 17, 2026',
      agent_label: 'Lead Generation',
      badge_type: 'Approval',
      status: 'pending'
    },
    {
      id: 'task_4',
      title: 'Approval needed: Hot lead: Fresh Mart Bistro (score 76)',
      description: 'Call within 24 hours, then send the tailored follow-up email draft for approval.',
      priority: 'High',
      owner_role: 'Owner: Inventory Manager',
      due_date: 'Due Oct 17, 2026',
      agent_label: 'Lead Generation',
      badge_type: 'Approval',
      status: 'pending'
    },
    {
      id: 'task_5',
      title: 'Approval needed: Hot lead: Silver Spoon Foods (score 78)',
      description: 'Call within 24 hours, then send the tailored follow-up email draft for approval.',
      priority: 'High',
      owner_role: 'Owner: Finance',
      due_date: 'Due Oct 15, 2026',
      agent_label: 'Lead Generation',
      badge_type: 'Approval',
      status: 'pending'
    },
    {
      id: 'task_6',
      title: 'Approval needed: Hot lead: Family Restaurant (score 71)',
      description: 'Call within 24 hours, then send the tailored follow-up email draft for approval.',
      priority: 'High',
      owner_role: 'Owner: Finance',
      due_date: 'Due Oct 18, 2026',
      agent_label: 'Lead Generation',
      badge_type: 'Approval',
      status: 'pending'
    },
    {
      id: 'task_7',
      title: 'Approval needed: Hot lead: Green Valley Foods (score 72)',
      description: 'Call within 24 hours, then send the tailored follow-up email draft for approval.',
      priority: 'High',
      owner_role: 'Owner: Finance',
      due_date: 'Due Oct 18, 2026',
      agent_label: 'Lead Generation',
      badge_type: 'Approval',
      status: 'pending'
    },
    {
      id: 'task_8',
      title: 'Approval needed: Reactivation account: Primo Food Centre 73',
      description: 'Draft a personalised reactivation message for approval with their top three categories.',
      priority: 'Medium',
      owner_role: 'Owner: Sales Manager',
      due_date: 'Due Oct 16, 2026',
      agent_label: 'Customer Retention',
      badge_type: 'Approval',
      status: 'pending'
    },
    {
      id: 'task_9',
      title: 'Approval needed: Reactivation account: Grand Supermarket 14',
      description: 'Draft a personalised reactivation message for approval with their top three categories.',
      priority: 'Medium',
      owner_role: 'Owner: Finance',
      due_date: 'Due Oct 17, 2026',
      agent_label: 'Customer Retention',
      badge_type: 'Approval',
      status: 'pending'
    },
    {
      id: 'task_10',
      title: 'Approval needed: Reactivation account: Urban Kitchen',
      description: 'Draft a personalised reactivation message for approval with their top three categories.',
      priority: 'Medium',
      owner_role: 'Owner: Inventory Manager',
      due_date: 'Due Oct 18, 2026',
      agent_label: 'Customer Retention',
      badge_type: 'Approval',
      status: 'pending'
    },
    {
      id: 'task_11',
      title: 'Approval needed: Reactivation account: Fatima Ali',
      description: 'Draft a personalised reactivation message for approval with their top three categories.',
      priority: 'Medium',
      owner_role: 'Owner: Sales Manager',
      due_date: 'Due Oct 15, 2026',
      agent_label: 'Customer Retention',
      badge_type: 'Approval',
      status: 'pending'
    },
    {
      id: 'task_12',
      title: 'Approval needed: Reactivation account: Jason Chen',
      description: 'Draft a personalised reactivation message for approval with their top three categories.',
      priority: 'Medium',
      owner_role: 'Owner: Finance',
      due_date: 'Due Oct 15, 2026',
      agent_label: 'Customer Retention',
      badge_type: 'Approval',
      status: 'pending'
    },
  ];

  // Default recommendations matching the exact screenshot
  const initialScreenshotRecommendations = [
    {
      id: 'rec_1',
      title: 'Low stock: Canachef Halal Butter Chicken 400g',
      description: 'Toronto Distribution Centre shows 154 available against a reorder point of 260 (cover 308 days, supplier lead time 31 days).',
      agent_badge: 'Inventory Forecasting',
      priority: 'Medium priority',
      confidence: 'high confidence',
      date: 'Oct 13, 2026',
      suggested_action: 'Approve a purchase order for 15 units.',
      status: 'open'
    },
    {
      id: 'rec_2',
      title: 'Low stock: Canachef Halal Chicken Biryani 400g',
      description: 'Cold Store Toronto shows 84 available against a reorder point of 161 (cover 140 days, supplier lead time 31 days).',
      agent_badge: 'Inventory Forecasting',
      priority: 'Medium priority',
      confidence: 'high confidence',
      date: 'Oct 13, 2026',
      suggested_action: 'Approve a purchase order for 3 units.',
      status: 'open'
    },
    {
      id: 'rec_3',
      title: 'Low stock: Canachef Halal Chicken Biryani 400g',
      description: 'Toronto Distribution Centre shows 87 available against a reorder point of 161 (cover 144 days, supplier lead time 31 days).',
      agent_badge: 'Inventory Forecasting',
      priority: 'Medium priority',
      confidence: 'high confidence',
      date: 'Oct 13, 2026',
      suggested_action: 'Approve a purchase order for 13 units.',
      status: 'open'
    },
    {
      id: 'rec_4',
      title: 'Low stock: Nostra Gourmet Vegetable Moussaka 1kg',
      description: 'Cold Store Toronto shows 90 available against a reorder point of 221 (cover 580 days, supplier lead time 9 days).',
      agent_badge: 'Inventory Forecasting',
      priority: 'Medium priority',
      confidence: 'high confidence',
      date: 'Oct 13, 2026',
      suggested_action: 'Approve a purchase order for 3 units.',
      status: 'open'
    },
    {
      id: 'rec_5',
      title: 'Low stock: Nostra Gourmet Vegetable Moussaka 1kg',
      description: 'Toronto Distribution Centre shows 161 available against a reorder point of 221 (cover 268.3 days, supplier lead time 9 days).',
      agent_badge: 'Inventory Forecasting',
      priority: 'Medium priority',
      confidence: 'high confidence',
      date: 'Oct 13, 2026',
      suggested_action: 'Approve a purchase order for 15 units.',
      status: 'open'
    },
    {
      id: 'rec_6',
      title: 'Low stock: Nostra Gourmet Chicken Alfredo Tray 1.1kg',
      description: 'Cold Store Toronto shows 5 available against a reorder point of 205 (cover 50 days, supplier lead time 21 days).',
      agent_badge: 'Inventory Forecasting',
      priority: 'Medium priority',
      confidence: 'high confidence',
      date: 'Oct 13, 2026',
      suggested_action: 'Approve a purchase order for 3 units.',
      status: 'open'
    },
    {
      id: 'rec_7',
      title: 'Low stock: Nostra Gourmet Chicken Alfredo Tray 1.1kg',
      description: 'Toronto Distribution Centre shows 10 available against a reorder point of 205 (cover 60 days, supplier lead time 21 days).',
      agent_badge: 'Inventory Forecasting',
      priority: 'Medium priority',
      confidence: 'high confidence',
      date: 'Oct 13, 2026',
      suggested_action: 'Approve a purchase order for 9 units.',
      status: 'open'
    },
    {
      id: 'rec_8',
      title: 'Low stock: Nostra Gourmet Beef Lasagna Tray 1.2kg',
      description: 'Cold Store Toronto shows 14 available against a reorder point of 93 (cover 140 days, supplier lead time 25 days).',
      agent_badge: 'Inventory Forecasting',
      priority: 'Medium priority',
      confidence: 'high confidence',
      date: 'Oct 13, 2026',
      suggested_action: 'Approve a purchase order for 3 units.',
      status: 'open'
    },
    {
      id: 'rec_9',
      title: 'Low stock: Ogusto Chocolate Covered Marshmallows 180g',
      description: 'Toronto Distribution Centre shows 76 available against a reorder point of 257 (cover 126.7 days, supplier lead time 18 days).',
      agent_badge: 'Inventory Forecasting',
      priority: 'Medium priority',
      confidence: 'high confidence',
      date: 'Oct 13, 2026',
      suggested_action: 'Approve a purchase order for 10 units.',
      status: 'open'
    },
    {
      id: 'rec_10',
      title: 'Sophie Tremblay below target in 2026-10',
      description: 'Sophie Tremblay (Montreal) is at 2% of the $86,800 target, with $1,845 booked month to date.',
      agent_badge: 'Sales Intelligence',
      priority: 'High priority',
      confidence: 'medium confidence',
      date: 'Oct 13, 2026',
      suggested_action: 'Approve a purchase order for 10 units.',
      status: 'open'
    },
    {
      id: 'rec_11',
      title: 'Sophie Tremblay below target in 2026-10',
      description: 'Sophie Tremblay (Montreal) is at 2% of the $86,800 target, with $1,845 booked month to date.',
      agent_badge: 'Sales Intelligence',
      priority: 'High priority',
      confidence: 'medium confidence',
      date: 'Oct 13, 2026',
      suggested_action: 'Prioritise high-value accounts with no order in 30 days and review the brand mix for this territory.',
      status: 'open'
    },
    {
      id: 'rec_12',
      title: 'Marco Bianchi below target in 2026-10',
      description: 'Marco Bianchi (Peel / Mississauga) is at 1% of the $76,600 target, with $806 booked month to date.',
      agent_badge: 'Sales Intelligence',
      priority: 'High priority',
      confidence: 'medium confidence',
      date: 'Oct 13, 2026',
      suggested_action: 'Prioritise high-value accounts with no order in 30 days and review the brand mix for this territory.',
      status: 'open'
    },
    {
      id: 'rec_13',
      title: 'Nate Rahman below target in 2026-10',
      description: 'Nate Rahman (GTA East) is at 0% of the $102,300 target, with $0 booked month to date.',
      agent_badge: 'Sales Intelligence',
      priority: 'High priority',
      confidence: 'medium confidence',
      date: 'Oct 13, 2026',
      suggested_action: 'Prioritise high-value accounts with no order in 30 days and review the brand mix for this territory.',
      status: 'open'
    },
  ];

  const [activeTasks, setActiveTasks] = useState(initialScreenshotTasks);
  const [activeRecommendations, setActiveRecommendations] = useState(initialScreenshotRecommendations);
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [agentMeta, setAgentMeta] = useState({
    customer_retention: { lastRun: 'Oct 13, 2026', nextRun: 'Oct 14, 2026', extraRecs: 8 },
    inventory_forecasting: { lastRun: 'Oct 13, 2026', nextRun: 'Oct 14, 2026', extraRecs: 0 },
    lead_generation: { lastRun: 'Oct 13, 2026', nextRun: 'Oct 14, 2026', extraRecs: 7 },
    sales_intelligence: { lastRun: 'Oct 12, 2026', nextRun: 'Oct 19, 2026', extraRecs: 1 }
  });
  const [localRuns, setLocalRuns] = useState([]);

  // Compute live counts per agent from activeTasks and activeRecommendations
  const getAgentCounts = (agentLabel, agentKey) => {
    const tasksCount = activeTasks.filter((t) => t.agent_label === agentLabel).length;
    const recsCount =
      activeRecommendations.filter((r) => r.agent_badge === agentLabel).length +
      (agentMeta[agentKey]?.extraRecs || 0);
    return { tasksCount, recsCount };
  };

  const retentionCounts = getAgentCounts('Customer Retention', 'customer_retention');
  const inventoryCounts = getAgentCounts('Inventory Forecasting', 'inventory_forecasting');
  const leadCounts = getAgentCounts('Lead Generation', 'lead_generation');
  const salesCounts = getAgentCounts('Sales Intelligence', 'sales_intelligence');

  const agents = [
    {
      key: 'customer_retention',
      label: 'Customer Retention',
      name: 'Customer Retention Agent',
      schedule: 'Daily at 07:00 ET',
      icon: HeartHandshake,
      description:
        'Detects churn risk, recommends reorder windows and builds reactivation campaigns from real purchase history.',
      recommendationsCount: retentionCounts.recsCount,
      awaitingApprovalCount: retentionCounts.tasksCount,
      errorsCount: 0,
      lastRun: agentMeta.customer_retention.lastRun,
      nextRun: agentMeta.customer_retention.nextRun,
      policy:
        'Messages respect marketing consent and unsubscribe status. Sending stays blocked until approved and an email channel is connected.'
    },
    {
      key: 'inventory_forecasting',
      label: 'Inventory Forecasting',
      name: 'Inventory Forecasting Agent',
      schedule: 'Daily at 05:30 ET',
      icon: Boxes,
      description:
        'Forecasts demand from sales history and seasonality, then recommends replenishment quantities and purchase orders.',
      recommendationsCount: inventoryCounts.recsCount,
      awaitingApprovalCount: inventoryCounts.tasksCount,
      errorsCount: 1,
      lastRun: agentMeta.inventory_forecasting.lastRun,
      nextRun: agentMeta.inventory_forecasting.nextRun,
      policy:
        'A purchase order is never created automatically. A manager must approve each recommendation.'
    },
    {
      key: 'lead_generation',
      label: 'Lead Generation',
      name: 'Lead Generation Agent',
      schedule: 'Daily at 06:30 ET',
      icon: Target,
      description:
        'Finds, scores and qualifies new B2B and B2C opportunities across the three storefronts and the retail network.',
      recommendationsCount: leadCounts.recsCount,
      awaitingApprovalCount: leadCounts.tasksCount,
      errorsCount: 0,
      lastRun: agentMeta.lead_generation.lastRun,
      nextRun: agentMeta.lead_generation.nextRun,
      policy:
        'Any outbound message needs a human approval before it can leave the system. No automated outreach is enabled.'
    },
    {
      key: 'sales_intelligence',
      label: 'Sales Intelligence',
      name: 'Sales Intelligence Agent',
      schedule: 'Mondays at 06:00 ET',
      icon: TrendingUp,
      description:
        'Analyses representative performance, brand mix and territory coverage, then builds weekly visit plans.',
      recommendationsCount: salesCounts.recsCount,
      awaitingApprovalCount: salesCounts.tasksCount,
      errorsCount: 1,
      lastRun: agentMeta.sales_intelligence.lastRun,
      nextRun: agentMeta.sales_intelligence.nextRun,
      policy: 'Advisory only: plans stay recommendations until a manager publishes them.'
    }
  ];

  // Real data generator when an agent runs
  const executeAgentAnalysis = (agentKey) => {
    const nowStr = 'Oct 16, 2026';
    const stamp = Date.now() + Math.floor(Math.random() * 1000);
    const customers = entities.Customer || [];
    const stocks = entities.StockRecord || [];
    const leads = entities.Lead || [];
    const reps = entities.Representative || [];

    let newTask = null;
    let newRec = null;
    let runEntry = null;

    if (agentKey === 'customer_retention') {
      const targetCustomer =
        customers.find((c) => c.segment === 'at_risk' || c.segment === 'inactive') ||
        customers[Math.floor(Math.random() * Math.max(1, customers.length))] ||
        { name: 'Starsky Fine Foods Mississauga', favorite_brand: 'Nutro Gusto' };
      const custName = targetCustomer.name || targetCustomer.company_name || 'Metro West Food Mart';

      newTask = {
        id: `task_ret_${stamp}`,
        title: `Approval needed: Reactivation & new arrivals update for ${custName}`,
        description: `Account is past its 45-day reorder window. Drafted personalized follow-up featuring New Product Arrivals & Q4 Promo pricing.`,
        priority: 'High',
        owner_role: 'Owner: Sales Manager',
        due_date: 'Due Oct 18, 2026',
        agent_label: 'Customer Retention',
        badge_type: 'Approval',
        status: 'pending'
      };
      newRec = {
        id: `rec_ret_${stamp}`,
        title: `Churn risk & reorder opportunity: ${custName}`,
        description: `Historical purchasing trend shows a 38-day average cycle, now 52 days without an order. High affinity for Nutro Gusto & Canachef lines.`,
        agent_badge: 'Customer Retention',
        priority: 'High priority',
        confidence: 'high confidence',
        date: nowStr,
        suggested_action: `Send approved New Arrivals & seasonal promotion catalogue and schedule rep follow-up call.`,
        status: 'open'
      };
      runEntry = {
        id: `run_ret_${stamp}`,
        agent_key: 'customer_retention',
        agent_name: 'Customer Retention Agent',
        status: 'success',
        duration_ms: 1840,
        records_scanned: customers.length || 120,
        recommendations_created: 1,
        summary: `Scanned ${customers.length || 120} customer purchase histories. Flagged ${custName} for proactive retention & new arrivals follow-up.`
      };
    } else if (agentKey === 'inventory_forecasting') {
      const lowItem =
        stocks.find((s) => (Number(s.available) || 0) < (Number(s.reorder_point) || 100)) ||
        { product_name: 'Europicks Sunflower Oil 1L', warehouse: 'Toronto Distribution Centre', available: 42, reorder_point: 180 };
      const prodName = lowItem.product_name || 'Europicks Sunflower Oil 1L';
      const whName = lowItem.warehouse || 'Toronto Distribution Centre';

      newTask = {
        id: `task_inv_${stamp}`,
        title: `Approval needed: Replenishment PO for ${prodName}`,
        description: `${whName} available stock (${lowItem.available || 42} cases) is below reorder point (${lowItem.reorder_point || 180} cases).`,
        priority: 'High',
        owner_role: 'Owner: Inventory Manager',
        due_date: 'Due Oct 17, 2026',
        agent_label: 'Inventory Forecasting',
        badge_type: 'Approval',
        status: 'pending'
      };
      newRec = {
        id: `rec_inv_${stamp}`,
        title: `Critical stock forecast: ${prodName}`,
        description: `${whName} shows ${lowItem.available || 42} available against a reorder point of ${lowItem.reorder_point || 180} (90-day demand velocity rising +18%).`,
        agent_badge: 'Inventory Forecasting',
        priority: 'High priority',
        confidence: 'high confidence',
        date: nowStr,
        suggested_action: `Approve a replenishment purchase order for 25 cases to prevent stockout.`,
        status: 'open'
      };
      runEntry = {
        id: `run_inv_${stamp}`,
        agent_key: 'inventory_forecasting',
        agent_name: 'Inventory Forecasting Agent',
        status: 'success',
        duration_ms: 2120,
        records_scanned: stocks.length || 82,
        recommendations_created: 1,
        summary: `Analyzed real-time inventory across ${stocks.length || 82} stock records and 90-day demand forecasts. Generated PO proposal for ${prodName}.`
      };
    } else if (agentKey === 'lead_generation') {
      const hotLead =
        leads.find((l) => (Number(l.score) || 0) >= 70) ||
        { company_name: 'Maple Leaf Ethnic Grocers', score: 82 };
      const leadName = hotLead.company_name || 'Maple Leaf Ethnic Grocers';
      const leadScore = hotLead.score || 82;

      newTask = {
        id: `task_lead_${stamp}`,
        title: `Approval needed: Hot B2B lead from www.premierpolmarex.ca: ${leadName} (score ${leadScore})`,
        description: `Inbound wholesale inquiry for Nutro Gusto & Canachef lines. Approve introductory wholesale tier sheet email.`,
        priority: 'High',
        owner_role: 'Owner: Sales Manager',
        due_date: 'Due Oct 17, 2026',
        agent_label: 'Lead Generation',
        badge_type: 'Approval',
        status: 'pending'
      };
      newRec = {
        id: `rec_lead_${stamp}`,
        title: `High-intent storefront opportunity: ${leadName} (Score ${leadScore})`,
        description: `Captured via www.premierpolmarex.ca wholesale portal. Matches high-value B2B supermarket profile in GTA.`,
        agent_badge: 'Lead Generation',
        priority: 'High priority',
        confidence: 'high confidence',
        date: nowStr,
        suggested_action: `Assign to territory representative and approve wholesale onboarding outreach within 24 hours.`,
        status: 'open'
      };
      runEntry = {
        id: `run_lead_${stamp}`,
        agent_key: 'lead_generation',
        agent_name: 'Lead Generation Agent',
        status: 'success',
        duration_ms: 1650,
        records_scanned: leads.length || 64,
        recommendations_created: 1,
        summary: `Scanned inbound B2B & B2C leads from www.premierpolmarex.ca, www.maplemart.com, and www.nutrogusto.com. Qualified ${leadName}.`
      };
    } else if (agentKey === 'sales_intelligence') {
      const repObj = reps[0] || { full_name: 'Sophie Tremblay', territory: 'Montreal' };
      const repName = repObj.full_name || 'Sophie Tremblay';

      newTask = {
        id: `task_sales_${stamp}`,
        title: `Approval needed: Publish optimized weekly route plan for ${repName}`,
        description: `AI route optimizer sequenced 6 high-priority customer visits combining reorder follow-ups and overdue receivables collection.`,
        priority: 'Medium',
        owner_role: 'Owner: Sales Manager',
        due_date: 'Due Oct 18, 2026',
        agent_label: 'Sales Intelligence',
        badge_type: 'Approval',
        status: 'pending'
      };
      newRec = {
        id: `rec_sales_${stamp}`,
        title: `Route & brand mix optimization for ${repName}`,
        description: `Territory analysis indicates strong Nutro Gusto adoption but lagging PastaCo & Europicks penetration across 8 active accounts.`,
        agent_badge: 'Sales Intelligence',
        priority: 'High priority',
        confidence: 'high confidence',
        date: nowStr,
        suggested_action: `Publish next week's suggested route plan and include PastaCo / Europicks sample kits on Tuesday stops.`,
        status: 'open'
      };
      runEntry = {
        id: `run_sales_${stamp}`,
        agent_key: 'sales_intelligence',
        agent_name: 'Sales Intelligence Agent',
        status: 'success',
        duration_ms: 1980,
        records_scanned: reps.length * 15 || 120,
        recommendations_created: 1,
        summary: `Evaluated rep productivity, brand mix, missed targets, and receivables balances. Built optimized weekly route plan for ${repName}.`
      };
    }

    if (newTask) setActiveTasks((prev) => [newTask, ...prev]);
    if (newRec) setActiveRecommendations((prev) => [newRec, ...prev]);
    if (runEntry) setLocalRuns((prev) => [runEntry, ...prev]);

    setAgentMeta((prev) => ({
      ...prev,
      [agentKey]: {
        ...prev[agentKey],
        lastRun: 'Just now (Oct 16, 2026)'
      }
    }));
  };

  const handleApprove = (taskId) => {
    const task = activeTasks.find((t) => t.id === taskId);
    setActiveTasks((prev) => prev.filter((t) => t.id !== taskId));
    approveTask(taskId);
    showToast({
      title: 'Action Approved & Queued',
      description: task ? `Approved: ${task.title}` : 'The recommendation has been authorized and queued for execution.'
    });
  };

  const handleReject = (taskId) => {
    setActiveTasks((prev) => prev.filter((t) => t.id !== taskId));
    rejectTask(taskId);
  };

  const handleAcceptRec = (recId) => {
    const rec = activeRecommendations.find((r) => r.id === recId);
    setActiveRecommendations((prev) => prev.filter((r) => r.id !== recId));
    acceptRecommendation(recId);
    showToast({
      title: 'Recommendation Accepted',
      description: rec ? `Executed: ${rec.suggested_action}` : 'Recommended action was confirmed.'
    });
  };

  const handleDismissRec = (recId) => {
    setActiveRecommendations((prev) => prev.filter((r) => r.id !== recId));
    dismissRecommendation(recId);
  };

  const handleSingleAgentRun = (agent) => {
    setRunningAgentKey(agent.key);
    setTimeout(() => {
      executeAgentAnalysis(agent.key);
      setRunningAgentKey(null);
      showToast({
        title: `${agent.name} Completed`,
        description: 'Analyzed live ERP records and generated new approval tasks & recommendations.'
      });
    }, 800);
  };

  const handleRunAllAgentsClick = () => {
    if (isRunningAll) return;
    setIsRunningAll(true);
    setTimeout(() => {
      executeAgentAnalysis('customer_retention');
      executeAgentAnalysis('inventory_forecasting');
      executeAgentAnalysis('lead_generation');
      executeAgentAnalysis('sales_intelligence');
      runAllAgents();
      setIsRunningAll(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground">AI agents centre</h1>
          <p className="text-[13.5px] text-slate-700 mt-1.5 max-w-3xl leading-relaxed font-normal">
            Four specialised agents support lead generation, retention, sales intelligence and inventory. They interpret, summarise and recommend; deterministic calculations, permissions and financial figures stay in application code.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-[#e2e8f0] bg-white px-3 py-1.5 text-xs text-slate-700 shadow-[0_1px_2px_rgba(0,0,0,0.03)] font-medium">
            <ShieldCheck className="h-4 w-4 text-[#e1241a]" />
            <span>Outward actions require approval</span>
          </div>

          <button
            onClick={handleRunAllAgentsClick}
            disabled={isRunningAll}
            className="btn-primary disabled:opacity-60"
          >
            <Sparkles className={`h-3.5 w-3.5 ${isRunningAll ? 'animate-spin' : ''}`} />
            <span>{isRunningAll ? 'Running all 4 agents…' : 'Run all agents'}</span>
          </button>
        </div>
      </div>

      {/* Info Callout Banner */}
      <div className="flex items-start gap-3 rounded-lg border border-[#cbd5e1] bg-slate-50/80 p-3.5 text-[13px] text-slate-700 leading-relaxed font-normal">
        <Info className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
        <p className="text-[13px] text-slate-700 leading-relaxed">
          Runs use only stored records plus approved sources. Email sending, purchase orders and external systems stay disabled until a human approves and the relevant integration is connected — nothing is transmitted by the agents themselves.
        </p>
      </div>

      {/* 4 Agent Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-stretch">
        {agents.map((agent) => {
          const Icon = agent.icon;
          const isRunning = runningAgentKey === agent.key;

          return (
            <div
              key={agent.key}
              className="flex flex-col justify-between rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-slate-300 transition-all h-full"
            >
              <div className="flex flex-col flex-1">
                {/* Header */}
                <div className="flex items-start justify-between gap-2 min-h-[48px]">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-[#e1241a] border border-red-100 mt-0.5">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-[13.5px] font-bold text-foreground leading-snug">
                        {agent.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">{agent.schedule}</p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold">
                    Active
                  </span>
                </div>

                {/* Description */}
                <p className="text-[12px] text-slate-700 leading-relaxed mt-3 min-h-[68px] font-normal">
                  {agent.description}
                </p>

                {/* 3-Column Stats Box */}
                <div className="grid grid-cols-3 divide-x divide-[#e2e8f0] rounded-lg bg-slate-50 py-2.5 px-1 text-center my-3.5 border border-[#e2e8f0]">
                  <div className="px-1 min-w-0 flex flex-col items-center justify-start">
                    <p className="text-base font-bold text-foreground leading-none">{agent.recommendationsCount}</p>
                    <p className="text-[9.5px] leading-tight tracking-tight text-slate-600 font-medium mt-1.5 break-words w-full">
                      Recommendations
                    </p>
                  </div>
                  <div className="px-1 min-w-0 flex flex-col items-center justify-start">
                    <p className="text-base font-bold text-foreground leading-none">{agent.awaitingApprovalCount}</p>
                    <p className="text-[9.5px] leading-tight tracking-tight text-slate-600 font-medium mt-1.5 break-words w-full">
                      Awaiting approval
                    </p>
                  </div>
                  <div className="px-1 min-w-0 flex flex-col items-center justify-start">
                    <p className={`text-base font-bold leading-none ${agent.errorsCount > 0 ? 'text-rose-600' : 'text-foreground'}`}>
                      {agent.errorsCount}
                    </p>
                    <p className="text-[9.5px] leading-tight tracking-tight text-slate-600 font-medium mt-1.5 break-words w-full">
                      Errors (7 days)
                    </p>
                  </div>
                </div>

                {/* Timestamps & Policy */}
                <div className="space-y-2 text-[11.5px] text-slate-600 flex-1 flex flex-col">
                  <p className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">Last run {agent.lastRun} · next {agent.nextRun}</span>
                  </p>
                  <p className="flex items-start gap-1.5 font-medium text-slate-700">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="leading-snug">Human approval required for outward actions</span>
                  </p>
                  <p className="text-[11.5px] text-slate-600 pt-2 border-t border-[#e2e8f0] leading-relaxed min-h-[58px]">
                    {agent.policy}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#e2e8f0]">
                <button
                  onClick={() => handleSingleAgentRun(agent)}
                  disabled={isRunning}
                  className="btn-secondary h-7.5 px-3 text-xs font-semibold disabled:opacity-50"
                >
                  {isRunning ? 'Running…' : 'Run now'}
                </button>
                <button
                  onClick={() => setSelectedAgentDetail(agent)}
                  className="flex items-center gap-1 text-xs font-semibold text-[#e1241a] hover:underline px-2"
                >
                  <span>Details</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Column Layout: Tasks awaiting approval & Recommendations generated */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Tasks awaiting approval */}
        <div className="rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#e2e8f0]">
            <div>
              <h2 className="text-sm font-bold font-heading text-foreground">
                Tasks awaiting approval
              </h2>
            </div>

            <button
              onClick={() => setActiveTasks(initialScreenshotTasks)}
              className="btn-table"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Refresh</span>
            </button>
          </div>

          <div className="space-y-3 max-h-[850px] overflow-y-auto pr-1">
            {activeTasks.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground border border-dashed border-[#e2e8f0] rounded-lg">
                <p className="text-xs font-semibold text-foreground">No tasks awaiting approval</p>
                <p className="text-[11px] mt-1">All agent proposals have been processed.</p>
              </div>
            ) : (
              activeTasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-lg border border-[#e2e8f0] bg-white p-3.5 space-y-2.5 hover:border-slate-300 transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-50 text-[#e1241a] shrink-0 mt-0.5">
                      <Info className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-foreground leading-snug">
                        {task.title}
                      </p>
                      <p className="text-[12.5px] text-slate-700 mt-1 leading-relaxed font-normal">
                        {task.description}
                      </p>
                    </div>
                  </div>

                  {/* Metadata Tag Row */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                    <span
                      className={`rounded border px-2 py-0.5 font-bold uppercase tracking-wider ${
                        task.priority === 'High'
                          ? 'bg-rose-50 border-rose-200 text-rose-700'
                          : 'bg-amber-50 border-amber-200 text-amber-700'
                      }`}
                    >
                      {task.priority}
                    </span>
                    <span className="rounded bg-slate-50 border border-[#e2e8f0] px-2 py-0.5 text-slate-600">
                      {task.owner_role}
                    </span>
                    <span className="rounded bg-slate-50 border border-[#e2e8f0] px-2 py-0.5 text-slate-600">
                      {task.due_date}
                    </span>
                    <span className="rounded bg-red-50 border border-red-200 px-2 py-0.5 text-[#e1241a] font-medium">
                      {task.agent_label}
                    </span>
                    <span className="rounded bg-slate-50 border border-[#e2e8f0] px-2 py-0.5 text-slate-700 font-medium">
                      {task.badge_type}
                    </span>
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center gap-2 pt-2 border-t border-[#e2e8f0]">
                    <button
                      onClick={() => handleReject(task.id)}
                      className="btn-table"
                    >
                      <X className="h-3.5 w-3.5 text-rose-500" />
                      <span>Reject</span>
                    </button>
                    <button
                      onClick={() => handleApprove(task.id)}
                      className="btn-table-primary"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Approve</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Recommendations generated */}
        <div className="rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#e2e8f0]">
            <div>
              <h2 className="text-sm font-bold font-heading text-foreground">
                Recommendations generated
              </h2>
            </div>

            {/* Tab switch: Open vs Execution history */}
            <div className="inline-flex rounded-lg border border-[#e2e8f0] bg-slate-100 p-0.5">
              <button
                onClick={() => setActiveTab('open')}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                  activeTab === 'open'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Open
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                  activeTab === 'history'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Execution history
              </button>
            </div>
          </div>

          {activeTab === 'open' ? (
            <div className="space-y-3 max-h-[850px] overflow-y-auto pr-1">
              {activeRecommendations.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground border border-dashed border-[#e2e8f0] rounded-lg">
                  <p className="text-xs font-semibold text-foreground">No open recommendations</p>
                  <p className="text-[11px] mt-1">All recommendations have been acted on.</p>
                </div>
              ) : (
                activeRecommendations.map((rec) => (
                  <div
                    key={rec.id}
                    className="rounded-lg border border-[#e2e8f0] bg-white p-3.5 space-y-2.5 hover:border-slate-300 transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                  >
                    <div>
                      <h4 className="text-sm font-bold text-foreground">
                        {rec.title}
                      </h4>
                      <p className="text-[12.5px] text-slate-700 mt-1 leading-relaxed font-normal">
                        {rec.description}
                      </p>
                    </div>

                    {/* Agent Pill & Meta */}
                    <div className="space-y-1.5">
                      <div className="flex items-center">
                        <span className="rounded bg-slate-100 border border-[#cbd5e1] px-2.5 py-0.5 text-[11px] font-semibold text-slate-800">
                          {rec.agent_badge}
                        </span>
                      </div>
                      <div className="text-[11.5px] text-slate-600 font-medium">
                        {rec.priority} · {rec.confidence} · {rec.date}
                      </div>
                    </div>

                    {/* Suggested Action */}
                    <div className="text-[12px] text-slate-800 bg-slate-50 p-2 rounded-md border border-[#e2e8f0]">
                      <span className="font-semibold text-slate-700">Suggested action: </span>
                      <span>{rec.suggested_action}</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-2 border-t border-[#e2e8f0]">
                      <button
                        onClick={() => handleAcceptRec(rec.id)}
                        className="btn-table-primary"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleDismissRec(rec.id)}
                        className="btn-table"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            /* Execution history tab */
            <div className="space-y-3 max-h-[850px] overflow-y-auto pr-1">
              {[...localRuns, ...(entities.AgentRun || [])].slice(0, 15).map((run) => (
                <div
                  key={run.id}
                  className="rounded-lg border border-[#e2e8f0] bg-slate-50/50 p-3.5 space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">
                      {run.agent_name || run.agent_key}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                        run.status === 'success'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {run.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{run.summary}</p>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground/80 pt-1 border-t border-[#e2e8f0]/60">
                    <span>Duration: {(run.duration_ms / 1000).toFixed(1)}s</span>
                    <span>Scanned: {run.records_scanned || 0}</span>
                    <span>Created: {run.recommendations_created || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Agent Details Dialog */}
      {selectedAgentDetail && (() => {
        const currentAgent = agents.find((a) => a.key === selectedAgentDetail.key) || selectedAgentDetail;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-xs p-4">
            <div className="w-full max-w-lg rounded-xl border border-[#e2e8f0] bg-white p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="rounded-lg p-2 bg-red-50 text-[#e1241a] border border-red-100">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold font-heading text-sm text-foreground">
                        {currentAgent.name}
                      </h3>
                      <span className="rounded-full border px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border-emerald-200">
                        Active
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{currentAgent.schedule}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAgentDetail(null)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Live Metrics Summary inside Details Modal */}
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="rounded-lg border border-[#e2e8f0] bg-slate-50/70 p-2.5">
                  <p className="text-[10px] text-muted-foreground font-medium">Recommendations</p>
                  <p className="text-base font-bold text-foreground mt-0.5">{currentAgent.recommendationsCount}</p>
                </div>
                <div className="rounded-lg border border-[#e2e8f0] bg-slate-50/70 p-2.5">
                  <p className="text-[10px] text-muted-foreground font-medium">Awaiting approval</p>
                  <p className="text-base font-bold text-[#e1241a] mt-0.5">{currentAgent.awaitingApprovalCount}</p>
                </div>
                <div className="rounded-lg border border-[#e2e8f0] bg-slate-50/70 p-2.5">
                  <p className="text-[10px] text-muted-foreground font-medium">Errors (7 days)</p>
                  <p className="text-base font-bold text-emerald-600 mt-0.5">{currentAgent.errorsCount}</p>
                </div>
              </div>

              <div className="space-y-3 text-xs leading-relaxed">
                <div>
                  <p className="font-semibold text-foreground mb-1">Operational Purpose</p>
                  <p className="text-muted-foreground">{currentAgent.description}</p>
                </div>

                <div>
                  <p className="font-semibold text-foreground mb-1">Approval & Guardrails</p>
                  <p className="text-muted-foreground">{currentAgent.policy}</p>
                </div>

                <div className="rounded-lg bg-slate-50 p-3 grid grid-cols-2 gap-2 text-[11px] border border-[#e2e8f0]">
                  <div>
                    <p className="font-semibold text-foreground">Last Execution</p>
                    <p className="text-muted-foreground mt-0.5">{currentAgent.lastRun}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Next Scheduled Run</p>
                    <p className="text-muted-foreground mt-0.5">{currentAgent.nextRun} (Automated CRON)</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e2e8f0]">
                <button
                  onClick={() => {
                    setSelectedAgentDetail(null);
                    handleSingleAgentRun(currentAgent);
                  }}
                  className="btn-primary h-8 px-4 text-xs font-semibold flex items-center gap-1.5"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  Run Agent Now
                </button>
                <button
                  onClick={() => setSelectedAgentDetail(null)}
                  className="btn-secondary h-8 px-4 text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
