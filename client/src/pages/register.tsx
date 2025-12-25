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

const PPF_CATEGORIES = {
  Elite: {
    "Small Cars": {
      "TPU 5 Years Gloss": 55000,
      "TPU 5 Years Matt": 60000,
      "TPU 7 Years Gloss": 80000,
      "TPU 10 Years Gloss": 95000,
    },
    "Hatchback / Small Sedan": {
      "TPU 5 Years Gloss": 60000,
      "TPU 5 Years Matt": 70000,
      "TPU 7 Years Gloss": 85000,
      "TPU 10 Years Gloss": 105000,
    },
    "Mid-size Sedan / Compact SUV / MUV": {
      "TPU 5 Years Gloss": 70000,
      "TPU 5 Years Matt": 75000,
      "TPU 7 Years Gloss": 90000,
      "TPU 10 Years Gloss": 112000,
    },
    "SUV / MPV": {
      "TPU 5 Years Gloss": 80000,
      "TPU 5 Years Matt": 85000,
      "TPU 7 Years Gloss": 95000,
      "TPU 10 Years Gloss": 120000,
    },
  },
  "Garware Plus": {
    "Small Cars": { "TPU 5 Years Gloss": 62000 },
    "Hatchback / Small Sedan": { "TPU 5 Years Gloss": 65000 },
    "Mid-size Sedan / Compact SUV / MUV": { "TPU 5 Years Gloss": 70000 },
    "SUV / MPV": { "TPU 5 Years Gloss": 85000 },
  },
  "Garware Premium": {
    "Small Cars": { "TPU 8 Years Gloss": 80000 },
    "Hatchback / Small Sedan": { "TPU 8 Years Gloss": 85000 },
    "Mid-size Sedan / Compact SUV / MUV": { "TPU 8 Years Gloss": 90000 },
    "SUV / MPV": { "TPU 8 Years Gloss": 95000 },
  },
  "Garware Matt": {
    "Small Cars": { "TPU 5 Years Matt": 105000 },
    "Hatchback / Small Sedan": { "TPU 5 Years Matt": 110000 },
    "Mid-size Sedan / Compact SUV / MUV": { "TPU 5 Years Matt": 115000 },
    "SUV / MPV": { "TPU 5 Years Matt": 120000 },
  },
};

const OTHER_SERVICES = {
  "Foam Washing": {
    "Small Cars": 400,
    "Hatchback / Small Sedan": 500,
    "Mid-size Sedan / Compact SUV / MUV": 600,
    "SUV / MPV": 700,
  },
  "Premium Washing": {
    "Small Cars": 600,
    "Hatchback / Small Sedan": 700,
    "Mid-size Sedan / Compact SUV / MUV": 800,
    "SUV / MPV": 900,
  },
  "Interior Cleaning": {
    "Small Cars": 2500,
    "Hatchback / Small Sedan": 3000,
    "Mid-size Sedan / Compact SUV / MUV": 3500,
    "SUV / MPV": 4500,
  },
  "Interior Steam Cleaning": {
    "Small Cars": 3500,
    "Hatchback / Small Sedan": 4000,
    "Mid-size Sedan / Compact SUV / MUV": 4500,
    "SUV / MPV": 5500,
  },
  "Leather Treatment": {
    "Small Cars": 5000,
    "Hatchback / Small Sedan": 5500,
    "Mid-size Sedan / Compact SUV / MUV": 6000,
    "SUV / MPV": 7000,
  },
  Detailing: {
    "Small Cars": 5000,
    "Hatchback / Small Sedan": 6500,
    "Mid-size Sedan / Compact SUV / MUV": 7000,
    "SUV / MPV": 9000,
  },
  "Paint Sealant Coating (Teflon)": {
    "Small Cars": 6500,
    "Hatchback / Small Sedan": 8500,
    "Mid-size Sedan / Compact SUV / MUV": 9500,
    "SUV / MPV": 11500,
  },
  "Ceramic Coating – 9H": {
    "Small Cars": 11000,
    "Hatchback / Small Sedan": 12500,
    "Mid-size Sedan / Compact SUV / MUV": 15000,
    "SUV / MPV": 18000,
  },
  "Ceramic Coating – MAFRA": {
    "Small Cars": 12500,
    "Hatchback / Small Sedan": 15000,
    "Mid-size Sedan / Compact SUV / MUV": 18000,
    "SUV / MPV": 21000,
  },
  "Ceramic Coating – MENZA PRO": {
    "Small Cars": 15000,
    "Hatchback / Small Sedan": 18000,
    "Mid-size Sedan / Compact SUV / MUV": 21000,
    "SUV / MPV": 24000,
  },
  "Ceramic Coating – KOCH CHEMIE": {
    "Small Cars": 18000,
    "Hatchback / Small Sedan": 22000,
    "Mid-size Sedan / Compact SUV / MUV": 25000,
    "SUV / MPV": 28000,
  },
  "Corrosion Treatment": {
    "Small Cars": 3500,
    "Hatchback / Small Sedan": 5000,
    "Mid-size Sedan / Compact SUV / MUV": 6000,
    "SUV / MPV": 7500,
  },
  "Windshield Coating": {
    "Small Cars": 2500,
    "Hatchback / Small Sedan": 3000,
    "Mid-size Sedan / Compact SUV / MUV": 3500,
    "SUV / MPV": 4000,
  },
  "Windshield Coating All Glasses": {
    "Small Cars": 5000,
    "Hatchback / Small Sedan": 5500,
    "Mid-size Sedan / Compact SUV / MUV": 6000,
    "SUV / MPV": 6500,
  },
  "Sun Control Film – Economy": {
    "Small Cars": 5200,
    "Hatchback / Small Sedan": 6000,
    "Mid-size Sedan / Compact SUV / MUV": 6500,
    "SUV / MPV": 8400,
  },
  "Sun Control Film – Standard": {
    "Small Cars": 7500,
    "Hatchback / Small Sedan": 8300,
    "Mid-size Sedan / Compact SUV / MUV": 9500,
    "SUV / MPV": 12500,
  },
  "Sun Control Film – Premium": {
    "Small Cars": 11500,
    "Hatchback / Small Sedan": 13000,
    "Mid-size Sedan / Compact SUV / MUV": 15000,
    "SUV / MPV": 18000,
  },
  "Sun Control Film – Ceramic": {
    "Small Cars": 13500,
    "Hatchback / Small Sedan": 15500,
    "Mid-size Sedan / Compact SUV / MUV": 18000,
    "SUV / MPV": 21000,
  },
};

