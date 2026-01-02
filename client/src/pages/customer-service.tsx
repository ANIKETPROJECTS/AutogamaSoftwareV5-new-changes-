import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Plus, X, User, Car, Package, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { PPF_CATEGORIES, OTHER_SERVICES, VEHICLE_TYPES } from '@/lib/service-catalog';

type SelectedService = {
  name: string;
  vehicleType: string;
  price: number;
  discount: number;
  category?: string;
  warranty?: string;
};

export default function CustomerService() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location] = useLocation();
  
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedVehicleIndex, setSelectedVehicleIndex] = useState<string>('');
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string>('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [serviceNotes, setServiceNotes] = useState('');
  const [ppfDiscount, setPpfDiscount] = useState<string>('');
  const [laborCost, setLaborCost] = useState<string>('');
  const [includeGst, setIncludeGst] = useState(true);
  const [selectedItems, setSelectedItems] = useState<{ inventoryId: string; metersUsed?: number; name: string; unit: string; quantity?: number; rollId?: string }[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [metersUsed, setMetersUsed] = useState<string>('1');
  const [expandedInventoryId, setExpandedInventoryId] = useState<string | null>(null);

  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [newVehicleMake, setNewVehicleMake] = useState('');
  const [newVehicleModel, setNewVehicleModel] = useState('');
  const [newVehiclePlate, setNewVehiclePlate] = useState('');
  const [newVehicleYear, setNewVehicleYear] = useState('');
  const [newVehicleColor, setNewVehicleColor] = useState('');

  const [ppfCategory, setPpfCategory] = useState('');
  const [ppfVehicleType, setPpfVehicleType] = useState('');
  const [ppfWarranty, setPpfWarranty] = useState('');
  const [ppfPrice, setPpfPrice] = useState(0);
  const [ppfGstEnabled, setPpfGstEnabled] = useState(false);
  const [otherServicesGstEnabled, setOtherServicesGstEnabled] = useState(false);
  const [ppfWarrantyFromPreferences, setPpfWarrantyFromPreferences] = useState(false);
  const [selectedAccessoryCategory, setSelectedAccessoryCategory] = useState('');
  const [selectedAccessoryId, setSelectedAccessoryId] = useState('');
  const [accessoryQuantity, setAccessoryQuantity] = useState('1');
  const [selectedAccessories, setSelectedAccessories] = useState<{ id: string; name: string; category: string; price: number; quantity: number }[]>([]);

  const [selectedOtherServices, setSelectedOtherServices] = useState<SelectedService[]>([]);
  const [otherServiceName, setOtherServiceName] = useState('');
  const [otherServiceVehicleType, setOtherServiceVehicleType] = useState('');

  const [showPpfSection, setShowPpfSection] = useState(false);
  const [showOtherServicesSection, setShowOtherServicesSection] = useState(false);
  const [showAddAccessorySection, setShowAddAccessorySection] = useState(false);
  const [isLoadingLastService, setIsLoadingLastService] = useState(false);

  useEffect(() => {
    if (ppfCategory) setShowPpfSection(true);
  }, [ppfCategory]);

  useEffect(() => {
    if (selectedAccessoryCategory) setShowAddAccessorySection(true);
  }, [selectedAccessoryCategory]);

  const { data: customersData = [] } = useQuery<any>({
    queryKey: ['customers'],
    queryFn: () => api.customers.list(),
  });

  const customers = (Array.isArray(customersData) ? customersData : (customersData as any)?.customers || [])
    .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const preSelectedCustomerId = urlParams.get('customerId');
    
    // Debug logging
    console.log('[Auto-select Debug] URL Customer ID:', preSelectedCustomerId);
    console.log('[Auto-select Debug] Customers list length:', customers.length);
    console.log('[Auto-select Debug] Location:', location);

    if (preSelectedCustomerId && customers.length > 0) {
      // Find customer by _id or id (handling both MongoDB and Drizzle formats)
      const customer = customers.find((c: any) => (c._id === preSelectedCustomerId || c.id === preSelectedCustomerId));
      console.log('[Auto-select Debug] Found customer object:', customer ? customer.name : 'NOT FOUND');

      if (customer) {
        const targetId = customer._id || customer.id;
        console.log('[Auto-select Debug] Final Target ID to select:', targetId);
        
        // Use a slight delay to ensure the Select component is ready and not overridden by other effects
        const timer = setTimeout(() => {
          console.log('[Auto-select Debug] Executing selection for:', targetId);
          setSelectedCustomerId(targetId);
          if (customer.vehicles && customer.vehicles.length > 0) {
            console.log('[Auto-select Debug] Auto-selecting vehicle index 0');
            setSelectedVehicleIndex('0');
          }
        }, 150);
        return () => clearTimeout(timer);
      }
    }
  }, [customersData, location]);

  const filteredCustomers = customers.filter((customer: any) => 
    customer.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
    customer.phone.includes(customerSearch)
  );

  const displayedCustomers = customerSearch ? filteredCustomers : filteredCustomers.slice(0, 5);

  const { data: inventoryData = [] } = useQuery<any>({
    queryKey: ['inventory'],
    queryFn: api.inventory.list,
  });

  const inventory = Array.isArray(inventoryData) ? inventoryData : (inventoryData as any)?.inventory || [];

  const { data: techniciansData = [] } = useQuery<any>({
    queryKey: ['technicians'],
    queryFn: api.technicians.list,
  });

  const technicians = Array.isArray(techniciansData) ? techniciansData : (techniciansData as any)?.technicians || [];

  const addVehicleMutation = useMutation({
    mutationFn: async ({ customerId, vehicle }: { customerId: string; vehicle: any }) => {
      return api.customers.addVehicle(customerId, vehicle);
    },
    onSuccess: (updatedCustomer) => {
      queryClient.setQueryData(['customers'], (oldData: any[]) => {
        if (!oldData) return [updatedCustomer];
        return oldData.map(c => c._id === updatedCustomer._id ? updatedCustomer : c);
      });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({ title: 'Vehicle added successfully!' });
      setShowAddVehicle(false);
      setNewVehicleMake('');
      setNewVehicleModel('');
      setNewVehiclePlate('');
      setNewVehicleYear('');
      setNewVehicleColor('');
      if (updatedCustomer && updatedCustomer.vehicles) {
        setSelectedVehicleIndex((updatedCustomer.vehicles.length - 1).toString());
      }
    },
    onError: (error: any) => {
      toast({ title: error?.message || 'Failed to add vehicle', variant: 'destructive' });
    }
  });

  const createJobMutation = useMutation({
    mutationFn: async (data: any) => {
      const job = await api.jobs.create(data);
      if (selectedItems.length > 0) {
        const materialsToAdd = selectedItems.map(item => ({
          inventoryId: item.inventoryId,
          quantity: item.quantity || item.metersUsed || 0
        }));
        try {
          await api.jobs.addMaterials(job._id, materialsToAdd);
        } catch (error: any) {
          console.error('Failed to add materials to job:', error);
          throw new Error(error?.message || 'Failed to add materials to job');
        }
      }
      return job;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      resetForm();
      toast({ title: 'Service created successfully! Rolls deducted and materials added to job.' });
    },
    onError: (error: any) => {
      toast({ title: error?.message || 'Failed to create service', variant: 'destructive' });
    }
  });

  const resetForm = () => {
    setSelectedCustomerId('');
    setSelectedVehicleIndex('');
    setSelectedTechnicianId('');
    setServiceNotes('');
    setPpfDiscount('');
    setLaborCost('');
    setIncludeGst(true);
    setSelectedItems([]);
    setSelectedItemId('');
    setMetersUsed('1');
    setPpfCategory('');
    setPpfVehicleType('');
    setPpfWarranty('');
    setPpfPrice(0);
    setPpfWarrantyFromPreferences(false);
    setSelectedOtherServices([]);
    setOtherServiceName('');
    setOtherServiceVehicleType('');
    setSelectedAccessoryCategory('');
    setSelectedAccessoryId('');
    setAccessoryQuantity('1');
    setSelectedAccessories([]);
  };

  const selectedCustomer = (Array.isArray(customers) ? customers : []).find((c: any) => c._id === selectedCustomerId);

  useEffect(() => {
    if (selectedCustomer) {
      if (selectedCustomer.vehicles && selectedCustomer.vehicles.length > 0) {
        setSelectedVehicleIndex('0');
      }
    }
  }, [selectedCustomerId, selectedCustomer]);

  useEffect(() => {
    const loadVehiclePreferences = async () => {
      if (!selectedCustomerId || selectedVehicleIndex === '') return;
      
      setIsLoadingLastService(true);
      try {
        const prefs = await api.customers.getVehiclePreferences(selectedCustomerId, parseInt(selectedVehicleIndex, 10));
        if (prefs) {
          const category = prefs.ppfCategory || '';
          const vehicleType = prefs.ppfVehicleType || '';
          const warranty = prefs.ppfWarranty || (prefs as any).warranty || '';
          
          setPpfCategory(category);
          setPpfVehicleType(vehicleType);
          setPpfWarranty(warranty);
          
          let price = prefs.ppfPrice || 0;
          if (price === 0 && category && vehicleType && warranty) {
            const categoryData = PPF_CATEGORIES[category as keyof typeof PPF_CATEGORIES];
            if (categoryData) {
              const vehicleTypeData = categoryData[vehicleType as keyof typeof categoryData] as Record<string, number>;
              if (vehicleTypeData && vehicleTypeData[warranty]) {
                price = vehicleTypeData[warranty];
              }
            }
          }
          setPpfPrice(price);
          if (warranty) {
            setPpfWarrantyFromPreferences(true);
          }
          
          // Auto-populate Other Services using ppfVehicleType for consistent pricing
          if (Array.isArray(prefs.otherServices) && prefs.otherServices.length > 0 && vehicleType) {
            const servicesWithPrices = prefs.otherServices
              .filter((svc: any) => svc.name !== 'Labor Charge')
              .map((svc: any) => {
                const serviceData = OTHER_SERVICES[svc.name as keyof typeof OTHER_SERVICES];
                let price = 0;
                if (serviceData) {
                  price = (serviceData as any)[vehicleType] || 0;
                }
                return {
                  name: svc.name,
                  vehicleType: vehicleType,
                  price: price,
                  discount: svc.discount || 0
                };
              });
            setSelectedOtherServices(servicesWithPrices);
          }
        }
      } catch (error) {
        console.error("Error loading vehicle preferences:", error);
      } finally {
        setIsLoadingLastService(false);
      }
    };
    
    loadVehiclePreferences();
  }, [selectedCustomerId, selectedVehicleIndex]);

  // Catalog auto-fill effect
  useEffect(() => {
    if (isLoadingLastService) return;
    if (!ppfCategory || !ppfVehicleType || !ppfWarranty) return;
    
    const categoryData = PPF_CATEGORIES[ppfCategory as keyof typeof PPF_CATEGORIES];
    if (categoryData && (categoryData as any)[ppfVehicleType]) {
      const vehicleTypeData = (categoryData as any)[ppfVehicleType] as Record<string, number>;
      if (vehicleTypeData[ppfWarranty]) {
        const calculatedPrice = vehicleTypeData[ppfWarranty];
        setPpfPrice(prev => (prev === 0 || prev !== calculatedPrice ? calculatedPrice : prev));
      }
    }
  }, [ppfCategory, ppfVehicleType, ppfWarranty, isLoadingLastService]);

  const handleAddOtherService = () => {
    if (!otherServiceName || !otherServiceVehicleType) {
      toast({ title: 'Please select a service and vehicle type', variant: 'destructive' });
      return;
    }
    const serviceData = OTHER_SERVICES[otherServiceName as keyof typeof OTHER_SERVICES];
    if (!serviceData || !(serviceData as any)[otherServiceVehicleType]) {
      toast({ title: 'Invalid service selection', variant: 'destructive' });
      return;
    }
    const price = (serviceData as any)[otherServiceVehicleType];
    const exists = selectedOtherServices.some(
      s => s.name === otherServiceName && s.vehicleType === otherServiceVehicleType
    );
    if (exists) {
      toast({ title: 'This service is already added', variant: 'destructive' });
      return;
    }
    setSelectedOtherServices([...selectedOtherServices, {
      name: otherServiceName,
      vehicleType: otherServiceVehicleType,
      price,
      discount: 0
    }]);
    setOtherServiceName('');
    setOtherServiceVehicleType('');
  };

  const handleRemoveOtherService = (index: number) => {
    setSelectedOtherServices(selectedOtherServices.filter((_, i) => i !== index));
  };

  const handleAddAccessory = () => {
    if (!selectedAccessoryId) {
      toast({ title: 'Please select an accessory', variant: 'destructive' });
      return;
    }
    const item = inventory.find((inv: any) => inv._id === selectedAccessoryId);
    if (!item) return;

    const qty = parseInt(accessoryQuantity);
    if (isNaN(qty) || qty <= 0) {
      toast({ title: 'Please enter a valid quantity', variant: 'destructive' });
      return;
    }

    if (qty > (item.quantity || 0)) {
      toast({ title: `Only ${item.quantity} available in stock`, variant: 'destructive' });
      return;
    }

    const exists = selectedAccessories.some(a => a.id === selectedAccessoryId);
    if (exists) {
      toast({ title: 'This accessory is already added', variant: 'destructive' });
      return;
    }

    setSelectedAccessories([...selectedAccessories, {
      id: selectedAccessoryId,
      name: item.name,
      category: item.category,
      price: item.price || 0,
      quantity: qty
    }]);
    setSelectedAccessoryId('');
    setAccessoryQuantity('1');
  };

  const handleRemoveAccessory = (index: number) => {
    setSelectedAccessories(selectedAccessories.filter((_, i) => i !== index));
  };

  const handleAddItem = () => {
    if (!selectedItemId) {
      toast({ title: 'Please select a product', variant: 'destructive' });
      return;
    }
    const item = (Array.isArray(inventory) ? inventory : []).find((inv: any) => inv._id === selectedItemId);
    if (!item) return;

    const val = parseFloat(metersUsed);
    if (isNaN(val) || val <= 0) {
      toast({ title: 'Please enter a valid amount', variant: 'destructive' });
      return;
    }

    // Calculate total available across all rolls
    let totalAvailable = 0;
    if (item.rolls && item.rolls.length > 0) {
      totalAvailable = item.rolls.reduce((sum: number, roll: any) => {
        if (roll.status !== 'Finished' && roll.remaining_sqft > 0) {
          return sum + (roll.remaining_sqft || 0);
        }
        return sum;
      }, 0);
    } else {
      totalAvailable = item.quantity || 0;
    }

    if (val > totalAvailable) {
      toast({ title: `Only ${totalAvailable} available for ${item.category}`, variant: 'destructive' });
      return;
    }

    setSelectedItems([...selectedItems, {
      inventoryId: selectedItemId,
      quantity: val,
      name: item.category,
      unit: 'Square Feet'
    }]);
    setSelectedItemId('');
    setMetersUsed('1');
  };

  const handleRemoveItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const ppfDiscountAmount = parseFloat(ppfDiscount) || 0;
  const ppfAfterDiscount = Math.max(0, ppfPrice - ppfDiscountAmount);
  const otherServicesTotal = selectedOtherServices.reduce((sum, s) => sum + s.price, 0);
  const accessoriesTotal = selectedAccessories.reduce((sum, a) => sum + (a.price * a.quantity), 0);
  const otherServicesDiscount = selectedOtherServices.reduce((sum, s) => sum + (s.discount || 0), 0);
  const otherServicesAfterDiscount = selectedOtherServices.reduce((sum, s) => sum + Math.max(0, s.price - (s.discount || 0)), 0);
  
  const parsedLaborCost = parseFloat(laborCost) || 0;
  
  const totalDiscount = ppfDiscountAmount + otherServicesDiscount;
  const totalServiceAfterDiscount = ppfAfterDiscount + otherServicesAfterDiscount + accessoriesTotal;
  
  const subtotal = ppfAfterDiscount + otherServicesAfterDiscount + accessoriesTotal + parsedLaborCost;
  const gstValue = includeGst ? subtotal * 0.18 : 0;
  const totalCostValue = subtotal + gstValue;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !selectedVehicleIndex) {
      toast({ title: 'Please select a customer and vehicle', variant: 'destructive' });
      return;
    }
    if (subtotal <= 0) {
      toast({ title: 'Please select at least one service or enter labor cost', variant: 'destructive' });
      return;
    }
    const customer = customers.find((c: any) => c._id === selectedCustomerId);
    if (!customer) return;
    const vehicleIdx = parseInt(selectedVehicleIndex, 10);
    const vehicle = customer.vehicles[vehicleIdx];
    const selectedTechnician = technicians.find((t: any) => t._id === selectedTechnicianId);

    const serviceItemsList: any[] = [];
    if (ppfPrice > 0) {
      // Find the material item associated with this PPF service
      const ppfMaterialItem = selectedItems.find(item => item.rollId);
      
      serviceItemsList.push({
        name: `PPF ${ppfCategory} - ${ppfWarranty}`,
        price: ppfPrice,
        discount: ppfDiscountAmount,
        type: 'part',
        category: ppfCategory,
        vehicleType: ppfVehicleType,
        warranty: ppfWarranty,
        rollId: ppfMaterialItem?.rollId,
        rollName: ppfMaterialItem?.name,
        sizeUsed: ppfMaterialItem ? (ppfMaterialItem.quantity || ppfMaterialItem.metersUsed)?.toString() : undefined
      });
    }
    selectedOtherServices.forEach(s => {
      serviceItemsList.push({
        name: s.name,
        price: s.price,
        discount: s.discount || 0,
        type: 'part'
      });
    });
    selectedAccessories.forEach(a => {
      serviceItemsList.push({
        name: `${a.name} (${a.quantity}x)`,
        price: a.price * a.quantity,
        discount: 0,
        type: 'part'
      });
    });
    if (parsedLaborCost > 0) {
      serviceItemsList.push({
        name: 'Labor Charge',
        price: parsedLaborCost,
        type: 'labor'
      });
    }

    const materialsList = [
      ...selectedItems.map(item => ({
        inventoryId: item.inventoryId,
        name: item.name,
        quantity: item.quantity || item.metersUsed,
      })),
      ...selectedAccessories.map(a => ({
        inventoryId: a.id,
        name: a.name,
        quantity: a.quantity
      }))
    ];

    createJobMutation.mutate({
      customerId: selectedCustomerId,
      vehicleIndex: vehicleIdx,
      customerName: customer.name,
      vehicleName: `${vehicle.make} ${vehicle.model}`,
      plateNumber: vehicle.plateNumber,
      technicianId: selectedTechnicianId || undefined,
      technicianName: selectedTechnician?.name,
      notes: serviceNotes,
      stage: 'New Lead',
      serviceItems: serviceItemsList,
      totalAmount: totalCostValue,
      paidAmount: 0,
      paymentStatus: 'Pending',
      requiresGST: includeGst
    });
  };

  const getAvailableWarranties = () => {
    if (!ppfCategory || !ppfVehicleType) return [];
    const categoryData = PPF_CATEGORIES[ppfCategory as keyof typeof PPF_CATEGORIES];
    if (!categoryData || !(categoryData as any)[ppfVehicleType]) return [];
    return Object.keys((categoryData as any)[ppfVehicleType]);
  };

  return (
    <div className="space-y-8 p-4">
      <Card className="bg-white border-2 border-red-200 shadow-sm overflow-hidden">
        <CardHeader className="pb-6 border-b border-red-200 bg-gradient-to-r from-red-50/50 to-transparent">
          <CardTitle className="flex items-center gap-3 text-lg text-slate-900 font-semibold">
            <div className="p-2 bg-red-100 rounded-lg">
              <Package className="w-5 h-5 text-red-600" />
            </div>
            Create New Service
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-8 pb-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Select Customer *</Label>
                  <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                    <SelectTrigger data-testid="select-customer">
                      <SelectValue placeholder="Choose a customer" />
                    </SelectTrigger>
                    <SelectContent position="popper" className="max-h-60 w-[var(--radix-select-trigger-width)]">
                      <div className="p-2 sticky top-0 bg-white z-10 border-b">
                        <Input
                          placeholder="Search customer..."
                          className="h-8 text-sm"
                          onChange={(e) => {
                            const search = e.target.value.toLowerCase();
                            const items = e.target.closest('[role="listbox"]')?.querySelectorAll('[role="option"]');
                            items?.forEach((item) => {
                              const text = item.textContent?.toLowerCase() || "";
                              (item as HTMLElement).style.display = text.includes(search) ? "flex" : "none";
                            });
                          }}
                          onKeyDown={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div className="overflow-y-auto max-h-[220px]">
                        {customers.map((customer: any) => (
                          <SelectItem key={customer._id} value={customer._id}>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              {customer.name} - {customer.phone}
                            </div>
                          </SelectItem>
                        ))}
                      </div>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">Select Vehicle *</Label>
                  <Select value={selectedVehicleIndex} onValueChange={setSelectedVehicleIndex} disabled={!selectedCustomerId}>
                    <SelectTrigger data-testid="select-vehicle">
                      <SelectValue placeholder="Choose a vehicle" />
                    </SelectTrigger>
                    <SelectContent position="popper" className="max-h-60 w-[var(--radix-select-trigger-width)]">
                      <div className="p-2 sticky top-0 bg-white z-10 border-b">
                        <Input
                          placeholder="Search vehicle..."
                          className="h-8 text-sm"
                          onChange={(e) => {
                            const search = e.target.value.toLowerCase();
                            const items = e.target.closest('[role="listbox"]')?.querySelectorAll('[role="option"]');
                            items?.forEach((item) => {
                              const text = item.textContent?.toLowerCase() || "";
                              (item as HTMLElement).style.display = text.includes(search) ? "flex" : "none";
                            });
                          }}
                          onKeyDown={(e) => e.stopPropagation()}
                        />
                      </div>
                      {selectedCustomer?.vehicles?.map((v: any, idx: number) => (
                        <SelectItem key={idx} value={idx.toString()}>
                          {v.make} {v.model} - {v.plateNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Assign Technician</Label>
                    <Select value={selectedTechnicianId} onValueChange={setSelectedTechnicianId}>
                      <SelectTrigger data-testid="select-technician">
                        <SelectValue placeholder="Assign technician" />
                      </SelectTrigger>
                      <SelectContent position="popper" className="max-h-60 w-[var(--radix-select-trigger-width)]">
                        <div className="p-2 sticky top-0 bg-white z-10 border-b">
                          <Input
                            placeholder="Search technician..."
                            className="h-8 text-sm"
                            onChange={(e) => {
                              const search = e.target.value.toLowerCase();
                              const items = e.target.closest('[role="listbox"]')?.querySelectorAll('[role="option"]');
                              items?.forEach((item) => {
                                const text = item.textContent?.toLowerCase() || "";
                                (item as HTMLElement).style.display = text.includes(search) ? "flex" : "none";
                              });
                            }}
                            onKeyDown={(e) => e.stopPropagation()}
                          />
                        </div>
                        {technicians.map((t: any) => (
                          t.status !== 'Off' && (
                            <SelectItem key={t._id} value={t._id} disabled={t.status !== 'Available'}>
                              {t.name} - {t.specialty} ({t.status})
                            </SelectItem>
                          )
                        ))}
                      </SelectContent>
                    </Select>
                </div>

                <Card className="border border-red-200">
                  <CardHeader className="py-3 cursor-pointer" onClick={() => setShowPpfSection(!showPpfSection)}>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">PPF Service</CardTitle>
                      {showPpfSection ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    <div className="space-y-2">
                      <Label className="text-sm">PPF Category</Label>
                      <Select value={ppfCategory} onValueChange={(val) => {
                        setPpfCategory(val);
                        setPpfWarranty('');
                        setShowPpfSection(true);
                      }}>
                        <SelectTrigger data-testid="select-ppf-category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent position="popper" className="max-h-60 w-[var(--radix-select-trigger-width)]">
                          <div className="p-2 sticky top-0 bg-white z-10 border-b">
                            <Input
                              placeholder="Search category..."
                              className="h-8 text-sm"
                              onChange={(e) => {
                                const search = e.target.value.toLowerCase();
                                const items = e.target.closest('[role="listbox"]')?.querySelectorAll('[role="option"]');
                                items?.forEach((item) => {
                                  const text = item.textContent?.toLowerCase() || "";
                                  (item as HTMLElement).style.display = text.includes(search) ? "flex" : "none";
                                });
                              }}
                              onKeyDown={(e) => e.stopPropagation()}
                            />
                          </div>
                          {Object.keys(PPF_CATEGORIES).map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {showPpfSection && (
                      <div className="space-y-3 pt-3 border-t">
                        <div className="space-y-2">
                          <Label className="text-sm">Vehicle Type</Label>
                          <Select value={ppfVehicleType} onValueChange={(val) => {
                            setPpfVehicleType(val);
                            setPpfWarranty('');
                          }}>
                            <SelectTrigger data-testid="select-ppf-vehicle-type">
                              <SelectValue placeholder="Select vehicle type" />
                            </SelectTrigger>
                            <SelectContent position="popper" className="max-h-60 w-[var(--radix-select-trigger-width)]">
                              <div className="p-2 sticky top-0 bg-white z-10 border-b">
                                <Input
                                  placeholder="Search vehicle type..."
                                  className="h-8 text-sm"
                                  onChange={(e) => {
                                    const search = e.target.value.toLowerCase();
                                    const items = e.target.closest('[role="listbox"]')?.querySelectorAll('[role="option"]');
                                    items?.forEach((item) => {
                                      const text = item.textContent?.toLowerCase() || "";
                                      (item as HTMLElement).style.display = text.includes(search) ? "flex" : "none";
                                    });
                                  }}
                                  onKeyDown={(e) => e.stopPropagation()}
                                />
                              </div>
                              {VEHICLE_TYPES.map((type) => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm">Warranty & Price</Label>
                          <Select key={`${ppfCategory}-${ppfVehicleType}`} value={ppfWarranty} onValueChange={setPpfWarranty} disabled={!ppfCategory || !ppfVehicleType}>
                            <SelectTrigger data-testid="select-ppf-warranty">
                              <SelectValue placeholder="Select warranty" />
                            </SelectTrigger>
                            <SelectContent className="max-h-64 overflow-y-auto">
                              {getAvailableWarranties().map((warranty) => {
                                const categoryData = PPF_CATEGORIES[ppfCategory as keyof typeof PPF_CATEGORIES];
                                const vehicleData = categoryData ? (categoryData[ppfVehicleType as keyof typeof categoryData] as Record<string, number>) : null;
                                const price = vehicleData ? vehicleData[warranty] : null;
                                return (
                                  <SelectItem key={warranty} value={warranty}>
                                    {warranty} {price ? `- ₹${price.toLocaleString('en-IN')}` : ''}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>

                        {ppfPrice > 0 && (
                          <div className="space-y-3">
                            <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                              <div className="flex justify-between items-center">
                                <Label className="text-sm font-medium">PPF Price</Label>
                                <span className="text-lg font-bold text-primary">₹{ppfPrice.toLocaleString('en-IN')}</span>
                              </div>
                            </div>
                            <div className="w-full">
                              <Label className="text-xs">Discount</Label>
                              <Input type="number" value={ppfDiscount} onChange={(e) => setPpfDiscount(e.target.value)} />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>


                <Card className="border border-red-200">
                  <CardHeader className="py-3">
                    <CardTitle className="text-base">Other Services</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-sm">Select Service</Label>
                      <Select value={otherServiceName} onValueChange={setOtherServiceName}>
                        <SelectTrigger data-testid="select-other-service">
                          <SelectValue placeholder="Choose a service" />
                        </SelectTrigger>
                        <SelectContent position="popper" className="max-h-60 w-[var(--radix-select-trigger-width)]">
                          <div className="p-2 sticky top-0 bg-white z-10 border-b">
                            <Input
                              placeholder="Search service..."
                              className="h-8 text-sm"
                              onChange={(e) => {
                                const search = e.target.value.toLowerCase();
                                const items = e.target.closest('[role="listbox"]')?.querySelectorAll('[role="option"]');
                                items?.forEach((item) => {
                                  const text = item.textContent?.toLowerCase() || "";
                                  (item as HTMLElement).style.display = text.includes(search) ? "flex" : "none";
                                });
                              }}
                              onKeyDown={(e) => e.stopPropagation()}
                            />
                          </div>
                          {Object.keys(OTHER_SERVICES).map((service) => (
                            <SelectItem key={service} value={service}>{service}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm">Vehicle Type</Label>
                      <Select value={otherServiceVehicleType} onValueChange={setOtherServiceVehicleType}>
                        <SelectTrigger data-testid="select-other-service-vehicle-type">
                          <SelectValue placeholder="Select vehicle type" />
                        </SelectTrigger>
                        <SelectContent className="max-h-64 overflow-y-auto">
                          {VEHICLE_TYPES.map((type) => {
                            const serviceData = otherServiceName ? OTHER_SERVICES[otherServiceName as keyof typeof OTHER_SERVICES] : null;
                            const price = serviceData ? (serviceData as any)[type] : null;
                            return (
                              <SelectItem key={type} value={type}>
                                {type} {price ? `- ₹${price.toLocaleString('en-IN')}` : ''}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button type="button" variant="outline" onClick={handleAddOtherService} disabled={!otherServiceName || !otherServiceVehicleType} className="w-full">
                      Add Service
                    </Button>

                    {selectedOtherServices.length > 0 && (
                      <div className="space-y-4 mt-3">
                        <div className="border-b pb-2">
                          <Label className="text-sm font-semibold">Selected Services</Label>
                        </div>
                        <div className="border rounded-lg divide-y">
                          {selectedOtherServices.map((service, index) => (
                            <div key={index} className="space-y-2 p-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-sm">{service.name}</p>
                                  <p className="text-xs text-muted-foreground">{service.vehicleType}</p>
                                </div>
                                <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveOtherService(index)}>
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              </div>
                              <div className="bg-gray-50 p-2 rounded-md border border-gray-200">
                                <div className="flex justify-between items-center mb-2">
                                  <Label className="text-sm font-medium">Service Price</Label>
                                  <span className="text-lg font-bold text-primary">₹{service.price.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="w-full">
                                  <Label className="text-xs">Discount</Label>
                                  <Input 
                                    type="number" 
                                    value={service.discount || ''} 
                                    onChange={(e) => {
                                      const newServices = [...selectedOtherServices];
                                      newServices[index].discount = parseFloat(e.target.value) || 0;
                                      setSelectedOtherServices(newServices);
                                    }} 
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Service Notes</Label>
                  <Textarea value={serviceNotes} onChange={(e) => setServiceNotes(e.target.value)} placeholder="Additional notes..." rows={3} />
                </div>

                <div className="space-y-2">
                  <Label>Labor Charge</Label>
                  <Input type="number" value={laborCost} onChange={(e) => setLaborCost(e.target.value)} placeholder="0" min="0" />
                </div>

                <div className="space-y-4 border border-gray-200 p-4 rounded-lg">
                  <h3 className="font-semibold text-sm">Add Item from Inventory</h3>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-sm">Select Product</Label>
                      <Select value={selectedItemId} onValueChange={(id) => {
                        setSelectedItemId(id);
                        setExpandedInventoryId(null);
                      }}>
                        <SelectTrigger data-testid="select-inventory-item">
                          <SelectValue placeholder="Choose a product" />
                        </SelectTrigger>
                        <SelectContent position="popper" className="max-h-60 w-[var(--radix-select-trigger-width)]">
                          <div className="p-2 sticky top-0 bg-white z-10 border-b">
                            <Input
                              placeholder="Search product..."
                              className="h-8 text-sm"
                              onChange={(e) => {
                                const search = e.target.value.toLowerCase();
                                const items = e.target.closest('[role="listbox"]')?.querySelectorAll('[role="option"]');
                                items?.forEach((item) => {
                                  const text = item.textContent?.toLowerCase() || "";
                                  (item as HTMLElement).style.display = text.includes(search) ? "flex" : "none";
                                });
                              }}
                              onKeyDown={(e) => e.stopPropagation()}
                            />
                          </div>
                          {(Array.isArray(inventory) ? inventory : [])
                            .filter((item: any) => item.category !== 'Accessories')
                            .map((item: any) => (
                              <SelectItem key={item._id} value={item._id}>
                                {item.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedItemId && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 space-y-2">
                        {(() => {
                          const item = (Array.isArray(inventory) ? inventory : []).find((inv: any) => inv._id === selectedItemId);
                          const totalAvailable = item?.rolls?.reduce((sum: number, roll: any) => {
                            if (roll.status !== 'Finished' && roll.remaining_sqft > 0) {
                              return sum + (roll.remaining_sqft || 0);
                            }
                            return sum;
                          }, 0) || 0;
                          const activeRolls = item?.rolls?.filter((r: any) => r.status !== 'Finished' && r.remaining_sqft > 0) || [];

                          return (
                            <>
                              <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedInventoryId(expandedInventoryId === selectedItemId ? null : selectedItemId)}>
                                <div>
                                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">{totalAvailable} sq ft available across {activeRolls.length} roll(s)</p>
                                </div>
                                {activeRolls.length > 0 && (
                                  expandedInventoryId === selectedItemId ? 
                                  <ChevronUp className="w-4 h-4 text-blue-600 dark:text-blue-400" /> : 
                                  <ChevronDown className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                )}
                              </div>
                              
                              {expandedInventoryId === selectedItemId && activeRolls.length > 0 && (
                                <div className="space-y-2 mt-2 pt-2 border-t border-blue-200 dark:border-blue-800">
                                  {activeRolls.map((roll: any, idx: number) => (
                                    <div key={roll._id || idx} className="flex items-center justify-between text-sm bg-white dark:bg-slate-800 p-2 rounded">
                                      <div>
                                        <p className="font-medium text-slate-900 dark:text-slate-100">{roll.name}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Created: {new Date(roll.createdAt).toLocaleDateString()}</p>
                                      </div>
                                      <p className="font-semibold text-blue-600 dark:text-blue-400">{roll.remaining_sqft} sq ft</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label className="text-sm">Quantity/Amount</Label>
                      <Input type="number" value={metersUsed} onChange={(e) => setMetersUsed(e.target.value)} placeholder="0" min="0" />
                    </div>

                    <Button type="button" variant="outline" onClick={handleAddItem} className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Item
                    </Button>
                  </div>

                  {selectedItems.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Selected Items</Label>
                      <div className="border rounded-lg divide-y">
                        {selectedItems.map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-2">
                            <div>
                              <p className="text-sm font-medium">{item.name}</p>
                              <p className="text-xs text-muted-foreground">{item.quantity} {item.unit}</p>
                            </div>
                            <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveItem(index)}>
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3 border border-gray-200 p-4 rounded-lg bg-white">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Package className="w-4 h-4 text-red-600" />
                    Cost Summary
                  </h3>
                  <div className="space-y-2 border-t pt-3">
                    {ppfPrice > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">PPF Service:</span>
                        <span className="font-medium">₹{ppfPrice.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    {selectedOtherServices.length > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Other Services:</span>
                        <span className="font-medium">₹{otherServicesTotal.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    {selectedAccessories.length > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Accessories:</span>
                        <span className="font-medium">₹{accessoriesTotal.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    {parsedLaborCost > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Labor Charge:</span>
                        <span className="font-medium">₹{parsedLaborCost.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    {totalDiscount > 0 && (
                      <div className="flex justify-between text-sm text-orange-600">
                        <span>Discount:</span>
                        <span>-₹{totalDiscount.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm border-t pt-2 font-medium">
                      <span>Subtotal:</span>
                      <span>₹{subtotal.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Checkbox id="include-gst" checked={includeGst} onCheckedChange={(val) => setIncludeGst(!!val)} />
                        <Label htmlFor="include-gst" className="text-sm cursor-pointer">GST (18%)</Label>
                      </div>
                      <span className="font-medium">{includeGst ? `₹${gstValue.toLocaleString('en-IN')}` : '₹0'}</span>
                    </div>
                    <div className="flex justify-between text-base font-bold border-t pt-2 text-red-600">
                      <span>Total:</span>
                      <span>₹{totalCostValue.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={createJobMutation.isPending}>
                    {createJobMutation.isPending ? "Creating..." : "Create Service"}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
