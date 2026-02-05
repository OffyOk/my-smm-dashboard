import { NavLink } from "react-router-dom";
import {
  Activity,
  Bot,
  LayoutDashboard,
  ListOrdered,
  MessageCircle,
  Calculator,
  PlugZap,
  Settings2,
} from "lucide-react";
import { cn } from "../../lib/utils";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/orders", label: "Order Manager", icon: ListOrdered },
  { to: "/messages", label: "Quick Messages", icon: MessageCircle },
  { to: "/pricing", label: "Pricing Calculator", icon: Calculator },
  { to: "/services", label: "Services", icon: Settings2 },
  { to: "/providers", label: "Providers", icon: PlugZap },
];

export function Sidebar() {
  return (
    <aside className="flex h-screen w-[260px] flex-col gap-6 border-r border-slate-800/60 bg-panel-950 px-5 py-6 text-slate-100 light:border-slate-200 light:bg-white light:text-slate-900">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300 light:bg-emerald-100 light:text-emerald-700">
          <Bot className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Rocket Boost</p>
          <p className="text-lg font-semibold">Mission Control</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800/60 bg-slate-900/60 px-4 py-3 text-xs text-slate-300 light:border-slate-200 light:bg-slate-100 light:text-slate-600">
        <p className="text-[11px] uppercase tracking-[0.3em]">System Pulse</p>
        <div className="mt-2 flex items-center gap-2">
          <Activity className="h-4 w-4 text-emerald-400" />
          <span>All automations healthy</span>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                  isActive
                    ? "bg-slate-900/70 text-white shadow-glow light:bg-slate-100 light:text-slate-900"
                    : "text-slate-400 hover:bg-slate-900/40 hover:text-slate-100 light:text-slate-600 light:hover:bg-slate-100"
                )
              }
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-4 text-xs text-slate-400 light:border-slate-200 light:bg-slate-100 light:text-slate-600">
        <p className="text-[11px] uppercase tracking-[0.3em]">Queue Status</p>
        <p className="mt-2 text-sm text-slate-200 light:text-slate-800">1,248 jobs pending</p>
        <p className="mt-1 text-[12px]">ETA: 14 min</p>
      </div>
    </aside>
  );
}
