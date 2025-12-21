import { Link, useLocation } from 'wouter';
import { Menu, X, LayoutDashboard, UserPlus, Filter, Users, Wrench, UserCog, FileText, CreditCard, Package, Calendar, MessageCircle, Settings, LogOut } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';

const navSections = [
  {
    title: 'Main',
    items: [
      { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    ]
  },
  {
    title: 'Customers',
    items: [
      { href: '/register', label: 'Register Customers', icon: UserPlus },
      { href: '/registered-customers', label: 'Registered Customers', icon: Filter },
    ]
  },
  {
    title: 'Service',
    items: [
      { href: '/customer-service', label: 'Customers Service', icon: Wrench },
      { href: '/jobs', label: 'Service Funnel', icon: Wrench },
      { href: '/invoices', label: 'Invoices & Tracking', icon: FileText },
    ]
  },
  {
    title: 'Operations',
    items: [
      { href: '/technicians', label: 'Technicians', icon: UserCog },
      { href: '/inventory', label: 'Inventory', icon: Package },
      { href: '/appointments', label: 'Appointments', icon: Calendar },
    ]
  },
  {
    title: 'Settings',
    items: [
      { href: '/settings', label: 'Settings', icon: Settings },
    ]
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        data-testid="button-menu-toggle"
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen w-64 bg-white border-r border-gray-200 transition-transform duration-300 flex flex-col",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
          {/* Logo Section */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-400 flex items-center justify-center text-gray-900 font-bold text-sm">
                M
              </div>
              <div>
                <h1 className="font-bold text-base text-gray-900">
                  Mauli Car World
                </h1>
                <p className="text-xs text-gray-500 font-medium">Manager v1.0</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            {navSections.map((section) => (
              <div key={section.title} className="mb-4">
                <h3 className="text-xs font-bold text-gray-600 mb-3 px-2">
                  {section.title}
                </h3>
                <div className="space-y-0">
                  {section.items.map((item) => {
                    const isActive = location === item.href || (item.href !== '/' && location.startsWith(item.href + '/'));
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
                            "flex items-center gap-3 px-3 py-2.5 cursor-pointer text-sm font-medium",
                            isActive
                              ? "bg-blue-100 text-blue-700 mx-2 rounded-md"
                              : "text-gray-700"
                          )}
                        >
                          <Icon className="w-5 h-5 flex-shrink-0" />
                          <span>{item.label}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="md:ml-64 min-h-screen bg-gray-50">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
