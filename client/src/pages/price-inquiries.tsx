import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
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
    return 65000; // Simplified for this reconstruction
  } else {
    const serviceData = OTHER_SERVICES[service as keyof typeof OTHER_SERVICES];
    if (serviceData && (serviceData as any)[carType]) {
      return (serviceData as any)[carType];
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

  const { data: inquiriesData, isLoading } = useQuery({
    queryKey: ['/api/price-inquiries', searchQuery, filterService],
    queryFn: () => api.priceInquiries.list(),
  });
  const inquiries = inquiriesData?.inquiries || [];

  const createMutation = useMutation({
    mutationFn: api.priceInquiries.create,
    onSuccess: () => {
      setShowForm(false);
      setSelectedServiceItems([]);
      queryClient.invalidateQueries({ queryKey: ['/api/price-inquiries'] });
      toast({ title: 'Price inquiry saved successfully' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: api.priceInquiries.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/price-inquiries'] });
      toast({ title: 'Inquiry deleted' });
    },
  });

  const addServiceItem = () => {
    if (!tempServiceName || !tempCarType) return;
    const price = getPriceForService(tempServiceName, tempCarType);
    if (price === null) return;
    setSelectedServiceItems([...selectedServiceItems, {
      id: Date.now().toString(),
      name: tempServiceName,
      carType: tempCarType,
      price: price
    }]);
    setTempServiceName('');
    setTempCarType('');
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const serviceDetailsJson = JSON.stringify(selectedServiceItems.map(item => ({
      name: item.name,
      carType: item.carType,
      servicePrice: item.price,
      customerPrice: item.customerPrice
    })));
    createMutation.mutate({
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string || '',
      service: selectedServiceItems.map(item => `${item.name} (${item.carType})`).join(', '),
      serviceDetailsJson,
      priceOffered: selectedServiceItems.reduce((sum, item) => sum + item.price, 0),
      priceStated: selectedServiceItems.reduce((sum, item) => sum + (item.customerPrice || 0), 0),
      notes: formData.get('notes') as string || ''
    });
  };

  const filteredInquiries = useMemo(() => {
    return inquiries.filter((inquiry: any) => {
      const matchesSearch = inquiry.name.toLowerCase().includes(searchQuery.toLowerCase()) || inquiry.phone.includes(searchQuery);
      const matchesFilter = filterService === 'all' || !filterService || inquiry.service.includes(filterService);
      return matchesSearch && matchesFilter;
    });
  }, [inquiries, searchQuery, filterService]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Inquiry</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <Select value={filterService} onValueChange={setFilterService}>
          <SelectTrigger><SelectValue placeholder="Filter by service" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Services</SelectItem>
            {ALL_SERVICES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {!showForm ? (
        <Button onClick={() => setShowForm(true)}>Add Inquiry</Button>
      ) : (
        <Card><CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input name="name" placeholder="Name" required />
              <Input name="phone" placeholder="Phone" required maxLength={10} />
            </div>
            <Input name="email" placeholder="Email" type="email" />
            <div className="grid grid-cols-3 gap-4">
              <Select value={tempServiceName} onValueChange={setTempServiceName}>
                <SelectTrigger><SelectValue placeholder="Service" /></SelectTrigger>
                <SelectContent className="max-h-64 overflow-y-auto">
                  {ALL_SERVICES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={tempCarType} onValueChange={setTempCarType}>
                <SelectTrigger><SelectValue placeholder="Car Type" /></SelectTrigger>
                <SelectContent>{CAR_TYPES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
              <Button type="button" onClick={addServiceItem}>Add</Button>
            </div>
            {selectedServiceItems.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="p-3 text-left">Service Name</th>
                      <th className="p-3 text-right">Service Price</th>
                      <th className="p-3 text-right">Customer Price</th>
                      <th className="p-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedServiceItems.map(item => (
                      <tr key={item.id} className="border-b hover:bg-slate-50" data-testid={`row-service-${item.id}`}>
                        <td className="p-3">
                          <div className="font-medium" data-testid={`text-servicename-${item.id}`}>{item.name}</div>
                          <div className="text-xs text-slate-500" data-testid={`text-cartype-${item.id}`}>{item.carType}</div>
                        </td>
                        <td className="p-3 text-right font-medium" data-testid={`text-serviceprice-${item.id}`}>₹{item.price.toLocaleString()}</td>
                        <td className="p-3 text-right">
                          <Input 
                            type="number" 
                            placeholder="Enter price" 
                            className="w-32 ml-auto" 
                            data-testid={`input-customerprice-${item.id}`}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              setSelectedServiceItems(selectedServiceItems.map(i => i.id === item.id ? { ...i, customerPrice: val } : i));
                            }}
                            value={item.customerPrice || ''}
                          />
                        </td>
                        <td className="p-3 text-center">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            type="button"
                            data-testid={`button-delete-service-${item.id}`}
                            onClick={() => setSelectedServiceItems(selectedServiceItems.filter(i => i.id !== item.id))}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div>
              <Label htmlFor="notes" className="text-sm font-medium">Notes (Optional)</Label>
              <Textarea 
                name="notes" 
                id="notes"
                placeholder="Add any additional notes or special requests..." 
                className="mt-2 resize-none"
                rows={4}
                data-testid="textarea-notes"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit">Save Inquiry</Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </CardContent></Card>
      )}

      <div className="grid grid-cols-1 gap-6">
        {filteredInquiries.map((inquiry: any) => {
          const diff = (inquiry.priceStated || 0) - (inquiry.priceOffered || 0);
          const isNegative = diff < 0;
          const serviceDetails = inquiry.serviceDetailsJson ? JSON.parse(inquiry.serviceDetailsJson) : [];

          return (
            <Card key={inquiry._id} className="border border-orange-200 hover:shadow-lg transition-all overflow-hidden">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left Column: Customer & Service Info */}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Customer Name</Label>
                      <p className="text-lg font-semibold text-slate-900">{inquiry.name}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Phone Number</Label>
                        <div className="flex items-center gap-2 text-slate-700 font-medium">
                          <Phone className="w-4 h-4 text-blue-500" />
                          {inquiry.phone}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email Address</Label>
                        <div className="flex items-center gap-2 text-slate-700 font-medium">
                          <Mail className="w-4 h-4 text-blue-500" />
                          <span className="truncate">{inquiry.email || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Services Requested</Label>
                      <div className="bg-slate-50 border border-slate-100 p-3 rounded-md space-y-2">
                        {serviceDetails.length > 0 ? (
                          serviceDetails.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center text-sm border-b border-slate-100 last:border-0 pb-2 last:pb-0">
                              <div>
                                <span className="font-semibold text-slate-800">{item.name}</span>
                                <span className="text-xs text-slate-500 ml-2">({item.carType})</span>
                              </div>
                              <div className="text-slate-600">₹{item.servicePrice.toLocaleString()}</div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-slate-800 font-medium">{inquiry.service}</p>
                        )}
                      </div>
                    </div>

                    {inquiry.notes && (
                      <div className="space-y-1">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Special Notes</Label>
                        <p className="text-sm text-slate-600 bg-orange-50/50 p-2 rounded italic">"{inquiry.notes}"</p>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Pricing & Meta Info */}
                  <div className="flex flex-col justify-between space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div className="space-y-1 text-center sm:text-left">
                        <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Our Price</Label>
                        <p className="text-xl font-bold text-slate-900">₹{inquiry.priceOffered?.toLocaleString()}</p>
                      </div>
                      <div className="space-y-1 text-center sm:text-left border-y sm:border-y-0 sm:border-x border-slate-200 py-2 sm:py-0 px-0 sm:px-4">
                        <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Customer Price</Label>
                        <p className="text-xl font-bold text-slate-900">₹{inquiry.priceStated?.toLocaleString()}</p>
                      </div>
                      <div className="space-y-1 text-center sm:text-left">
                        <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Difference</Label>
                        <div className="flex flex-col">
                          <p className={cn("text-xl font-bold", isNegative ? "text-red-600" : "text-emerald-600")}>
                            {isNegative ? '-' : '+'}₹{Math.abs(diff).toLocaleString()}
                          </p>
                          <span className={cn("text-[10px] font-bold", isNegative ? "text-red-500" : "text-emerald-500")}>
                            {isNegative ? '' : '+'}{(inquiry.priceOffered > 0 ? (diff / inquiry.priceOffered) * 100 : 0).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between text-xs text-muted-foreground border-b pb-2">
                        <span className="font-medium">Inquiry ID: <span className="text-slate-900">#{inquiry._id.slice(-6).toUpperCase()}</span></span>
                        <span className="font-medium">Date: <span className="text-slate-900">{inquiry.createdAt ? format(new Date(inquiry.createdAt), 'MMMM d, yyyy') : 'N/A'}</span></span>
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="hover-elevate bg-white border-slate-200 text-slate-700"
                          onClick={() => { setSelectedInquiry(inquiry); setViewDialogOpen(true); }}
                        >
                          View
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="hover-elevate bg-white border-slate-200 text-slate-700"
                        >
                          Print
                        </Button>
                          <Button 
                          variant="outline" 
                          size="sm" 
                          className="hover-elevate bg-blue-50 border-blue-100 text-blue-700 hover:bg-blue-100"
                          onClick={() => {
                            const details = serviceDetails.map((s: any) => `${s.name}: ₹${s.servicePrice}`).join('\n');
                            const text = `Inquiry Details:\nName: ${inquiry.name}\nPhone: ${inquiry.phone}\nServices:\n${details}\nTotal: ₹${inquiry.priceOffered}`;
                            window.open(`https://wa.me/${inquiry.phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
                          }}
                        >
                          Send
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="hover-elevate bg-red-50 border-red-100 text-red-600 hover:bg-red-100"
                          onClick={() => { setInquiryToDelete(inquiry); setDeleteDialogOpen(true); }}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Inquiry</AlertDialogTitle><AlertDialogDescription>Are you sure?</AlertDialogDescription></AlertDialogHeader>
          <div className="flex justify-end gap-3"><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction className="bg-red-600" onClick={() => inquiryToDelete && deleteMutation.mutate(inquiryToDelete._id)}>Delete</AlertDialogAction></div>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Inquiry Details</DialogTitle>
          </DialogHeader>
          {selectedInquiry && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-muted-foreground">Name</p>
                  <p className="font-bold">{selectedInquiry.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="font-bold">{selectedInquiry.phone}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-bold">{selectedInquiry.email || 'N/A'}</p>
                </div>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="p-3 text-left">Service Name</th>
                      <th className="p-3 text-right">Service Price</th>
                      <th className="p-3 text-right">Customer Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInquiry.serviceDetailsJson ? (
                      JSON.parse(selectedInquiry.serviceDetailsJson).map((item: any, index: number) => (
                        <tr key={index} className="border-b hover:bg-slate-50" data-testid={`row-service-detail-${index}`}>
                          <td className="p-3">
                            <div className="font-medium" data-testid={`text-servicename-detail-${index}`}>{item.name}</div>
                            <div className="text-xs text-slate-500" data-testid={`text-cartype-detail-${index}`}>{item.carType}</div>
                          </td>
                          <td className="p-3 text-right font-medium" data-testid={`text-serviceprice-detail-${index}`}>₹{item.servicePrice.toLocaleString()}</td>
                          <td className="p-3 text-right font-medium" data-testid={`text-customerprice-detail-${index}`}>₹{(item.customerPrice || 0).toLocaleString()}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="p-3 text-center text-muted-foreground">No service details available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div>
                  <p className="text-muted-foreground text-xs uppercase font-bold">Our Price</p>
                  <p className="text-lg font-bold">₹{selectedInquiry.priceOffered?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase font-bold">Customer Price</p>
                  <p className="text-lg font-bold">₹{selectedInquiry.priceStated?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase font-bold">Difference</p>
                  <p className={cn("text-lg font-bold", ((selectedInquiry.priceStated || 0) - (selectedInquiry.priceOffered || 0)) < 0 ? "text-red-600" : "text-green-600")}>
                    {((selectedInquiry.priceStated || 0) - (selectedInquiry.priceOffered || 0)) < 0 ? '-' : '+'}₹{Math.abs((selectedInquiry.priceStated || 0) - (selectedInquiry.priceOffered || 0)).toLocaleString()}
                  </p>
                </div>
              </div>

              {selectedInquiry.notes && (
                <div className="pt-4 border-t">
                  <p className="text-muted-foreground text-xs uppercase font-bold mb-2">Notes</p>
                  <p className="text-sm whitespace-pre-wrap bg-slate-50 p-3 rounded border border-slate-200" data-testid="text-notes-display">{selectedInquiry.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
