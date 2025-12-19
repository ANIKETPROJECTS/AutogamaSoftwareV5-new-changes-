import { useState } from 'react';
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
import { Package, AlertTriangle, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const PPF_ITEMS = [
  { name: 'Elite', category: 'Elite' },
  { name: 'Garware Plus', category: 'Garware Plus' },
  { name: 'Garware Premium', category: 'Garware Premium' },
  { name: 'Garware Matt', category: 'Garware Matt' }
];

const UNITS = ['sheets', 'meter'];
const MIN_STOCK = 5;
const DEFAULT_UNIT = 'meter';

const CATEGORY_COLORS: Record<string, string> = {
  'Elite': 'bg-blue-500/20 text-blue-400',
  'Garware Plus': 'bg-purple-500/20 text-purple-400',
  'Garware Premium': 'bg-orange-500/20 text-orange-400',
  'Garware Matt': 'bg-green-500/20 text-green-400'
};

export default function Inventory() {
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [adjustType, setAdjustType] = useState<'in' | 'out'>('in');
  const [adjustAmount, setAdjustAmount] = useState('1');
  const [adjustUnit, setAdjustUnit] = useState(DEFAULT_UNIT);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: api.inventory.list,
  });

  const adjustMutation = useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) => api.inventory.adjust(id, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setAdjustDialogOpen(false);
      setAdjustAmount('1');
      setAdjustUnit(DEFAULT_UNIT);
      toast({ title: `Stock adjusted successfully` });
    },
    onError: () => {
      toast({ title: 'Failed to adjust stock', variant: 'destructive' });
    }
  });

  const handleAdjust = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedItem) return;
    
    const amount = parseInt(adjustAmount, 10);
    if (amount <= 0) {
      toast({ title: 'Please enter a valid quantity', variant: 'destructive' });
      return;
    }
    
    // Update the item with the new unit before adjusting
    if (selectedItem._id && selectedItem.unit !== adjustUnit) {
      // Update unit on the server
      api.inventory.update(selectedItem._id, { unit: adjustUnit }).then(() => {
        adjustMutation.mutate({
          id: selectedItem._id,
          quantity: adjustType === 'in' ? amount : -amount
        });
      }).catch(() => {
        toast({ title: 'Failed to update unit', variant: 'destructive' });
      });
    } else {
      adjustMutation.mutate({
        id: selectedItem._id,
        quantity: adjustType === 'in' ? amount : -amount
      });
    }
  };

  const isLowStock = (item: any) => item.quantity <= MIN_STOCK;
  
  const lowStockItems = inventory.filter(isLowStock);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">PPF Inventory</h1>
          <p className="text-muted-foreground mt-1">Manage stock for PPF products</p>
        </div>
      </div>

      {lowStockItems.length > 0 && (
        <Card className="bg-red-500/5 border-red-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span className="text-red-400 font-medium">{lowStockItems.length} product{lowStockItems.length !== 1 ? 's' : ''} below minimum stock level of {MIN_STOCK}!</span>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">Loading inventory...</div>
        ) : (
          PPF_ITEMS.map((ppfItem) => {
            const item = inventory.find((inv: any) => inv.category === ppfItem.category);
            const displayItem = item || { name: ppfItem.name, category: ppfItem.category, quantity: 0, unit: DEFAULT_UNIT, minStock: MIN_STOCK, _id: null };
            
            // Use category as display name for known PPF products
            const displayName = ppfItem.category;
            
            return (
              <Card 
                key={displayItem.category} 
                className={cn(
                  "bg-card border-border",
                  item && isLowStock(item) && "border-red-500/30"
                )}
                data-testid={`inventory-card-${displayItem.category}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{displayName}</CardTitle>
                      <Badge className={cn("mt-1", CATEGORY_COLORS[displayItem.category])}>
                        {displayItem.category}
                      </Badge>
                    </div>
                    <div className="p-2 bg-accent rounded-lg">
                      <Package className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className={cn(
                      "text-3xl font-display font-bold",
                      item && isLowStock(item) && "text-red-400"
                    )}>
                      {displayItem.quantity}
                    </span>
                    <span className="text-sm text-muted-foreground">{displayItem.unit}</span>
                  </div>
                  
                  {item && isLowStock(item) && (
                    <p className="text-xs text-red-400 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Below minimum ({MIN_STOCK} {displayItem.unit})
                    </p>
                  )}

                  {!item && (
                    <p className="text-xs text-muted-foreground">
                      No stock data yet
                    </p>
                  )}

                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 min-w-24"
                      onClick={() => {
                        setSelectedItem(displayItem);
                        setAdjustType('in');
                        setAdjustAmount('1');
                        setAdjustUnit(displayItem.unit || DEFAULT_UNIT);
                        setAdjustDialogOpen(true);
                      }}
                      data-testid={`button-stock-in-${displayItem.category}`}
                    >
                      <ArrowUp className="w-3 h-3 mr-1 text-green-500" />
                      Stock In
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 min-w-24"
                      onClick={() => {
                        setSelectedItem(displayItem);
                        setAdjustType('out');
                        setAdjustAmount('1');
                        setAdjustUnit(displayItem.unit || DEFAULT_UNIT);
                        setAdjustDialogOpen(true);
                      }}
                      data-testid={`button-stock-out-${displayItem.category}`}
                      disabled={displayItem.quantity === 0}
                    >
                      <ArrowDown className="w-3 h-3 mr-1 text-red-500" />
                      Stock Out
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {adjustType === 'in' ? 'Stock In' : 'Stock Out'}: {selectedItem?.name}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdjust} className="space-y-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={adjustType === 'in' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1"
                  onClick={() => setAdjustType('in')}
                >
                  <ArrowUp className="w-3 h-3 mr-1" />
                  Stock In
                </Button>
                <Button
                  type="button"
                  variant={adjustType === 'out' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1"
                  onClick={() => setAdjustType('out')}
                >
                  <ArrowDown className="w-3 h-3 mr-1" />
                  Stock Out
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Unit</Label>
              <Select value={adjustUnit} onValueChange={setAdjustUnit}>
                <SelectTrigger data-testid="select-adjust-unit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((unit) => (
                    <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Quantity ({adjustUnit})</Label>
              <Input 
                type="number" 
                step="1" 
                min="1" 
                required 
                placeholder="0"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                data-testid="input-adjust-amount"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-primary"
              disabled={adjustMutation.isPending}
              data-testid="button-update-stock"
            >
              {adjustMutation.isPending ? 'Updating...' : 'Update Stock'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
