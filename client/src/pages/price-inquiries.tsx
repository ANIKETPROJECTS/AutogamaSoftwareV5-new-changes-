import { useState, useMemo } from 'react';
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
import { Trash2, Phone, Mail, Search, X, AlertCircle, LayoutGrid, List, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';

const validatePhone = (phone: string): boolean => {
  const digitsOnly = phone.replace(/\D/g, '');
  return digitsOnly.length === 10;
};

const validateEmail = (email: string): boolean => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const PPF_CATEGORIES = {
  Elite: {
    'Small Cars': {
      'TPU 5 Years Gloss': 55000,
      'TPU 5 Years Matt': 60000,
      'TPU 7 Years Gloss': 80000,
      'TPU 10 Years Gloss': 95000,
    },
    'Hatchback / Small Sedan': {
      'TPU 5 Years Gloss': 60000,
      'TPU 5 Years Matt': 70000,
      'TPU 7 Years Gloss': 85000,
      'TPU 10 Years Gloss': 105000,
    },
    'Mid-size Sedan / Compact SUV / MUV': {
      'TPU 5 Years Gloss': 70000,
      'TPU 5 Years Matt': 75000,
      'TPU 7 Years Gloss': 90000,
      'TPU 10 Years Gloss': 112000,
    },
    'SUV / MPV': {
      'TPU 5 Years Gloss': 80000,
      'TPU 5 Years Matt': 85000,
      'TPU 7 Years Gloss': 95000,
      'TPU 10 Years Gloss': 120000,
    },
  },
  'Garware Plus': {
    'Small Cars': { 'TPU 5 Years Gloss': 62000 },
    'Hatchback / Small Sedan': { 'TPU 5 Years Gloss': 65000 },
    'Mid-size Sedan / Compact SUV / MUV': { 'TPU 5 Years Gloss': 70000 },
    'SUV / MPV': { 'TPU 5 Years Gloss': 85000 },
  },
  'Garware Premium': {
    'Small Cars': { 'TPU 8 Years Gloss': 80000 },
    'Hatchback / Small Sedan': { 'TPU 8 Years Gloss': 85000 },
    'Mid-size Sedan / Compact SUV / MUV': { 'TPU 8 Years Gloss': 90000 },
    'SUV / MPV': { 'TPU 8 Years Gloss': 95000 },
  },
  'Garware Matt': {
    'Small Cars': { 'TPU 5 Years Matt': 105000 },
    'Hatchback / Small Sedan': { 'TPU 5 Years Matt': 110000 },
    'Mid-size Sedan / Compact SUV / MUV': { 'TPU 5 Years Matt': 115000 },
    'SUV / MPV': { 'TPU 5 Years Matt': 120000 },
  },
};

const OTHER_SERVICES = {
  'Foam Washing': {
    'Small Cars': 400,
    'Hatchback / Small Sedan': 500,
    'Mid-size Sedan / Compact SUV / MUV': 600,
    'SUV / MPV': 700,
  },
  'Premium Washing': {
    'Small Cars': 600,
    'Hatchback / Small Sedan': 700,
    'Mid-size Sedan / Compact SUV / MUV': 800,
    'SUV / MPV': 900,
  },
  'Interior Cleaning': {
    'Small Cars': 2500,
    'Hatchback / Small Sedan': 3000,
    'Mid-size Sedan / Compact SUV / MUV': 3500,
    'SUV / MPV': 4500,
  },
  'Interior Steam Cleaning': {
    'Small Cars': 3500,
    'Hatchback / Small Sedan': 4000,
    'Mid-size Sedan / Compact SUV / MUV': 4500,
    'SUV / MPV': 5500,
  },
  'Leather Treatment': {
    'Small Cars': 5000,
    'Hatchback / Small Sedan': 5500,
    'Mid-size Sedan / Compact SUV / MUV': 6000,
    'SUV / MPV': 7000,
  },
  'Detailing': {
    'Small Cars': 5000,
    'Hatchback / Small Sedan': 6500,
    'Mid-size Sedan / Compact SUV / MUV': 7000,
    'SUV / MPV': 9000,
  },
  'Paint Sealant Coating (Teflon)': {
    'Small Cars': 6500,
    'Hatchback / Small Sedan': 8500,
    'Mid-size Sedan / Compact SUV / MUV': 9500,
    'SUV / MPV': 11500,
  },
  'Ceramic Coating – 9H': {
    'Small Cars': 11000,
    'Hatchback / Small Sedan': 12500,
    'Mid-size Sedan / Compact SUV / MUV': 15000,
    'SUV / MPV': 18000,
  },
  'Ceramic Coating – MAFRA': {
    'Small Cars': 12500,
    'Hatchback / Small Sedan': 15000,
    'Mid-size Sedan / Compact SUV / MUV': 18000,
    'SUV / MPV': 21000,
  },
  'Ceramic Coating – MENZA PRO': {
    'Small Cars': 15000,
    'Hatchback / Small Sedan': 18000,
    'Mid-size Sedan / Compact SUV / MUV': 21000,
    'SUV / MPV': 24000,
  },
  'Ceramic Coating – KOCH CHEMIE': {
    'Small Cars': 18000,
    'Hatchback / Small Sedan': 22000,
    'Mid-size Sedan / Compact SUV / MUV': 25000,
    'SUV / MPV': 28000,
  },
  'Corrosion Treatment': {
    'Small Cars': 3500,
    'Hatchback / Small Sedan': 5000,
    'Mid-size Sedan / Compact SUV / MUV': 6000,
    'SUV / MPV': 7500,
  },
  'Windshield Coating': {
    'Small Cars': 2500,
    'Hatchback / Small Sedan': 3000,
    'Mid-size Sedan / Compact SUV / MUV': 3500,
    'SUV / MPV': 4000,
  },
  'Windshield Coating All Glasses': {
    'Small Cars': 5000,
    'Hatchback / Small Sedan': 5500,
    'Mid-size Sedan / Compact SUV / MUV': 6000,
    'SUV / MPV': 6500,
  },
  'Sun Control Film – Economy': {
    'Small Cars': 5200,
    'Hatchback / Small Sedan': 6000,
    'Mid-size Sedan / Compact SUV / MUV': 6500,
    'SUV / MPV': 8400,
  },
  'Sun Control Film – Standard': {
    'Small Cars': 7500,
    'Hatchback / Small Sedan': 8300,
    'Mid-size Sedan / Compact SUV / MUV': 9500,
    'SUV / MPV': 12500,
  },
  'Sun Control Film – Premium': {
    'Small Cars': 11500,
    'Hatchback / Small Sedan': 13000,
    'Mid-size Sedan / Compact SUV / MUV': 15000,
    'SUV / MPV': 18000,
  },
  'Sun Control Film – Ceramic': {
    'Small Cars': 13500,
    'Hatchback / Small Sedan': 15500,
    'Mid-size Sedan / Compact SUV / MUV': 18000,
    'SUV / MPV': 21000,
  },
};

const CAR_TYPES = ['Small Cars', 'Hatchback / Small Sedan', 'Mid-size Sedan / Compact SUV / MUV', 'SUV / MPV'];

const ALL_SERVICES = [
  'PPF - Elite',
  'PPF - Garware Plus',
  'PPF - Garware Premium',
  'PPF - Garware Matt',
  ...Object.keys(OTHER_SERVICES),
];

function getPriceForService(service: string, carType: string): number | null {
  if (service.startsWith('PPF')) {
    const ppfType = service.replace('PPF - ', '');
    const ppfData = PPF_CATEGORIES[ppfType as keyof typeof PPF_CATEGORIES];
    if (ppfData && ppfData[carType as keyof typeof ppfData]) {
      const variants = ppfData[carType as keyof typeof ppfData];
      const prices = Object.values(variants);
      return prices.length > 0 ? (prices[0] as number) : null;
    }
  } else {
    const serviceData = OTHER_SERVICES[service as keyof typeof OTHER_SERVICES];
    if (serviceData && serviceData[carType as keyof typeof serviceData]) {
      return serviceData[carType as keyof typeof serviceData];
    }
  }
  return null;
}

type ServiceItem = {
  id: string;
  name: string;
  carType: string;
  price: number;
  customerPrice?: number;
};

export default function PriceInquiries() {
  const [showForm, setShowForm] = useState(false);
  const [selectedServiceItems, setSelectedServiceItems] = useState<ServiceItem[]>([]);
  const [tempServiceName, setTempServiceName] = useState('');
  const [tempCarType, setTempCarType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterService, setFilterService] = useState('');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [errors, setErrors] = useState<{ phone?: string; email?: string }>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [inquiryToDelete, setInquiryToDelete] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const inquiryDetails = useMemo(() => {
    if (!selectedInquiry?.serviceDetailsJson) return [];
    try {
      return JSON.parse(selectedInquiry.serviceDetailsJson);
    } catch (e) {
      console.error('Failed to parse service details:', e);
      return [];
    }
  }, [selectedInquiry]);

  const { data: inquiriesData, isLoading } = useQuery({
    queryKey: ['/api/price-inquiries', searchQuery, filterService],
    queryFn: () => api.priceInquiries.list(),
  });
  const inquiries = inquiriesData?.inquiries || [];

  const createMutation = useMutation({
    mutationFn: api.priceInquiries.create,
    onMutate: async (newInquiry) => {
      await queryClient.cancelQueries({ queryKey: ['/api/price-inquiries'] });
      const previousInquiries = queryClient.getQueryData(['/api/price-inquiries', searchQuery, filterService]);
      
      const optimisticInquiry = {
        ...newInquiry,
        _id: 'temp-' + Date.now(),
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData(['/api/price-inquiries', searchQuery, filterService], (old: any) => ({
        ...old,
        inquiries: [optimisticInquiry, ...(old?.inquiries || [])]
      }));

      return { previousInquiries };
    },
    onError: (err, newInquiry, context: any) => {
      queryClient.setQueryData(['/api/price-inquiries', searchQuery, filterService], context.previousInquiries);
      toast({ title: 'Failed to save inquiry', variant: 'destructive' });
    },
    onSuccess: () => {
      setShowForm(false);
      setSelectedServiceItems([]);
      setTempServiceName('');
      setTempCarType('');
      toast({ title: 'Price inquiry saved successfully' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/price-inquiries'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: api.priceInquiries.delete,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['/api/price-inquiries'] });
      const previousInquiries = queryClient.getQueryData(['/api/price-inquiries', searchQuery, filterService]);
      
      queryClient.setQueryData(['/api/price-inquiries', searchQuery, filterService], (old: any) => ({
        ...old,
        inquiries: old?.inquiries?.filter((i: any) => i._id !== id)
      }));

      return { previousInquiries };
    },
    onError: (err, id, context: any) => {
      queryClient.setQueryData(['/api/price-inquiries', searchQuery, filterService], context.previousInquiries);
      toast({ title: 'Failed to delete inquiry', variant: 'destructive' });
    },
    onSuccess: () => {
      toast({ title: 'Inquiry deleted' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/price-inquiries'] });
    }
  });

  const addServiceItem = () => {
    if (!tempServiceName || !tempCarType) {
      toast({ title: 'Please select both service and car type', variant: 'destructive' });
      return;
    }
    
    const price = getPriceForService(tempServiceName, tempCarType);
    if (price === null) {
      toast({ title: 'Unable to get price for this combination', variant: 'destructive' });
      return;
    }

    const newItem: ServiceItem = {
      id: Date.now().toString(),
      name: tempServiceName,
      carType: tempCarType,
      price: price
    };

    setSelectedServiceItems([...selectedServiceItems, newItem]);
    setTempServiceName('');
    setTempCarType('');
  };

  const removeServiceItem = (id: string) => {
    setSelectedServiceItems(selectedServiceItems.filter(item => item.id !== id));
  };

  const getTotalPrice = () => {
    return selectedServiceItems.reduce((sum, item) => sum + item.price, 0);
  };

  const getTotalCustomerPrice = () => {
    return selectedServiceItems.reduce((sum, item) => sum + (item.customerPrice || 0), 0);
  };

  const updateServiceCustomerPrice = (id: string, newPrice: number | undefined) => {
    setSelectedServiceItems(selectedServiceItems.map(item =>
      item.id === id ? { ...item, customerPrice: newPrice } : item
    ));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const phone = formData.get('phone') as string;
    const email = formData.get('email') as string;
    const newErrors: { phone?: string; email?: string } = {};

    if (!validatePhone(phone)) {
      newErrors.phone = 'Phone number must be 10 digits';
    }

    if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (selectedServiceItems.length === 0) {
      toast({ title: 'Please add at least one service', variant: 'destructive' });
      return;
    }

    setErrors({});
    const serviceDetails = selectedServiceItems.map(item => `${item.name} (${item.carType})`).join(', ');
    const serviceDetailsJson = JSON.stringify(selectedServiceItems.map(item => ({
      name: item.name,
      carType: item.carType,
      servicePrice: item.price,
      customerPrice: item.customerPrice
    })));
    createMutation.mutate({
      name: formData.get('name'),
      phone: phone,
      email: email || '',
      service: serviceDetails,
      serviceDetailsJson: serviceDetailsJson,
      priceOffered: getTotalPrice(),
      priceStated: getTotalCustomerPrice(),
      notes: formData.get('notes') || ''
    });
    
    form.reset();
  };

  const filteredInquiries = useMemo(() => {
    return inquiries.filter((inquiry: any) => {
      const matchesSearch = 
        inquiry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inquiry.phone.includes(searchQuery) ||
        inquiry.email?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesFilter = filterService === 'all' || !filterService || inquiry.service.includes(filterService);
      
      return matchesSearch && matchesFilter;
    });
  }, [inquiries, searchQuery, filterService]);

  return (
    <div className="space-y-6">
      {/* Header and Search/Filter Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Inquiry</h1>
          <div className="flex gap-2">
            <Button
              variant={viewMode === "card" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("card")}
              className="flex items-center gap-2"
              data-testid="button-view-card"
            >
              <LayoutGrid className="w-4 h-4" />
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
        
        {/* Search and Filter at Top */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
          
          <Select value={filterService} onValueChange={setFilterService}>
            <SelectTrigger data-testid="select-filter">
              <SelectValue placeholder="Filter by service" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              {ALL_SERVICES.map((service) => (
                <SelectItem key={service} value={service} data-testid={`filter-option-${service}`}>
                  {service}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Form Section */}
      <div className="space-y-6">
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
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Row 1: Name and Phone */}
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
                      maxLength={10}
                      data-testid="input-phone"
                      className={errors.phone ? 'border-red-500' : ''}
                    />
                    {errors.phone && (
                      <div className="flex items-center gap-1 mt-1 text-sm text-red-600">
                        <AlertCircle className="w-4 h-4" />
                        {errors.phone}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Row 2: Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="john@example.com"
                      required
                      data-testid="input-email"
                      className={errors.email ? 'border-red-500' : ''}
                    />
                    {errors.email && (
                      <div className="flex items-center gap-1 mt-1 text-sm text-red-600">
                        <AlertCircle className="w-4 h-4" />
                        {errors.email}
                      </div>
                    )}
                  </div>
                </div>

                {/* Services Section */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-4">Add Services</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <Label htmlFor="tempService">Service Type</Label>
                      <Select value={tempServiceName} onValueChange={setTempServiceName}>
                        <SelectTrigger id="tempService" data-testid="select-service">
                          <SelectValue placeholder="Select service" />
                        </SelectTrigger>
                        <SelectContent className="max-h-48">
                          {ALL_SERVICES.map((service) => (
                            <SelectItem key={service} value={service} data-testid={`option-service-${service}`}>
                              {service}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="tempCarType">Car Type</Label>
                      <Select value={tempCarType} onValueChange={setTempCarType}>
                        <SelectTrigger id="tempCarType" data-testid="select-car-type">
                          <SelectValue placeholder="Select car type" />
                        </SelectTrigger>
                        <SelectContent>
                          {CAR_TYPES.map((carType) => (
                            <SelectItem key={carType} value={carType} data-testid={`option-car-${carType}`}>
                              {carType}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button 
                        type="button" 
                        onClick={addServiceItem}
                        className="w-full"
                        data-testid="button-add-service"
                      >
                        Add Service
                      </Button>
                    </div>
                  </div>

                  {/* Selected Services Table */}
                  {selectedServiceItems.length > 0 && (
                    <div className="mb-4">
                      <div className="border rounded-lg overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-slate-100">
                              <th className="p-3 text-left font-semibold text-sm w-1/5">Service</th>
                              <th className="p-3 text-left font-semibold text-sm w-1/5">Car Type</th>
                              <th className="p-3 text-left font-semibold text-sm w-1/5">Service Price (₹)</th>
                              <th className="p-3 text-left font-semibold text-sm w-1/5">Customer Price (₹)</th>
                              <th className="p-3 text-left font-semibold text-sm w-1/5">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedServiceItems.map((item) => (
                              <tr key={item.id} className="border-t">
                                <td className="p-3 text-sm w-1/5">{item.name}</td>
                                <td className="p-3 text-sm w-1/5">{item.carType}</td>
                                <td className="p-3 text-sm font-semibold w-1/5">{item.price}</td>
                                <td className="p-3 text-sm w-1/5">
                                  <Input
                                    type="number"
                                    value={item.customerPrice ?? ''}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      updateServiceCustomerPrice(item.id, val === '' ? undefined : parseFloat(val));
                                    }}
                                    className="w-full"
                                    min="0"
                                    data-testid={`input-service-customer-price-${item.id}`}
                                  />
                                </td>
                                <td className="p-3 text-sm w-1/5">
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => removeServiceItem(item.id)}
                                    data-testid={`button-delete-service-${item.id}`}
                                  >
                                    Delete
                                  </Button>
                                </td>
                              </tr>
                            ))}
                            <tr className="border-t bg-blue-50">
                              <td colSpan={2} className="p-3 text-sm font-bold">Total:</td>
                              <td className="p-3 text-sm font-bold text-blue-600">₹{getTotalPrice()}</td>
                              <td colSpan={2}></td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Input
                    id="notes"
                    name="notes"
                    placeholder="Any additional notes..."
                    data-testid="input-notes"
                  />
                </div>

                {/* Action Buttons */}
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
                      setSelectedServiceItems([]);
                      setTempServiceName('');
                      setTempCarType('');
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

      {/* Inquiries List */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Inquiry List</h2>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredInquiries.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              {inquiries.length === 0 ? 'No inquiries yet. Start by adding one!' : 'No inquiries match your search or filter.'}
            </CardContent>
          </Card>
        ) : (
          <div className={cn(
            viewMode === "card" 
              ? "grid grid-cols-1 gap-4" 
              : "border rounded-lg overflow-hidden bg-card"
          )}>
            {viewMode === "card" ? (
              filteredInquiries.map((inquiry: any) => {
                const diff = (inquiry.priceStated || 0) - (inquiry.priceOffered || 0);
                const diffPercent = inquiry.priceOffered > 0 ? (diff / inquiry.priceOffered) * 100 : 0;
                const isNegative = diff < 0;

                return (
                  <Card key={inquiry._id} className="overflow-hidden hover:shadow-md transition-shadow border-orange-200">
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row gap-6">
                        {/* Customer Info */}
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <h3 className="text-xl font-bold text-foreground uppercase tracking-tight">
                              {inquiry.name}
                            </h3>
                            <span className="text-xs text-muted-foreground font-medium">
                              {inquiry.createdAt ? format(new Date(inquiry.createdAt), 'MMM d, yyyy') : 'Dec 27, 2025'}
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-4 h-4 text-muted-foreground/60" />
                              <span className="font-medium">{inquiry.phone}</span>
                            </div>
                            {inquiry.email && (
                              <div className="flex items-center gap-1.5">
                                <Mail className="w-4 h-4 text-muted-foreground/60" />
                                <span className="uppercase">{inquiry.email}</span>
                              </div>
                            )}
                          </div>

                          <div className="pt-2">
                            <p className="text-sm font-medium text-foreground leading-relaxed">
                              {inquiry.service}
                            </p>
                          </div>
                        </div>

                        {/* Actions and Pricing */}
                        <div className="flex flex-row items-center gap-6 self-end md:self-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedInquiry(inquiry);
                              setViewDialogOpen(true);
                            }}
                            className="bg-red-50 hover:bg-red-100 text-red-600 font-semibold px-4 h-9"
                          >
                            View Details
                          </Button>

                          <div className="flex gap-8 items-center">
                            <div className="text-right">
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-1">Our Price</p>
                              <p className="text-lg font-bold text-foreground">
                                ₹{inquiry.priceOffered?.toLocaleString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-1">Customer</p>
                              <p className="text-lg font-bold text-foreground">
                                ₹{inquiry.priceStated?.toLocaleString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-1">Diff</p>
                              <p className={cn(
                                "text-lg font-bold whitespace-nowrap",
                                isNegative ? "text-red-600" : "text-green-600"
                              )}>
                                {isNegative ? '-' : '+'}₹{Math.abs(diff).toLocaleString()} 
                                <span className="text-xs ml-1 opacity-80">
                                  ({isNegative ? '' : '+'}{diffPercent.toFixed(1)}%)
                                </span>
                              </p>
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setInquiryToDelete(inquiry);
                              setDeleteDialogOpen(true);
                            }}
                            className="text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors h-9 w-9"
                          >
                            <Trash2 className="w-5 h-5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/50 border-b">
                      <th className="p-4 text-left font-semibold text-sm">Customer</th>
                      <th className="p-4 text-left font-semibold text-sm">Date</th>
                      <th className="p-4 text-left font-semibold text-sm">Service</th>
                      <th className="p-4 text-right font-semibold text-sm">Our Price</th>
                      <th className="p-4 text-right font-semibold text-sm">Customer Price</th>
                      <th className="p-4 text-right font-semibold text-sm">Diff</th>
                      <th className="p-4 text-center font-semibold text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInquiries.map((inquiry: any) => {
                      const diff = (inquiry.priceStated || 0) - (inquiry.priceOffered || 0);
                      const isNegative = diff < 0;
                      return (
                        <tr key={inquiry._id} className="border-b last:border-0 hover:bg-muted/30 transition-colors group">
                          <td className="p-4">
                            <div className="font-semibold uppercase">{inquiry.name}</div>
                            <div className="text-xs text-muted-foreground">{inquiry.phone}</div>
                          </td>
                          <td className="p-4 text-sm whitespace-nowrap">
                            {inquiry.createdAt ? format(new Date(inquiry.createdAt), 'MMM d, yyyy') : 'N/A'}
                          </td>
                          <td className="p-4">
                            <p className="text-sm line-clamp-1 max-w-[200px]" title={inquiry.service}>
                              {inquiry.service}
                            </p>
                          </td>
                          <td className="p-4 text-right font-medium">₹{inquiry.priceOffered?.toLocaleString()}</td>
                          <td className="p-4 text-right font-medium">₹{inquiry.priceStated?.toLocaleString()}</td>
                          <td className={cn(
                            "p-4 text-right font-bold",
                            isNegative ? "text-red-600" : "text-green-600"
                          )}>
                            {isNegative ? '-' : '+'}₹{Math.abs(diff).toLocaleString()}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedInquiry(inquiry);
                                  setViewDialogOpen(true);
                                }}
                                className="h-8 text-xs font-semibold"
                              >
                                Details
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setInquiryToDelete(inquiry);
                                  setDeleteDialogOpen(true);
                                }}
                                className="h-8 w-8 text-muted-foreground hover:text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Inquiry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the inquiry for <strong>{inquiryToDelete?.name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (inquiryToDelete) {
                  deleteMutation.mutate(inquiryToDelete._id.toString ? inquiryToDelete._id.toString() : inquiryToDelete._id);
                  setDeleteDialogOpen(false);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Inquiry Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-screen overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Inquiry Details</DialogTitle>
          </DialogHeader>
          {selectedInquiry && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Customer Name</p>
                  <p className="font-semibold">{selectedInquiry.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-semibold">{selectedInquiry.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-semibold">{selectedInquiry.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-semibold">{selectedInquiry.createdAt ? format(new Date(selectedInquiry.createdAt), 'MMM dd, yyyy') : 'N/A'}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Services</h3>
                <div className="border rounded-lg overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="p-3 text-left">Service</th>
                        <th className="p-3 text-left">Car Type</th>
                        <th className="p-3 text-right">Service Price (₹)</th>
                        <th className="p-3 text-right">Customer Price (₹)</th>
                        <th className="p-3 text-right">Difference (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInquiry.serviceDetailsJson ? (
                        (() => {
                          try {
                            const details = JSON.parse(selectedInquiry.serviceDetailsJson);
                            return details.map((service: any, idx: number) => {
                              const diff = (service.customerPrice || 0) - (service.servicePrice || 0);
                              return (
                                <tr key={idx} className="border-t">
                                  <td className="p-3">{service.name}</td>
                                  <td className="p-3">{service.carType}</td>
                                  <td className="p-3 text-right font-semibold">₹{service.servicePrice?.toLocaleString()}</td>
                                  <td className="p-3 text-right font-semibold">₹{service.customerPrice?.toLocaleString() || '0'}</td>
                                  <td className={`p-3 text-right font-bold ${diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {diff >= 0 ? '+' : ''}₹{diff.toLocaleString()}
                                  </td>
                                </tr>
                              );
                            });
                          } catch (e) {
                            return (
                              <tr className="border-t">
                                <td colSpan={5} className="p-3 text-center text-muted-foreground">
                                  {selectedInquiry.service}
                                </td>
                              </tr>
                            );
                          }
                        })()
                      ) : (
                        <tr className="border-t">
                          <td colSpan={5} className="p-3 text-center text-muted-foreground">
                            {selectedInquiry.service}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Our Price</p>
                  <p className="text-lg font-bold">₹{selectedInquiry.priceOffered.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Customer Price</p>
                  <p className="text-lg font-bold">₹{selectedInquiry.priceStated.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Difference</p>
                  <p className="text-lg font-bold">₹{Math.abs(selectedInquiry.priceStated - selectedInquiry.priceOffered).toLocaleString()}</p>
                </div>
              </div>

              {selectedInquiry.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="font-semibold">{selectedInquiry.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
