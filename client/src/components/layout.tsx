import { Link, useLocation } from 'wouter';
import { Menu, X, LayoutDashboard, UserPlus, Filter, Users, Wrench, UserCog, FileText, CreditCard, Package, Calendar, MessageCircle, Settings, LogOut, Bell, User, DollarSign } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { usePageContext } from '@/contexts/page-context';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card } from '@/components/ui/card';

const menuItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/price-inquiries', label: 'Inquiry', icon: DollarSign },
  { href: '/register', label: 'Register Customers', icon: UserPlus },
  { href: '/registered-customers', label: 'Registered Customers', icon: Filter },
  { href: '/customer-service', label: 'Customers Service', icon: Wrench },
  { href: '/jobs', label: 'Service Funnel', icon: Wrench },
  { href: '/invoices', label: 'Invoices & Tracking', icon: FileText },
  { href: '/technicians', label: 'Technicians', icon: UserCog },
  { href: '/inventory', label: 'Inventory', icon: Package },
  { href: '/appointments', label: 'Appointments', icon: Calendar },
  { href: '/settings', label: 'Settings', icon: Settings },
];

interface Notification {
  id: string;
  message: string;
  timestamp: Date;
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  const { title: pageTitle, subtitle: pageSubtitle } = usePageContext();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const handleClearNotifications = () => {
    setNotifications([]);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-card border-r border-border transition-all duration-300 ease-in-out flex flex-col",
          sidebarOpen ? "w-64" : "w-20"
        )}
      >
        {/* Header with Toggle Button */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <img 
                src="/logo.png" 
                alt="AutoGarage Logo" 
                className="h-8 object-contain"
              />
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 hover:bg-secondary rounded-md transition-colors"
            data-testid="button-sidebar-toggle"
            title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            <Menu className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 overflow-y-auto">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const isActive = location === item.href || (item.href !== '/' && location.startsWith(item.href + '/'));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <div
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 cursor-pointer text-sm font-medium rounded-md transition-colors whitespace-nowrap",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-primary"
                        : "text-sidebar-foreground hover:bg-sidebar-accent"
                    )}
                    title={!sidebarOpen ? item.label : undefined}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {sidebarOpen && <span>{item.label}</span>}
                  </div>
                </Link>
              );
            })}
          </div>
        </nav>
      </aside>

      {/* Header */}
      <header className={cn(
        "bg-card border-b border-border sticky top-0 z-30 transition-all duration-300 ease-in-out",
        sidebarOpen ? "ml-64" : "ml-20"
      )}>
        <div className="px-4 md:px-8 py-4 flex items-center justify-between gap-4">
          {/* Page Title and Subtitle */}
          {(pageTitle || pageSubtitle) && (
            <div>
              {pageTitle && <h1 className="text-2xl font-bold text-slate-900">{pageTitle}</h1>}
              {pageSubtitle && <p className="text-sm text-slate-600">{pageSubtitle}</p>}
            </div>
          )}
          <div className="flex items-center gap-4 ml-auto">
          {/* Notification Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                data-testid="button-notifications"
                className="relative"
              >
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="p-2">
                <h3 className="font-semibold text-sm mb-2">Notifications</h3>
                {notifications.length === 0 ? (
                  <div className="text-center py-6">
                    <Bell className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                    <p className="text-sm text-muted-foreground" data-testid="text-no-notifications">No notifications</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {notifications.map((notif) => (
                      <div key={notif.id} className="text-sm p-2 bg-secondary rounded">
                        <p>{notif.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {notif.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearNotifications}
                      className="w-full"
                      data-testid="button-clear-notifications"
                    >
                      Clear All
                    </Button>
                  </div>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Profile Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                data-testid="button-profile"
              >
                <User className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled>
                <span className="text-sm">{user?.email || 'Profile'}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={logout} data-testid="menu-logout">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={cn(
        "min-h-screen bg-background transition-all duration-300 ease-in-out",
        sidebarOpen ? "ml-64" : "ml-20"
      )}>
        <div className="p-4 md:p-8 max-w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
