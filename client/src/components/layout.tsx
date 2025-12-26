import { Link, useLocation } from 'wouter';
import { Menu, X, LayoutDashboard, UserPlus, Filter, Users, Wrench, UserCog, FileText, CreditCard, Package, Calendar, MessageCircle, Settings, LogOut, Bell, User, MessageSquare } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { usePageContext } from '@/contexts/page-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card } from '@/components/ui/card';

const menuItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/price-inquiries', label: 'Inquiry', icon: MessageSquare },
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

  const { data: appointments = [] } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => api.appointments.list(),
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => api.jobs.list(),
  });

  const pendingAppointments = (Array.isArray(appointments) ? appointments : []).filter((appt: any) => {
    const apptDate = new Date(appt.date);
    const today = new Date();
    return apptDate.toDateString() === today.toDateString() && appt.status === 'Scheduled';
  }).length;

  const completedJobsToday = (Array.isArray(jobs) ? jobs : []).filter((job: any) => {
    const jobDate = new Date(job.createdAt);
    const today = new Date();
    return job.stage === 'Completed' && jobDate.toDateString() === today.toDateString();
  });

  const todayCompletedJobs = completedJobsToday.length;

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
          {/* Appointment Badge */}
          {pendingAppointments > 0 && (
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
              <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                {pendingAppointments} {pendingAppointments === 1 ? 'appointment' : 'appointments'}
              </span>
            </div>
          )}

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
                {(todayCompletedJobs > 0 || notifications.length > 0) && (
                  <span className={cn(
                    "absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white text-center leading-none",
                    todayCompletedJobs > 0 ? "bg-green-500" : "bg-red-500"
                  )}>
                    {todayCompletedJobs > 0 ? todayCompletedJobs : notifications.length}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-96">
              <div className="p-3">
                <h3 className="font-semibold text-sm mb-3">Notifications</h3>
                
                {/* Completed Services Section */}
                {todayCompletedJobs > 0 && (
                  <div className="mb-3 space-y-2">
                    <p className="text-xs font-semibold text-green-700 dark:text-green-300 px-2">
                      Completed Services Today
                    </p>
                    {completedJobsToday.map((job: any) => (
                      <div key={job._id} className="p-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-md">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-green-900 dark:text-green-100">
                              {job.customerName}
                            </p>
                            <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                              {job.vehicleName} {job.plateNumber && `(${job.plateNumber})`}
                            </p>
                            {job.serviceType && (
                              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                Service: {job.serviceType}
                              </p>
                            )}
                          </div>
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-1 flex-shrink-0"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {todayCompletedJobs === 0 && notifications.length === 0 ? (
                  <div className="text-center py-6">
                    <Bell className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                    <p className="text-sm text-muted-foreground" data-testid="text-no-notifications">No notifications</p>
                  </div>
                ) : (
                  <>
                    {notifications.length > 0 && (
                      <div className="space-y-2 mt-3">
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 px-2">
                          Other Notifications
                        </p>
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
                          Clear
                        </Button>
                      </div>
                    )}
                  </>
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
