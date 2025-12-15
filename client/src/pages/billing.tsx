import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { IndianRupee, FileText, Download, Search, Eye, Printer } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'wouter';

export default function Billing() {
  const [search, setSearch] = useState('');

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => api.jobs.list(),
  });

  // Filter completed jobs with amounts
  const billedJobs = jobs.filter((job: any) => 
    job.totalAmount > 0 &&
    (job.customerName?.toLowerCase().includes(search.toLowerCase()) ||
     job.plateNumber?.toLowerCase().includes(search.toLowerCase()))
  );

  const totalRevenue = billedJobs.reduce((sum: number, job: any) => sum + (job.paidAmount || 0), 0);
  const pendingAmount = billedJobs.reduce((sum: number, job: any) => sum + ((job.totalAmount || 0) - (job.paidAmount || 0)), 0);
  const totalInvoices = billedJobs.length;

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400';
      case 'Partially Paid': return 'bg-yellow-100 dark:bg-yellow-950/50 text-yellow-700 dark:text-yellow-400';
      default: return 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground" data-testid="text-billing-title">
          Billing & Invoices
        </h1>
        <p className="text-muted-foreground mt-1">Manage invoices and billing records</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800" data-testid="card-total-revenue">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">Total Revenue</p>
                <p className="text-3xl font-bold mt-1 text-green-900 dark:text-green-100 flex items-center">
                  <IndianRupee className="w-6 h-6" />
                  {totalRevenue.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-lg">
                <IndianRupee className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800" data-testid="card-pending-amount">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">Pending Amount</p>
                <p className="text-3xl font-bold mt-1 text-orange-900 dark:text-orange-100 flex items-center">
                  <IndianRupee className="w-6 h-6" />
                  {pendingAmount.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
                <IndianRupee className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800" data-testid="card-total-invoices">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Invoices</p>
                <p className="text-3xl font-bold mt-1 text-blue-900 dark:text-blue-100">
                  {totalInvoices}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by customer name or vehicle number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
          data-testid="input-search-billing"
        />
      </div>

      {/* Invoices List */}
      <Card className="border-orange-200 dark:border-orange-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            Invoices
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-center py-8">Loading...</p>
          ) : billedJobs.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No invoices found</p>
          ) : (
            <div className="space-y-3">
              {billedJobs.map((job: any) => (
                <div 
                  key={job._id}
                  className="flex items-center justify-between p-4 bg-accent/30 rounded-lg hover:bg-accent/50 transition-colors"
                  data-testid={`invoice-item-${job._id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <FileText className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{job.customerName}</p>
                      <p className="text-sm text-muted-foreground">{job.vehicleName} - {job.plateNumber}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold text-foreground flex items-center justify-end">
                        <IndianRupee className="w-4 h-4" />
                        {(job.totalAmount || 0).toLocaleString('en-IN')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Paid: <IndianRupee className="w-3 h-3 inline" />{(job.paidAmount || 0).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <Badge className={getPaymentStatusColor(job.paymentStatus)}>
                      {job.paymentStatus}
                    </Badge>
                    <div className="flex gap-2">
                      <Link href={`/jobs/${job._id}`}>
                        <Button variant="outline" size="icon" data-testid={`button-view-invoice-${job._id}`}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button variant="outline" size="icon" data-testid={`button-print-invoice-${job._id}`}>
                        <Printer className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="icon" data-testid={`button-download-invoice-${job._id}`}>
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
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
