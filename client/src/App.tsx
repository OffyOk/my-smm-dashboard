import { Routes, Route } from "react-router-dom";
import { Sidebar } from "./components/layout/Sidebar";
import { Header } from "./components/layout/Header";
import { Dashboard } from "./pages/Dashboard";
import { OrdersPage } from "./pages/OrdersPage";
import { ServicesPage } from "./pages/ServicesPage";
import { ProvidersPage } from "./pages/ProvidersPage";

function App() {
  return (
    <div className="flex min-h-screen bg-panel-950 text-slate-100 light:bg-slate-50 light:text-slate-900">
      <div className="hidden lg:flex">
        <Sidebar />
      </div>
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="flex-1 space-y-8 px-6 py-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/providers" element={<ProvidersPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
