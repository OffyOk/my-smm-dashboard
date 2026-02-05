import { Bell, Menu, Search } from "lucide-react";
import { ThemeToggle } from "../theme-toggle";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-slate-800/60 bg-panel-950/80 px-6 py-4 backdrop-blur light:border-slate-200 light:bg-white/80">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Super Admin</p>
        <h1 className="text-xl font-semibold">Mission Control Panel</h1>
      </div>

      <div className="flex flex-1 items-center justify-end gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-4 w-4" />
        </Button>
        <div className="hidden w-full max-w-md items-center gap-2 rounded-lg border border-slate-800/60 bg-slate-900/40 px-3 py-2 text-sm text-slate-400 light:border-slate-200 light:bg-slate-100 sm:flex">
          <Search className="h-4 w-4" />
          <Input
            placeholder="Search orders, links, services"
            className="h-7 border-none bg-transparent p-0 text-sm text-slate-200 focus-visible:ring-0 light:text-slate-800"
          />
        </div>
        <Button variant="ghost" size="icon">
          <Bell className="h-4 w-4" />
        </Button>
        <ThemeToggle />
      </div>
    </header>
  );
}
