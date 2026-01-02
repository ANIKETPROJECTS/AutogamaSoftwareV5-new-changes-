import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ShoppingBag, Plus, Save } from 'lucide-react';
import { usePageContext } from '@/contexts/page-context';

export default function Accessories() {
  const [category, setCategory] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { setPageTitle } = usePageContext();

  useEffect(() => {
    setPageTitle("Accessories", "Manage and sell accessories");
  }, [setPageTitle]);

  const { data: inventory = [] } = useQuery({
    queryKey: ['inventory'],
    queryFn: api.inventory.list,
  });

  const categories = Array.from(new Set(
    inventory
      .filter((item: any) => item.category === 'Accessories')
      .map((item: any) => item.name)
  ));

  const sellMutation = useMutation({
    mutationFn: async (data: any) => {
      // First, check if the accessory exists in inventory
      let existingItem = inventory.find(
        (item: any) => item.category === 'Accessories' && item.name === data.category
      );

      if (!existingItem) {
        // Create it if it doesn't exist
        existingItem = await api.inventory.create({
          name: data.category,
          category: 'Accessories',
          quantity: 0,
          unit: 'Units',
          minStock: 5,
        });
      }

      // Record the sale (This is a simplified version, in a real app you'd have a sales table)
      // For now, we just create/ensure the inventory item exists as requested
      return existingItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast({ title: 'Accessory recorded in inventory' });
      setCategory('');
      setNewCategory('');
      setIsAddingNewCategory(false);
      setName('');
      setPrice('');
      setQuantity('');
    },
    onError: () => {
      toast({ title: 'Failed to process accessory', variant: 'destructive' });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCategory = isAddingNewCategory ? newCategory : category;
    
    if (!finalCategory || !name || !price || !quantity) {
      toast({ title: 'Please fill all fields', variant: 'destructive' });
      return;
    }

    sellMutation.mutate({
      category: finalCategory,
      name,
      price: parseFloat(price),
      quantity: parseInt(quantity)
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" />
            Sell Accessory
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Category</Label>
              {isAddingNewCategory ? (
                <div className="flex gap-2">
                  <Input 
                    placeholder="Enter new category name" 
                    value={newCategory} 
                    onChange={(e) => setNewCategory(e.target.value)}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsAddingNewCategory(false)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Select value={category} onValueChange={(value) => {
                  if (value === 'new') {
                    setIsAddingNewCategory(true);
                  } else {
                    setCategory(value);
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                    <SelectItem value="new" className="text-primary font-medium">
                      <Plus className="w-4 h-4 mr-2 inline" />
                      Add New Category
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label>Accessory Name</Label>
              <Input 
                placeholder="e.g., Microfiber Cloth" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price (₹)</Label>
                <Input 
                  type="number" 
                  placeholder="0.00" 
                  value={price} 
                  onChange={(e) => setPrice(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label>Quantity Sold</Label>
                <Input 
                  type="number" 
                  placeholder="1" 
                  value={quantity} 
                  onChange={(e) => setQuantity(e.target.value)} 
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={sellMutation.isPending}>
              <Save className="w-4 h-4 mr-2" />
              {sellMutation.isPending ? 'Processing...' : 'Record Sale & Create Inventory'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
