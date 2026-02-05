import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import { Sidebar } from "./components/layout/Sidebar";
import { Header } from "./components/layout/Header";
import { Dashboard } from "./pages/Dashboard";
import { OrdersPage } from "./pages/OrdersPage";
import { ServicesPage } from "./pages/ServicesPage";
import { ProvidersPage } from "./pages/ProvidersPage";
import { QuickMessagesPage } from "./pages/QuickMessagesPage";
import { PricingCalculatorPage } from "./pages/PricingCalculatorPage";
import { UsersPage } from "./pages/UsersPage";
import { ToastViewport } from "./components/toast";

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-panel-950 text-slate-100 light:bg-slate-50 light:text-slate-900">
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div
            className="absolute inset-0 bg-slate-950/70"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative z-50 w-[260px]">
            <Sidebar />
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 space-y-8 px-4 py-5 pb-24 sm:px-6 sm:py-6 sm:pb-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/messages" element={<QuickMessagesPage />} />
            <Route path="/pricing" element={<PricingCalculatorPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/providers" element={<ProvidersPage />} />
          </Routes>
        </main>
      </div>
      <ToastViewport />
    </div>
  );
}

export default App;
