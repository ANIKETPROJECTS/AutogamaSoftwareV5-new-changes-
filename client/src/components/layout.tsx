import { Link, useLocation } from 'wouter';
import { Menu, X, LayoutDashboard, UserPlus, Filter, Users, Wrench, UserCog, FileText, CreditCard, Package, Calendar, MessageCircle, Settings } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/register', label: 'Register Customers', icon: UserPlus },
  { href: '/funnel', label: 'Customers Funnel', icon: Filter },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/jobs', label: 'Jobs', icon: Wrench },
  { href: '/technicians', label: 'Technicians', icon: UserCog },
  { href: '/billing', label: 'Billing & Invoice', icon: FileText },
  { href: '/payments', label: 'Payment Tracking', icon: CreditCard },
  { href: '/inventory', label: 'Inventory', icon: Package },
  { href: '/appointments', label: 'Appointments', icon: Calendar },
  { href: '/whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg bg-card border border-border hover:bg-accent transition-colors"
        data-testid="button-menu-toggle"
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen w-60 bg-sidebar border-r border-sidebar-border transition-transform duration-300",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="h-full flex flex-col">
          <div className="p-5 border-b border-sidebar-border">
            <h1 className="font-display text-xl font-bold">
              <span className="text-primary">Auto</span><span className="text-foreground">Garage</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-1">CRM System</p>
          </div>

          <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location === item.href || (item.href !== '/' && location.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <div
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer text-sm",
                      isActive
                        ? "bg-primary text-primary-foreground font-medium"
                        : "text-sidebar-foreground hover:bg-sidebar-accent"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </div>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-sidebar-border">
            <p className="text-xs text-muted-foreground">AutoGarage CRM v1.0</p>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="md:ml-60 min-h-screen">
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
