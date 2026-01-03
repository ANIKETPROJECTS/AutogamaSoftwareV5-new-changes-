import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Package, AlertTriangle, Search, Plus, Trash2, ArrowLeft, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

const PPF_ITEMS = [
  { name: 'Elite', category: 'Elite' },
  { name: 'Garware Plus', category: 'Garware Plus' },
  { name: 'Garware Premium', category: 'Garware Premium' },
  { name: 'Garware Matt', category: 'Garware Matt' }
];

const MIN_STOCK = 5;
const DEFAULT_UNIT = 'Square Feet';

const CATEGORY_COLORS: Record<string, string> = {
  'Elite': 'bg-blue-500/20 text-blue-400',
  'Garware Plus': 'bg-purple-500/20 text-purple-400',
  'Garware Premium': 'bg-orange-500/20 text-orange-400',
  'Garware Matt': 'bg-green-500/20 text-green-400',
  'Accessories': 'bg-slate-500/20 text-slate-400'
};

function SearchableSelect({ 
  options, 
  value, 
  onValueChange, 
  placeholder, 
  emptyMessage = "No option found.",
  allowCustom = true,
  customLabel = "Add new",
  newPlaceholder = "Enter name"
}: { 
  options: string[], 
  value: string, 
  onValueChange: (val: string) => void, 
  placeholder: string,
  emptyMessage?: string,
  allowCustom?: boolean,
  customLabel?: string,
  newPlaceholder?: string
}) {
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [isAddingNew, setIsAddingNew] = useState(false)

  const filteredOptions = useMemo(() => {
    if (!inputValue) return options;
    return options.filter(opt => opt.toLowerCase().includes(inputValue.toLowerCase()));
  }, [options, inputValue]);

  if (isAddingNew) {
    return (
      <div className="flex gap-2">
        <Input
          className="flex-1"
          placeholder={newPlaceholder}
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          autoFocus
        />
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => {
            setIsAddingNew(false);
            onValueChange("");
          }}
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value ? value : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" onPointerDownOutside={(e) => e.preventDefault()}>
        <div className="flex flex-col">
          <div className="p-2 border-b">
            <div className="flex items-center bg-muted/50 rounded-md px-2 py-1">
              <Search className="w-4 h-4 text-muted-foreground mr-2" />
              <input
                className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground"
                placeholder={`Search ${placeholder.toLowerCase()}...`}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
            </div>
          </div>
          <div className="max-h-[300px] overflow-y-auto p-1">
            {filteredOptions.length === 0 && !inputValue && (
              <div className="p-2 text-sm text-center text-muted-foreground">{emptyMessage}</div>
            )}
            <div className="space-y-1">
              {filteredOptions.map((option) => (
                <div
                  key={option}
                  className={cn(
                    "flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
                  )}
                  onClick={() => {
                    onValueChange(option)
                    setOpen(false)
                    setInputValue("")
                  }}
                >
                  <Check
                    className={cn(
                      "h-4 w-4",
                      value === option ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option}
                </div>
              ))}
            </div>
            {allowCustom && (
              <div className="border-t mt-1 pt-1">
                <div
                  className="flex items-center gap-2 cursor-pointer py-1.5 px-2 text-sm text-[#E11D48] hover:bg-[#E11D48]/10 transition-colors rounded-sm font-medium"
                  onClick={() => {
                    setIsAddingNew(true);
                    onValueChange("");
                    setOpen(false);
                    setInputValue("");
                  }}
                >
                  {customLabel}
                </div>
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default function Inventory() {
  const [rollDialogOpen, setRollDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [adjustType] = useState<'in' | 'out'>('in');
  const [adjustAmount] = useState('1');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'quantity'>('name');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [accSortBy, setAccSortBy] = useState<'name' | 'quantity'>('name');
  const [accFilterCategory, setAccFilterCategory] = useState<string>('all');
  const [rollName, setRollName] = useState('');
  const [rollQuantity, setRollQuantity] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ppf' | 'accessories'>('ppf');
  const [accessoryDialogOpen, setAccessoryDialogOpen] = useState(false);
  const [editingAccessory, setEditingAccessory] = useState<any>(null);
  const [accName, setAccName] = useState('');
  const [accQuantity, setAccQuantity] = useState('');
  const [accUnit, setAccUnit] = useState('');
  const [accCategory, setAccCategory] = useState('');
  const [accPrice, setAccPrice] = useState('');

  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<any>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: api.inventory.list,
  });

  const isLowStock = (item: any) => (item.rolls?.filter((r: any) => r.status !== 'Finished' && (r.remaining_sqft > 0.01 || r.remaining_meters > 0.01)).length || 0) <= 1;

  const filteredAndSortedItems = useMemo(() => {
    let items = PPF_ITEMS.map((ppfItem) => {
      const item = inventory.find((inv: any) => inv.category === ppfItem.category);
      if (item) return item;
      return { 
        name: ppfItem.name, 
        category: ppfItem.category, 
        quantity: 0, 
        unit: DEFAULT_UNIT, 
        minStock: MIN_STOCK, 
        _id: `temp-${ppfItem.category}`, // Ensure a temporary ID exists for interaction
        rolls: [],
        history: []
      };
    });

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter((item) => 
        item.category.toLowerCase().includes(query) || 
        item.name.toLowerCase().includes(query)
      );
    }

    if (filterCategory !== 'all') {
      items = items.filter((item) => item.category === filterCategory);
    }

    if (sortBy === 'quantity') {
      items.sort((a, b) => (b.rolls?.length || 0) - (a.rolls?.length || 0));
    } else {
      items.sort((a, b) => a.category.localeCompare(b.category));
    }

    return items;
  }, [inventory, searchQuery, filterCategory, sortBy]);

  const accessoryItems = useMemo(() => {
    let items = [];
    if (activeTab === 'accessories') {
      items = inventory.filter((inv: any) => !PPF_ITEMS.some(ppf => ppf.category === inv.category));
    } else {
      items = inventory.filter((inv: any) => inv.category === 'Accessories');
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter((item: any) => 
        item.category.toLowerCase().includes(query) || 
        item.name.toLowerCase().includes(query)
      );
    }

    if (accFilterCategory !== 'all') {
      items = items.filter((item: any) => item.category === accFilterCategory);
    }

    if (accSortBy === 'quantity') {
      items.sort((a: any, b: any) => b.quantity - a.quantity);
    } else {
      items.sort((a: any, b: any) => a.name.localeCompare(b.name));
    }

    return items;
  }, [inventory, activeTab, searchQuery, accFilterCategory, accSortBy]);

  const selectedItemForDetail = useMemo(() => {
    if (!selectedProductId) return null;
    return filteredAndSortedItems.find(item => item._id === selectedProductId);
  }, [selectedProductId, filteredAndSortedItems]);

  const lowStockItems = useMemo(() => filteredAndSortedItems.filter(isLowStock), [filteredAndSortedItems]);

  const categories = useMemo(() => {
    // Filter out PPF items from accessory categories
    const ppfCategories = new Set(PPF_ITEMS.map(item => item.category));
    const cats = new Set(inventory
      .filter((inv: any) => !ppfCategories.has(inv.category))
      .map((inv: any) => inv.category)
    );
    return Array.from(cats);
  }, [inventory]);

  const existingNames = useMemo(() => {
    // Filter by selected category if one is chosen
    const filtered = accCategory 
      ? inventory.filter((item: any) => item.category === accCategory)
      : inventory.filter((item: any) => !PPF_ITEMS.some(ppf => ppf.category === item.category));
    
    return Array.from(new Set(filtered.map((item: any) => item.name)));
  }, [inventory, accCategory]);

  const addRollMutation = useMutation({
    mutationFn: (data: { id: string; roll: any }) => api.inventory.addRoll(data.id, data.roll),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setRollDialogOpen(false);
      setRollName('');
      setRollQuantity('');
      toast({ title: 'Roll added successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to add roll', variant: 'destructive' });
    }
  });

  const deleteRollMutation = useMutation({
    mutationFn: ({ id, rollId }: { id: string; rollId: string }) => api.inventory.deleteRoll(id, rollId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast({ title: 'Roll deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to delete roll', variant: 'destructive' });
    }
  });

  const upsertAccessoryMutation = useMutation({
    mutationFn: (data: any) => {
      if (data._id) {
        return api.inventory.update(data._id, data);
      }
      return api.inventory.create({
        ...data,
        category: accCategory
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setAccessoryDialogOpen(false);
      setEditingAccessory(null);
      setAccName('');
      setAccQuantity('');
      setAccUnit('');
      setAccPrice('');
      toast({ title: editingAccessory ? 'Accessory updated' : 'Accessory added' });
    }
  });

  const deleteAccessoryMutation = useMutation({
    mutationFn: (id: string) => api.inventory.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast({ title: 'Accessory deleted' });
    }
  });

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          {selectedProductId && (
            <Button variant="ghost" size="icon" onClick={() => setSelectedProductId(null)} className="h-10 w-10">
              <ArrowLeft className="w-6 h-6" />
            </Button>
          )}
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Inventory</h1>
            <p className="text-muted-foreground mt-1">Manage stock for PPF and accessories</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            variant={activeTab === 'ppf' ? 'default' : 'outline'}
            onClick={() => {
              setActiveTab('ppf');
              setSelectedProductId(null);
            }}
            className="flex-1 sm:flex-none"
          >
            PPF Inventory
          </Button>
          <Button 
            variant={activeTab === 'accessories' ? 'default' : 'outline'}
            onClick={() => {
              setActiveTab('accessories');
              setSelectedProductId(null);
            }}
            className="flex-1 sm:flex-none"
          >
            Accessories
          </Button>
          {activeTab === 'accessories' && (
            <Button 
              onClick={() => {
                setEditingAccessory(null);
                setAccName('');
                setAccCategory('');
                setAccQuantity('');
                setAccUnit('');
                setAccPrice('');
                setAccessoryDialogOpen(true);
              }}
              className="ml-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Accessory
            </Button>
          )}
        </div>
        
        {!selectedProductId && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search by product name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {activeTab === 'ppf' ? (
              <>
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'name' | 'quantity')}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Sort by Name</SelectItem>
                    <SelectItem value="quantity">Sort by Quantity</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {PPF_ITEMS.map(i => <SelectItem key={i.category} value={i.category}>{i.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </>
            ) : (
              <>
                <Select value={accSortBy} onValueChange={(value) => setAccSortBy(value as 'name' | 'quantity')}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Sort by Name</SelectItem>
                    <SelectItem value="quantity">Sort by Quantity</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={accFilterCategory} onValueChange={setAccFilterCategory}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
        )}
      </div>

      {!selectedProductId && activeTab === 'ppf' && lowStockItems.length > 0 && (
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-gray-600" />
            <span className="text-gray-700 font-medium">{lowStockItems.length} product{lowStockItems.length !== 1 ? 's' : ''} with low stock (1 or fewer rolls)!</span>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        <div className={cn(
          "space-y-4 transition-all duration-300",
          selectedProductId ? "lg:col-span-4" : "lg:col-span-12"
        )}>
          {activeTab === 'ppf' ? (
            <div className={cn(
              "grid gap-4",
              selectedProductId ? "grid-cols-1" : "md:grid-cols-2 lg:grid-cols-4"
            )}>
              {isLoading ? (
                <div className="col-span-full text-center py-8 text-muted-foreground">Loading inventory...</div>
              ) : filteredAndSortedItems.length === 0 ? (
                <div className="col-span-full text-center py-8 text-muted-foreground">No products match your search or filters</div>
              ) : (
                filteredAndSortedItems
                  .filter(item => !selectedProductId || item._id === selectedProductId)
                  .map((displayItem) => {
                    const isSelected = selectedProductId === displayItem._id;
                    
                    return (
                      <Card 
                        key={displayItem.category}
                        className={cn(
                          "card-modern border cursor-pointer transition-all hover:ring-2 hover:ring-primary/20",
                          isLowStock(displayItem) ? "border-red-200" : "border-border",
                          isSelected && "ring-2 ring-primary border-primary bg-primary/5 shadow-md scale-[1.02]"
                        )}
                        onClick={() => setSelectedProductId(isSelected ? null : displayItem._id)}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-base">{displayItem.category}</CardTitle>
                              <Badge className={cn("mt-1", CATEGORY_COLORS[displayItem.category])}>
                                {displayItem.category}
                              </Badge>
                            </div>
                            {isSelected && <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-baseline justify-between">
                            <span className="text-3xl font-display font-bold">
                              {displayItem.rolls?.filter((r: any) => r.status !== 'Finished' && (r.remaining_sqft > 0.01 || r.remaining_meters > 0.01)).length || 0}
                            </span>
                            <span className="text-sm text-muted-foreground">rolls</span>
                          </div>
                          
                          {!isSelected && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log('[Inventory] Setting selectedItem for Add Roll:', displayItem);
                                setSelectedItem(displayItem);
                                setRollDialogOpen(true);
                              }}
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Add Roll
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {isLoading ? (
                <div className="col-span-full text-center py-8 text-muted-foreground">Loading inventory...</div>
              ) : accessoryItems.length === 0 ? (
                <div className="col-span-full text-center py-8 text-muted-foreground border rounded-lg bg-muted/20">
                  No accessories in inventory.
                </div>
              ) : (
                accessoryItems.map((item: any) => (
                  <Card 
                    key={item._id}
                    className="card-modern border transition-all hover:ring-2 hover:ring-primary/20 group h-full flex flex-col"
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl font-bold">{item.name}</CardTitle>
                          <Badge className="mt-1 bg-slate-500/20 text-slate-400">
                            {item.category}
                          </Badge>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                            if (confirm('Delete this accessory?')) {
                              deleteAccessoryMutation.mutate(item._id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-between pt-4 space-y-6">
                      <div className="flex items-end justify-between">
                        <div>
                          <span className="text-2xl font-display font-bold block">{item.quantity}</span>
                          <span className="text-xs font-medium text-muted-foreground block">Quantity</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block mb-0.5">Price</span>
                          <span className="text-lg font-display font-bold text-primary block">₹{item.price || 0}</span>
                        </div>
                      </div>
                      
                      <Button 
                        variant="outline" 
                        className="w-full mt-4 bg-muted/30 hover:bg-primary/10 hover:border-primary/50 transition-colors"
                        onClick={() => {
                          setEditingAccessory(item);
                          setAccName(item.name);
                          setAccCategory(item.category);
                          setAccQuantity(item.quantity.toString());
                          setAccUnit(item.unit);
                          setAccPrice(item.price?.toString() || '');
                          setAccessoryDialogOpen(true);
                        }}
                      >
                        <Package className="w-4 h-4 mr-2" />
                        Edit Accessory
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>

        {selectedProductId && selectedItemForDetail && (
          <div className="lg:col-span-8 animate-in slide-in-from-right-4 duration-300">
            <Card className="sticky top-4 border-primary/20 shadow-lg overflow-hidden">
              <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" />
                    {selectedItemForDetail.category}
                  </h2>
                  <p className="text-sm text-muted-foreground">Detailed Roll Inventory</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setSelectedHistoryItem(selectedItemForDetail);
                    setHistoryDialogOpen(true);
                  }}
                >
                  History
                </Button>
              </div>
              
              <CardContent className="p-0">
                {(!selectedItemForDetail.rolls || selectedItemForDetail.rolls.filter((r: any) => r.status !== 'Finished' && (r.remaining_sqft > 0.01 || r.remaining_meters > 0.01)).length === 0) ? (
                  <div className="p-12 text-center text-muted-foreground">
                    <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No active rolls found for this product.</p>
                    <Button variant="outline" className="mt-4" onClick={() => {
                      setSelectedItem(selectedItemForDetail);
                      setRollDialogOpen(true);
                    }}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Roll
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="p-4 space-y-3 max-h-[calc(100vh-250px)] overflow-y-auto">
                      {selectedItemForDetail.rolls
                        .filter((roll: any) => roll.status !== 'Finished' && (roll.remaining_sqft > 0.01 || roll.remaining_meters > 0.01))
                        .map((roll: any) => (
                        <div 
                          key={roll._id} 
                          className="group relative p-2 bg-card border rounded-lg hover:border-primary/40 transition-all shadow-sm"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-0.5">
                                <p className="font-bold text-sm truncate">{roll.name}</p>
                                <Badge 
                                  variant={roll.status === 'Finished' ? 'outline' : 'secondary'} 
                                  className={cn(
                                    "h-3.5 px-1.5 text-[9px]",
                                    roll.status !== 'Finished' && "bg-green-500/10 text-green-600 border-green-200"
                                  )}
                                >
                                  {roll.status === 'Finished' ? 'Finished' : 'Available'}
                                </Badge>
                              </div>
                              <div className="flex gap-4 text-[10px] text-muted-foreground">
                                <div className="flex items-baseline gap-1">
                                  <span className="font-semibold uppercase text-[8px] opacity-70">Stock:</span>
                                  <span className="font-bold text-foreground">{roll.squareFeet?.toFixed(1)}</span>
                                  <span>sqft</span>
                                </div>
                                <div className="flex items-baseline gap-1">
                                  <span className="font-semibold uppercase text-[8px] opacity-70">Left:</span>
                                  <span className={cn(
                                    "font-bold",
                                    (roll.remaining_sqft / roll.squareFeet) < 0.2 ? "text-destructive" : "text-primary"
                                  )}>{roll.remaining_sqft?.toFixed(1)}</span>
                                  <span>sqft</span>
                                </div>
                              </div>
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => deleteRollMutation.mutate({ id: selectedItemForDetail._id, rollId: roll._id })}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                          <div className="mt-1.5">
                            <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                              <div 
                                className={cn(
                                  "h-full transition-all duration-700",
                                  (roll.remaining_sqft / roll.squareFeet) < 0.2 ? "bg-destructive" : "bg-primary"
                                )}
                                style={{ width: `${Math.min(100, (roll.remaining_sqft / (roll.squareFeet || 1)) * 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 bg-muted/20 border-t">
                      <Button className="w-full" size="sm" onClick={() => {
                        setSelectedItem(selectedItemForDetail);
                        setRollDialogOpen(true);
                      }}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add New Roll
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <Dialog open={rollDialogOpen} onOpenChange={setRollDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add New Roll - {selectedItem?.category}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Roll Name/ID</Label>
              <Input 
                placeholder="e.g. Roll #123"
                value={rollName}
                onChange={(e) => setRollName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Total Square Feet</Label>
              <Input 
                type="number"
                placeholder="e.g. 250"
                value={rollQuantity}
                onChange={(e) => setRollQuantity(e.target.value)}
              />
            </div>
            <Button 
              className="w-full"
              disabled={!rollName || !rollQuantity || addRollMutation.isPending}
              onClick={() => {
                if (selectedItem?._id) {
                  addRollMutation.mutate({
                    id: selectedItem._id,
                    roll: {
                      name: rollName,
                      meters: 0,
                      squareFeet: parseFloat(rollQuantity),
                      unit: 'Square Feet'
                    }
                  });
                } else {
                  toast({ 
                    title: 'Error', 
                    description: 'No product selected. Please try clicking Add Roll again.',
                    variant: 'destructive' 
                  });
                }
              }}
            >
              {addRollMutation.isPending ? 'Adding...' : 'Add Roll'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={accessoryDialogOpen} onOpenChange={setAccessoryDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingAccessory ? 'Edit Accessory' : 'Add Accessory'}</DialogTitle>
            <div className="sr-only">
              <p>Form to {editingAccessory ? 'update' : 'create'} an accessory in the inventory.</p>
            </div>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Category / Type</Label>
              <SearchableSelect 
                options={categories}
                value={accCategory}
                onValueChange={setAccCategory}
                placeholder="Select category"
                customLabel="+ Add New Category"
                newPlaceholder="Enter new category name"
              />
            </div>
            <div className="space-y-2">
              <Label>Accessory Name</Label>
              <SearchableSelect 
                options={existingNames}
                value={accName}
                onValueChange={setAccName}
                placeholder="Select name"
                customLabel="+ Add New Accessory"
                newPlaceholder="Enter new accessory name"
              />
            </div>
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input 
                type="number"
                placeholder="0"
                value={accQuantity}
                onChange={(e) => setAccQuantity(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Price (₹)</Label>
              <Input 
                type="number"
                placeholder="0"
                value={accPrice}
                onChange={(e) => setAccPrice(e.target.value)}
              />
            </div>
            <Button 
              className="w-full"
              disabled={!accName || !accQuantity || upsertAccessoryMutation.isPending}
              onClick={() => {
                upsertAccessoryMutation.mutate({
                  _id: editingAccessory?._id,
                  name: accName,
                  quantity: parseInt(accQuantity),
                  unit: accUnit || 'Unit',
                  price: parseFloat(accPrice) || 0,
                  category: accCategory
                });
              }}
            >
              {upsertAccessoryMutation.isPending ? 'Saving...' : 'Save Accessory'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Stock History - {selectedHistoryItem?.category || selectedHistoryItem?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto mt-4">
            <table className="w-full text-sm">
              <thead className="bg-muted sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">Description</th>
                  <th className="px-4 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {selectedHistoryItem?.history?.length > 0 ? (
                  [...selectedHistoryItem.history].reverse().map((entry: any, i: number) => (
                    <tr key={i} className="hover:bg-accent/50 transition-colors">
                      <td className="px-4 py-2">{new Date(entry.date || entry.timestamp).toLocaleString()}</td>
                      <td className="px-4 py-2">
                        <Badge 
                          variant={entry.type === 'Stock In' || entry.type === 'in' ? 'default' : 'destructive'} 
                          className="text-[10px] uppercase font-bold"
                        >
                          {entry.type === 'in' ? 'Stock In' : entry.type === 'out' ? 'Stock Out' : entry.type}
                        </Badge>
                      </td>
                      <td className="px-4 py-2">{entry.description}</td>
                      <td className={cn(
                        "px-4 py-2 text-right font-bold",
                        entry.type === 'Stock In' || entry.type === 'in' ? "text-green-600" : "text-red-600"
                      )}>
                        {entry.type === 'Stock In' || entry.type === 'in' ? '+' : ''}{entry.amount}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground italic">No history available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}