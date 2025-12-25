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
import { Trash2, Phone, Mail, Search, X, AlertCircle, LayoutGrid, List } from 'lucide-react';
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

export default function PriceInquiries() {
  const [showForm, setShowForm] = useState(false);
  const [selectedService, setSelectedService] = useState('');
  const [selectedCarType, setSelectedCarType] = useState('');
  const [autoPrice, setAutoPrice] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterService, setFilterService] = useState('');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [errors, setErrors] = useState<{ phone?: string; email?: string }>({});
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
      setSelectedCarType('');
      setAutoPrice(null);
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

  const handleServiceChange = (service: string) => {
    setSelectedService(service);
    setSelectedCarType('');
    setAutoPrice(null);
  };

  const handleCarTypeChange = (carType: string) => {
    setSelectedCarType(carType);
    const price = getPriceForService(selectedService, carType);
    setAutoPrice(price);
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

    if (!selectedService || !selectedCarType || autoPrice === null) {
      toast({ title: 'Please select service and car type', variant: 'destructive' });
      return;
    }

    setErrors({});
    createMutation.mutate({
      name: formData.get('name'),
      phone: phone,
      email: email || '',
      service: `${selectedService} - ${selectedCarType}`,
      priceOffered: autoPrice,
      priceStated: parseFloat(formData.get('priceStated') as string),
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
                
                {/* Row 2: Email and Service */}
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
                  <div>
                    <Label htmlFor="service">Service Type</Label>
                    <Select value={selectedService} onValueChange={handleServiceChange}>
                      <SelectTrigger id="service" data-testid="select-service">
                        <SelectValue placeholder="Select a service" />
                      </SelectTrigger>
                      <SelectContent>
                        {ALL_SERVICES.map((service) => (
                          <SelectItem key={service} value={service} data-testid={`option-service-${service}`}>
                            {service}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Row 3: Car Type and Auto Price */}
                {selectedService && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="carType">Car Type</Label>
                      <Select value={selectedCarType} onValueChange={handleCarTypeChange}>
                        <SelectTrigger id="carType" data-testid="select-car-type">
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
                    <div>
                      <Label htmlFor="priceOffered">Our Price (Auto) (₹)</Label>
                      <Input
                        id="priceOffered"
                        name="priceOffered"
                        type="number"
                        value={autoPrice || 0}
                        disabled
                        data-testid="input-price-offered"
                        className="bg-secondary"
                      />
                    </div>
                  </div>
                )}

                {/* Row 4: Customer Price and Notes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <div>
                    <Label htmlFor="notes">Notes (optional)</Label>
                    <Input
                      id="notes"
                      name="notes"
                      placeholder="Any additional notes..."
                      data-testid="input-notes"
                    />
                  </div>
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
                      setSelectedService('');
                      setSelectedCarType('');
                      setAutoPrice(null);
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
          <div className="text-center py-12">Loading...</div>
        ) : filteredInquiries.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-secondary">
              {inquiries.length === 0 ? 'No inquiries yet. Start by adding one!' : 'No inquiries match your search or filter.'}
            </CardContent>
          </Card>
        ) : viewMode === "card" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInquiries.map((inquiry: any) => {
              const priceDifference = inquiry.priceOffered - inquiry.priceStated;
              const percentageDifference = inquiry.priceOffered > 0 ? ((priceDifference / inquiry.priceOffered) * 100).toFixed(1) : "0";

              return (
                <Card
                  key={inquiry._id}
                  className="border border-orange-200 rounded-lg hover:shadow-lg transition-all duration-300 group relative"
                  data-testid={`inquiry-card-${inquiry._id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col h-full gap-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg text-slate-900 group-hover:text-primary transition-colors truncate">
                            {inquiry.name}
                          </h3>
                          <p className="text-sm text-slate-700 font-medium">{inquiry.phone}</p>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => deleteMutation.mutate(inquiry._id.toString ? inquiry._id.toString() : inquiry._id)}
                          disabled={deleteMutation.isPending}
                          data-testid={`button-delete-${inquiry._id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <Mail className="w-3 h-3" />
                          <span className="truncate">{inquiry.email || 'No email provided'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-900 bg-slate-100 px-2 py-1 rounded">
                          {inquiry.service}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                        <div className="text-center">
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Our Price</p>
                          <p className="text-sm font-bold text-primary">₹{inquiry.priceOffered.toLocaleString()}</p>
                        </div>
                        <div className="text-center border-x border-slate-100 px-1">
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Customer</p>
                          <p className="text-sm font-bold text-destructive">₹{inquiry.priceStated.toLocaleString()}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Diff</p>
                          <p className={`text-sm font-bold ${priceDifference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {priceDifference >= 0 ? '+' : ''}₹{priceDifference.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium">
                        <span>{inquiry.createdAt ? format(new Date(inquiry.createdAt), 'MMM dd, yyyy') : 'N/A'}</span>
                        <span className={priceDifference >= 0 ? 'text-green-600' : 'text-red-600'}>{percentageDifference}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredInquiries.map((inquiry: any) => {
              const priceDifference = inquiry.priceOffered - inquiry.priceStated;
              const percentageDifference = inquiry.priceOffered > 0 ? ((priceDifference / inquiry.priceOffered) * 100).toFixed(1) : "0";

              return (
                <Card key={inquiry._id} className="hover-elevate">
                  <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg" data-testid={`text-name-${inquiry._id}`}>{inquiry.name}</h3>
                        <span className="text-xs text-secondary">
                          {inquiry.createdAt ? format(new Date(inquiry.createdAt), 'MMM dd, yyyy') : 'N/A'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-secondary">
                        <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {inquiry.phone}</span>
                        {inquiry.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {inquiry.email}</span>}
                        <span className="font-medium text-foreground">{inquiry.service}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="text-xs text-secondary">Our Price</p>
                        <p className="font-bold">₹{inquiry.priceOffered.toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-secondary">Customer</p>
                        <p className="font-bold text-destructive">₹{inquiry.priceStated.toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-secondary">Diff</p>
                        <p className={`font-bold ${priceDifference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {priceDifference >= 0 ? '+' : ''}₹{priceDifference.toLocaleString()} ({percentageDifference}%)
                        </p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-red-600 h-8 w-8 hover:bg-red-50"
                        onClick={() => deleteMutation.mutate(inquiry._id.toString ? inquiry._id.toString() : inquiry._id)}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-list-${inquiry._id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
