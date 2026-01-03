import { useQuery } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, History } from 'lucide-react';
import { format } from 'date-fns';
import { usePageContext } from '@/contexts/page-context';
import { useEffect } from 'react';

export default function RollHistory() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { setPageTitle } = usePageContext();

  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: api.inventory.list,
  });

  const item = inventory.find((inv: any) => inv._id === id || inv.id === id);

  useEffect(() => {
    if (item) {
      setPageTitle(`Roll History - ${item.category}`, "Detailed transaction history for this category");
    } else {
      setPageTitle("Roll History", "Detailed transaction history");
    }
  }, [item, setPageTitle]);

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading history...</div>;
  }

  if (!item) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-muted-foreground">Category not found or no history available.</p>
        <Button onClick={() => setLocation('/inventory')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Inventory
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => setLocation('/inventory')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Inventory
        </Button>
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">Category: {item.category}</h2>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Roll Name</th>
                  <th className="px-4 py-3 text-right">Quantity</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {item.history && item.history.length > 0 ? (
                  item.history.slice().reverse().map((entry: any, idx: number) => (
                    <tr key={idx} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        {format(new Date(entry.timestamp || entry.date), 'dd/MM/yyyy, hh:mm:ss a')}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={entry.type === 'IN' || entry.type === 'STOCK IN' ? 'default' : 'destructive'} className="text-[10px] px-1 py-0 h-4">
                          {entry.type}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {entry.description || entry.rollName || '-'}
                      </td>
                      <td className={`px-4 py-3 text-right font-bold ${entry.type === 'IN' || entry.type === 'STOCK IN' ? 'text-green-600' : 'text-red-600'}`}>
                        {entry.type === 'IN' || entry.type === 'STOCK IN' ? '+' : ''}{entry.amount || entry.quantity}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                      No history found for this category.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
