import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Eye, Edit, Clock, User, Car, Calendar, Phone, MapPin } from "lucide-react";
import { Link } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

const FUNNEL_STAGES = [
  { key: "Inquired", label: "Inquired", color: "blue" },
  { key: "Working", label: "Working", color: "orange" },
  { key: "Waiting", label: "Waiting", color: "yellow" },
  { key: "Completed", label: "Completed", color: "green" },
];

const PHASE_COLORS: Record<string, string> = {
  Inquired: "bg-blue-100 text-blue-700 border-blue-200",
  Working: "bg-orange-100 text-orange-700 border-orange-200",
  Waiting: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Completed: "bg-green-100 text-green-700 border-green-200",
};

export default function CustomerFunnel() {
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: () => api.customers.list(),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.customers.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast({ title: "Customer status updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update status", variant: "destructive" });
    },
  });

  const getCustomersByStatus = (status: string) => {
    return customers.filter((customer: any) => (customer.status || 'Inquired') === status);
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const customerDate = new Date(date);
    const diffDays = Math.floor(
      (now.getTime() - customerDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "1 day ago";
    return `${diffDays} days ago`;
  };

  const stageCounts = FUNNEL_STAGES.reduce(
    (acc, stage) => {
      acc[stage.key] = getCustomersByStatus(stage.key).length;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="font-display text-3xl font-bold tracking-tight"
          data-testid="text-funnel-title"
        >
          Customer Funnel
        </h1>
        <p className="text-muted-foreground mt-1">
          Track customer journey through different stages
        </p>
      </div>

      <Tabs defaultValue="Inquired" className="w-full">
        <TabsList className="w-full justify-start bg-muted/30 p-1 h-auto flex-wrap gap-1">
          {FUNNEL_STAGES.map((stage) => (
            <TabsTrigger
              key={stage.key}
              value={stage.key}
              className="data-[state=active]:bg-background"
              data-testid={`tab-${stage.key}`}
            >
              {stage.label} ({stageCounts[stage.key]})
            </TabsTrigger>
          ))}
        </TabsList>

        {FUNNEL_STAGES.map((stage, index) => (
          <TabsContent key={stage.key} value={stage.key} className="mt-6">
            <Card className="border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Badge className={`${PHASE_COLORS[stage.key]} text-xs`}>
                      PHASE {index + 1}
                    </Badge>
                    <CardTitle className="mt-2 flex items-center gap-2">
                      <span className="text-xl">{stage.label}</span>
                    </CardTitle>
                  </div>
                  <div className="text-2xl font-bold text-muted-foreground">
                    {stageCounts[stage.key]}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-muted-foreground text-center py-8">
                    Loading...
                  </p>
                ) : getCustomersByStatus(stage.key).length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No customers in this stage
                  </p>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {getCustomersByStatus(stage.key).map((customer: any) => (
                      <Card
                        key={customer._id}
                        className="bg-card border-border hover:shadow-md transition-shadow"
                        data-testid={`funnel-customer-${customer._id}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-semibold text-foreground">
                                {customer.name}
                              </h3>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {customer.phone}
                              </p>
                            </div>
                            <Badge className={`${PHASE_COLORS[stage.key]} text-xs`}>
                              <Clock className="w-3 h-3 mr-1" />
                              {stage.label}
                            </Badge>
                          </div>

                          <div className="space-y-2 text-sm text-muted-foreground">
                            {customer.address && (
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                <span className="truncate">{customer.address}</span>
                              </div>
                            )}
                            {customer.vehicles && customer.vehicles.length > 0 && (
                              <div className="flex items-center gap-2">
                                <Car className="w-4 h-4" />
                                <span>
                                  {customer.vehicles[0].make} {customer.vehicles[0].model} - {customer.vehicles[0].plateNumber}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>
                                {formatTimeAgo(customer.createdAt || new Date().toISOString())}
                              </span>
                            </div>
                          </div>

                          <div className="flex gap-2 mt-4">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => {
                                setSelectedCustomer(customer);
                                setDetailsOpen(true);
                              }}
                              data-testid={`button-view-${customer._id}`}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View Details
                            </Button>
                            <Link href={`/customers/${customer._id}`} className="flex-1">
                              <Button
                                size="sm"
                                className="w-full bg-blue-500 hover:bg-blue-600"
                                data-testid={`button-history-${customer._id}`}
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                History
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{selectedCustomer.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{selectedCustomer.phone}</p>
                </div>
                {selectedCustomer.email && (
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedCustomer.email}</p>
                  </div>
                )}
                {selectedCustomer.address && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="font-medium">{selectedCustomer.address}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Current Status</p>
                  <Badge className={`mt-1 ${PHASE_COLORS[selectedCustomer.status || 'Inquired']}`}>
                    {selectedCustomer.status || 'Inquired'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vehicles</p>
                  <p className="font-medium">{selectedCustomer.vehicles?.length || 0} vehicle(s)</p>
                </div>
              </div>

              {selectedCustomer.vehicles && selectedCustomer.vehicles.length > 0 && (
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground mb-2">Vehicles</p>
                  <div className="space-y-2">
                    {selectedCustomer.vehicles.map((vehicle: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 p-2 bg-accent/50 rounded-lg">
                        <Car className="w-4 h-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{vehicle.make} {vehicle.model}</p>
                          <p className="text-xs text-muted-foreground">{vehicle.plateNumber}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">{vehicle.color}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Change Status
                </p>
                <Select
                  value={selectedCustomer.status || 'Inquired'}
                  onValueChange={(value) => {
                    updateStatusMutation.mutate({
                      id: selectedCustomer._id,
                      status: value,
                    });
                    setSelectedCustomer({ ...selectedCustomer, status: value });
                  }}
                  disabled={updateStatusMutation.isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {FUNNEL_STAGES.map((stage) => (
                      <SelectItem key={stage.key} value={stage.key}>
                        {stage.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
