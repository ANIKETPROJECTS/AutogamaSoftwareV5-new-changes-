import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { User, Car, Check, ChevronRight, ChevronLeft } from "lucide-react";
import { useLocation } from "wouter";

const REFERRAL_SOURCES = [
  "Google Search",
  "Social Media",
  "Friend/Family",
  "Advertisement",
  "Walk-in",
  "Other",
];

const CUSTOMER_STATUSES = [
  { value: "Inquired", label: "Inquired" },
  { value: "Working", label: "Working" },
  { value: "Waiting", label: "Waiting" },
  { value: "Completed", label: "Completed" },
];

const VEHICLE_TYPES = [
  "Sedan",
  "SUV",
  "Hatchback",
  "Luxury",
  "Sports",
  "Other",
];

export default function CustomerRegistration() {
  const [step, setStep] = useState(1);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Customer info
  const [customerData, setCustomerData] = useState({
    name: "",
    phone: "",
    alternatePhone: "",
    email: "",
    address: "",
    city: "",
    district: "",
    state: "Maharashtra",
    referralSource: "",
    status: "Inquired",
  });

  // Vehicle info
  const [vehicleData, setVehicleData] = useState({
    make: "",
    model: "",
    year: "",
    plateNumber: "",
    chassisNumber: "",
    color: "",
    vehicleType: "",
  });

  const createCustomerMutation = useMutation({
    mutationFn: api.customers.create,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast({ title: "Customer registered successfully!" });
      setLocation("/funnel");
    },
    onError: () => {
      toast({ title: "Failed to register customer", variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    createCustomerMutation.mutate({
      name: customerData.name,
      phone: customerData.phone,
      email: customerData.email || undefined,
      address: `${customerData.address}, ${customerData.city}, ${customerData.district}, ${customerData.state}`,
      status: customerData.status,
      vehicles: [
        {
          make: vehicleData.make,
          model: vehicleData.model,
          year: vehicleData.year,
          plateNumber: vehicleData.plateNumber,
          color: vehicleData.color,
          vin: vehicleData.chassisNumber,
        },
      ],
    });
  };

  const canProceedStep1 = customerData.name && customerData.phone;
  const canProceedStep2 =
    vehicleData.make && vehicleData.model && vehicleData.plateNumber;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1
            className="font-display text-3xl font-bold tracking-tight"
            data-testid="text-registration-title"
          >
            Customer Registration
          </h1>
          <p className="text-muted-foreground mt-2">
            Register your vehicle with us for exclusive services and offers
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-4">
            {/* Step 1 */}
            <div className="flex flex-col items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                  step >= 1
                    ? "bg-blue-500 border-blue-500 text-white"
                    : "border-muted-foreground text-muted-foreground"
                }`}
              >
                {step > 1 ? <Check className="w-5 h-5" /> : "1"}
              </div>
              <span
                className={`text-sm mt-2 ${step >= 1 ? "text-blue-500 font-medium" : "text-muted-foreground"}`}
              >
                Customer Info
              </span>
            </div>

            {/* Line */}
            <div
              className={`w-32 h-1 rounded ${step > 1 ? "bg-blue-500" : "bg-muted"}`}
            />

            {/* Step 2 */}
            <div className="flex flex-col items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                  step >= 2
                    ? "bg-blue-500 border-blue-500 text-white"
                    : "border-muted-foreground text-muted-foreground"
                }`}
              >
                {step > 2 ? <Check className="w-5 h-5" /> : "2"}
              </div>
              <span
                className={`text-sm mt-2 ${step >= 2 ? "text-blue-500 font-medium" : "text-muted-foreground"}`}
              >
                Vehicle Details
              </span>
            </div>
          </div>
        </div>

        {/* Step 1: Customer Information */}
        {step === 1 && (
          <Card
            className="border-orange-200 dark:border-orange-800"
            data-testid="card-customer-info"
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-500" />
                Customer Information
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Please provide your personal details
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name *</Label>
                  <Input
                    value={customerData.name}
                    onChange={(e) =>
                      setCustomerData({ ...customerData, name: e.target.value })
                    }
                    placeholder="Enter your full name"
                    data-testid="input-full-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Mobile Number *</Label>
                  <Input
                    value={customerData.phone}
                    onChange={(e) =>
                      setCustomerData({
                        ...customerData,
                        phone: e.target.value,
                      })
                    }
                    placeholder="10-digit mobile number"
                    data-testid="input-mobile"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Alternative Number (Optional)</Label>
                  <Input
                    value={customerData.alternatePhone}
                    onChange={(e) =>
                      setCustomerData({
                        ...customerData,
                        alternatePhone: e.target.value,
                      })
                    }
                    placeholder="10-digit mobile number (Optional)"
                    data-testid="input-alt-mobile"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    value={customerData.email}
                    onChange={(e) =>
                      setCustomerData({
                        ...customerData,
                        email: e.target.value,
                      })
                    }
                    placeholder="your@email.com (optional)"
                    data-testid="input-email"
                  />
                </div>

                <div className="space-y-2">
                  <Label>How did you hear about us?</Label>
                  <Select
                    value={customerData.referralSource}
                    onValueChange={(value) =>
                      setCustomerData({
                        ...customerData,
                        referralSource: value,
                      })
                    }
                  >
                    <SelectTrigger data-testid="select-referral">
                      <SelectValue placeholder="Select referral source" />
                    </SelectTrigger>
                    <SelectContent>
                      {REFERRAL_SOURCES.map((source) => (
                        <SelectItem key={source} value={source}>
                          {source}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Customer Status</Label>
                  <Select
                    value={customerData.status}
                    onValueChange={(value) =>
                      setCustomerData({
                        ...customerData,
                        status: value,
                      })
                    }
                  >
                    <SelectTrigger data-testid="select-status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {CUSTOMER_STATUSES.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label>Address</Label>
                  <Input
                    value={customerData.address}
                    onChange={(e) =>
                      setCustomerData({
                        ...customerData,
                        address: e.target.value,
                      })
                    }
                    placeholder="Street address"
                    data-testid="input-address"
                  />
                </div>

                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    value={customerData.city}
                    onChange={(e) =>
                      setCustomerData({ ...customerData, city: e.target.value })
                    }
                    placeholder="City"
                    data-testid="input-city"
                  />
                </div>

                <div className="space-y-2">
                  <Label>District</Label>
                  <Input
                    value={customerData.district}
                    onChange={(e) =>
                      setCustomerData({
                        ...customerData,
                        district: e.target.value,
                      })
                    }
                    placeholder="District"
                    data-testid="input-district"
                  />
                </div>

                <div className="space-y-2">
                  <Label>State</Label>
                  <Input
                    value={customerData.state}
                    onChange={(e) =>
                      setCustomerData({
                        ...customerData,
                        state: e.target.value,
                      })
                    }
                    placeholder="State"
                    data-testid="input-state"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={() => setStep(2)}
                  disabled={!canProceedStep1}
                  className="bg-blue-500 hover:bg-blue-600"
                  data-testid="button-next-step"
                >
                  Next Step
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Vehicle Details */}
        {step === 2 && (
          <Card
            className="border-orange-200 dark:border-orange-800"
            data-testid="card-vehicle-info"
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="w-5 h-5 text-blue-500" />
                Vehicle Details
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Please provide your vehicle information
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Vehicle Make *</Label>
                  <Input
                    value={vehicleData.make}
                    onChange={(e) =>
                      setVehicleData({ ...vehicleData, make: e.target.value })
                    }
                    placeholder="e.g., Toyota, BMW"
                    data-testid="input-vehicle-make"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Vehicle Model *</Label>
                  <Input
                    value={vehicleData.model}
                    onChange={(e) =>
                      setVehicleData({ ...vehicleData, model: e.target.value })
                    }
                    placeholder="e.g., Fortuner, 3 Series"
                    data-testid="input-vehicle-model"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Vehicle Type</Label>
                  <Select
                    value={vehicleData.vehicleType}
                    onValueChange={(value) =>
                      setVehicleData({ ...vehicleData, vehicleType: value })
                    }
                  >
                    <SelectTrigger data-testid="select-vehicle-type">
                      <SelectValue placeholder="Select vehicle type" />
                    </SelectTrigger>
                    <SelectContent>
                      {VEHICLE_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Year of Manufacture</Label>
                  <Input
                    value={vehicleData.year}
                    onChange={(e) =>
                      setVehicleData({ ...vehicleData, year: e.target.value })
                    }
                    placeholder="e.g., 2023"
                    data-testid="input-vehicle-year"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Vehicle Number *</Label>
                  <Input
                    value={vehicleData.plateNumber}
                    onChange={(e) =>
                      setVehicleData({
                        ...vehicleData,
                        plateNumber: e.target.value,
                      })
                    }
                    placeholder="e.g., MH02 AB 1234"
                    data-testid="input-plate-number"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Chassis Number</Label>
                  <Input
                    value={vehicleData.chassisNumber}
                    onChange={(e) =>
                      setVehicleData({
                        ...vehicleData,
                        chassisNumber: e.target.value,
                      })
                    }
                    placeholder="Vehicle chassis number"
                    data-testid="input-chassis"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Color</Label>
                  <Input
                    value={vehicleData.color}
                    onChange={(e) =>
                      setVehicleData({ ...vehicleData, color: e.target.value })
                    }
                    placeholder="e.g., White, Black"
                    data-testid="input-color"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  data-testid="button-prev-step"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={
                    !canProceedStep2 || createCustomerMutation.isPending
                  }
                  className="bg-green-500 hover:bg-green-600"
                  data-testid="button-submit-registration"
                >
                  {createCustomerMutation.isPending
                    ? "Registering..."
                    : "Complete Registration"}
                  <Check className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
