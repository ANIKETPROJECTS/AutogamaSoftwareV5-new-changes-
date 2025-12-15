import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IndianRupee, CreditCard, Search, TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'wouter';

export default function PaymentTracking() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => api.jobs.list(),
  });

  // Filter jobs with payment info
  const paymentJobs = jobs.filter((job: any) => {
    const matchesSearch = 
      job.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      job.plateNumber?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || job.paymentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const paidCount = jobs.filter((j: any) => j.paymentStatus === 'Paid').length;
  const partialCount = jobs.filter((j: any) => j.paymentStatus === 'Partially Paid').length;
  const pendingCount = jobs.filter((j: any) => j.paymentStatus === 'Pending').length;

  const totalCollected = jobs.reduce((sum: number, j: any) => sum + (j.paidAmount || 0), 0);
  const totalPending = jobs.reduce((sum: number, j: any) => sum + ((j.totalAmount || 0) - (j.paidAmount || 0)), 0);

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400';
      case 'Partially Paid': return 'bg-yellow-100 dark:bg-yellow-950/50 text-yellow-700 dark:text-yellow-400';
      default: return 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400';
    }
  };

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'Paid': return <CheckCircle className="w-4 h-4" />;
      case 'Partially Paid': return <Clock className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground" data-testid="text-payments-title">
          Payment Tracking
        </h1>
        <p className="text-muted-foreground mt-1">Monitor and track all payment statuses</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800" data-testid="card-collected">
          <CardContent className="p-4">
            <p className="text-sm text-green-600 dark:text-green-400 font-medium">Total Collected</p>
            <p className="text-2xl font-bold mt-1 text-green-900 dark:text-green-100 flex items-center">
              <IndianRupee className="w-5 h-5" />
              {totalCollected.toLocaleString('en-IN')}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800" data-testid="card-pending-total">
          <CardContent className="p-4">
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">Total Pending</p>
            <p className="text-2xl font-bold mt-1 text-red-900 dark:text-red-100 flex items-center">
              <IndianRupee className="w-5 h-5" />
              {totalPending.toLocaleString('en-IN')}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800" data-testid="card-paid-count">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Paid</p>
                <p className="text-2xl font-bold mt-1 text-emerald-900 dark:text-emerald-100">{paidCount}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800" data-testid="card-partial-count">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">Partial</p>
                <p className="text-2xl font-bold mt-1 text-yellow-900 dark:text-yellow-100">{partialCount}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800" data-testid="card-pending-count">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">Pending</p>
                <p className="text-2xl font-bold mt-1 text-red-900 dark:text-red-100">{pendingCount}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by customer or vehicle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            data-testid="input-search-payments"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Paid">Paid</SelectItem>
            <SelectItem value="Partially Paid">Partially Paid</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Payment List */}
      <Card className="border-orange-200 dark:border-orange-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-500" />
            Payment Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-center py-8">Loading...</p>
          ) : paymentJobs.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No payment records found</p>
          ) : (
            <div className="space-y-3">
              {paymentJobs.map((job: any) => (
                <div 
                  key={job._id}
                  className="flex items-center justify-between p-4 bg-accent/30 rounded-lg hover:bg-accent/50 transition-colors"
                  data-testid={`payment-item-${job._id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${getPaymentStatusColor(job.paymentStatus)}`}>
                      {getPaymentStatusIcon(job.paymentStatus)}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{job.customerName}</p>
                      <p className="text-sm text-muted-foreground">{job.vehicleName} - {job.plateNumber}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="font-bold text-foreground flex items-center justify-end">
                        <IndianRupee className="w-4 h-4" />
                        {(job.totalAmount || 0).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Paid</p>
                      <p className="font-bold text-green-600 flex items-center justify-end">
                        <IndianRupee className="w-4 h-4" />
                        {(job.paidAmount || 0).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Balance</p>
                      <p className="font-bold text-red-600 flex items-center justify-end">
                        <IndianRupee className="w-4 h-4" />
                        {((job.totalAmount || 0) - (job.paidAmount || 0)).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <Badge className={`${getPaymentStatusColor(job.paymentStatus)} min-w-[100px] justify-center`}>
                      {job.paymentStatus}
                    </Badge>
                    <Link href={`/jobs/${job._id}`}>
                      <Button variant="outline" size="sm" data-testid={`button-add-payment-${job._id}`}>
                        Add Payment
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
