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
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight" data-testid="text-service-funnel-title">
          Service Funnel
        </h1>
        <p className="text-muted-foreground mt-1">
          Track service status, send WhatsApp updates automatically, and manage invoices
        </p>
      </div>

      {/* Funnel Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {JOB_STAGES.map(stage => (
          <Card key={stage} className={cn("border", STAGE_BG_COLORS[stage])}>
            <CardContent className="p-3">
              <div className="flex flex-col items-center gap-2 text-center">
                <Badge className={cn(STAGE_BADGE_COLORS[stage], "text-xs")}>{stage}</Badge>
                <span className="text-3xl font-bold">{groupedJobs[stage]?.length || 0}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by customer, vehicle, or plate..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            data-testid="input-search-jobs"
          />
        </div>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-full sm:w-48" data-testid="select-stage-filter">
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
      <div className="space-y-3">
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
              className="bg-card border-border hover:border-primary/30 transition-colors"
              data-testid={`service-item-${job._id}`}
            >
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="p-3 bg-primary/10 rounded-xl">
                      <Car className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{job.vehicleName}</h3>
                        <Badge variant="outline" className="text-xs">{job.plateNumber}</Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {job.customerName}
                        </span>
                        {job.technicianName && (
                          <span>Assigned: {job.technicianName}</span>
                        )}
                      </div>
                      {job.notes && (
                        <p className="text-sm text-muted-foreground mt-2 truncate">{job.notes}</p>
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

                <div className="flex items-center justify-between gap-4 mt-4 pt-4 border-t border-border text-sm flex-wrap">
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-muted-foreground">Total: </span>
                      <span className="font-semibold flex items-center"><IndianRupee className="w-3 h-3" />{job.totalAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Paid: </span>
                      <span className="font-semibold text-green-500 flex items-center"><IndianRupee className="w-3 h-3" />{job.paidAmount.toLocaleString('en-IN')}</span>
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
