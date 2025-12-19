import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  IndianRupee,
  Package,
  AlertTriangle,
  Users,
  TrendingUp,
  Clock,
  Activity,
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

const COLORS = ["#3B82F6", "#22C55E", "#F97316", "#EAB308"];

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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1
            className="font-display text-4xl font-bold tracking-tight text-foreground"
            data-testid="text-dashboard-title"
          >
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">Your garage operations at a glance</p>
        </div>
      </div>

      <div className="stat-card-grid">
        <Card className="stat-card" data-testid="card-todays-sales">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="stat-label">Today's Sales</p>
                <p className="stat-value">₹{(todaySales/1000).toFixed(1)}K</p>
              </div>
              <div className="stat-icon-container">
                <IndianRupee className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card" data-testid="card-active-jobs-count">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="stat-label">Active Jobs</p>
                <p className="stat-value">{jobs.filter((j: any) => j.stage !== "Completed" && j.stage !== "Cancelled").length}</p>
              </div>
              <div className="stat-icon-container">
                <Package className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card" data-testid="card-low-stock-count">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="stat-label">Low Stock</p>
                <p className="stat-value">{lowStock.length}</p>
              </div>
              <div className="stat-icon-container">
                <AlertTriangle className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card" data-testid="card-total-customers">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="stat-label">Customers</p>
                <p className="stat-value">{customers.length}</p>
              </div>
              <div className="stat-icon-container">
                <Users className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          className="card-modern"
          data-testid="card-sales-trends"
        >
          <CardHeader className="pb-4 border-b border-border/50">
            <CardTitle className="flex items-center gap-3 text-base text-foreground">
              <TrendingUp className="w-4 h-4 text-primary" />
              Sales Trends (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={last7Days}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="day" className="text-muted-foreground" />
                <YAxis className="text-muted-foreground" />
                <Tooltip />
                <Bar dataKey="sales" fill="#dc2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card
          className="card-modern"
          data-testid="card-service-status"
        >
          <CardHeader className="pb-4 border-b border-border/50">
            <CardTitle className="flex items-center gap-3 text-base text-foreground">
              <Clock className="w-4 h-4 text-primary" />
              Customer Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart margin={{ left: 80, right: 20 }}>
                <Pie
                  data={customerStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {customerStatusData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={STATUS_COLORS[entry.name] || COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card
          className="card-modern"
          data-testid="card-customer-growth"
        >
          <CardHeader className="pb-4 border-b border-border/50">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <TrendingUp className="w-5 h-5 text-primary" />
              Customer Growth (6 Months)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={customerGrowth}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-muted-foreground" />
                <YAxis className="text-muted-foreground" />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="customers"
                  stroke="#dc2626"
                  strokeWidth={2}
                  dot={{ fill: "#dc2626", strokeWidth: 2 }}
                  name="Total Customers"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card
          className="card-modern"
          data-testid="card-product-categories"
        >
          <CardHeader className="pb-4 border-b border-border/50">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Package className="w-5 h-5 text-primary" />
              Product Categories
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" className="text-muted-foreground" />
                <YAxis
                  dataKey="name"
                  type="category"
                  className="text-muted-foreground"
                  width={100}
                />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="products"
                  fill="#F97316"
                  radius={[0, 4, 4, 0]}
                  name="Products"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card
          className="border-border"
          data-testid="card-active-service-jobs"
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-foreground">
              Active Service Jobs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeJobs.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No active jobs
              </p>
            ) : (
              activeJobs.map((job: any) => (
                <div
                  key={job._id}
                  className="flex items-center justify-between p-3 bg-accent/30 rounded-lg"
                  data-testid={`job-item-${job._id}`}
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {job.customerName || "Unknown"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {job.plateNumber}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-blue-50 text-blue-600 border-blue-200"
                  >
                    <Clock className="w-3 h-3 mr-1" />
                    {job.stage === "New Lead" ? "Inquired" : job.stage}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card
          className="border-border"
          data-testid="card-low-stock-alerts"
        >
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {lowStock.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No low stock items
              </p>
            ) : (
              lowStock.slice(0, 5).map((item: any) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between p-3 bg-accent/30 rounded-lg"
                  data-testid={`low-stock-item-${item._id}`}
                >
                  <div>
                    <p className="font-medium text-foreground">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Reorder level: {item.minStock}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-orange-500">
                      {item.quantity}
                    </p>
                    <p className="text-xs text-muted-foreground">in stock</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card
        className="border-border"
        data-testid="card-recent-activity"
      >
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Activity className="w-5 h-5 text-purple-500" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {customers.slice(0, 5).map((customer: any, i: number) => (
            <div
              key={customer._id || i}
              className="flex items-center justify-between p-3 hover:bg-accent/30 rounded-lg transition-colors"
              data-testid={`activity-item-${customer._id}`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Activity className="w-4 h-4 text-purple-500" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {customer.status === "Inquired" ? "New inquiry from" : "Customer"}{" "}
                    {customer.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {customer.phone}
                    </Badge>
                    <Badge className="text-xs bg-green-100 text-green-700">
                      {customer.status || "Inquired"}
                    </Badge>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {new Date(customer.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
          {customers.length === 0 && (
            <p className="text-muted-foreground text-center py-4">
              No recent activity
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
