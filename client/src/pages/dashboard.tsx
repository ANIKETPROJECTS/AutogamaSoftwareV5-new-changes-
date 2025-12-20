import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/metric-card";
import { useAuth } from "@/contexts/auth-context";
import {
  IndianRupee,
  Package,
  AlertTriangle,
  Users,
  TrendingUp,
  Clock,
  Activity,
  Zap,
  LogOut,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";

const COLORS = ["#3B82F6", "#22C55E", "#F97316", "#dc2626"];

const STATUS_COLORS: Record<string, string> = {
  Inquired: "#3B82F6",
  Working: "#F97316",
  Waiting: "#EAB308",
  Completed: "#22C55E",
};

export default function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ["dashboard"],
    queryFn: api.dashboard.stats,
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ["jobs"],
    queryFn: () => api.jobs.list(),
  });

  const { data: lowStock = [] } = useQuery({
    queryKey: ["inventory", "low-stock"],
    queryFn: api.inventory.lowStock,
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: () => api.customers.list(),
  });

  const { data: inventory = [] } = useQuery({
    queryKey: ["inventory"],
    queryFn: api.inventory.list,
  });

  const customerStatusCount = customers.reduce((acc: Record<string, number>, customer: any) => {
    const status = customer.status || "Inquired";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const customerStatusData = Object.entries(customerStatusCount).map(([name, value]) => ({
    name,
    value,
  }));

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    
    const dayJobs = jobs.filter((job: any) => {
      const jobDate = new Date(job.createdAt);
      return jobDate >= dayStart && jobDate <= dayEnd;
    });
    
    const daySales = dayJobs.reduce((sum: number, job: any) => sum + (job.paidAmount || 0), 0);
    
    return {
      day: date.toLocaleDateString("en-US", { weekday: "short" }),
      sales: daySales,
    };
  });

  const customerGrowth = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - i));
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    
    const customersUpToMonth = customers.filter((c: any) => {
      const created = new Date(c.createdAt);
      return created <= monthEnd;
    }).length;
    
    return {
      month: date.toLocaleDateString("en-US", { month: "short" }),
      customers: customersUpToMonth,
    };
  });

  const categoryCount = inventory.reduce(
    (acc: Record<string, number>, item: any) => {
      const cat = item.category || "Uncategorized";
      acc[cat] = (acc[cat] || 0) + item.quantity;
      return acc;
    },
    {},
  );

  const categoryData = Object.entries(categoryCount).map(([name, value]) => ({
    name,
    products: value,
  }));

  const activeJobs = jobs
    .filter((j: any) => j.stage !== "Completed" && j.stage !== "Cancelled")
    .slice(0, 5);

  const todaySales = jobs.reduce((sum: number, job: any) => {
    const jobDate = new Date(job.createdAt);
    const today = new Date();
    if (jobDate.toDateString() === today.toDateString()) {
      return sum + (job.paidAmount || 0);
    }
    return sum;
  }, 0);

  const totalRevenue = jobs.reduce((sum: number, job: any) => sum + (job.paidAmount || 0), 0);
  const completedJobs = jobs.filter((j: any) => j.stage === "Completed").length;
  const jobCompletion = jobs.length > 0 ? Math.round((completedJobs / jobs.length) * 100) : 0;

  const { user, logout } = useAuth();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-4 border-b border-slate-200">
        <div>
          <h1
            className="text-2xl font-semibold text-slate-900"
            data-testid="text-dashboard-title"
          >
            Dashboard
          </h1>
          <p className="text-sm text-slate-600 mt-2">Welcome back! Here's your garage performance</p>
        </div>
        {user && (
          <div className="flex items-center gap-3 bg-gradient-to-br from-slate-100 to-slate-50 rounded-lg p-3 border border-slate-200">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-bold text-sm">
                {user.name?.charAt(0) || 'A'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900 text-sm truncate">{user.name}</p>
              <p className="text-slate-600 text-xs truncate">{user.email}</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2 text-slate-700 hover:bg-slate-200"
              onClick={logout}
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Metric Cards Grid */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Today's Sales"
          value={`₹${(todaySales/1000).toFixed(1)}K`}
          icon={IndianRupee}
          description="Revenue earned today"
          data-testid="card-todays-sales"
        />

        <MetricCard
          title="Active Jobs"
          value={jobs.filter((j: any) => j.stage !== "Completed" && j.stage !== "Cancelled").length}
          icon={Zap}
          description="Jobs in progress"
          data-testid="card-active-jobs-count"
        />

        <MetricCard
          title="Completion Rate"
          value={`${jobCompletion}%`}
          icon={TrendingUp}
          progress={jobCompletion}
          description={`${completedJobs} of ${jobs.length} jobs`}
          data-testid="card-job-completion"
        />

        <MetricCard
          title="Total Customers"
          value={customers.length}
          icon={Users}
          description="Registered customers"
          data-testid="card-total-customers"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:border-primary/50 transition-all"
          data-testid="card-sales-trends"
        >
          <CardHeader className="pb-4 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-transparent">
            <CardTitle className="flex items-center gap-3 text-base text-slate-900 font-semibold">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Sales Trends
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={last7Days}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                <XAxis dataKey="day" stroke="rgba(0,0,0,0.6)" />
                <YAxis stroke="rgba(0,0,0,0.6)" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid rgba(59,130,246,0.3)' }}
                />
                <Bar dataKey="sales" fill="#3B82F6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card
          className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:border-primary/50 transition-all"
          data-testid="card-customer-status"
        >
          <CardHeader className="pb-4 border-b border-slate-200 bg-gradient-to-r from-primary/5 to-transparent">
            <CardTitle className="flex items-center gap-3 text-base text-slate-900 font-semibold">
              <Activity className="w-5 h-5 text-primary" />
              Customer Status
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={customerStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#dc2626"
                  dataKey="value"
                >
                  {customerStatusData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid rgba(220,38,38,0.3)' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:border-green-600/50 transition-all"
          data-testid="card-customer-growth"
        >
          <CardHeader className="pb-4 border-b border-slate-200 bg-gradient-to-r from-green-50 to-transparent">
            <CardTitle className="flex items-center gap-3 text-base text-slate-900 font-semibold">
              <Users className="w-5 h-5 text-green-600" />
              Customer Growth
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={customerGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                <XAxis dataKey="month" stroke="rgba(0,0,0,0.6)" />
                <YAxis stroke="rgba(0,0,0,0.6)" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid rgba(34,197,94,0.3)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="customers" 
                  stroke="#22C55E" 
                  strokeWidth={2}
                  dot={{ fill: '#22C55E', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card
          className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:border-orange-500/50 transition-all"
          data-testid="card-inventory-categories"
        >
          <CardHeader className="pb-4 border-b border-slate-200 bg-gradient-to-r from-orange-50 to-transparent">
            <CardTitle className="flex items-center gap-3 text-base text-slate-900 font-semibold">
              <Package className="w-5 h-5 text-orange-600" />
              Inventory by Category
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                <XAxis type="number" stroke="rgba(0,0,0,0.6)" />
                <YAxis dataKey="name" type="category" stroke="rgba(0,0,0,0.6)" width={100} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid rgba(249,115,22,0.3)' }}
                />
                <Bar dataKey="products" fill="#F97316" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Active Jobs Table */}
      <Card
        className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:border-primary/50 transition-all"
        data-testid="card-active-jobs"
      >
        <CardHeader className="pb-4 border-b border-slate-200 bg-gradient-to-r from-primary/5 to-transparent">
          <CardTitle className="flex items-center gap-3 text-base text-slate-900 font-semibold">
            <Clock className="w-5 h-5 text-primary" />
            Active Jobs
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {activeJobs.length > 0 ? (
            <div className="space-y-3">
              {activeJobs.map((job: any) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-slate-50 to-white hover:from-slate-100 hover:to-slate-50 transition-all border border-slate-200 hover:border-slate-300"
                  data-testid={`job-row-${job.id}`}
                >
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 text-sm">{job.serviceType}</p>
                    <p className="text-xs text-slate-600 mt-1">{job.customerName}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-white text-primary border-primary/50 text-xs font-semibold"
                  >
                    {job.stage}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <p className="font-medium">No active jobs</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
