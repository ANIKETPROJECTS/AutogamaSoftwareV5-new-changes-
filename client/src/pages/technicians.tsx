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
  'Available': 'bg-gray-200 text-black border-gray-300',
  'Busy': 'bg-gray-200 text-black border-gray-300',
  'Off': 'bg-gray-200 text-black border-gray-300'
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
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-6 pb-6 border-b border-slate-200">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-primary/90 text-white hover:shadow-lg transition-all" data-testid="button-new-technician">
               
              Add Technician
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-slate-900">Add New Technician</DialogTitle>
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
                className="w-full bg-gradient-to-r from-primary to-primary/90 text-white hover:shadow-lg transition-all"
                disabled={createTechnicianMutation.isPending}
                data-testid="button-submit-technician"
              >
                {createTechnicianMutation.isPending ? 'Adding...' : 'Add Technician'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full text-center py-8 text-slate-500">Loading technicians...</div>
        ) : technicians.length === 0 ? (
          <div className="col-span-full text-center py-8 text-slate-500">
            No technicians yet. Add your first technician!
          </div>
        ) : (
          technicians.map((tech: any) => {
            const jobCount = getWorkloadForTechnician(tech._id);
            return (
              <Card 
                key={tech._id} 
                className="bg-gradient-to-br from-white to-slate-50 border border-red-300 shadow-sm hover:shadow-md transition-all hover-elevate"
                data-testid={`technician-card-${tech._id}`}
              >
                <CardHeader className="pb-4 border-b border-slate-200 bg-gradient-to-r from-primary/5 to-transparent">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <Wrench className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold text-slate-900">{tech.name}</CardTitle>
                        <p className="text-sm text-slate-600 flex items-center gap-1 mt-1">
                          <Briefcase className="w-3 h-3" />
                          {tech.specialty}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  {tech.phone && (
                    <p className="text-sm text-slate-600 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {tech.phone}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">Status</span>
                    <Select
                      value={tech.status}
                      onValueChange={(status) => updateStatusMutation.mutate({ id: tech._id, status })}
                    >
                      <SelectTrigger 
                        className={cn("w-32 border-slate-200 bg-white", STATUS_COLORS[tech.status])}
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

                  <div className="p-4 bg-gradient-to-br from-slate-50 to-white rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">Active Jobs</span>
                      <Badge 
                        variant="outline"
                        className={cn(
                          jobCount > 2 && 'border-orange-300 text-orange-700 bg-orange-50',
                          jobCount > 0 && jobCount <= 2 && 'border-yellow-300 text-yellow-700 bg-yellow-50',
                          jobCount === 0 && 'border-gray-300 text-slate-700 bg-gray-50'
                        )}
                      >
                        {jobCount}
                      </Badge>
                    </div>
                    {jobCount > 2 && (
                      <p className="text-xs text-orange-700 mt-2 font-medium">High workload</p>
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
