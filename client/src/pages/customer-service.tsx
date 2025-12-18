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
import { useToast } from '@/hooks/use-toast';
import { Plus, X, User, Car, Package, Trash2 } from 'lucide-react';

const SERVICE_STATUSES = ['Inquired', 'Working', 'Waiting', 'Completed'];

export default function CustomerService() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location] = useLocation();
  
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedVehicleIndex, setSelectedVehicleIndex] = useState<string>('');
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string>('');
  const [serviceNotes, setServiceNotes] = useState('');
  const [originalServiceCost, setOriginalServiceCost] = useState<string>('');
  const [discountPercentage, setDiscountPercentage] = useState<string>('0');
  const [laborCost, setLaborCost] = useState<string>('');
  const [selectedItems, setSelectedItems] = useState<{ inventoryId: string; quantity: number; name: string; unit: string }[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [itemQuantity, setItemQuantity] = useState<string>('1');

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

  const createJobMutation = useMutation({
    mutationFn: async (data: any) => {
      const job = await api.jobs.create(data);
      if (selectedItems.length > 0) {
        try {
          await api.jobs.addMaterials(job._id, selectedItems.map(item => ({
            inventoryId: item.inventoryId,
            quantity: item.quantity
          })));
          
          // Automatically reduce inventory for each item used
          for (const item of selectedItems) {
            try {
              await api.inventory.adjust(item.inventoryId, -item.quantity);
            } catch (error: any) {
              console.error(`Failed to reduce inventory for ${item.name}:`, error);
            }
          }
        } catch (error: any) {
          console.error('Failed to add materials:', error);
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
    setOriginalServiceCost('');
    setDiscountPercentage('0');
    setLaborCost('');
    setSelectedItems([]);
    setSelectedItemId('');
    setItemQuantity('1');
  };

  const selectedCustomer = customers.find((c: any) => c._id === selectedCustomerId);

  // Auto-fill vehicle and service cost when customer is selected
  useEffect(() => {
    if (selectedCustomer) {
      // Auto-fill vehicle if customer has vehicles
      if (selectedCustomer.vehicles && selectedCustomer.vehicles.length > 0) {
        setSelectedVehicleIndex('0');
      }
      // Auto-fill service cost
      if (selectedCustomer.serviceCost > 0) {
        setOriginalServiceCost(selectedCustomer.serviceCost.toString());
        setDiscountPercentage('0');
      }
    }
  }, [selectedCustomerId, selectedCustomer]);

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

    const original = parseFloat(originalServiceCost) || 0;
    const discountPct = parseFloat(discountPercentage) || 0;
    const parsedServiceCost = original * (1 - discountPct / 100);
    const parsedLaborCost = parseFloat(laborCost) || 0;
    
    if (parsedServiceCost <= 0 && parsedLaborCost <= 0) {
      toast({ title: 'Please enter a valid service or labor cost', variant: 'destructive' });
      return;
    }

    const customer = customers.find((c: any) => c._id === selectedCustomerId);
    if (!customer) return;

    const vehicleIdx = parseInt(selectedVehicleIndex, 10);
    const vehicle = customer.vehicles[vehicleIdx];
    if (!vehicle) return;

    const totalAmount = parsedServiceCost + parsedLaborCost;

    const selectedTechnician = technicians.find((t: any) => t._id === selectedTechnicianId);
    
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
      serviceCost: parsedServiceCost,
      laborCost: parsedLaborCost,
      serviceItems: [],
      materials: [],
      totalAmount: totalAmount,
      paidAmount: 0,
      paymentStatus: 'Pending'
    });
  };

  const original = parseFloat(originalServiceCost) || 0;
  const discountPct = parseFloat(discountPercentage) || 0;
  const discountedServiceCost = original * (1 - discountPct / 100);
  const parsedLaborCost = parseFloat(laborCost) || 0;
  const subtotal = discountedServiceCost + parsedLaborCost;
  const gst = subtotal * 0.18;
  const totalCost = subtotal + gst;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Customers Service</h1>
        <p className="text-muted-foreground mt-1">Create services for customers with inventory items</p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                              {customer.vehicles?.length > 0 && (
                                <span className="text-xs text-muted-foreground">
                                  ({customer.vehicles[0].make} {customer.vehicles[0].model})
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {selectedCustomer && (
                  <div className="space-y-2">
                    <Label>Select Vehicle *</Label>
                    <Select value={selectedVehicleIndex} onValueChange={setSelectedVehicleIndex}>
                      <SelectTrigger data-testid="select-vehicle">
                        {selectedVehicleIndex ? (
                          <SelectValue />
                        ) : (
                          <span className="text-muted-foreground">Choose a vehicle</span>
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

                <div className="space-y-2">
                  <Label>Original Service Cost *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={originalServiceCost}
                      onChange={(e) => setOriginalServiceCost(e.target.value)}
                      placeholder="Enter original service charge"
                      className="pl-7"
                      data-testid="input-original-service-cost"
                    />
                  </div>
                </div>

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
                  <Label>Labor Cost *</Label>
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
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Service Notes</Label>
                  <Textarea
                    value={serviceNotes}
                    onChange={(e) => setServiceNotes(e.target.value)}
                    placeholder="Describe the service to be performed..."
                    rows={3}
                    data-testid="input-service-notes"
                  />
                </div>
              </div>

              <div className="space-y-4">
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
                  <div className="flex justify-between text-sm">
                    <span>Original Service Cost:</span>
                    <span>₹{original.toLocaleString('en-IN')}</span>
                  </div>
                  {discountPct > 0 && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span>Discount ({discountPct}%):</span>
                        <span className="text-green-600">-₹{(original * discountPct / 100).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Discounted Price:</span>
                        <span>₹{discountedServiceCost.toLocaleString('en-IN')}</span>
                      </div>
                    </>
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
                disabled={createJobMutation.isPending || !selectedCustomerId || !selectedVehicleIndex}
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
