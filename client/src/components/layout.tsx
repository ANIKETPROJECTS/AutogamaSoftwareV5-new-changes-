import { Link, useLocation } from 'wouter';
import { Menu, X, LayoutDashboard, UserPlus, Filter, Users, Wrench, UserCog, FileText, CreditCard, Package, Calendar, MessageCircle, Settings, LogOut, Bell, User, Moon, Sun } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const [isDark, setIsDark] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // Initialize theme from localStorage
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme ? savedTheme === 'dark' : prefersDark;
    
    const html = document.documentElement;
    if (shouldBeDark) {
      html.classList.add('dark');
      setIsDark(true);
    } else {
      html.classList.remove('dark');
      setIsDark(false);
    }
  }, []);

  const toggleTheme = () => {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
      html.classList.remove('dark');
      setIsDark(false);
      localStorage.setItem('theme', 'light');
    } else {
      html.classList.add('dark');
      setIsDark(true);
      localStorage.setItem('theme', 'dark');
    }
  };

  const handleClearNotifications = () => {
    setNotifications([]);
  };

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
          "fixed left-0 top-0 z-40 h-screen w-64 bg-card border-r border-border transition-transform duration-300 flex flex-col",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
          {/* Logo Section */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                AG
              </div>
              <div>
                <h1 className="font-bold text-base text-foreground">
                  AutoGarage
                </h1>
                <p className="text-xs text-muted-foreground font-medium">CRM System</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-1">
              {menuItems.map((item) => {
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
                        "flex items-center gap-3 px-3 py-2.5 cursor-pointer text-sm font-medium rounded-md transition-colors",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-primary"
                          : "text-sidebar-foreground hover:bg-sidebar-accent"
                      )}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span>{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </nav>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Header */}
      <header className="md:ml-64 bg-card border-b border-border sticky top-0 z-30">
        <div className="px-4 md:px-8 py-4 flex items-center justify-end gap-4">
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

          {/* Theme Toggle Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            data-testid="button-theme-toggle"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="md:ml-64 min-h-screen bg-background">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
