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
  const [discountPercentage, setDiscountPercentage] = useState<string>('0');
  const [laborCost, setLaborCost] = useState<string>('');
  const [selectedItems, setSelectedItems] = useState<{ inventoryId: string; quantity: number; name: string; unit: string }[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [itemQuantity, setItemQuantity] = useState<string>('1');

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

  const [selectedOtherServices, setSelectedOtherServices] = useState<SelectedService[]>([]);
  const [otherServiceName, setOtherServiceName] = useState('');
  const [otherServiceVehicleType, setOtherServiceVehicleType] = useState('');

  const [ppfMaterialCategory, setPpfMaterialCategory] = useState('');
  const [ppfMaterialMeters, setPpfMaterialMeters] = useState<string>('1');

  const [showPpfSection, setShowPpfSection] = useState(true);
  const [showOtherServicesSection, setShowOtherServicesSection] = useState(true);
  const [showPpfMaterialsSection, setShowPpfMaterialsSection] = useState(true);
  const [isLoadingLastService, setIsLoadingLastService] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const preSelectedCustomerId = urlParams.get('customerId');
    if (preSelectedCustomerId) {
      setSelectedCustomerId(preSelectedCustomerId);
    }
  }, [location]);

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.customers.list(),
  });

  const { data: inventory = [] } = useQuery({
    queryKey: ['inventory'],
    queryFn: api.inventory.list,
  });

  const { data: technicians = [] } = useQuery({
    queryKey: ['technicians'],
    queryFn: api.technicians.list,
  });

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
            await api.inventory.adjust(item.inventoryId, -item.quantity);
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
    setDiscountPercentage('0');
    setLaborCost('');
    setSelectedItems([]);
    setSelectedItemId('');
    setItemQuantity('1');
    setPpfCategory('');
    setPpfVehicleType('');
    setPpfWarranty('');
    setPpfPrice(0);
    setSelectedOtherServices([]);
    setOtherServiceName('');
    setOtherServiceVehicleType('');
    setPpfMaterialCategory('');
    setPpfMaterialMeters('1');
  };

  const selectedCustomer = customers.find((c: any) => c._id === selectedCustomerId);

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
          // Set PPF details
          const category = prefs.ppfCategory || '';
          const vehicleType = prefs.ppfVehicleType || '';
          const warranty = prefs.ppfWarranty || '';
          let price = prefs.ppfPrice || 0;
          
          // If price is 0 but we have category/vehicleType/warranty, calculate it
          if (price === 0 && category && vehicleType && warranty) {
            const categoryData = PPF_CATEGORIES[category];
            if (categoryData && categoryData[vehicleType] && categoryData[vehicleType][warranty]) {
              price = categoryData[vehicleType][warranty];
            }
          }
          
          setPpfCategory(category);
          setPpfVehicleType(vehicleType);
          setPpfWarranty(warranty);
          setPpfPrice(price);
          
          if (typeof prefs.laborCost === 'number' && prefs.laborCost > 0) {
            setLaborCost(prefs.laborCost.toString());
          }
          if (Array.isArray(prefs.otherServices) && prefs.otherServices.length > 0) {
            setSelectedOtherServices(prefs.otherServices);
            const firstService = prefs.otherServices[0];
            if (firstService.name) setOtherServiceName(firstService.name);
            if (firstService.vehicleType) setOtherServiceVehicleType(firstService.vehicleType);
          }
        }
      } catch (error) {
        // No preferences found
      } finally {
        setIsLoadingLastService(false);
      }
    };
    
    loadVehiclePreferences();
  }, [selectedCustomerId, selectedVehicleIndex]);

  useEffect(() => {
    // Only auto-calculate price when user manually changes warranty (not from preferences loading)
    // Skip if all required fields are empty (form was reset) or if price is already set from preferences
    if (!ppfCategory || !ppfVehicleType || !ppfWarranty) {
      if (!ppfWarranty) {
        setPpfPrice(0);
      }
      return;
    }
    
    // Only calculate if price is 0 (hasn't been set yet from preferences)
    if (ppfPrice === 0) {
      const categoryData = PPF_CATEGORIES[ppfCategory];
      if (categoryData && categoryData[ppfVehicleType] && categoryData[ppfVehicleType][ppfWarranty]) {
        const calculatedPrice = categoryData[ppfVehicleType][ppfWarranty];
        setPpfPrice(calculatedPrice);
      }
    }
  }, [ppfCategory, ppfVehicleType, ppfWarranty]);

  const handleAddVehicle = () => {
    if (!selectedCustomerId) {
      toast({ title: 'Please select a customer first', variant: 'destructive' });
      return;
    }
    if (!newVehicleMake || !newVehicleModel || !newVehiclePlate) {
      toast({ title: 'Please fill in make, model, and plate number', variant: 'destructive' });
      return;
    }
    
    // Copy preferences from existing vehicle (if available) to new vehicle
    const newVehicle: any = {
      make: newVehicleMake,
      model: newVehicleModel,
      plateNumber: newVehiclePlate,
      year: newVehicleYear ? parseInt(newVehicleYear, 10) : undefined,
      color: newVehicleColor || undefined,
    };
    
    // Inherit PPF and service preferences from customer's existing vehicle
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
      price
    }]);
    setOtherServiceName('');
    setOtherServiceVehicleType('');
  };

  const handleRemoveOtherService = (index: number) => {
    setSelectedOtherServices(selectedOtherServices.filter((_, i) => i !== index));
  };

  const handleAddPpfMaterial = () => {
    if (!ppfMaterialCategory) {
      toast({ title: 'Please select a PPF product', variant: 'destructive' });
      return;
    }
    
    const meters = parseInt(ppfMaterialMeters, 10);
    if (isNaN(meters) || meters <= 0) {
      toast({ title: 'Please enter valid meters (greater than 0)', variant: 'destructive' });
      return;
    }

    const ppfItem = inventory.find((inv: any) => inv.category === ppfMaterialCategory);
    if (!ppfItem) {
      toast({ title: 'PPF product not found in inventory', variant: 'destructive' });
      return;
    }

    if (meters > ppfItem.quantity) {
      toast({ title: `Only ${ppfItem.quantity} ${ppfItem.unit} available in stock`, variant: 'destructive' });
      return;
    }

    const existingIndex = selectedItems.findIndex(i => i.inventoryId === ppfItem._id);
    if (existingIndex >= 0) {
      const newItems = [...selectedItems];
      const newQty = newItems[existingIndex].quantity + meters;
      if (newQty > ppfItem.quantity) {
        toast({ title: `Total would exceed available stock (${ppfItem.quantity} ${ppfItem.unit})`, variant: 'destructive' });
        return;
      }
      newItems[existingIndex].quantity = newQty;
      setSelectedItems(newItems);
    } else {
      setSelectedItems([...selectedItems, {
        inventoryId: ppfItem._id,
        quantity: meters,
        name: ppfItem.name,
        unit: ppfItem.unit
      }]);
    }

    toast({ title: `Added ${meters}m of ${ppfItem.name}` });
    setPpfMaterialCategory('');
    setPpfMaterialMeters('1');
  };

  const handleAddItem = () => {
    if (!selectedItemId) {
      toast({ title: 'Please select an item', variant: 'destructive' });
      return;
    }
    
    const item = inventory.find((inv: any) => inv._id === selectedItemId);
    if (!item) return;

    const qty = parseInt(itemQuantity, 10);
    
    if (isNaN(qty) || qty <= 0) {
      toast({ title: 'Please enter a valid quantity greater than 0', variant: 'destructive' });
      return;
    }
    
    if (qty > item.quantity) {
      toast({ title: `Only ${item.quantity} ${item.unit} available in stock`, variant: 'destructive' });
      return;
    }

    const existingIndex = selectedItems.findIndex(i => i.inventoryId === selectedItemId);
    if (existingIndex >= 0) {
      const newItems = [...selectedItems];
      const newQty = newItems[existingIndex].quantity + qty;
      if (newQty > item.quantity) {
        toast({ title: `Total would exceed available stock (${item.quantity} ${item.unit})`, variant: 'destructive' });
        return;
      }
      newItems[existingIndex].quantity = newQty;
      setSelectedItems(newItems);
    } else {
      setSelectedItems([...selectedItems, {
        inventoryId: selectedItemId,
        quantity: qty,
        name: item.name,
        unit: item.unit
      }]);
    }

    setSelectedItemId('');
    setItemQuantity('1');
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

    const totalServiceCost = ppfPrice + selectedOtherServices.reduce((sum, s) => sum + s.price, 0);
    const discountPct = parseFloat(discountPercentage) || 0;
    const discountedServiceCost = totalServiceCost * (1 - discountPct / 100);
    const parsedLaborCost = parseFloat(laborCost) || 0;
    
    if (discountedServiceCost <= 0 && parsedLaborCost <= 0) {
      toast({ title: 'Please select at least one service or enter labor cost', variant: 'destructive' });
      return;
    }

    const customer = customers.find((c: any) => c._id === selectedCustomerId);
    if (!customer) return;

    const vehicleIdx = parseInt(selectedVehicleIndex, 10);
    const vehicle = customer.vehicles[vehicleIdx];
    if (!vehicle) return;

    const subtotal = discountedServiceCost + parsedLaborCost;
    const gstAmount = subtotal * 0.18;
    const totalAmount = subtotal + gstAmount;

    const selectedTechnician = technicians.find((t: any) => t._id === selectedTechnicianId);

    const serviceItemsList: { name: string; price: number; category?: string; vehicleType?: string; warranty?: string }[] = [];
    if (ppfPrice > 0) {
      serviceItemsList.push({
        name: `PPF ${ppfCategory} - ${ppfWarranty}`,
        price: ppfPrice,
        category: ppfCategory,
        vehicleType: ppfVehicleType,
        warranty: ppfWarranty
      });
    }
    selectedOtherServices.forEach(s => {
      serviceItemsList.push({
        name: s.name,
        price: s.price,
        vehicleType: s.vehicleType
      });
    });

    const materialsList = selectedItems.map(item => ({
      inventoryId: item.inventoryId,
      name: item.name,
      quantity: item.quantity,
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
      serviceCost: discountedServiceCost,
      laborCost: parsedLaborCost,
      serviceItems: serviceItemsList,
      materials: materialsList,
      totalAmount: totalAmount,
      paidAmount: 0,
      paymentStatus: 'Pending'
    });
  };

  const totalServiceCost = ppfPrice + selectedOtherServices.reduce((sum, s) => sum + s.price, 0);
  const discountPct = parseFloat(discountPercentage) || 0;
  const discountAmount = totalServiceCost * discountPct / 100;
  const discountedServiceCost = totalServiceCost - discountAmount;
  const parsedLaborCost = parseFloat(laborCost) || 0;
  const subtotal = discountedServiceCost + parsedLaborCost;
  const gst = subtotal * 0.18;
  const totalCost = subtotal + gst;

  const getAvailableWarranties = () => {
    if (!ppfCategory || !ppfVehicleType) return [];
    const categoryData = PPF_CATEGORIES[ppfCategory];
    if (!categoryData || !categoryData[ppfVehicleType]) return [];
    return Object.keys(categoryData[ppfVehicleType]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Customers Service</h1>
        <p className="text-muted-foreground mt-1">Create services for customers with full service selection</p>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create New Service
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Customer *</Label>
                  <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                    <SelectTrigger data-testid="select-customer">
                      <SelectValue placeholder="Choose a customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground text-center">No customers found</div>
                      ) : (
                        customers.map((customer: any) => (
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

                {selectedCustomer && (
                  <>
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
                          <Plus className="w-4 h-4 mr-1" />
                          Add New Vehicle
                        </Button>
                      </div>
                      <Select value={selectedVehicleIndex} onValueChange={setSelectedVehicleIndex}>
                        <SelectTrigger data-testid="select-vehicle">
                          {selectedVehicleIndex !== '' ? (
                            <div className="flex items-center gap-2">
                              <Car className="w-4 h-4" />
                              {selectedCustomer.vehicles[parseInt(selectedVehicleIndex)]?.make} {selectedCustomer.vehicles[parseInt(selectedVehicleIndex)]?.model} - {selectedCustomer.vehicles[parseInt(selectedVehicleIndex)]?.plateNumber}
                            </div>
                          ) : (
                            <span>Choose a vehicle</span>
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          {selectedCustomer.vehicles.map((vehicle: any, index: number) => (
                            <SelectItem key={index} value={index.toString()}>
                              <div className="flex items-center gap-2">
                                <Car className="w-4 h-4" />
                                {vehicle.make} {vehicle.model} - {vehicle.plateNumber}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {showAddVehicle && (
                      <Card className="border-dashed">
                        <CardContent className="pt-4 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">Make *</Label>
                              <Input
                                value={newVehicleMake}
                                onChange={(e) => setNewVehicleMake(e.target.value)}
                                placeholder="e.g., Toyota"
                                data-testid="input-new-vehicle-make"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Model *</Label>
                              <Input
                                value={newVehicleModel}
                                onChange={(e) => setNewVehicleModel(e.target.value)}
                                placeholder="e.g., Camry"
                                data-testid="input-new-vehicle-model"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">Plate Number *</Label>
                              <Input
                                value={newVehiclePlate}
                                onChange={(e) => setNewVehiclePlate(e.target.value)}
                                placeholder="e.g., MH12AB1234"
                                data-testid="input-new-vehicle-plate"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Year</Label>
                              <Input
                                type="number"
                                value={newVehicleYear}
                                onChange={(e) => setNewVehicleYear(e.target.value)}
                                placeholder="e.g., 2023"
                                data-testid="input-new-vehicle-year"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Color</Label>
                              <Input
                                value={newVehicleColor}
                                onChange={(e) => setNewVehicleColor(e.target.value)}
                                placeholder="e.g., White"
                                data-testid="input-new-vehicle-color"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setShowAddVehicle(false)}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              onClick={handleAddVehicle}
                              disabled={addVehicleMutation.isPending}
                              data-testid="button-save-new-vehicle"
                            >
                              {addVehicleMutation.isPending ? 'Adding...' : 'Add Vehicle'}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}

                <div className="space-y-2">
                  <Label>Assign Technician</Label>
                  <Select value={selectedTechnicianId} onValueChange={setSelectedTechnicianId}>
                    <SelectTrigger data-testid="select-technician">
                      <SelectValue placeholder="Select a technician (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {technicians.map((tech: any) => (
                        <SelectItem key={tech._id} value={tech._id}>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            {tech.name} - {tech.specialty}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Card className="border">
                  <CardHeader className="py-3 cursor-pointer" onClick={() => setShowPpfSection(!showPpfSection)}>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">PPF Service</CardTitle>
                      {showPpfSection ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </CardHeader>
                  {showPpfSection && (
                    <CardContent className="space-y-3">
                      {selectedVehicleIndex !== '' && ppfCategory && (
                        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded p-2 text-sm text-blue-700 dark:text-blue-300">
                          Auto-filled from previous service - feel free to edit
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label className="text-sm">PPF Category</Label>
                        <Select value={ppfCategory} onValueChange={(val) => {
                          setPpfCategory(val);
                          setPpfWarranty('');
                        }} disabled={isLoadingLastService}>
                          <SelectTrigger data-testid="select-ppf-category">
                            <SelectValue placeholder="Select PPF category" />
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
                        <Select value={ppfWarranty} onValueChange={setPpfWarranty} disabled={!ppfCategory || !ppfVehicleType || isLoadingLastService}>
                          <SelectTrigger data-testid="select-ppf-warranty">
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
                        <div className="bg-accent/30 p-3 rounded-md">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">PPF Service Price:</span>
                            <span className="text-lg font-bold text-primary">₹{ppfPrice.toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>

                <Card className="border">
                  <CardHeader className="py-3 cursor-pointer" onClick={() => setShowOtherServicesSection(!showOtherServicesSection)}>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Other Services</CardTitle>
                      {showOtherServicesSection ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </CardHeader>
                  {showOtherServicesSection && (
                    <CardContent className="space-y-3">
                      {selectedVehicleIndex !== '' && selectedOtherServices.length > 0 && (
                        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded p-2 text-sm text-blue-700 dark:text-blue-300">
                          Auto-filled from previous service - feel free to edit
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label className="text-sm">Select Service</Label>
                        <Select value={otherServiceName} onValueChange={setOtherServiceName} disabled={isLoadingLastService}>
                          <SelectTrigger data-testid="select-other-service">
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
                          <SelectTrigger data-testid="select-other-service-vehicle-type">
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
                        <Plus className="w-4 h-4 mr-2" />
                        Add Service
                      </Button>

                      {selectedOtherServices.length > 0 && (
                        <div className="space-y-2 mt-3">
                          <Label className="text-sm">Selected Services</Label>
                          <div className="border rounded-lg divide-y">
                            {selectedOtherServices.map((service, index) => (
                              <div key={index} className="flex items-center justify-between p-3">
                                <div>
                                  <p className="font-medium text-sm">{service.name}</p>
                                  <p className="text-xs text-muted-foreground">{service.vehicleType}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold">₹{service.price.toLocaleString('en-IN')}</span>
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
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Discount %</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={discountPercentage}
                    onChange={(e) => setDiscountPercentage(e.target.value)}
                    placeholder="Enter discount percentage"
                    data-testid="input-discount-percentage"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Labor Cost</Label>
                  {selectedVehicleIndex !== '' && laborCost && (
                    <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded p-2 text-xs text-blue-700 dark:text-blue-300">
                      Auto-filled from previous service - feel free to edit
                    </div>
                  )}
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={laborCost}
                      onChange={(e) => setLaborCost(e.target.value)}
                      placeholder="Enter labor charge"
                      className="pl-7"
                      data-testid="input-labor-cost"
                      disabled={isLoadingLastService}
                    />
                  </div>
                </div>

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

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    PPF Materials (with stock reduction)
                  </Label>
                  <div className="flex gap-2">
                    <Select value={ppfMaterialCategory} onValueChange={setPpfMaterialCategory}>
                      <SelectTrigger className="flex-1" data-testid="select-ppf-material">
                        <SelectValue placeholder="Select PPF product" />
                      </SelectTrigger>
                      <SelectContent>
                        {inventory.filter((item: any) => item.category && ['Elite', 'Garware Plus', 'Garware Premium', 'Garware Matt'].includes(item.category)).map((item: any) => (
                          <SelectItem key={item._id} value={item.category}>
                            {item.name} ({item.quantity} {item.unit} available)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min="1"
                      value={ppfMaterialMeters}
                      onChange={(e) => setPpfMaterialMeters(e.target.value)}
                      className="w-20"
                      placeholder="Meters"
                      data-testid="input-ppf-meters"
                    />
                    <Button type="button" onClick={handleAddPpfMaterial} variant="outline" data-testid="button-add-ppf-material">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Add Items from Inventory
                  </Label>
                  <div className="flex gap-2">
                    <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                      <SelectTrigger className="flex-1" data-testid="select-inventory-item">
                        <SelectValue placeholder="Select item" />
                      </SelectTrigger>
                      <SelectContent>
                        {inventory.filter((item: any) => item.quantity > 0).map((item: any) => (
                          <SelectItem key={item._id} value={item._id}>
                            {item.name} ({item.quantity} {item.unit} available)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min="1"
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(e.target.value)}
                      className="w-20"
                      placeholder="Qty"
                      data-testid="input-item-quantity"
                    />
                    <Button type="button" onClick={handleAddItem} variant="outline" data-testid="button-add-item">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {selectedItems.length > 0 && (
                  <div className="space-y-2">
                    <Label>Selected Items</Label>
                    <div className="border rounded-lg divide-y">
                      {selectedItems.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3">
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.quantity} {item.unit}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveItem(index)}
                            data-testid={`button-remove-item-${index}`}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border rounded-lg p-4 bg-accent/30 space-y-2">
                  <h4 className="font-semibold text-sm text-muted-foreground">Cost Summary</h4>
                  
                  {ppfPrice > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>PPF ({ppfCategory}):</span>
                      <span>₹{ppfPrice.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  
                  {selectedOtherServices.map((service, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{service.name}:</span>
                      <span>₹{service.price.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                  
                  {(ppfPrice > 0 || selectedOtherServices.length > 0) && (
                    <div className="flex justify-between text-sm font-medium border-t pt-2">
                      <span>Total Service Cost:</span>
                      <span>₹{totalServiceCost.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  
                  {discountPct > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Discount ({discountPct}%):</span>
                      <span className="text-green-600">-₹{discountAmount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-sm">
                    <span>Labor Cost:</span>
                    <span>₹{parsedLaborCost.toLocaleString('en-IN')}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Subtotal:</span>
                    <span>₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>GST (18%):</span>
                    <span>₹{gst.toLocaleString('en-IN')}</span>
                  </div>
                  
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total Amount:</span>
                      <span className="text-primary">₹{totalCost.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={resetForm}>
                <X className="w-4 h-4 mr-2" />
                Clear
              </Button>
              <Button
                type="submit"
                className="bg-primary"
                disabled={createJobMutation.isPending || !selectedCustomerId || !selectedVehicleIndex || (ppfPrice <= 0 && selectedOtherServices.length === 0 && !parsedLaborCost)}
                data-testid="button-create-service"
              >
                {createJobMutation.isPending ? 'Creating...' : 'Create Service'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
