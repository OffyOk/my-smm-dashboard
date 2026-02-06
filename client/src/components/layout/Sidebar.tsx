import { NavLink } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Bot,
  LayoutDashboard,
  ListOrdered,
  MessageCircle,
  Calculator,
  Users,
  PlugZap,
  Settings2,
  ChevronsLeft,
  ChevronsRight,
  Wallet,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { apiFetch } from "../../lib/api";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/orders", label: "Order Manager", icon: ListOrdered },
  { to: "/messages", label: "Quick Messages", icon: MessageCircle },
  { to: "/pricing", label: "Pricing Calculator", icon: Calculator },
  { to: "/users", label: "Users", icon: Users },
  { to: "/services", label: "Services", icon: Settings2 },
  { to: "/providers", label: "Providers", icon: PlugZap },
];

type BalanceItem = {
  code: string;
  balance: number | null;
  balance_status: "ok" | "error";
};

type SidebarProps = {
  collapsed?: boolean;
  onToggle?: () => void;
};

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const balancesQuery = useQuery({
    queryKey: ["providers", "balances"],
    queryFn: () => apiFetch<BalanceItem[]>("/api/providers/balances"),
  });

  const lowBalances =
    balancesQuery.data?.filter(
      (item) => item.balance_status === "ok" && item.balance !== null && item.balance < 2
    ) ?? [];

  return (
    <aside
      className={cn(
        "flex h-screen flex-col gap-6 border-r border-slate-800/60 bg-panel-950 py-6 text-slate-100 light:border-slate-200 light:bg-white light:text-slate-900",
        collapsed ? "w-[84px] px-3" : "w-[260px] px-5",
      )}
    >
      <div className={cn("flex items-center", collapsed ? "justify-center" : "gap-3")}>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300 light:bg-emerald-100 light:text-emerald-700">
          <Bot className="h-5 w-5" />
        </div>
        {!collapsed && (
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Rocket Boost</p>
            <p className="text-lg font-semibold">Mission Control</p>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "flex items-center gap-2 rounded-lg border border-slate-800/60 bg-slate-900/40 px-3 py-2 text-xs text-slate-400 transition hover:text-slate-100 light:border-slate-200 light:bg-slate-100 light:text-slate-600",
          collapsed ? "justify-center" : "justify-between",
        )}
      >
        {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
        {!collapsed && <span>Collapse</span>}
      </button>

      {!collapsed && (
        <div className="rounded-xl border border-slate-800/60 bg-slate-900/60 px-4 py-3 text-xs text-slate-300 light:border-slate-200 light:bg-slate-100 light:text-slate-600">
          <p className="text-[11px] uppercase tracking-[0.3em]">System Pulse</p>
          <div className="mt-2 flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-400" />
            <span>All automations healthy</span>
          </div>
        </div>
      )}

      <nav className="flex flex-1 flex-col gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition",
                  collapsed ? "justify-center" : "gap-3",
                  isActive
                    ? "bg-slate-900/70 text-white shadow-glow light:bg-slate-100 light:text-slate-900"
                    : "text-slate-400 hover:bg-slate-900/40 hover:text-slate-100 light:text-slate-600 light:hover:bg-slate-100",
                )
              }
            >
              <Icon className="h-4 w-4" />
              {!collapsed && item.label}
            </NavLink>
          );
        })}
      </nav>

      <div
        className={cn(
          "rounded-xl border border-slate-800/60 bg-slate-900/40 text-xs text-slate-400 light:border-slate-200 light:bg-slate-100 light:text-slate-600",
          collapsed ? "p-3" : "p-4",
        )}
      >
        <div className={cn("flex items-center", collapsed ? "justify-center" : "justify-between")}>
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-amber-400" />
            {!collapsed && (
              <p className="text-[11px] uppercase tracking-[0.3em]">Balance Alert</p>
            )}
          </div>
          {collapsed && (
            <span className="text-xs font-semibold text-slate-200">{lowBalances.length}</span>
          )}
        </div>
        {!collapsed && (
          <div className="mt-2 space-y-1">
            <p className="text-sm text-slate-200 light:text-slate-800">
              {lowBalances.length}
              <span className="ml-2 text-[11px] uppercase tracking-[0.3em] text-slate-500">Low</span>
            </p>
            <p className="text-[12px]">
              {lowBalances.length
                ? lowBalances.map((item) => item.code).join(", ")
                : "All providers healthy"}
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}