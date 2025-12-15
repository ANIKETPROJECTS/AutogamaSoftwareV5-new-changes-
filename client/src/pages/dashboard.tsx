import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { IndianRupee, Package, AlertTriangle, Users, TrendingUp, Clock, Store, Activity } from 'lucide-react';
import { Link } from 'wouter';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';

const COLORS = ['#3B82F6', '#22C55E', '#F97316', '#EAB308'];

export default function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ['dashboard'],
    queryFn: api.dashboard.stats,
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => api.jobs.list(),
  });

  const { data: lowStock = [] } = useQuery({
    queryKey: ['inventory', 'low-stock'],
    queryFn: api.inventory.lowStock,
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.customers.list(),
  });

  const { data: inventory = [] } = useQuery({
    queryKey: ['inventory'],
    queryFn: api.inventory.list,
  });

  // Calculate service status distribution
  const stageCount = jobs.reduce((acc: Record<string, number>, job: any) => {
    const stage = job.stage || 'Unknown';
    acc[stage] = (acc[stage] || 0) + 1;
    return acc;
  }, {});

  const serviceStatusData = Object.entries(stageCount).map(([name, value]) => ({
    name: name.replace('Work In Progress', 'Working').replace('New Lead', 'Inquired').replace('Ready for Delivery', 'Waiting'),
    value,
  }));

  // Sales trends - last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      sales: Math.floor(Math.random() * 20000), // Replace with actual data
    };
  });

  // Customer growth - 6 months
  const customerGrowth = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - i));
    return {
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      customers: customers.filter((c: any) => {
        const created = new Date(c.createdAt || date);
        return created <= date;
      }).length || i + 1,
    };
  });

  // Product categories
  const categoryCount = inventory.reduce((acc: Record<string, number>, item: any) => {
    const cat = item.category || 'Uncategorized';
    acc[cat] = (acc[cat] || 0) + item.quantity;
    return acc;
  }, {});

  const categoryData = Object.entries(categoryCount).map(([name, value]) => ({
    name,
    products: value,
  }));

  // Active service jobs
  const activeJobs = jobs.filter((j: any) => 
    j.stage !== 'Completed' && j.stage !== 'Cancelled'
  ).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground" data-testid="text-dashboard-title">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back, Admin</p>
        </div>
        <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 px-4 py-2 text-sm" data-testid="badge-current-shop">
          <Store className="w-4 h-4 mr-2" />
          Current Shop: Shop A - Beed
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800" data-testid="card-todays-sales">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Today's Sales</p>
                <p className="text-3xl font-bold mt-1 text-blue-900 dark:text-blue-100 flex items-center">
                  <IndianRupee className="w-6 h-6" />
                  {(stats?.todaySales || 0).toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-green-600 mt-1">+12.5% from last month</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <IndianRupee className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800" data-testid="card-active-jobs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">Active Service Jobs</p>
                <p className="text-3xl font-bold mt-1 text-yellow-900 dark:text-yellow-100">
                  {stats?.activeJobs || activeJobs.length}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg">
                <Package className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800" data-testid="card-low-stock">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">Low Stock Items</p>
                <p className="text-3xl font-bold mt-1 text-orange-900 dark:text-orange-100">
                  {lowStock.length}
                </p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800" data-testid="card-total-customers">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">Total Customers</p>
                <p className="text-3xl font-bold mt-1 text-green-900 dark:text-green-100">
                  {customers.length}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-lg">
                <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-orange-200 dark:border-orange-800" data-testid="card-sales-trends">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              Sales Trends (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={last7Days}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="day" className="text-muted-foreground" />
                <YAxis className="text-muted-foreground" />
                <Tooltip />
                <Bar dataKey="sales" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-orange-200 dark:border-orange-800" data-testid="card-service-status">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Clock className="w-5 h-5 text-green-500" />
              Service Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={serviceStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {serviceStatusData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-orange-200 dark:border-orange-800" data-testid="card-customer-growth">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <TrendingUp className="w-5 h-5 text-green-500" />
              Customer Growth (6 Months)
            </CardTitle>
          </CardHeader>
          <CardContent>
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
                  stroke="#22C55E" 
                  strokeWidth={2}
                  dot={{ fill: '#22C55E', strokeWidth: 2 }}
                  name="Total Customers"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-orange-200 dark:border-orange-800" data-testid="card-product-categories">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Package className="w-5 h-5 text-orange-500" />
              Product Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" className="text-muted-foreground" />
                <YAxis dataKey="name" type="category" className="text-muted-foreground" width={100} />
                <Tooltip />
                <Legend />
                <Bar dataKey="products" fill="#F97316" radius={[0, 4, 4, 0]} name="Products" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Active Jobs & Low Stock */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-orange-200 dark:border-orange-800" data-testid="card-active-service-jobs">
          <CardHeader className="pb-2">
            <CardTitle className="text-foreground">Active Service Jobs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeJobs.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No active jobs</p>
            ) : (
              activeJobs.map((job: any) => (
                <div key={job._id} className="flex items-center justify-between p-3 bg-accent/30 rounded-lg" data-testid={`job-item-${job._id}`}>
                  <div>
                    <p className="font-medium text-foreground">{job.customerName || 'Unknown'}</p>
                    <p className="text-sm text-muted-foreground">{job.plateNumber}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Phase 1</span>
                    <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border-blue-200">
                      <Clock className="w-3 h-3 mr-1" />
                      {job.stage === 'New Lead' ? 'Inquired' : job.stage}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-orange-200 dark:border-orange-800" data-testid="card-low-stock-alerts">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {lowStock.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No low stock items</p>
            ) : (
              lowStock.slice(0, 5).map((item: any) => (
                <div key={item._id} className="flex items-center justify-between p-3 bg-accent/30 rounded-lg" data-testid={`low-stock-item-${item._id}`}>
                  <div>
                    <p className="text-sm text-muted-foreground">Reorder level: {item.minStock}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-orange-500">{item.quantity}</p>
                    <p className="text-xs text-muted-foreground">in stock</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-orange-200 dark:border-orange-800" data-testid="card-recent-activity">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Activity className="w-5 h-5 text-purple-500" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {jobs.slice(0, 5).map((job: any, i: number) => (
            <div key={job._id || i} className="flex items-center justify-between p-3 hover:bg-accent/30 rounded-lg transition-colors" data-testid={`activity-item-${job._id}`}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Activity className="w-4 h-4 text-purple-500" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {job.stage === 'New Lead' ? 'New inquiry from' : 'Job updated for'} {job.customerName}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">{job.customerName}</Badge>
                    <Badge className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                      {job.stage === 'New Lead' ? 'inquiry' : 'update'}
                    </Badge>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">recently</p>
            </div>
          ))}
          {jobs.length === 0 && (
            <p className="text-muted-foreground text-center py-4">No recent activity</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
