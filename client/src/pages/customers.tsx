import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, User, Phone, Car, ChevronRight, MapPin } from 'lucide-react';
import { Link } from 'wouter';

const CUSTOMER_STATUSES = ['Inquired', 'Working', 'Waiting', 'Completed'];

const STATUS_COLORS: Record<string, string> = {
  Inquired: "bg-blue-100 text-blue-700 border-blue-200",
  Working: "bg-orange-100 text-orange-700 border-orange-200",
  Waiting: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Completed: "bg-green-100 text-green-700 border-green-200",
};

export default function Customers() {
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [vehicleDialogOpen, setVehicleDialogOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [newCustomerStatus, setNewCustomerStatus] = useState('Inquired');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers', search],
    queryFn: () => api.customers.list(search || undefined),
  });

  const createCustomerMutation = useMutation({
    mutationFn: api.customers.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setDialogOpen(false);
      toast({ title: 'Customer created successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to create customer', variant: 'destructive' });
    }
  });

  const updateCustomerMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.customers.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({ title: 'Customer updated successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to update customer', variant: 'destructive' });
    }
  });

  const addVehicleMutation = useMutation({
    mutationFn: ({ id, vehicle }: { id: string; vehicle: any }) => api.customers.addVehicle(id, vehicle),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setVehicleDialogOpen(false);
      toast({ title: 'Vehicle added successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to add vehicle', variant: 'destructive' });
    }
  });

  const handleCreateCustomer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    createCustomerMutation.mutate({
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string || undefined,
      address: formData.get('address') as string || undefined,
      status: newCustomerStatus,
      vehicles: [{
        make: formData.get('vehicleMake') as string,
        model: formData.get('vehicleModel') as string,
        year: formData.get('vehicleYear') as string,
        plateNumber: formData.get('plateNumber') as string,
        color: formData.get('vehicleColor') as string,
      }]
    });
    setNewCustomerStatus('Inquired');
  };

  const handleAddVehicle = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCustomerId) return;
    
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    addVehicleMutation.mutate({
      id: selectedCustomerId,
      vehicle: {
        make: formData.get('make') as string,
        model: formData.get('model') as string,
        year: formData.get('year') as string,
        plateNumber: formData.get('plateNumber') as string,
        color: formData.get('color') as string,
      }
    });
  };

  const handleStatusChange = (customerId: string, newStatus: string) => {
    updateCustomerMutation.mutate({
      id: customerId,
      data: { status: newStatus }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground mt-1">Manage customer records and vehicles</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90" data-testid="button-new-customer">
              <Plus className="w-4 h-4 mr-2" />
              New Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label>Name *</Label>
                  <Input name="name" required placeholder="Customer name" data-testid="input-customer-name" />
                </div>
                <div className="space-y-2">
                  <Label>Phone *</Label>
                  <Input name="phone" required placeholder="+91 98765 43210" data-testid="input-customer-phone" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input name="email" type="email" placeholder="email@example.com" data-testid="input-customer-email" />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Address</Label>
                  <Input name="address" placeholder="Full address" data-testid="input-customer-address" />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Status</Label>
                  <Select value={newCustomerStatus} onValueChange={setNewCustomerStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {CUSTOMER_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">First Vehicle</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Make *</Label>
                    <Input name="vehicleMake" required placeholder="Toyota" data-testid="input-vehicle-make" />
                  </div>
                  <div className="space-y-2">
                    <Label>Model *</Label>
                    <Input name="vehicleModel" required placeholder="Fortuner" data-testid="input-vehicle-model" />
                  </div>
                  <div className="space-y-2">
                    <Label>Year</Label>
                    <Input name="vehicleYear" placeholder="2023" data-testid="input-vehicle-year" />
                  </div>
                  <div className="space-y-2">
                    <Label>Color *</Label>
                    <Input name="vehicleColor" required placeholder="White" data-testid="input-vehicle-color" />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Plate Number *</Label>
                    <Input name="plateNumber" required placeholder="MH02 AB 1234" data-testid="input-plate-number" />
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-primary"
                disabled={createCustomerMutation.isPending}
                data-testid="button-submit-customer"
              >
                {createCustomerMutation.isPending ? 'Creating...' : 'Add Customer'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, phone, or plate number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
          data-testid="input-search-customers"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">Loading customers...</div>
        ) : customers.length === 0 ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            {search ? 'No customers match your search' : 'No customers yet. Add your first customer!'}
          </div>
        ) : (
          customers.map((customer: any) => (
            <Card 
              key={customer._id} 
              className="bg-card border-border hover:border-primary/30 transition-colors"
              data-testid={`customer-card-${customer._id}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{customer.name}</CardTitle>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {customer.phone}
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Select 
                    value={customer.status || 'Inquired'} 
                    onValueChange={(value) => handleStatusChange(customer._id, value)}
                  >
                    <SelectTrigger className={`w-auto h-7 text-xs ${STATUS_COLORS[customer.status || 'Inquired']}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CUSTOMER_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {customer.address && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {customer.address}
                  </p>
                )}
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Vehicles ({customer.vehicles.length})</span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setSelectedCustomerId(customer._id);
                        setVehicleDialogOpen(true);
                      }}
                      data-testid={`button-add-vehicle-${customer._id}`}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {customer.vehicles.map((vehicle: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 p-2 bg-accent/50 rounded-lg">
                        <Car className="w-4 h-4 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{vehicle.make} {vehicle.model}</p>
                          <p className="text-xs text-muted-foreground">{vehicle.plateNumber}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">{vehicle.color}</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <Link href={`/customers/${customer._id}`}>
                  <Button variant="outline" className="w-full mt-2" data-testid={`button-view-customer-${customer._id}`}>
                    View History
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={vehicleDialogOpen} onOpenChange={setVehicleDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Vehicle</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddVehicle} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Make *</Label>
                <Input name="make" required placeholder="Toyota" />
              </div>
              <div className="space-y-2">
                <Label>Model *</Label>
                <Input name="model" required placeholder="Fortuner" />
              </div>
              <div className="space-y-2">
                <Label>Year</Label>
                <Input name="year" placeholder="2023" />
              </div>
              <div className="space-y-2">
                <Label>Color *</Label>
                <Input name="color" required placeholder="White" />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Plate Number *</Label>
                <Input name="plateNumber" required placeholder="MH02 AB 1234" />
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full bg-primary"
              disabled={addVehicleMutation.isPending}
            >
              {addVehicleMutation.isPending ? 'Adding...' : 'Add Vehicle'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
