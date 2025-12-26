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
  const [serviceNotes, setServiceNotes] = useState('');
  const [ppfDiscount, setPpfDiscount] = useState<string>('');
  const [laborCost, setLaborCost] = useState<string>('');
  const [includeGst, setIncludeGst] = useState(true);
  const [selectedItems, setSelectedItems] = useState<{ inventoryId: string; rollId?: string; metersUsed?: number; name: string; unit: string; quantity?: number }[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [selectedRollId, setSelectedRollId] = useState<string>('');
  const [metersUsed, setMetersUsed] = useState<string>('1');

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
  const [ppfWarrantyFromPreferences, setPpfWarrantyFromPreferences] = useState(false);

  const [selectedOtherServices, setSelectedOtherServices] = useState<SelectedService[]>([]);
  const [otherServiceName, setOtherServiceName] = useState('');
  const [otherServiceVehicleType, setOtherServiceVehicleType] = useState('');

  const [showPpfSection, setShowPpfSection] = useState(true);
  const [showOtherServicesSection, setShowOtherServicesSection] = useState(true);
  const [isLoadingLastService, setIsLoadingLastService] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const preSelectedCustomerId = urlParams.get('customerId');
    if (preSelectedCustomerId) {
      setSelectedCustomerId(preSelectedCustomerId);
    }
  }, [location]);

  const { data: customersData = [] } = useQuery<any>({
    queryKey: ['customers'],
    queryFn: () => api.customers.list(),
  });

  const customers = Array.isArray(customersData) ? customersData : (customersData as any)?.customers || [];

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
        for (const item of selectedItems) {
          try {
            if (item.rollId && item.metersUsed) {
              await api.inventory.deductRoll(item.inventoryId, item.rollId, item.metersUsed);
            } else if (item.quantity) {
              await api.inventory.adjust(item.inventoryId, -item.quantity);
            }
          } catch (error: any) {
            console.error(`Failed to reduce inventory for ${item.name}:`, error);
          }
        }
      }
      return job;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      resetForm();
      toast({ title: 'Service created successfully! Inventory reduced automatically.' });
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
    setSelectedRollId('');
    setMetersUsed('1');
    setPpfCategory('');
    setPpfVehicleType('');
    setPpfWarranty('');
    setPpfPrice(0);
    setPpfWarrantyFromPreferences(false);
    setSelectedOtherServices([]);
    setOtherServiceName('');
    setOtherServiceVehicleType('');
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
          // Immediately set what we have from preferences
          const category = prefs.ppfCategory || '';
          const vehicleType = prefs.ppfVehicleType || '';
          const warranty = prefs.ppfWarranty || '';
          
          setPpfCategory(category);
          setPpfVehicleType(vehicleType);
          
          // Small delay to ensure category and vehicle type are updated before setting warranty and price
          // This avoids the catalog useEffect clearing the price
          setTimeout(() => {
            setPpfWarranty(warranty);
            if (warranty) {
              setPpfWarrantyFromPreferences(true);
            }
            
            let price = prefs.ppfPrice || 0;
            if (price === 0 && category && vehicleType && warranty) {
              const categoryData = PPF_CATEGORIES[category];
              if (categoryData && categoryData[vehicleType] && categoryData[vehicleType][warranty]) {
                price = categoryData[vehicleType][warranty];
              }
            }
            setPpfPrice(price);
            
            if (typeof prefs.laborCost === 'number' && prefs.laborCost > 0) {
              setLaborCost(prefs.laborCost.toString());
            }
          }, 0);
          
          if (Array.isArray(prefs.otherServices) && prefs.otherServices.length > 0) {
            const servicesWithPrices = prefs.otherServices.map((svc: any) => {
              const serviceData = OTHER_SERVICES[svc.name];
              const price = serviceData && serviceData[svc.vehicleType] ? serviceData[svc.vehicleType] : 0;
              return {
                name: svc.name,
                vehicleType: svc.vehicleType || '',
                price: price,
                discount: 0
              };
            });
            setSelectedOtherServices(servicesWithPrices);
            
            // Pre-fill the form fields with the first service so user can see and edit it
            if (servicesWithPrices.length > 0) {
              setOtherServiceName(servicesWithPrices[0].name);
              setOtherServiceVehicleType(servicesWithPrices[0].vehicleType);
            }
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

  // Catalog auto-fill effect - only run when user MANUALLY changes selection
  useEffect(() => {
    // Avoid running this when loading preferences to prevent overwriting
    if (isLoadingLastService) return;

    if (!ppfCategory || !ppfVehicleType || !ppfWarranty) {
      return;
    }
    
    const categoryData = PPF_CATEGORIES[ppfCategory];
    if (categoryData && categoryData[ppfVehicleType] && categoryData[ppfVehicleType][ppfWarranty]) {
      const calculatedPrice = categoryData[ppfVehicleType][ppfWarranty];
      // Only update if current price is 0 or different (prevents loop)
      setPpfPrice(prev => (prev === 0 || prev !== calculatedPrice ? calculatedPrice : prev));
    }
  }, [ppfCategory, ppfVehicleType, ppfWarranty, isLoadingLastService]);

  const handleAddVehicle = () => {
    if (!selectedCustomerId) {
      toast({ title: 'Please select a customer first', variant: 'destructive' });
      return;
    }
    if (!newVehicleMake || !newVehicleModel || !newVehiclePlate) {
      toast({ title: 'Please fill in make, model, and plate number', variant: 'destructive' });
      return;
    }
    
    const newVehicle: any = {
      make: newVehicleMake,
      model: newVehicleModel,
      plateNumber: newVehiclePlate,
      year: newVehicleYear ? parseInt(newVehicleYear, 10) : undefined,
      color: newVehicleColor || undefined,
    };
    
    if (selectedCustomer?.vehicles?.[0]) {
      const firstVehicle = selectedCustomer.vehicles[0];
      if (firstVehicle.ppfCategory) newVehicle.ppfCategory = firstVehicle.ppfCategory;
      if (firstVehicle.ppfVehicleType) newVehicle.ppfVehicleType = firstVehicle.ppfVehicleType;
      if (firstVehicle.ppfWarranty) newVehicle.ppfWarranty = firstVehicle.ppfWarranty;
      if (firstVehicle.ppfPrice) newVehicle.ppfPrice = firstVehicle.ppfPrice;
      if (firstVehicle.laborCost) newVehicle.laborCost = firstVehicle.laborCost;
      if (firstVehicle.otherServices?.length > 0) newVehicle.otherServices = firstVehicle.otherServices;
    }
    
    addVehicleMutation.mutate({
      customerId: selectedCustomerId,
      vehicle: newVehicle
    });
  };

  const handleAddOtherService = () => {
    if (!otherServiceName || !otherServiceVehicleType) {
      toast({ title: 'Please select a service and vehicle type', variant: 'destructive' });
      return;
    }
    const serviceData = OTHER_SERVICES[otherServiceName];
    if (!serviceData || !serviceData[otherServiceVehicleType]) {
      toast({ title: 'Invalid service selection', variant: 'destructive' });
      return;
    }
    const price = serviceData[otherServiceVehicleType];
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

    const getAvailableRolls = () => {
      const item = (Array.isArray(inventory) ? inventory : []).find((inv: any) => inv._id === selectedItemId);
      if (!item || !item.rolls) return [];
      // Only return rolls that have remaining stock
      return item.rolls.filter((roll: any) => {
        const isFinished = roll.status === 'Finished';
        const hasStock = roll.remaining_meters > 0 || roll.remaining_sqft > 0;
        return !isFinished && hasStock;
      });
    };

  const handleAddItem = () => {
    if (!selectedItemId) {
      toast({ title: 'Please select a product', variant: 'destructive' });
      return;
    }
    
    const item = (Array.isArray(inventory) ? inventory : []).find((inv: any) => inv._id === selectedItemId);
    if (!item) return;

    if (item.rolls && item.rolls.length > 0) {
      if (!selectedRollId) {
        toast({ title: 'Please select a roll', variant: 'destructive' });
        return;
      }
      
      const roll = item.rolls.find((r: any) => r._id === selectedRollId);
      if (!roll) {
        toast({ title: 'Roll not found', variant: 'destructive' });
        return;
      }

      if (roll.status === 'Finished' || (roll.remaining_meters <= 0 && roll.remaining_sqft <= 0)) {
        toast({ title: 'Selected roll is not available', variant: 'destructive' });
        return;
      }

      const val = parseFloat(metersUsed);
      if (isNaN(val) || val <= 0) {
        toast({ title: 'Please enter a valid amount', variant: 'destructive' });
        return;
      }

      if (roll.remaining_sqft > 0) {
        if (val > roll.remaining_sqft) {
          toast({ title: `Only ${roll.remaining_sqft}sqft available in this roll`, variant: 'destructive' });
          return;
        }
        setSelectedItems([...selectedItems, {
          inventoryId: selectedItemId,
          rollId: selectedRollId,
          metersUsed: 0,
          quantity: val,
          name: `${item.name} - ${roll.name}`,
          unit: 'Square Feet'
        }]);
      } else {
        if (val > roll.remaining_meters) {
          toast({ title: `Only ${roll.remaining_meters}m available in this roll`, variant: 'destructive' });
          return;
        }
        setSelectedItems([...selectedItems, {
          inventoryId: selectedItemId,
          rollId: selectedRollId,
          metersUsed: val,
          quantity: val, // Ensure quantity is also set for display
          name: `${item.name} - ${roll.name}`,
          unit: 'meters'
        }]);
      }
    } else {
      const qty = parseFloat(metersUsed); // Use parseFloat to support decimal quantities
      if (isNaN(qty) || qty <= 0) {
        toast({ title: 'Please enter a valid quantity', variant: 'destructive' });
        return;
      }
      
      if (qty > item.quantity) {
        toast({ title: `Only ${item.quantity} ${item.unit} available`, variant: 'destructive' });
        return;
      }

      setSelectedItems([...selectedItems, {
        inventoryId: selectedItemId,
        quantity: qty,
        name: item.name,
        unit: item.unit
      }]);
    }

    setSelectedItemId('');
    setSelectedRollId('');
    setMetersUsed('1');
  };

  const handleRemoveItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCustomerId || !selectedVehicleIndex) {
      toast({ title: 'Please select a customer and vehicle', variant: 'destructive' });
      return;
    }

    const ppfDiscountAmount = parseFloat(ppfDiscount) || 0;
    const ppfAfterDiscount = Math.max(0, ppfPrice - ppfDiscountAmount);
    const otherServicesTotal = selectedOtherServices.reduce((sum, s) => sum + Math.max(0, s.price - (s.discount || 0)), 0);
    const totalServiceCost = ppfAfterDiscount + otherServicesTotal;
    const parsedLaborCost = parseFloat(laborCost) || 0;
    
    if (totalServiceCost <= 0 && parsedLaborCost <= 0) {
      toast({ title: 'Please select at least one service or enter labor cost', variant: 'destructive' });
      return;
    }

    const customer = (Array.isArray(customers) ? customers : []).find((c: any) => c._id === selectedCustomerId);
    if (!customer) return;

    const vehicleIdx = parseInt(selectedVehicleIndex, 10);
    const vehicle = customer.vehicles[vehicleIdx];
    if (!vehicle) return;

    const selectedTechnician = (Array.isArray(technicians) ? technicians : []).find((t: any) => t._id === selectedTechnicianId);

    const subtotal = totalServiceCost + parsedLaborCost;
    const gstAmount = includeGst ? subtotal * 0.18 : 0;
    const totalAmount = subtotal + gstAmount;

    const serviceItemsList: { name: string; price: number; discount?: number; category?: string; vehicleType?: string; warranty?: string; type: string; cost: number; description: string }[] = [];
    if (ppfPrice > 0) {
      serviceItemsList.push({
        name: `PPF ${ppfCategory} - ${ppfWarranty}`,
        price: ppfPrice,
        discount: ppfDiscountAmount,
        category: ppfCategory,
        vehicleType: ppfVehicleType,
        warranty: ppfWarranty,
        type: 'part',
        cost: ppfPrice,
        description: `PPF ${ppfCategory} - ${ppfWarranty}`
      });
    }
    selectedOtherServices.forEach(s => {
      serviceItemsList.push({
        name: s.name,
        price: s.price,
        discount: s.discount || 0,
        vehicleType: s.vehicleType,
        type: 'part',
        cost: s.price,
        description: s.name
      });
    });

    if (parsedLaborCost > 0) {
      serviceItemsList.push({
        name: 'Labor Charge',
        price: parsedLaborCost,
        discount: 0,
        type: 'labor',
        cost: parsedLaborCost,
        description: 'Labor Charge'
      });
    }

    const materialsList = selectedItems.map(item => ({
      inventoryId: item.inventoryId,
      name: item.name,
      quantity: item.quantity || item.metersUsed,
      cost: 0
    }));
    
    createJobMutation.mutate({
      customerId: selectedCustomerId,
      vehicleIndex: vehicleIdx,
      customerName: customer.name,
      vehicleName: `${vehicle.make} ${vehicle.model}`.trim() || vehicle.model,
      plateNumber: vehicle.plateNumber,
      technicianId: selectedTechnicianId || undefined,
      technicianName: selectedTechnician?.name,
      notes: serviceNotes,
      stage: 'New Lead',
      serviceCost: totalServiceCost,
      laborCost: parsedLaborCost,
      serviceItems: serviceItemsList,
      materials: materialsList,
      totalAmount: totalAmount,
      paidAmount: 0,
      paymentStatus: 'Pending',
      requiresGST: includeGst
    });
  };

  const ppfDiscountAmount = parseFloat(ppfDiscount) || 0;
  const ppfAfterDiscount = Math.max(0, ppfPrice - ppfDiscountAmount);
  const otherServicesTotal = selectedOtherServices.reduce((sum, s) => sum + s.price, 0);
  const otherServicesDiscount = selectedOtherServices.reduce((sum, s) => sum + (s.discount || 0), 0);
  const totalServiceBaseCost = ppfPrice + otherServicesTotal;
  const totalDiscount = ppfDiscountAmount + otherServicesDiscount;
  const totalServiceAfterDiscount = ppfAfterDiscount + selectedOtherServices.reduce((sum, s) => sum + Math.max(0, s.price - (s.discount || 0)), 0);
  const parsedLaborCost = parseFloat(laborCost) || 0;
  const subtotal = totalServiceAfterDiscount + parsedLaborCost;
  const gst = includeGst ? subtotal * 0.18 : 0;
  const totalCost = subtotal + gst;

  const handleIncludeGstChange = (checked: boolean) => {
    setIncludeGst(checked);
  };

  const getAvailableWarranties = () => {
    if (!ppfCategory || !ppfVehicleType) return [];
    const categoryData = PPF_CATEGORIES[ppfCategory];
    if (!categoryData || !categoryData[ppfVehicleType]) return [];
    return Object.keys(categoryData[ppfVehicleType]);
  };

  return (
    <div className="space-y-8">
      <Card className="bg-white border-2 border-red-200 shadow-sm overflow-hidden">
        <CardHeader className="pb-6 border-b border-red-200 bg-gradient-to-r from-red-50/50 to-transparent">
          <CardTitle className="flex items-center gap-3 text-lg text-slate-900 font-semibold">
            <div className="p-2 bg-red-100 rounded-lg">
              <Package className="w-5 h-5 text-red-600" />
            </div>
            Create New Service
          </CardTitle>
          <p className="text-sm text-slate-600 mt-2">Select a customer, vehicle, and services to create a new job</p>
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
                      {(Array.isArray(customers) ? customers : []).length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground text-center">No customers found</div>
                      ) : (
                        (Array.isArray(customers) ? customers : []).map((customer: any) => (
                          <SelectItem key={customer._id} value={customer._id}>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              {customer.name} - {customer.phone}
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Select Vehicle *</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAddVehicle(!showAddVehicle)}
                      data-testid="button-toggle-add-vehicle"
                    >
                      Add New Vehicle
                    </Button>
                  </div>
                  <Select value={selectedVehicleIndex} onValueChange={setSelectedVehicleIndex} disabled={!selectedCustomerId}>
                    <SelectTrigger data-testid="select-vehicle">
                      {selectedVehicleIndex !== '' && selectedCustomer?.vehicles ? (
                        <div className="flex items-center gap-2">
                          <Car className="w-4 h-4" />
                          {selectedCustomer.vehicles[parseInt(selectedVehicleIndex)]?.make} {selectedCustomer.vehicles[parseInt(selectedVehicleIndex)]?.model} - {selectedCustomer.vehicles[parseInt(selectedVehicleIndex)]?.plateNumber}
                        </div>
                      ) : (
                        <span>Choose a vehicle</span>
                      )}
                    </SelectTrigger>
                    <SelectContent>
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
                      <SelectValue placeholder="Choose a technician" />
                    </SelectTrigger>
                    <SelectContent>
                      {technicians.map((t: any) => (
                        <SelectItem key={t._id} value={t._id}>
                          {t.name} - {t.specialty}
                        </SelectItem>
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
                  {showPpfSection && (
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <Label className="text-sm">PPF Category</Label>
                        <Select value={ppfCategory} onValueChange={(val) => {
                          setPpfCategory(val);
                          setPpfWarranty('');
                          setPpfWarrantyFromPreferences(false);
                        }} disabled={isLoadingLastService}>
                          <SelectTrigger data-testid="select-ppf-category">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.keys(PPF_CATEGORIES).map((cat) => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">Vehicle Type</Label>
                        <Select value={ppfVehicleType} onValueChange={(val) => {
                          setPpfVehicleType(val);
                          setPpfWarranty('');
                          setPpfWarrantyFromPreferences(false);
                        }} disabled={isLoadingLastService}>
                          <SelectTrigger data-testid="select-ppf-vehicle-type">
                            <SelectValue placeholder="Select vehicle type" />
                          </SelectTrigger>
                          <SelectContent>
                            {VEHICLE_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">Warranty / Variant</Label>
                        <Select value={ppfWarranty} onValueChange={(val) => {
                          setPpfWarranty(val);
                          setPpfWarrantyFromPreferences(false);
                        }} disabled={!ppfCategory || !ppfVehicleType || isLoadingLastService}>
                          <SelectTrigger data-testid="select-ppf-warranty" className={ppfWarranty && ppfWarrantyFromPreferences ? 'border-red-500' : ''}>
                            <SelectValue placeholder="Select warranty" />
                          </SelectTrigger>
                          <SelectContent>
                            {getAvailableWarranties().map((warranty) => (
                              <SelectItem key={warranty} value={warranty}>{warranty}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {ppfPrice > 0 && (
                        <div className="space-y-3">
                          <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">PPF Service Price:</span>
                              <span className="text-lg font-bold text-primary">₹{ppfPrice.toLocaleString('en-IN')}</span>
                            </div>
                          </div>
                          <div className="w-full">
                            <Label className="text-xs">Discount</Label>
                            <Input
                              type="number"
                              min="0"
                              step="1"
                              value={ppfDiscount}
                              onChange={(e) => setPpfDiscount(e.target.value)}
                              placeholder=""
                              data-testid="input-ppf-discount-card"
                              className="mt-1 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&]:appearance-none"
                            />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>

                <Card className="border border-red-200">
                  <CardHeader className="py-3 cursor-pointer" onClick={() => setShowOtherServicesSection(!showOtherServicesSection)}>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Other Services</CardTitle>
                      {showOtherServicesSection ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </CardHeader>
                  {showOtherServicesSection && (
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <Label className="text-sm">Select Service</Label>
                        <Select value={otherServiceName} onValueChange={setOtherServiceName} disabled={isLoadingLastService}>
                          <SelectTrigger data-testid="select-other-service" className={otherServiceName && !isLoadingLastService ? 'border-red-500' : ''}>
                            <SelectValue placeholder="Choose a service" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.keys(OTHER_SERVICES).map((service) => (
                              <SelectItem key={service} value={service}>{service}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">Vehicle Type</Label>
                        <Select value={otherServiceVehicleType} onValueChange={setOtherServiceVehicleType} disabled={isLoadingLastService}>
                          <SelectTrigger data-testid="select-other-service-vehicle-type" className={otherServiceVehicleType && !isLoadingLastService ? 'border-red-500' : ''}>
                            <SelectValue placeholder="Select vehicle type" />
                          </SelectTrigger>
                          <SelectContent>
                            {VEHICLE_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddOtherService}
                        disabled={!otherServiceName || !otherServiceVehicleType}
                        className="w-full"
                        data-testid="button-add-other-service"
                      >
                        Add Service
                      </Button>

                      {selectedOtherServices.length > 0 && (
                        <div className="space-y-2 mt-3">
                          <Label className="text-sm">Selected Services</Label>
                          <div className="border rounded-lg divide-y">
                            {selectedOtherServices.map((service, index) => (
                              <div key={index} className="space-y-2 p-3">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium text-sm">{service.name}</p>
                                    <p className="text-xs text-muted-foreground">{service.vehicleType}</p>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemoveOtherService(index)}
                                    data-testid={`button-remove-other-service-${index}`}
                                  >
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                  </Button>
                                </div>
                                <div className="flex gap-3 items-end">
                                  <div className="flex-1">
                                    <Label className="text-xs">Price: ₹{service.price.toLocaleString('en-IN')}</Label>
                                  </div>
                                  <div className="w-32">
                                    <Label className="text-xs">Discount</Label>
                                    <Input
                                      type="number"
                                      min="0"
                                      step="1"
                                      value={service.discount || ''}
                                      onChange={(e) => {
                                        const newServices = [...selectedOtherServices];
                                        newServices[index].discount = parseFloat(e.target.value) || 0;
                                        setSelectedOtherServices(newServices);
                                      }}
                                      placeholder=""
                                      data-testid={`input-service-discount-${index}`}
                                      className="mt-1 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&]:appearance-none"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Service Notes</Label>
                  <Textarea
                    value={serviceNotes}
                    onChange={(e) => setServiceNotes(e.target.value)}
                    placeholder="Additional notes about the service..."
                    rows={3}
                    data-testid="input-service-notes"
                  />
                </div>

                <div className="space-y-3 border border-red-200 p-4 rounded-lg">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Package className="w-4 h-4 text-red-600" />
                    Add Items from Inventory
                  </h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[10px] text-slate-400 font-bold uppercase">Select Product</Label>
                        <Select value={selectedItemId} onValueChange={(val) => {
                          setSelectedItemId(val);
                          setSelectedRollId('');
                          setMetersUsed('1');
                        }}>
                          <SelectTrigger className="bg-white" data-testid="select-inventory-product">
                            <SelectValue placeholder="Choose product" />
                          </SelectTrigger>
                          <SelectContent>
                            {inventory.map((item: any) => (
                              <SelectItem key={item._id} value={item._id}>
                                {item.name} ({item.rolls?.filter((r: any) => r.remaining_meters > 0 || r.remaining_sqft > 0).length || 0} rolls)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedItemId && (Array.isArray(inventory) ? inventory : []).find((inv: any) => inv._id === selectedItemId)?.rolls?.length > 0 && (
                        <div className="space-y-1">
                          <Label className="text-[10px] text-slate-400 font-bold uppercase">Select Roll</Label>
                          <Select value={selectedRollId} onValueChange={setSelectedRollId}>
                            <SelectTrigger className="bg-white" data-testid="select-inventory-roll">
                              <SelectValue placeholder="Choose roll" />
                            </SelectTrigger>
                            <SelectContent>
                              {getAvailableRolls().map((roll: any) => (
                                <SelectItem key={roll._id} value={roll._id}>
                                  {roll.name} ({roll.remaining_sqft > 0 ? `${roll.remaining_sqft}sqft` : `${roll.remaining_meters}m`} left)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    {selectedItemId && (
                      <div className="space-y-1">
                        <Label className="text-[10px] text-slate-400 font-bold uppercase">
                          {selectedRollId ? 'Size to be Used (meters)' : 'Quantity'}
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            value={metersUsed}
                            onChange={(e) => setMetersUsed(e.target.value)}
                            min="0.1"
                            step="0.1"
                            className="bg-white"
                            data-testid="input-inventory-quantity"
                          />
                          <Button 
                            type="button" 
                            variant="secondary"
                            onClick={handleAddItem}
                            className="shrink-0"
                            disabled={!selectedItemId || (!!(Array.isArray(inventory) ? inventory : []).find((inv: any) => inv._id === selectedItemId)?.rolls?.length && !selectedRollId) || !metersUsed}
                            data-testid="button-add-inventory-item"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {selectedItems.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-[10px] text-slate-400 font-bold uppercase">Selected Materials</Label>
                    <div className="space-y-2">
                      {selectedItems.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100 group">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-700">{item.name}</span>
                            <span className="text-[10px] text-slate-400 font-semibold uppercase">
                              {item.unit === 'Square Feet' ? `${item.quantity} Sqft` : `${item.quantity} Meters`}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-slate-400 hover:text-red-500 transition-colors"
                            data-testid={`button-remove-item-${idx}`}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Labor Cost</Label>
                  <Input
                    type="number"
                    value={laborCost}
                    onChange={(e) => setLaborCost(e.target.value)}
                    placeholder="Enter labor cost (optional)"
                    min="0"
                    step="10"
                    data-testid="input-labor-cost"
                    className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&]:appearance-none"
                  />
                </div>

                <div className="border-2 border-gray-200 rounded-xl p-5 bg-gradient-to-br from-gray-50 via-gray-50 to-slate-50 space-y-4">
                  <h4 className="font-bold text-base text-slate-900 border-b pb-2">Cost Summary</h4>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>Service Cost (PPF + Others):</span>
                      <span className="font-medium">₹{totalServiceBaseCost.toLocaleString('en-IN')}</span>
                    </div>
                    
                    {totalDiscount > 0 && (
                      <div className="flex justify-between text-sm text-green-600 font-medium">
                        <span>Discount Given:</span>
                        <span>- ₹{totalDiscount.toLocaleString('en-IN')}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-sm text-slate-600">
                      <span>Labor Cost:</span>
                      <span className="font-medium">₹{parsedLaborCost.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="flex justify-between text-sm font-semibold text-slate-900 border-t pt-2 mt-2">
                      <span>Subtotal:</span>
                      <span>₹{subtotal.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="flex justify-between items-center text-sm py-1">
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          id="include-gst-summary" 
                          checked={includeGst}
                          onCheckedChange={(checked) => setIncludeGst(checked as boolean)}
                          className="h-4 w-4"
                        />
                        <Label htmlFor="include-gst-summary" className="text-slate-600 cursor-pointer">GST (18%)</Label>
                      </div>
                      <span className={includeGst ? "font-medium text-slate-900" : "text-slate-400 line-through"}>
                        ₹{gst.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between text-lg font-semibold border-t-2 border-dashed pt-4 mt-2 text-slate-900">
                    <span>Total Amount:</span>
                    <span>₹{totalCost.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white font-bold px-8 h-12 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 active:scale-[0.98]"
                    disabled={createJobMutation.isPending}
                    data-testid="button-create-service"
                  >
                    {createJobMutation.isPending ? 'Creating...' : 'Create Service'}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {showAddVehicle && (
        <Card className="bg-white border-2 border-red-200">
          <CardHeader>
            <CardTitle className="text-lg">Add New Vehicle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Make *</Label>
                <Input
                  value={newVehicleMake}
                  onChange={(e) => setNewVehicleMake(e.target.value)}
                  placeholder="e.g. Toyota"
                  data-testid="input-new-vehicle-make"
                />
              </div>
              <div className="space-y-2">
                <Label>Model *</Label>
                <Input
                  value={newVehicleModel}
                  onChange={(e) => setNewVehicleModel(e.target.value)}
                  placeholder="e.g. Camry"
                  data-testid="input-new-vehicle-model"
                />
              </div>
              <div className="space-y-2">
                <Label>Plate Number *</Label>
                <Input
                  value={newVehiclePlate}
                  onChange={(e) => setNewVehiclePlate(e.target.value)}
                  placeholder="e.g. ABC 123"
                  data-testid="input-new-vehicle-plate"
                />
              </div>
              <div className="space-y-2">
                <Label>Year</Label>
                <Input
                  type="number"
                  value={newVehicleYear}
                  onChange={(e) => setNewVehicleYear(e.target.value)}
                  placeholder="e.g. 2023"
                  data-testid="input-new-vehicle-year"
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <Input
                  value={newVehicleColor}
                  onChange={(e) => setNewVehicleColor(e.target.value)}
                  placeholder="e.g. White"
                  data-testid="input-new-vehicle-color"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddVehicle} disabled={addVehicleMutation.isPending} className="flex-1" data-testid="button-confirm-add-vehicle">
                {addVehicleMutation.isPending ? 'Adding...' : 'Add Vehicle'}
              </Button>
              <Button variant="outline" onClick={() => setShowAddVehicle(false)} className="flex-1" data-testid="button-cancel-add-vehicle">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
