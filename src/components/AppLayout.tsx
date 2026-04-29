import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, ShoppingCart, Package, Receipt, BarChart3, LogOut, Droplets } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/sales", label: "Sales", icon: ShoppingCart },
  { to: "/inventory", label: "Inventory", icon: Package },
  { to: "/expenses", label: "Expenses", icon: Receipt },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
];

export function AppLayout() {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const current = navItems.find(n => n.to === pathname) ?? navItems[0];

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
    navigate("/auth");
  };

  return (
    <div className="min-h-screen flex w-full">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border bg-sidebar p-4 sticky top-0 h-screen">
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="rounded-xl bg-gradient-primary p-2 shadow-glow">
            <Droplets className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <p className="font-bold tracking-tight">OilFlow</p>
            <p className="text-xs text-muted-foreground">Manager</p>
          </div>
        </div>
        <nav className="mt-6 flex flex-col gap-1">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) => cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-gradient-primary text-primary-foreground shadow-glow"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto space-y-2">
          <div className="glass-card p-3 text-xs">
            <p className="text-muted-foreground">Signed in as</p>
            <p className="font-medium truncate">{user?.email}</p>
          </div>
          <Button variant="ghost" className="w-full justify-start gap-2" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="md:hidden sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-border bg-background/80 backdrop-blur px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-gradient-primary p-1.5">
              <Droplets className="h-4 w-4 text-primary-foreground" />
            </div>
            <p className="font-bold">{current.label}</p>
          </div>
          <ThemeToggle />
        </header>

        {/* Desktop header */}
        <header className="hidden md:flex sticky top-0 z-30 items-center justify-between gap-2 border-b border-border bg-background/60 backdrop-blur px-6 py-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight">{current.label}</h1>
          </div>
          <ThemeToggle />
        </header>

        <main className="flex-1 px-4 md:px-6 py-5 md:py-6 pb-24 md:pb-8 max-w-[1400px] w-full mx-auto">
          <Outlet />
        </main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/85 backdrop-blur-xl safe-bottom">
          <ul className="grid grid-cols-5">
            {navItems.map(item => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end
                  className={({ isActive }) => cn(
                    "flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {({ isActive }) => (
                    <>
                      <div className={cn("rounded-lg p-1.5 transition-all", isActive && "bg-primary/15")}>
                        <item.icon className="h-5 w-5" />
                      </div>
                      <span>{item.label}</span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}