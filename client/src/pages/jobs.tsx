import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Car, User, Phone, MessageCircle, FileText, IndianRupee } from 'lucide-react';
import { cn } from '@/lib/utils';

const JOB_STAGES = [
  'New Lead',
  'Inspection Done',
  'Work In Progress',
  'Ready for Delivery',
  'Completed',
  'Cancelled'
];

const STAGE_COLORS: Record<string, string> = {
  'New Lead': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Inspection Done': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'Work In Progress': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'Ready for Delivery': 'bg-green-500/20 text-green-400 border-green-500/30',
  'Completed': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'Cancelled': 'bg-red-500/20 text-red-400 border-red-500/30'
};

const STAGE_BG_COLORS: Record<string, string> = {
  'New Lead': 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
  'Inspection Done': 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800',
  'Work In Progress': 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800',
  'Ready for Delivery': 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800',
  'Completed': 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800',
  'Cancelled': 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
};

const STAGE_BADGE_COLORS: Record<string, string> = {
  'New Lead': 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  'Inspection Done': 'bg-yellow-100 dark:bg-yellow-950/50 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
  'Work In Progress': 'bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800',
  'Ready for Delivery': 'bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
  'Completed': 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  'Cancelled': 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
};

export default function ServiceFunnel() {
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => api.jobs.list(),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.customers.list(),
  });

  const { data: technicians = [] } = useQuery({
    queryKey: ['technicians'],
    queryFn: api.technicians.list,
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => api.invoices.list(),
  });

  const hasInvoice = (jobId: string) => invoices.some((inv: any) => inv.jobId === jobId);
  
  const isTerminalStage = (stage: string) => stage === 'Completed' || stage === 'Cancelled';

  const updateStageMutation = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: string }) => api.jobs.updateStage(id, stage),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      if (variables.stage === 'Completed') {
        queryClient.invalidateQueries({ queryKey: ['invoices'] });
      }
      toast({ 
        title: 'Status updated',
        description: 'WhatsApp notification sent & invoice created if needed'
      });
    },
    onError: () => {
      toast({ title: 'Cannot change stage after invoice is created', variant: 'destructive' });
    }
  });

  const groupedJobs = JOB_STAGES.reduce((acc, stage) => {
    acc[stage] = jobs.filter((job: any) => job.stage === stage);
    return acc;
  }, {} as Record<string, any[]>);

  const filteredJobs = jobs.filter((job: any) => {
    const matchesSearch = search === '' || 
      job.customerName.toLowerCase().includes(search.toLowerCase()) ||
      job.vehicleName.toLowerCase().includes(search.toLowerCase()) ||
      job.plateNumber.toLowerCase().includes(search.toLowerCase());
    const matchesStage = stageFilter === 'all' || job.stage === stageFilter;
    return matchesSearch && matchesStage;
  });

  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  return (
    <div className="space-y-8">
      <div className="pb-6 border-b border-slate-200">
        <div className="inline-block px-4 py-2 bg-gradient-to-r from-blue-100 to-blue-50 border border-blue-200 rounded-lg mb-4">
          <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Real-Time Pipeline</span>
        </div>
        <h1 className="text-2xl font-semibold text-slate-900 mb-2" data-testid="text-service-funnel-title">
          Service Funnel
        </h1>
        <p className="text-sm text-slate-600 mt-2">
          Track service status in real-time, send WhatsApp updates automatically, and manage invoices
        </p>
      </div>

      {/* Funnel Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {JOB_STAGES.map(stage => (
          <Card key={stage} className={cn("card-modern border-2 shadow-md hover:shadow-lg transition-all duration-300", STAGE_BG_COLORS[stage])}>
            <CardContent className="p-4">
              <div className="flex flex-col items-center gap-3 text-center">
                <Badge className={cn(STAGE_BADGE_COLORS[stage], "text-xs font-bold")}>{stage}</Badge>
                <span className="text-4xl font-bold text-slate-900">{groupedJobs[stage]?.length || 0}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 bg-gradient-to-r from-slate-50 to-slate-100 p-6 rounded-xl border border-slate-200">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Search by customer, vehicle, or plate..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 bg-white border-slate-300 rounded-lg shadow-sm"
            data-testid="input-search-jobs"
          />
        </div>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-full sm:w-48 bg-white border-slate-300 rounded-lg shadow-sm" data-testid="select-stage-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {JOB_STAGES.map(stage => (
              <SelectItem key={stage} value={stage}>{stage}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Service List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading services...</div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {search || stageFilter !== 'all' ? 'No services match your filters' : 'No services yet. Create a new service from Customers Service page.'}
          </div>
        ) : (
          filteredJobs.map((job: any) => (
            <Card 
              key={job._id} 
              className="card-modern border-slate-200 shadow-md hover:shadow-xl transition-all duration-300 hover:border-slate-300 bg-gradient-to-r from-white to-slate-50"
              data-testid={`service-item-${job._id}`}
            >
              <CardContent className="p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="p-3.5 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl border border-blue-200 shadow-sm">
                      <Car className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-lg text-slate-900">{job.vehicleName}</h3>
                        <Badge variant="outline" className="text-xs font-semibold bg-slate-100 border-slate-300">{job.plateNumber}</Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                        <span className="flex items-center gap-1.5 font-medium">
                          <User className="w-4 h-4 text-slate-400" />
                          {job.customerName}
                        </span>
                        {job.technicianName && (
                          <span className="flex items-center gap-1.5 font-medium">
                            <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                            Assigned: {job.technicianName}
                          </span>
                        )}
                      </div>
                      {job.notes && (
                        <p className="text-sm text-slate-600 mt-2 italic bg-slate-100 px-3 py-1.5 rounded-lg">{job.notes}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {isTerminalStage(job.stage) ? (
                      <Badge className={cn("w-48 justify-center border py-2", STAGE_COLORS[job.stage])}>
                        {job.stage}
                      </Badge>
                    ) : (
                      <Select
                        value={job.stage}
                        onValueChange={(stage) => updateStageMutation.mutate({ id: job._id, stage })}
                      >
                        <SelectTrigger className={cn("w-48 border", STAGE_COLORS[job.stage])} data-testid={`stage-select-${job._id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {JOB_STAGES.map(stage => (
                            <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    
                    <div title="WhatsApp notification sent on status change">
                      <MessageCircle className="w-5 h-5 text-green-500" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 mt-5 pt-5 border-t border-slate-200 text-sm flex-wrap">
                  <div className="flex items-center gap-6">
                    <div className="bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
                      <span className="text-orange-700 text-xs font-semibold block">Service Cost</span>
                      <span className="font-bold text-orange-900 flex items-center text-sm"><IndianRupee className="w-4 h-4" />{job.totalAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                      <span className="text-green-700 text-xs font-semibold block">Final Amount</span>
                      <span className="font-bold text-green-700 flex items-center text-sm"><IndianRupee className="w-4 h-4" />{job.paidAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        job.paymentStatus === 'Paid' && 'border-green-500/30 text-green-500',
                        job.paymentStatus === 'Partially Paid' && 'border-yellow-500/30 text-yellow-500',
                        job.paymentStatus === 'Pending' && 'border-red-500/30 text-red-500'
                      )}
                    >
                      {job.paymentStatus}
                    </Badge>
                  </div>
                  <div>
                    {hasInvoice(job._id) && (
                      <Badge className="bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
                        <FileText className="w-3 h-3 mr-1" />
                        Invoice Created
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
