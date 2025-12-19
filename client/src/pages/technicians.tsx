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
import { useToast } from '@/hooks/use-toast';
import { Plus, Wrench, Phone, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  'Available': 'bg-green-500/20 text-green-400 border-green-500/30',
  'Busy': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'Off': 'bg-gray-500/20 text-gray-400 border-gray-500/30'
};

export default function Technicians() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: technicians = [], isLoading } = useQuery({
    queryKey: ['technicians'],
    queryFn: api.technicians.list,
  });

  const { data: workload = [] } = useQuery({
    queryKey: ['technicians', 'workload'],
    queryFn: api.technicians.workload,
  });

  const createTechnicianMutation = useMutation({
    mutationFn: api.technicians.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
      setDialogOpen(false);
      toast({ title: 'Technician added successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to add technician', variant: 'destructive' });
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.technicians.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
      toast({ title: 'Status updated' });
    }
  });

  const handleCreateTechnician = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    createTechnicianMutation.mutate({
      name: formData.get('name') as string,
      specialty: formData.get('specialty') as string,
      phone: formData.get('phone') as string || undefined,
      status: 'Available'
    });
  };

  const getWorkloadForTechnician = (techId: string) => {
    const found = workload.find((w: any) => w.technician._id === techId);
    return found?.jobCount || 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Technicians</h1>
          <p className="text-muted-foreground mt-1">Manage your workshop team</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90" data-testid="button-new-technician">
              <Plus className="w-4 h-4 mr-2" />
              Add Technician
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Technician</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateTechnician} className="space-y-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input name="name" required placeholder="Technician name" data-testid="input-technician-name" />
              </div>
              <div className="space-y-2">
                <Label>Specialty *</Label>
                <Input name="specialty" required placeholder="e.g., General Mechanic, Detailing Expert" data-testid="input-technician-specialty" />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input name="phone" placeholder="+91 98765 43210" data-testid="input-technician-phone" />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-primary"
                disabled={createTechnicianMutation.isPending}
                data-testid="button-submit-technician"
              >
                {createTechnicianMutation.isPending ? 'Adding...' : 'Add Technician'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">Loading technicians...</div>
        ) : technicians.length === 0 ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            No technicians yet. Add your first technician!
          </div>
        ) : (
          technicians.map((tech: any) => {
            const jobCount = getWorkloadForTechnician(tech._id);
            return (
              <Card 
                key={tech._id} 
                className="card-modern"
                data-testid={`technician-card-${tech._id}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Wrench className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{tech.name}</CardTitle>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Briefcase className="w-3 h-3" />
                          {tech.specialty}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {tech.phone && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {tech.phone}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Select
                      value={tech.status}
                      onValueChange={(status) => updateStatusMutation.mutate({ id: tech._id, status })}
                    >
                      <SelectTrigger 
                        className={cn("w-32 border", STATUS_COLORS[tech.status])}
                        data-testid={`status-select-${tech._id}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Available">Available</SelectItem>
                        <SelectItem value="Busy">Busy</SelectItem>
                        <SelectItem value="Off">Off</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="p-3 bg-accent/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Active Jobs</span>
                      <Badge 
                        variant="outline"
                        className={cn(
                          jobCount > 2 && 'border-red-500/30 text-red-400',
                          jobCount > 0 && jobCount <= 2 && 'border-yellow-500/30 text-yellow-400',
                          jobCount === 0 && 'border-green-500/30 text-green-400'
                        )}
                      >
                        {jobCount}
                      </Badge>
                    </div>
                    {jobCount > 2 && (
                      <p className="text-xs text-red-400 mt-1">High workload</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
