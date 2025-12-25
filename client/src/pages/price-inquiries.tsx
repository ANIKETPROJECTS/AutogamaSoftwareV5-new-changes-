import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Phone, Mail, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

const SERVICES = [
  'PPF - Elite',
  'PPF - Garware Plus',
  'PPF - Garware Premium',
  'PPF - Garware Matt',
  'Foam Washing',
  'Premium Washing',
  'Interior Cleaning',
  'Interior Steam Cleaning',
  'Leather Treatment',
  'Detailing',
  'Ceramic Coating',
  'Other',
];

export default function PriceInquiries() {
  const [showForm, setShowForm] = useState(false);
  const [selectedService, setSelectedService] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: inquiries = [], isLoading } = useQuery({
    queryKey: ['/api/price-inquiries'],
    queryFn: api.priceInquiries.list,
  });

  const createMutation = useMutation({
    mutationFn: api.priceInquiries.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/price-inquiries'] });
      setShowForm(false);
      setSelectedService('');
      toast({ title: 'Price inquiry saved successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to save inquiry', variant: 'destructive' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: api.priceInquiries.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/price-inquiries'] });
      toast({ title: 'Inquiry deleted' });
    },
    onError: () => {
      toast({ title: 'Failed to delete inquiry', variant: 'destructive' });
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    if (!selectedService) {
      toast({ title: 'Please select a service', variant: 'destructive' });
      return;
    }

    createMutation.mutate({
      name: formData.get('name'),
      phone: formData.get('phone'),
      email: formData.get('email') || '',
      service: selectedService,
      priceOffered: parseFloat(formData.get('priceOffered') as string),
      priceStated: parseFloat(formData.get('priceStated') as string),
      notes: formData.get('notes') || ''
    });
    
    form.reset();
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold mb-6">Inquiry</h1>
        
        {!showForm ? (
          <Button 
            onClick={() => setShowForm(true)}
            className="mb-6"
            data-testid="button-add-inquiry"
          >
            Add Inquiry
          </Button>
        ) : (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Customer Name</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="John Doe"
                      required
                      data-testid="input-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      placeholder="9876543210"
                      required
                      data-testid="input-phone"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email (optional)</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="john@example.com"
                      data-testid="input-email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="service">Service Inquired</Label>
                    <Select value={selectedService} onValueChange={setSelectedService}>
                      <SelectTrigger id="service" data-testid="select-service">
                        <SelectValue placeholder="Select a service" />
                      </SelectTrigger>
                      <SelectContent>
                        {SERVICES.map((service) => (
                          <SelectItem key={service} value={service} data-testid={`option-service-${service}`}>
                            {service}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="priceOffered">Price Offered (₹)</Label>
                    <Input
                      id="priceOffered"
                      name="priceOffered"
                      type="number"
                      min="0"
                      placeholder="0"
                      required
                      data-testid="input-price-offered"
                    />
                  </div>
                  <div>
                    <Label htmlFor="priceStated">Price Stated by Customer (₹)</Label>
                    <Input
                      id="priceStated"
                      name="priceStated"
                      type="number"
                      min="0"
                      placeholder="0"
                      required
                      data-testid="input-price-stated"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder="Any additional notes..."
                    className="min-h-20"
                    data-testid="textarea-notes"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    disabled={createMutation.isPending}
                    data-testid="button-submit-inquiry"
                  >
                    {createMutation.isPending ? 'Saving...' : 'Save Inquiry'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setSelectedService('');
                    }}
                    data-testid="button-cancel-inquiry"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-12">Loading...</div>
      ) : inquiries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-secondary">
            No price inquiries yet. Start by adding one!
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {inquiries.map((inquiry: any) => {
            const priceDifference = inquiry.priceOffered - inquiry.priceStated;
            const percentageDifference = ((priceDifference / inquiry.priceOffered) * 100).toFixed(1);

            return (
              <Card key={inquiry._id} className="hover-elevate">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-lg" data-testid={`text-name-${inquiry._id}`}>
                        {inquiry.name}
                      </CardTitle>
                      <div className="flex items-center gap-4 mt-2 text-sm text-secondary">
                        <a href={`tel:${inquiry.phone}`} className="flex items-center gap-1 hover:text-primary" data-testid={`link-phone-${inquiry._id}`}>
                          <Phone className="w-4 h-4" />
                          {inquiry.phone}
                        </a>
                        {inquiry.email && (
                          <a href={`mailto:${inquiry.email}`} className="flex items-center gap-1 hover:text-primary" data-testid={`link-email-${inquiry._id}`}>
                            <Mail className="w-4 h-4" />
                            {inquiry.email}
                          </a>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => deleteMutation.mutate(inquiry._id.toString ? inquiry._id.toString() : inquiry._id)}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-${inquiry._id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-secondary">Service</p>
                      <p className="font-semibold" data-testid={`text-service-${inquiry._id}`}>{inquiry.service}</p>
                    </div>
                    <div>
                      <p className="text-sm text-secondary">Date</p>
                      <p className="font-semibold" data-testid={`text-date-${inquiry._id}`}>
                        {inquiry.createdAt ? format(new Date(inquiry.createdAt), 'MMM dd, yyyy') : 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 bg-secondary/10 p-4 rounded-lg">
                    <div>
                      <p className="text-xs text-secondary mb-1">Our Price</p>
                      <p className="text-lg font-bold text-primary" data-testid={`text-offered-${inquiry._id}`}>
                        ₹{inquiry.priceOffered.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-secondary mb-1">Customer Price</p>
                      <p className="text-lg font-bold text-destructive" data-testid={`text-stated-${inquiry._id}`}>
                        ₹{inquiry.priceStated.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-secondary mb-1">Difference</p>
                      <p className={`text-lg font-bold ${priceDifference >= 0 ? 'text-green-600' : 'text-red-600'}`} data-testid={`text-difference-${inquiry._id}`}>
                        {priceDifference >= 0 ? '+' : ''}₹{priceDifference.toLocaleString()}
                        <span className="text-sm ml-1">({percentageDifference}%)</span>
                      </p>
                    </div>
                  </div>

                  {inquiry.notes && (
                    <div>
                      <p className="text-sm text-secondary mb-1">Notes</p>
                      <p className="text-sm" data-testid={`text-notes-${inquiry._id}`}>{inquiry.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
