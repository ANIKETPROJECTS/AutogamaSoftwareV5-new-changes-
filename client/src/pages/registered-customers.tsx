import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, Search } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";

export default function RegisteredCustomers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterVehicles, setFilterVehicles] = useState("all");

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: () => api.customers.list(),
  });

  const filteredCustomers = customers.filter((customer: any) => {
    // Apply vehicle filter
    if (filterVehicles === "with-vehicles" && (!customer.vehicles || customer.vehicles.length === 0)) {
      return false;
    }
    if (filterVehicles === "without-vehicles" && customer.vehicles && customer.vehicles.length > 0) {
      return false;
    }

    // Apply search filter
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const nameMatch = customer.name?.toLowerCase().includes(query);
    const phoneMatch = customer.phone?.includes(query);
    const vehicleMatch = customer.vehicles?.some((v: any) => 
      v.make?.toLowerCase().includes(query) ||
      v.model?.toLowerCase().includes(query) ||
      v.plateNumber?.toLowerCase().includes(query)
    );
    return nameMatch || phoneMatch || vehicleMatch;
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Registered Customers</h1>
        <p className="text-muted-foreground mt-1 text-sm">View and manage all registered customers</p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
          <Input
            placeholder="Search by name, phone, or car..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-9"
            data-testid="input-search-customer"
          />
        </div>
        <Select value={filterVehicles} onValueChange={setFilterVehicles}>
          <SelectTrigger className="w-40" data-testid="select-filter-vehicles">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Customers</SelectItem>
            <SelectItem value="with-vehicles">With Vehicles</SelectItem>
            <SelectItem value="without-vehicles">Without Vehicles</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : filteredCustomers.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No customers found</div>
      ) : (
        <div className="space-y-2">
          {filteredCustomers.map((customer: any) => (
            <Link key={customer._id} href={`/customer-details/${customer._id}`}>
              <Card className="cursor-pointer hover-elevate border border-amber-200 dark:border-amber-800" data-testid={`customer-card-${customer._id}`}>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-base">{customer.name}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <Phone className="w-3.5 h-3.5" />
                    {customer.phone}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
