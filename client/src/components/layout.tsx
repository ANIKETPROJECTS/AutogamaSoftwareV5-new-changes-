import { Link, useLocation } from 'wouter';
import { Menu, X, LayoutDashboard, UserPlus, Filter, Users, Wrench, UserCog, FileText, CreditCard, Package, Calendar, MessageCircle, Settings, LogOut, Bell, User, MessageSquare, CalendarClock } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
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
import { format, isToday, isTomorrow, addDays, startOfDay, endOfDay } from 'date-fns';

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
  { href: '/accessories', label: 'Accessories', icon: CreditCard },
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

  const [dismissedJobs, setDismissedJobs] = useState<string[]>([]);

  const { data: appointmentsData } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => api.appointments.list(),
  });
  const appointments = appointmentsData?.appointments || appointmentsData || [];

  const { data: jobsData } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => api.jobs.list(),
  });
  const jobs = jobsData?.jobs || jobsData || [];

  const pendingAppointments = (Array.isArray(appointments) ? appointments : []).filter((appt: any) => {
    const apptDate = new Date(appt.date);
    const today = new Date();
    return apptDate.toDateString() === today.toDateString() && appt.status === 'Scheduled';
  }).length;

  const completedJobsToday = (Array.isArray(jobs) ? jobs : []).filter((job: any) => {
    const jobDate = new Date(job.createdAt);
    const today = new Date();
    return (
      job.stage === 'Completed' && 
      jobDate.toDateString() === today.toDateString() &&
      !dismissedJobs.includes(job._id)
    );
  });

  const todayCompletedJobs = completedJobsToday.length;

  const upcomingAppointments = useMemo(() => {
    if (!Array.isArray(appointments)) return [];
    const today = startOfDay(new Date());
    const nextWeek = endOfDay(addDays(today, 7));
    
    return appointments
      .filter((appt: any) => {
        const date = new Date(appt.date);
        return date >= today && date <= nextWeek && appt.status === 'Scheduled';
      })
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [appointments]);

  const hasUrgentAppointment = useMemo(() => {
    return upcomingAppointments.some((appt: any) => {
      const date = new Date(appt.date);
      return isToday(date) || isTomorrow(date);
    });
  }, [upcomingAppointments]);

  const handleClearNotifications = () => {
    setNotifications([]);
    if (completedJobsToday.length > 0) {
      setDismissedJobs(prev => [...prev, ...completedJobsToday.map((j: any) => j._id)]);
    }
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
          {/* Upcoming Appointments Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9"
                data-testid="button-appointment-alerts"
              >
                <CalendarClock className={cn(
                  "w-5 h-5 transition-colors",
                  hasUrgentAppointment ? "text-red-500 animate-pulse" : "text-slate-600"
                )} />
                {upcomingAppointments.length > 0 && (
                  <span className={cn(
                    "absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white",
                    hasUrgentAppointment ? "bg-red-500" : "bg-blue-500"
                  )}>
                    {upcomingAppointments.length}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="p-3">
                <div className="flex items-center justify-between mb-3 border-b pb-2">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <CalendarClock className="w-4 h-4" />
                    Upcoming Appointments
                  </h3>
                  <Link href="/appointments">
                    <Button variant="ghost" size="sm" className="h-7 text-xs px-2">View all</Button>
                  </Link>
                </div>
                
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {upcomingAppointments.length > 0 ? (
                    upcomingAppointments.map((appt: any) => {
                      const apptDate = new Date(appt.date);
                      const urgent = isToday(apptDate) || isTomorrow(apptDate);
                      return (
                        <div 
                          key={appt._id} 
                          className={cn(
                            "p-2 rounded-md border text-sm transition-colors",
                            urgent 
                              ? "bg-red-50 border-red-200 text-red-900" 
                              : "bg-slate-50 border-slate-100 text-slate-900"
                          )}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <span className="font-semibold truncate">{appt.customerName}</span>
                            <Badge variant={urgent ? "destructive" : "outline"} className="text-[10px] h-4 px-1 shrink-0">
                              {isToday(apptDate) ? 'Today' : isTomorrow(apptDate) ? 'Tomorrow' : format(apptDate, 'MMM dd')}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between mt-1 text-[11px] opacity-80">
                            <span>{appt.vehicleName}</span>
                            <span>{appt.time}</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-4 text-slate-500 text-sm">
                      No appointments in the next 7 days
                    </div>
                  )}
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

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
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">Notifications</h3>
                  {(todayCompletedJobs > 0 || notifications.length > 0) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearNotifications}
                      className="h-7 text-xs text-muted-foreground hover:text-foreground"
                      data-testid="button-mark-all-done"
                    >
                      Mark all done
                    </Button>
                  )}
                </div>
                
                {/* Completed Services Section */}
                {todayCompletedJobs > 0 && (
                  <div className="mb-3 space-y-2">
                    <p className="text-xs font-semibold text-green-700 dark:text-green-300 px-2">
                      Completed Services Today
                    </p>
                    {completedJobsToday.map((job: any) => (
                      <Link key={job._id} href="/funnel">
                        <div className="p-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-md cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors">
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
                      </Link>
                    ))}
                  </div>
                )}

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
                  </div>
                )}

                {todayCompletedJobs === 0 && notifications.length === 0 && (
                  <div className="text-center py-6">
                    <Bell className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                    <p className="text-sm text-muted-foreground" data-testid="text-no-notifications">No notifications</p>
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