const validatePhone = (phone: string): boolean => {
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');
  // Check if last 10 digits are present (handles +91, 0, spaces, dashes, etc.)
  return digitsOnly.length >= 10;
};

const validateEmail = (email: string): boolean => {
  if (!email) return true;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const VEHICLE_MAKES = [
  "Toyota", "Honda", "Maruti Suzuki", "Hyundai", "Tata", "Mahindra", "Kia", "MG", "Volkswagen", "Skoda", "BMW", "Mercedes-Benz", "Audi", "Land Rover", "Jaguar", "Volvo", "Porsche", "Lexus", "Jeep", "Other"
];

const VEHICLE_MODELS: Record<string, string[]> = {
  "Toyota": ["Fortuner", "Innova", "Innova Crysta", "Creta", "Fortuner GR-S", "Vios", "Yaris", "Glanza", "Urban Cruiser", "Rumion"],
  "Honda": ["City", "Accord", "Civic", "CR-V", "Jazz", "Amaze", "WR-V", "Elevate", "BR-V"],
  "Maruti Suzuki": ["Swift", "Alto", "WagonR", "Celerio", "Ertiga", "XL5", "Vitara Brezza", "S-Cross", "Jimny", "Baleno"],
  "Hyundai": ["Creta", "Tucson", "Kona", "Venue", "i20", "i10", "Grand i10 Nios", "Aura", "Alcazar", "Santa Fe"],
  "Tata": ["Nexon", "Harrier", "Safari", "Punch", "Altroz", "Tigor", "Tiago", "Hexa", "Nexon EV"],
  "Mahindra": ["XUV500", "XUV700", "Scorpio", "Bolero", "TUV300", "Xylo", "Quanto", "KUV100"],
  "Kia": ["Seltos", "Sonet", "Niro", "Carens", "EV6"],
  "MG": ["Hector", "Astor", "ZS EV", "Gloster", "Comet"],
  "Volkswagen": ["Polo", "Vento", "Tiguan", "Taigun", "Passat"],
  "Skoda": ["Slavia", "Superb", "Karoq", "Octavia"],
  "BMW": ["3 Series", "5 Series", "7 Series", "X1", "X3", "X5", "X7", "Z4"],
  "Mercedes-Benz": ["C-Class", "E-Class", "S-Class", "GLA", "GLC", "GLE", "GLS", "A-Class"],
  "Audi": ["A4", "A6", "A8", "Q3", "Q5", "Q7", "Q8"],
  "Land Rover": ["Range Rover", "Range Rover Evoque", "Discovery", "Defender"],
  "Jaguar": ["XE", "XF", "F-PACE", "E-PACE"],
  "Volvo": ["S60", "S90", "XC60", "XC90", "V90"],
  "Porsche": ["911", "Cayenne", "Panamera", "Macan"],
  "Lexus": ["LX", "RX", "NX", "ES", "CT"],
  "Jeep": ["Wrangler", "Compass", "Meridian", "Cherokee"],
  "Other": ["Other"]
};

const VEHICLE_COLORS = [
  "White", "Silver", "Grey", "Black", "Red", "Blue", "Brown", "Beige", "Golden", "Orange", "Yellow", "Green", "Maroon", "Purple", "Other"
];

export default function CustomerRegistration() {
  const [step, setStep] = useState(1);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [errors, setErrors] = useState<{ phone?: string; email?: string; referrerName?: string }>({});

  // Customer info
  const [customerData, setCustomerData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    district: "",
    state: "Maharashtra",
    referralSource: "",
    referrerName: "",
    status: "Inquired",
    ppfCategory: "",
    ppfVehicleType: "",
    ppfWarranty: "",
    ppfPrice: 0,
    selectedOtherServices: [] as Array<{ name: string; vehicleType: string; price: number }>,
    tempServiceName: "",
    tempServiceVehicleType: "",
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
    image: "" as string | undefined,
  });

  const [vehicleImagePreview, setVehicleImagePreview] = useState<string>("");

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

  const handleVehicleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setVehicleData({ ...vehicleData, image: base64String });
        setVehicleImagePreview(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    const selectedService = customerData.ppfCategory 
      ? `${customerData.ppfCategory} - ${customerData.ppfWarranty}`
      : '';
    
    // Calculate total service cost (PPF + All selected Other Services)
    let totalServiceCost = 0;
    if (customerData.ppfPrice > 0) {
      totalServiceCost += customerData.ppfPrice;
    }
    customerData.selectedOtherServices.forEach(service => {
      if (service.price > 0) {
        totalServiceCost += service.price;
      }
    });
    
    const otherServicesStr = customerData.selectedOtherServices.length > 0
      ? customerData.selectedOtherServices.map(s => s.name).join(', ')
      : '';
    
    const servicesList = [selectedService, otherServicesStr].filter(Boolean).join(' + ') || undefined;
    
    createCustomerMutation.mutate({
      name: customerData.name,
      phone: customerData.phone,
      email: customerData.email || undefined,
      address: `${customerData.address}, ${customerData.city}, ${customerData.district}, ${customerData.state}`,
      status: customerData.status,
      service: servicesList,
      serviceCost: totalServiceCost,
      referrerName: customerData.referrerName || undefined,
      vehicles: [
        {
          make: vehicleData.make,
          model: vehicleData.model,
          year: vehicleData.year,
          plateNumber: vehicleData.plateNumber,
          color: vehicleData.color,
          vin: vehicleData.chassisNumber,
          image: vehicleData.image,
          ppfCategory: customerData.ppfCategory,
          ppfVehicleType: customerData.ppfVehicleType,
          ppfWarranty: customerData.ppfWarranty,
          ppfPrice: customerData.ppfPrice,
          laborCost: 0,
          otherServices: customerData.selectedOtherServices,
        },
      ],
    });
  };

  const validateStep1 = () => {
    const newErrors: { phone?: string; email?: string; referrerName?: string } = {};
    
    if (!validatePhone(customerData.phone)) {
      newErrors.phone = "Please enter a valid 10-digit mobile number";
    }
    
    if (!validateEmail(customerData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (customerData.referralSource === "Other" && !customerData.referrerName) {
      newErrors.referrerName = "Please specify how you heard about us";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      // Pre-fill vehicle type from PPF selection in step 2
      if (customerData.ppfVehicleType) {
        setVehicleData({ ...vehicleData, vehicleType: customerData.ppfVehicleType });
      }
      setStep(2);
    }
  };

  const canProceedStep1 = customerData.name && customerData.phone && validatePhone(customerData.phone);
  const canProceedStep2 =
    vehicleData.make && vehicleData.model && vehicleData.plateNumber;

  return (
    <div className="p-4 pt-2">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Step 1: Customer Information */}
        {step === 1 && (
          <Card
            className="bg-gradient-to-br from-white to-slate-50 border-2 border-red-300 shadow-sm"
            data-testid="card-customer-info"
          >
            <CardHeader className="pb-6 border-b border-slate-200 bg-gradient-to-r from-primary/5 to-transparent">
              <CardTitle className="flex items-center gap-3 text-lg text-slate-900 font-semibold">
                <User className="w-5 h-5 text-primary" />
                Customer Information
              </CardTitle>
              <p className="text-sm text-slate-600 mt-2">Provide your personal details and service preferences</p>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <Label>Full Name *</Label>
                  <Input
                    value={customerData.name}
                    onChange={(e) =>
                      setCustomerData({ ...customerData, name: e.target.value })
                    }
                    placeholder="Enter your full name"
                    data-testid="input-full-name"
                    className="border-slate-300"
                  />
                </div>

                <div className="space-y-6">
                  <Label>Mobile Number *</Label>
                  <Input
                    value={customerData.phone}
                    onChange={(e) => {
                      setCustomerData({
                        ...customerData,
                        phone: e.target.value,
                      });
                      if (errors.phone) setErrors({ ...errors, phone: undefined });
                    }}
                    placeholder="10-digit mobile number"
                    data-testid="input-mobile"
                    className={errors.phone ? "border-red-500" : "border-slate-300"}
                  />
                  {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                </div>

                <div className="space-y-6">
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    value={customerData.email}
                    onChange={(e) => {
                      setCustomerData({
                        ...customerData,
                        email: e.target.value,
                      });
                      if (errors.email) setErrors({ ...errors, email: undefined });
                    }}
                    placeholder="your@email.com (optional)"
                    data-testid="input-email"
                    className={errors.email ? "border-red-500" : "border-slate-300"}
                  />
                  {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                </div>

                <div className="space-y-6">
                  <Label>How did you hear about us?</Label>
                  <Select
                    value={customerData.referralSource}
                    onValueChange={(value) =>
                      setCustomerData({
                        ...customerData,
                        referralSource: value,
                        referrerName: value === "Other" ? customerData.referrerName : "",
                      })
                    }
                  >
                    <SelectTrigger className="border-slate-300" data-testid="select-referral">
                      <SelectValue placeholder="Select referral source" />
                    </SelectTrigger>
                    <SelectContent position="popper" className="max-h-60 w-[var(--radix-select-trigger-width)]">
                      {REFERRAL_SOURCES.map((source) => (
                        <SelectItem key={source} value={source}>
                          {source}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {customerData.referralSource === "Other" && (
                  <div className="space-y-6">
                    <Label>Please specify how you heard about us *</Label>
                    <Input
                      value={customerData.referrerName}
                      onChange={(e) => {
                        setCustomerData({
                          ...customerData,
                          referrerName: e.target.value,
                        });
                        if (errors.referrerName) setErrors({ ...errors, referrerName: undefined });
                      }}
                      placeholder="Enter referrer's name"
                      data-testid="input-referrer-name"
                      className={errors.referrerName ? "border-red-500" : "border-slate-300"}
                    />
                    {errors.referrerName && <p className="text-sm text-red-500">{errors.referrerName}</p>}
                  </div>
                )}

                <div className="space-y-6">
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
                    <SelectTrigger className="border-slate-300" data-testid="select-status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent position="popper" className="max-h-60 w-[var(--radix-select-trigger-width)]">
                      {CUSTOMER_STATUSES.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* PPF & Services in 2 Columns */}
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* PPF Selection - Left Column */}
                  <div className="space-y-6">
                    <h3 className="font-medium text-sm">PPF Services</h3>
                    <div>
                      <Label>Category</Label>
                      <Select
                        value={customerData.ppfCategory}
                        onValueChange={(value) =>
                          setCustomerData({
                            ...customerData,
                            ppfCategory: value,
                            ppfVehicleType: "",
                            ppfWarranty: "",
                            ppfPrice: 0,
                          })
                        }
                      >
                        <SelectTrigger className="border-slate-300" data-testid="select-ppf-category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent position="popper" className="max-h-60 w-[var(--radix-select-trigger-width)]">
                          {Object.keys(PPF_CATEGORIES).map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {customerData.ppfCategory && (
                      <div>
                        <Label>Vehicle Type</Label>
                        <Select
                          value={customerData.ppfVehicleType}
                          onValueChange={(value) =>
                            setCustomerData({
                              ...customerData,
                              ppfVehicleType: value,
                              ppfWarranty: "",
                              ppfPrice: 0,
                            })
                          }
                        >
                          <SelectTrigger className="border-slate-300" data-testid="select-ppf-vehicle">
                            <SelectValue placeholder="Select vehicle type" />
                          </SelectTrigger>
                          <SelectContent position="popper" className="max-h-60 w-[var(--radix-select-trigger-width)]">
                            {Object.keys(PPF_CATEGORIES[customerData.ppfCategory as keyof typeof PPF_CATEGORIES]).map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {customerData.ppfVehicleType && (
                      <div>
                        <Label>Warranty & Price</Label>
                        <Select
                          value={customerData.ppfWarranty}
                          onValueChange={(value) => {
                            const categoryData = PPF_CATEGORIES[customerData.ppfCategory as keyof typeof PPF_CATEGORIES] as Record<string, Record<string, number>>;
                            const price = categoryData[customerData.ppfVehicleType][value] as number;
                            setCustomerData({
                              ...customerData,
                              ppfWarranty: value,
                              ppfPrice: price,
                            });
                          }}
                        >
                          <SelectTrigger className="border-slate-300" data-testid="select-ppf-warranty">
                            <SelectValue placeholder="Select warranty" />
                          </SelectTrigger>
                          <SelectContent position="popper" className="max-h-60 w-[var(--radix-select-trigger-width)]">
                            {Object.entries((PPF_CATEGORIES[customerData.ppfCategory as keyof typeof PPF_CATEGORIES] as Record<string, Record<string, number>>)[customerData.ppfVehicleType]).map(([warranty, price]) => (
                              <SelectItem key={warranty} value={warranty}>
                                {warranty} - ₹{(price as number).toLocaleString('en-IN')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  {/* Other Services Selection - Right Column */}
                  <div className="space-y-6">
                    <h3 className="font-medium text-sm">Other Services (Multiple)</h3>
                    <div>
                      <Label>Service</Label>
                      <Select value={customerData.tempServiceName} onValueChange={(value) => setCustomerData({...customerData, tempServiceName: value, tempServiceVehicleType: ""})}>
                        <SelectTrigger className="border-slate-300" data-testid="select-service-name">
                          <SelectValue placeholder="Select service" />
                        </SelectTrigger>
                        <SelectContent position="popper" className="max-h-60 w-[var(--radix-select-trigger-width)]">
                          {Object.keys(OTHER_SERVICES).map((service) => (
                            <SelectItem key={service} value={service}>
                              {service}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {customerData.tempServiceName && (
                      <div>
                        <Label>Vehicle Type</Label>
                        <Select value={customerData.tempServiceVehicleType} onValueChange={(value) => setCustomerData({...customerData, tempServiceVehicleType: value})}>
                          <SelectTrigger className="border-slate-300" data-testid="select-service-vehicle">
                            <SelectValue placeholder="Select vehicle type" />
                          </SelectTrigger>
                          <SelectContent position="popper" className="max-h-60 w-[var(--radix-select-trigger-width)]">
                            {Object.entries(OTHER_SERVICES[customerData.tempServiceName as keyof typeof OTHER_SERVICES]).map(([type, price]) => (
                              <SelectItem key={type} value={type}>
                                {type} - ₹{(price as number).toLocaleString('en-IN')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button type="button" size="sm" className="mt-2 w-full" onClick={() => {
                          if (customerData.tempServiceName && customerData.tempServiceVehicleType) {
                            const serviceData = OTHER_SERVICES[customerData.tempServiceName as keyof typeof OTHER_SERVICES] as Record<string, number>;
                            const price = serviceData[customerData.tempServiceVehicleType] as number;
                            setCustomerData({
                              ...customerData,
                              selectedOtherServices: [...customerData.selectedOtherServices, {name: customerData.tempServiceName, vehicleType: customerData.tempServiceVehicleType, price}],
                              tempServiceName: "",
                              tempServiceVehicleType: ""
                            });
                          }
                        }} data-testid="button-add-service">Add Service</Button>
                      </div>
                    )}

                    {customerData.selectedOtherServices.length > 0 && (
                      <div className="space-y-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <Label className="font-semibold text-slate-900">Selected Services</Label>
                        <div className="space-y-6">
                          {customerData.selectedOtherServices.map((svc, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
                              <span className="text-sm font-medium text-slate-900">{svc.name} - ₹{svc.price.toLocaleString('en-IN')}</span>
                              <button type="button" onClick={() => setCustomerData({...customerData, selectedOtherServices: customerData.selectedOtherServices.filter((_, i) => i !== idx)})} className="text-red-600 text-xs font-semibold hover:text-red-700" data-testid={`button-remove-service-${idx}`}>Remove</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2 space-y-6">
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
                    className="border border-input"
                  />
                </div>

                <div className="space-y-6">
                  <Label>City</Label>
                  <Input
                    value={customerData.city}
                    onChange={(e) =>
                      setCustomerData({ ...customerData, city: e.target.value })
                    }
                    placeholder="City"
                    data-testid="input-city"
                    className="border border-input"
                  />
                </div>

                <div className="space-y-6">
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
                    className="border border-input"
                  />
                </div>

                <div className="space-y-6">
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
                    className="border border-input"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t border-slate-200">
                <Button
                  onClick={handleNextStep}
                  disabled={!canProceedStep1}
                  className="bg-gradient-to-r from-primary to-primary/90 text-white hover:shadow-lg transition-all"
                  data-testid="button-next-step"
                >
                  Next Step
                   
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Vehicle Details */}
        {step === 2 && (
          <Card
            className="bg-gradient-to-br from-white to-slate-50 border-2 border-red-300 shadow-sm"
            data-testid="card-vehicle-info"
          >
            <CardHeader className="pb-6 border-b border-slate-200 bg-gradient-to-r from-primary/5 to-transparent">
              <CardTitle className="flex items-center gap-3 text-lg text-slate-900 font-semibold">
                <Car className="w-5 h-5 text-primary" />
                Vehicle Details
              </CardTitle>
              <p className="text-sm text-slate-600 mt-2">
                Please provide your vehicle information
              </p>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <Label>Vehicle Name *</Label>
                  <Select
                    value={vehicleData.make}
                    onValueChange={(value) =>
                      setVehicleData({ ...vehicleData, make: value, model: "" })
                    }
                  >
                    <SelectTrigger className="border-slate-300" data-testid="select-vehicle-make">
                      <SelectValue placeholder="Select vehicle make" />
                    </SelectTrigger>
                    <SelectContent position="popper" className="max-h-60 w-[var(--radix-select-trigger-width)]">
                      {VEHICLE_MAKES.map((make) => (
                        <SelectItem key={make} value={make}>
                          {make}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-6">
                  <Label>Vehicle Model *</Label>
                  <Select
                    value={vehicleData.model}
                    onValueChange={(value) =>
                      setVehicleData({ ...vehicleData, model: value })
                    }
                    disabled={!vehicleData.make}
                  >
                    <SelectTrigger className="border-slate-300" data-testid="select-vehicle-model">
                      <SelectValue placeholder={vehicleData.make ? "Select model" : "Select vehicle name first"} />
                    </SelectTrigger>
                    <SelectContent position="popper" className="max-h-60 w-[var(--radix-select-trigger-width)]">
                      {vehicleData.make && VEHICLE_MODELS[vehicleData.make as keyof typeof VEHICLE_MODELS]?.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-6">
                  <Label>Vehicle Type</Label>
                  <div className="px-4 py-3 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-900" data-testid="display-vehicle-type">
                    {vehicleData.vehicleType || 'Not selected'}
                  </div>
                </div>

                <div className="space-y-6">
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

                <div className="space-y-6">
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

                <div className="space-y-6">
                  <Label>Color</Label>
                  <Select
                    value={vehicleData.color}
                    onValueChange={(value) =>
                      setVehicleData({ ...vehicleData, color: value })
                    }
                  >
                    <SelectTrigger className="border-slate-300" data-testid="select-vehicle-color">
                      <SelectValue placeholder="Select color" />
                    </SelectTrigger>
                    <SelectContent position="popper" className="max-h-60 w-[var(--radix-select-trigger-width)]">
                      {VEHICLE_COLORS.map((color) => (
                        <SelectItem key={color} value={color}>
                          {color}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2 space-y-6">
                  <Label>Vehicle Image</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleVehicleImageChange}
                    placeholder="Upload vehicle photo"
                    data-testid="input-vehicle-image"
                  />
                  {vehicleImagePreview && (
                    <div className="mt-3 relative w-full h-48 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                      <img 
                        src={vehicleImagePreview} 
                        alt="Vehicle preview" 
                        className="w-full h-full object-cover"
                        data-testid="img-vehicle-preview"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between pt-6 border-t border-slate-200">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="border-slate-300 text-slate-700 hover:bg-slate-100"
                  data-testid="button-prev-step"
                >
                   
                  Previous
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={
                    !canProceedStep2 || createCustomerMutation.isPending
                  }
                  className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:shadow-lg transition-all"
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
