import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, Search, Mail, MapPin, Car, Users } from "lucide-react";
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
    <div className="space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-slate-200">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-600">Manage and view all your garage customers</p>
          </div>
          <div className="hidden md:flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl">
            <Users className="w-8 h-8 text-primary" />
          </div>
        </div>
      </div>

      {/* Search & Filter Section */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          
          <Input
            placeholder="Search by name, phone, or vehicle..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-11 bg-white border border-slate-200 rounded-lg focus:border-primary/50 shadow-sm"
            data-testid="input-search-customer"
          />
        </div>
        <Select value={filterVehicles} onValueChange={setFilterVehicles}>
          <SelectTrigger className="w-full md:w-48 h-11 bg-white border border-slate-200 shadow-sm" data-testid="select-filter-vehicles">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Customers</SelectItem>
            <SelectItem value="with-vehicles">With Vehicles</SelectItem>
            <SelectItem value="without-vehicles">Without Vehicles</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block">
            <div className="w-12 h-12 bg-slate-200 rounded-lg animate-pulse mb-4 mx-auto" />
            <p className="text-slate-600 font-medium">Loading customers...</p>
          </div>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="text-center py-12 bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-xl">
          <div className="w-16 h-16 bg-slate-200 rounded-lg mx-auto mb-4 flex items-center justify-center">
            <Users className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-900 font-semibold mb-1">No customers found</p>
          <p className="text-slate-600 text-sm">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredCustomers.map((customer: any) => (
            <Link key={customer._id} href={`/customer-details/${customer._id}`}>
              <Card className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 shadow-sm hover:shadow-lg hover:border-primary/50 transition-all duration-300 cursor-pointer group" data-testid={`customer-card-${customer._id}`}>
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-slate-900 group-hover:text-primary transition-colors">{customer.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5 font-mono">ID: {customer.customerId}</p>
                      <p className="text-sm text-slate-600 mt-1">{customer.phone}</p>
                    </div>
                    {customer.vehicles && customer.vehicles.length > 0 && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-lg flex-shrink-0">
                        <Car className="w-4 h-4 text-primary" />
                        <span className="text-sm font-semibold text-primary">{customer.vehicles.length}</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    {customer.email && (
                      <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                        <Mail className="w-4 h-4 text-slate-500 flex-shrink-0" />
                        <span className="truncate text-slate-700">{customer.email}</span>
                      </div>
                    )}
                    {customer.address && (
                      <div className="flex items-start gap-3 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                        <MapPin className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-2 text-slate-700">{customer.address}</span>
                      </div>
                    )}
                  </div>

                  {customer.vehicles && customer.vehicles.length > 0 && (
                    <div className="pt-2 border-t border-slate-200">
                      <div className="flex items-center gap-2 text-xs text-slate-600 mb-3 font-medium">
                        <Car className="w-4 h-4" />
                        Vehicles
                      </div>
                      <div className="space-y-3">
                        {customer.vehicles.slice(0, 2).map((vehicle: any, idx: number) => (
                          <div key={idx} className="space-y-2">
                            {vehicle.image && (
                              <div className="relative w-full h-32 bg-slate-200 rounded-lg overflow-hidden border border-slate-300">
                                <img 
                                  src={vehicle.image} 
                                  alt={`${vehicle.make} ${vehicle.model}`}
                                  className="w-full h-full object-cover"
                                  data-testid={`img-vehicle-${idx}`}
                                />
                              </div>
                            )}
                            <div className="px-2.5 py-1.5 bg-slate-100 rounded border border-slate-200 text-xs font-medium text-slate-900">
                              {vehicle.make} {vehicle.model} {vehicle.year ? `(${vehicle.year})` : ''} - {vehicle.plateNumber}
                            </div>
                          </div>
                        ))}
                        {customer.vehicles.length > 2 && (
                          <div className="px-2.5 py-1.5 bg-slate-100 rounded border border-slate-200 text-xs font-medium text-slate-600">
                            +{customer.vehicles.length - 2} more vehicle(s)
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
