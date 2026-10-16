import React, { useState } from 'react';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import { useApp } from './context/AppContext';

// Pages
import OverviewDashboard from './pages/OverviewDashboard';
import AIAgents from './pages/AIAgents';
import Leads from './pages/Leads';
import Customers from './pages/Customers';
import Representatives from './pages/Representatives';
import Orders from './pages/Orders';
import Products from './pages/Products';
import Inventory from './pages/Inventory';
import Forecasting from './pages/Forecasting';
import Receivables from './pages/Receivables';
import Reports from './pages/Reports';
import Notifications from './pages/Notifications';
import Integrations from './pages/Integrations';
import Settings from './pages/Settings';

export default function App() {
  const { currentRoute } = useApp();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Router switch based on currentRoute
  const renderCurrentPage = () => {
    switch (currentRoute) {
      case '/':
        return <OverviewDashboard />;
      case '/ai-agents':
      case '/ai-agents/customer_retention':
      case '/ai-agents/inventory_forecasting':
      case '/ai-agents/lead_generation':
      case '/ai-agents/sales_intelligence':
        return <AIAgents />;
      case '/leads':
        return <Leads />;
      case '/customers':
        return <Customers />;
      case '/representatives':
        return <Representatives />;
      case '/orders':
        return <Orders />;
      case '/products':
        return <Products />;
      case '/inventory':
        return <Inventory />;
      case '/forecasting':
        return <Forecasting />;
      case '/receivables':
        return <Receivables />;
      case '/reports':
        return <Reports />;
      case '/notifications':
        return <Notifications />;
      case '/integrations':
        return <Integrations />;
      case '/settings':
        return <Settings />;
      default:
        return <OverviewDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col antialiased">
      {/* Sidebar navigation */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content Area (offset by 268px on large screens) */}
      <div className="flex-1 lg:pl-[268px] flex flex-col min-h-screen transition-all">
        {/* Global sticky header */}
        <Header onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        {/* Dynamic Page View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-200">
          {renderCurrentPage()}
        </main>
      </div>
    </div>
  );
}

