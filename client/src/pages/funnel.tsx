import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Eye, Edit, Clock, User, Car, Calendar, FileText } from 'lucide-react';
import { Link } from 'wouter';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useState } from 'react';

const FUNNEL_STAGES = [
  { key: 'inquired', label: 'Inquired', dbStage: 'New Lead', color: 'blue' },
  { key: 'working', label: 'Working', dbStage: 'Work In Progress', color: 'orange' },
  { key: 'waiting', label: 'Waiting', dbStage: 'Ready for Delivery', color: 'yellow' },
  { key: 'completed', label: 'Completed', dbStage: 'Completed', color: 'green' },
];

const PHASE_COLORS: Record<string, string> = {
  inquired: 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border-blue-200',
  working: 'bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400 border-orange-200',
  waiting: 'bg-yellow-100 dark:bg-yellow-950/50 text-yellow-700 dark:text-yellow-400 border-yellow-200',
  completed: 'bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400 border-green-200',
};

export default function CustomerFunnel() {
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => api.jobs.list(),
  });

  const updateStageMutation = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: string }) => api.jobs.updateStage(id, stage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast({ title: 'Stage updated - WhatsApp message will be sent' });
    },
    onError: () => {
      toast({ title: 'Failed to update stage', variant: 'destructive' });
    }
  });

  const getJobsByStage = (dbStage: string) => {
    return jobs.filter((job: any) => job.stage === dbStage);
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const jobDate = new Date(date);
    const diffDays = Math.floor((now.getTime() - jobDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  };

  const stageCounts = FUNNEL_STAGES.reduce((acc, stage) => {
    acc[stage.key] = getJobsByStage(stage.dbStage).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground" data-testid="text-funnel-title">
          Service Workflow
        </h1>
        <p className="text-muted-foreground mt-1">Track customer journey and auto-send WhatsApp messages</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="inquired" className="w-full">
        <TabsList className="w-full justify-start bg-muted/30 p-1 h-auto flex-wrap gap-1">
          {FUNNEL_STAGES.map((stage) => (
            <TabsTrigger
              key={stage.key}
              value={stage.key}
              className="data-[state=active]:bg-background"
              data-testid={`tab-${stage.key}`}
            >
              {stage.label} ({stageCounts[stage.key]})
            </TabsTrigger>
          ))}
        </TabsList>

        {FUNNEL_STAGES.map((stage) => (
          <TabsContent key={stage.key} value={stage.key} className="mt-6">
            <Card className="border-orange-200 dark:border-orange-800">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Badge className={`${PHASE_COLORS[stage.key]} text-xs`}>PHASE {FUNNEL_STAGES.indexOf(stage) + 1}</Badge>
                    <CardTitle className="mt-2 flex items-center gap-2">
                      <span className="text-xl">{stage.label}</span>
                    </CardTitle>
                  </div>
                  <div className="text-2xl font-bold text-muted-foreground">
                    {stageCounts[stage.key]}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-muted-foreground text-center py-8">Loading...</p>
                ) : getJobsByStage(stage.dbStage).length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No customers in this stage</p>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {getJobsByStage(stage.dbStage).map((job: any) => (
                      <Card 
                        key={job._id} 
                        className="bg-card border-border hover:shadow-md transition-shadow"
                        data-testid={`funnel-job-${job._id}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-semibold text-foreground">{job.customerName}</h3>
                              <p className="text-sm text-muted-foreground">{job.plateNumber}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">Phase {FUNNEL_STAGES.indexOf(stage) + 1}</Badge>
                              <Badge className={`${PHASE_COLORS[stage.key]} text-xs`}>
                                <Clock className="w-3 h-3 mr-1" />
                                {stage.label}
                              </Badge>
                            </div>
                          </div>

                          <div className="space-y-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              <span>{job.technicianName || 'No handlers assigned'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>{formatTimeAgo(job.createdAt || new Date().toISOString())}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              <span className="text-xs">Auto-created from customer registration</span>
                            </div>
                          </div>

                          <div className="flex gap-2 mt-4">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => {
                                setSelectedJob(job);
                                setDetailsOpen(true);
                              }}
                              data-testid={`button-view-${job._id}`}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View Details
                            </Button>
                            <Link href={`/jobs/${job._id}`} className="flex-1">
                              <Button size="sm" className="w-full bg-blue-500 hover:bg-blue-600" data-testid={`button-edit-${job._id}`}>
                                <Edit className="w-4 h-4 mr-1" />
                                Edit
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Job Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Job Details</DialogTitle>
          </DialogHeader>
          {selectedJob && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-medium">{selectedJob.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vehicle</p>
                  <p className="font-medium">{selectedJob.vehicleName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Plate Number</p>
                  <p className="font-medium">{selectedJob.plateNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Stage</p>
                  <Badge className="mt-1">{selectedJob.stage}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Technician</p>
                  <p className="font-medium">{selectedJob.technicianName || 'Unassigned'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Status</p>
                  <Badge variant="outline">{selectedJob.paymentStatus}</Badge>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground mb-3">Move to Stage (WhatsApp will be sent)</p>
                <div className="flex flex-wrap gap-2">
                  {FUNNEL_STAGES.map((stage) => (
                    <Button
                      key={stage.key}
                      variant={selectedJob.stage === stage.dbStage ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        updateStageMutation.mutate({ id: selectedJob._id, stage: stage.dbStage });
                        setDetailsOpen(false);
                      }}
                      disabled={selectedJob.stage === stage.dbStage || updateStageMutation.isPending}
                    >
                      {stage.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
