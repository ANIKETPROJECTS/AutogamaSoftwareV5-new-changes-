import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Search, Trash2, Grid3X3, List, AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const validatePhone = (phone: string): boolean => {
  const digitsOnly = phone.replace(/\D/g, '');
  return digitsOnly.length === 10;
};

const validateEmail = (email: string): boolean => {
  if (!email) return true;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const STATUS_COLORS: Record<string, string> = {
  'Scheduled': 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300',
  'Done': 'bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-300',
};

export default function Appointments() {
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [searchQuery, setSearchQuery] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: appointmentsData, isLoading } = useQuery({
    queryKey: ['appointments', searchQuery],
    queryFn: () => api.appointments.list({ page: 1, limit: 100 }),
  });
  const appointments = appointmentsData?.appointments || [];
  const totalAppointments = appointmentsData?.total || 0;

  const createAppointmentMutation = useMutation({
    mutationFn: (data: any) => api.appointments.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setShowForm(false);
      setFormErrors({});
      toast({ title: 'Appointment booked successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to book appointment', variant: 'destructive' });
    }
  });

  const deleteAppointmentMutation = useMutation({
    mutationFn: (id: string) => api.appointments.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast({ title: 'Appointment deleted' });
    },
    onError: () => {
      toast({ title: 'Failed to delete appointment', variant: 'destructive' });
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.appointments.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast({ title: 'Status updated' });
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const phone = (formData.get('customerPhone') as string) || '';
    const email = (formData.get('customerEmail') as string) || '';
    const selectedDate = (formData.get('date') as string) || '';
    const selectedTime = (formData.get('time') as string) || '';
    const errors: Record<string, string> = {};

    if (!validatePhone(phone)) {
      errors.customerPhone = 'Phone must be 10 digits';
    }
    if (email && !validateEmail(email)) {
      errors.customerEmail = 'Invalid email address';
    }

    // Validate that appointment time is not in the past
    if (selectedDate && selectedTime) {
      const today = new Date();
      const todayString = format(today, 'yyyy-MM-dd');
      
      if (selectedDate === todayString) {
        const [hours, minutes] = selectedTime.split(':');
        const appointmentTime = new Date();
        appointmentTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        if (appointmentTime <= today) {
          errors.time = 'Cannot book appointments for past times. Please select a future time.';
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    createAppointmentMutation.mutate({
      customerName: formData.get('customerName') as string,
      customerPhone: formData.get('customerPhone') as string,
      customerEmail: formData.get('customerEmail') as string || undefined,
      vehicleInfo: formData.get('vehicleInfo') as string,
      serviceType: formData.get('serviceType') as string,
      date: selectedDate,
      time: selectedTime,
      notes: formData.get('notes') as string || undefined,
      status: 'Scheduled'
    });
    
    form.reset();
  };

  const filteredAppointments = useMemo(() => {
    return appointments.filter((appt: any) => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        appt.customerName?.toLowerCase().includes(query) ||
        appt.customerPhone?.includes(query) ||
        appt.vehicleInfo?.toLowerCase().includes(query)
      );
    });
  }, [appointments, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header and View Controls */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Appointments</h1>
          <div className="flex gap-2">
            <Button
              variant={viewMode === "card" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("card")}
              className="flex items-center gap-2"
              data-testid="button-view-card"
            >
              <Grid3X3 className="w-4 h-4" />
              Card
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="flex items-center gap-2"
              data-testid="button-view-list"
            >
              <List className="w-4 h-4" />
              List
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-secondary" />
          <Input
            placeholder="Search by name or phone number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-3"
              data-testid="button-clear-search"
            >
              <X className="w-4 h-4 text-secondary" />
            </button>
          )}
        </div>
      </div>

      {/* Form Section */}
      <div className="space-y-6">
        {!showForm ? (
          <Button 
            onClick={() => setShowForm(true)}
            className="mb-6"
            data-testid="button-add-appointment"
          >
            Book Appointment
          </Button>
        ) : (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Row 1: Name and Phone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customerName">Customer Name *</Label>
                    <Input
                      id="customerName"
                      name="customerName"
                      placeholder="John Doe"
                      required
                      data-testid="input-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerPhone">Phone *</Label>
                    <Input
                      id="customerPhone"
                      name="customerPhone"
                      placeholder="9876543210"
                      required
                      maxLength={10}
                      data-testid="input-phone"
                      className={formErrors.customerPhone ? 'border-red-500' : ''}
                    />
                    {formErrors.customerPhone && (
                      <div className="flex items-center gap-1 mt-1 text-sm text-red-600">
                        <AlertCircle className="w-4 h-4" />
                        {formErrors.customerPhone}
                      </div>
                    )}
                  </div>
                </div>

                {/* Row 2: Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customerEmail">Email (Optional)</Label>
                    <Input
                      id="customerEmail"
                      name="customerEmail"
                      type="email"
                      placeholder="john@example.com"
                      data-testid="input-email"
                      className={formErrors.customerEmail ? 'border-red-500' : ''}
                    />
                    {formErrors.customerEmail && (
                      <div className="flex items-center gap-1 mt-1 text-sm text-red-600">
                        <AlertCircle className="w-4 h-4" />
                        {formErrors.customerEmail}
                      </div>
                    )}
                  </div>
                </div>

                {/* Row 3: Vehicle and Service Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="vehicleInfo">Vehicle Info *</Label>
                    <Input
                      id="vehicleInfo"
                      name="vehicleInfo"
                      placeholder="e.g., Toyota Fortuner White"
                      required
                      data-testid="input-vehicle"
                    />
                  </div>
                  <div>
                    <Label htmlFor="serviceType">Service Type *</Label>
                    <Input
                      id="serviceType"
                      name="serviceType"
                      placeholder="e.g., PPF, Full Service, Detailing"
                      required
                      data-testid="input-service"
                    />
                  </div>
                </div>

                {/* Row 4: Date and Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      name="date"
                      type="date"
                      required
                      min={format(new Date(), 'yyyy-MM-dd')}
                      data-testid="input-date"
                    />
                  </div>
                  <div>
                    <Label htmlFor="time">Time *</Label>
                    <Input
                      id="time"
                      name="time"
                      type="time"
                      required
                      placeholder="HH:MM"
                      data-testid="input-time"
                      className={formErrors.time ? 'border-red-500' : ''}
                    />
                    {formErrors.time && (
                      <div className="flex items-center gap-1 mt-1 text-sm text-red-600">
                        <AlertCircle className="w-4 h-4" />
                        {formErrors.time}
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder="Any additional information..."
                    className="resize-none"
                    data-testid="input-notes"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={createAppointmentMutation.isPending}
                    data-testid="button-submit"
                  >
                    {createAppointmentMutation.isPending ? 'Booking...' : 'Book Appointment'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowForm(false)}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Appointments List/Grid */}
      <div>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading appointments...</div>
        ) : filteredAppointments.length === 0 ? (
          <Card className="card-modern">
            <CardContent className="py-12 text-center text-muted-foreground">
              No appointments found.
            </CardContent>
          </Card>
        ) : viewMode === "card" ? (
          // Card View
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAppointments.map((appt: any) => (
              <Card
                key={appt._id}
                className="hover-elevate"
                data-testid={`appointment-card-${appt._id}`}
              >
                <CardContent className="p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm">{appt.customerName}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(appt.date), 'MMM dd, yyyy')} at {appt.time}
                      </p>
                    </div>
                    <Badge className={cn("text-xs whitespace-nowrap", STATUS_COLORS[appt.status])}>
                      {appt.status}
                    </Badge>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Phone:</span>
                      <p className="font-medium">{appt.customerPhone}</p>
                    </div>
                    {appt.customerEmail && (
                      <div>
                        <span className="text-muted-foreground">Email:</span>
                        <p className="font-medium truncate text-xs">{appt.customerEmail}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">Vehicle:</span>
                      <p className="font-medium">{appt.vehicleInfo}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Service:</span>
                      <p className="font-medium">{appt.serviceType}</p>
                    </div>
                    {appt.notes && (
                      <div>
                        <span className="text-muted-foreground">Notes:</span>
                        <p className="text-xs">{appt.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t">
                    {appt.status === 'Scheduled' && (
                      <Button
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => updateStatusMutation.mutate({ id: appt._id, status: 'Done' })}
                        data-testid={`button-done-${appt._id}`}
                      >
                        Mark Done
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs text-destructive"
                      onClick={() => deleteAppointmentMutation.mutate(appt._id)}
                      data-testid={`button-delete-${appt._id}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          // List View
          <div className="space-y-2">
            {filteredAppointments.map((appt: any) => (
              <Card
                key={appt._id}
                className="hover-elevate"
                data-testid={`appointment-row-${appt._id}`}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-semibold">{appt.customerName}</span>
                        <Badge className={cn("text-xs", STATUS_COLORS[appt.status])}>
                          {appt.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>{format(new Date(appt.date), 'MMM dd, yyyy')} at {appt.time}</p>
                        <p>Phone: {appt.customerPhone}</p>
                        {appt.customerEmail && <p>Email: {appt.customerEmail}</p>}
                        <p>Vehicle: {appt.vehicleInfo}</p>
                        <p>Service: {appt.serviceType}</p>
                        {appt.notes && <p>Notes: {appt.notes}</p>}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {appt.status === 'Scheduled' && (
                        <Button
                          size="sm"
                          onClick={() => updateStatusMutation.mutate({ id: appt._id, status: 'Done' })}
                          data-testid={`button-done-${appt._id}`}
                        >
                          Mark Done
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive"
                        onClick={() => deleteAppointmentMutation.mutate(appt._id)}
                        data-testid={`button-delete-${appt._id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
