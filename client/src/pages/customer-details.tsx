import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, MapPin, Car, Mail, DollarSign, Wrench, ArrowLeft, Calendar, User, X, Plus, Package, Users } from "lucide-react";
import { Link, useRoute } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export default function CustomerDetails() {
  const [match, params] = useRoute("/customer-details/:id");
  const customerId = params?.id;
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageIndex, setImageIndex] = useState(0);

  const { data: customersData } = useQuery({
    queryKey: ["customers"],
    queryFn: () => api.customers.list({ page: 1, limit: 1000 }),
  });

  const { data: jobsData } = useQuery({
    queryKey: ["jobs"],
    queryFn: () => api.jobs.list({ page: 1, limit: 1000 }),
  });

  const customers = customersData?.customers || [];
  const jobs = jobsData?.jobs || [];

  const customer = customers.find((c: any) => c._id === customerId);
  const jobHistory = jobs.filter((job: any) => job.customerId === customerId);

  if (!customer) {
    return (
      <div className="space-y-4">
        <Link href="/registered-customers">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Customers
          </Button>
        </Link>
        <div className="text-center py-12 text-muted-foreground">Customer not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/registered-customers">
          <Button variant="ghost" size="sm" className="hover:bg-slate-100" data-testid="button-back">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Customers
          </Button>
        </Link>
      </div>

      {/* Customer Info Card */}
      <Card className="border-none shadow-md overflow-hidden bg-white max-w-5xl mx-auto" data-testid={`customer-details-${customerId}`}>
        <div className="h-2 bg-gradient-to-r from-red-500 to-red-600" />
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center border-2 border-red-100 overflow-hidden">
                  {customer.vehicles?.[0]?.image ? (
                    <img src={customer.vehicles[0].image} alt="Vehicle" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-7 h-7 text-red-600" />
                  )}
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{customer.name}</h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] h-4">
                    Active Customer
                  </Badge>
                </div>
              </div>
            </div>
            
            <Link href={`/customer-service?customerId=${customer._id}`}>
              <Button className="bg-red-600 hover:bg-red-700 shadow-sm h-9" data-testid={`button-create-service-${customer._id}`}>
                <Plus className="w-4 h-4 mr-2" />
                Create New Service
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Contact Details */}
            <div className="space-y-3">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Phone className="w-3.5 h-3.5" />
                Contact Details
              </h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-1.5 bg-white rounded-md shadow-sm border border-slate-100">
                    <Phone className="w-3 h-3 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium uppercase mb-0.5">Phone</p>
                    <p className="text-sm font-semibold text-slate-900">{customer.phone}</p>
                  </div>
                </div>
                {customer.email && (
                  <div className="flex items-start gap-3 pt-3 border-t border-slate-200/60">
                    <div className="mt-0.5 p-1.5 bg-white rounded-md shadow-sm border border-slate-100">
                      <Mail className="w-3 h-3 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium uppercase mb-0.5">Email</p>
                      <p className="text-sm font-semibold text-slate-900 break-all">{customer.email}</p>
                    </div>
                  </div>
                )}
                {customer.address && (
                  <div className="flex items-start gap-3 pt-3 border-t border-slate-200/60">
                    <div className="mt-0.5 p-1.5 bg-white rounded-md shadow-sm border border-slate-100">
                      <MapPin className="w-3 h-3 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium uppercase mb-0.5">Address</p>
                      <p className="text-sm font-semibold text-slate-900 leading-snug">{customer.address}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Vehicle Fleet */}
            <div className="space-y-3">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Car className="w-3.5 h-3.5" />
                Vehicles
              </h3>
              <div className="space-y-2">
                {customer.vehicles && customer.vehicles.length > 0 ? (
                  customer.vehicles.map((vehicle: any, i: number) => (
                    <div key={i} className="group bg-slate-50 hover:bg-red-50/50 rounded-xl p-3 border border-slate-100 hover:border-red-200 transition-all">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="text-sm font-bold text-slate-900">{vehicle.make} {vehicle.model}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {vehicle.plateNumber && (
                                <Badge variant="secondary" className="bg-white text-[9px] h-4 py-0 px-1.5 font-mono border-slate-200 uppercase">
                                  {vehicle.plateNumber}
                                </Badge>
                              )}
                              {vehicle.year && <span className="text-[10px] text-slate-400 font-medium">{vehicle.year}</span>}
                            </div>
                            {vehicle.otherServices && vehicle.otherServices.length > 0 && (
                              <div className="mt-2 space-y-2">
                                {vehicle.otherServices.some((s: any) => s.vehicleType?.toLowerCase() !== "accessory") && (
                                  <div>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">Services</p>
                                    <div className="flex flex-wrap gap-1">
                                      {vehicle.otherServices
                                        .filter((s: any) => s.vehicleType?.toLowerCase() !== "accessory")
                                        .map((service: any, idx: number) => (
                                          <Badge key={idx} variant="outline" className="text-[9px] bg-blue-50 text-blue-700 border-blue-100 py-0 h-4">
                                            {service.name}
                                          </Badge>
                                        ))}
                                    </div>
                                  </div>
                                )}
                                {vehicle.otherServices.some((s: any) => s.vehicleType?.toLowerCase() === "accessory") && (
                                  <div>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">Accessories</p>
                                    <div className="flex flex-wrap gap-1">
                                      {vehicle.otherServices
                                        .filter((s: any) => s.vehicleType?.toLowerCase() === "accessory")
                                        .map((acc: any, idx: number) => (
                                          <Badge key={idx} variant="outline" className="text-[9px] bg-emerald-50 text-emerald-700 border-emerald-100 py-0 h-4">
                                            {acc.name}
                                          </Badge>
                                        ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-slate-50 rounded-xl p-6 border border-dashed border-slate-200 text-center">
                    <p className="text-xs text-slate-400">No vehicles registered</p>
                  </div>
                )}
              </div>
            </div>

            {/* Current Service Plan */}
            <div className="space-y-3">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Wrench className="w-3.5 h-3.5" />
                Service Interest
              </h3>
              {customer.service ? (
                <div className="bg-red-50/30 rounded-xl p-4 border border-red-100 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 p-1.5 bg-white rounded-md shadow-sm border border-slate-100">
                      <Package className="w-3 h-3 text-red-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium uppercase mb-0.5">Selected Services</p>
                            <p className="text-sm font-semibold text-slate-900 leading-snug">
                                {customer.service.split(' + ').filter((s: string) => {
                                  const vehicle = customer.vehicles?.[0];
                                  if (!vehicle?.otherServices) return true;
                                  // Normalize string for comparison by removing (x1) etc and extra spaces
                                  const normalizedS = s.replace(/\s*\(x\d+\)\s*/g, '').trim().toLowerCase();
                                  return !vehicle.otherServices.some((as: any) => 
                                    as.vehicleType === "Accessory" && 
                                    (normalizedS === as.name.replace(/\s*\(x\d+\)\s*/g, '').trim().toLowerCase())
                                  );
                                }).join(' + ')}
                              </p>
                    </div>
                  </div>

                  {customer.vehicles?.[0]?.otherServices?.some((s: any) => s.vehicleType === "Accessory") && (
                    <div className="flex items-start gap-3 pt-3 border-t border-red-200/60">
                      <div className="mt-0.5 p-1.5 bg-white rounded-md shadow-sm border border-slate-100">
                        <Package className="w-3 h-3 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-medium uppercase mb-0.5">Selected Accessories</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {customer.vehicles[0].otherServices
                            .filter((s: any) => s.vehicleType === "Accessory")
                            .map((acc: any, idx: number) => (
                              <Badge key={idx} variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-100">
                                {acc.name}
                              </Badge>
                            ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {customer.serviceCost && (
                    <div className="pt-3 border-t border-red-200/60 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Estimated Total</span>
                      <span className="text-lg font-bold text-red-700">₹{customer.serviceCost.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-slate-50 rounded-xl p-6 border border-dashed border-slate-200 text-center">
                  <p className="text-xs text-slate-400">No active service plan</p>
                </div>
              )}
            </div>

            {/* Referral Information */}
            {(customer.referrerName || customer.referrerPhone) && (
              <div className="space-y-3">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Users className="w-3.5 h-3.5" />
                  Referral Information
                </h3>
                <div className="bg-blue-50/30 rounded-xl p-4 border border-blue-100 space-y-3">
                  {customer.referrerName && (
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 p-1.5 bg-white rounded-md shadow-sm border border-slate-100">
                        <User className="w-3 h-3 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-medium uppercase mb-0.5">Referred By</p>
                        <p className="text-sm font-semibold text-slate-900">{customer.referrerName}</p>
                      </div>
                    </div>
                  )}
                  
                  {customer.referrerPhone && (
                    <div className="flex items-start gap-3 pt-3 border-t border-blue-200/60">
                      <div className="mt-0.5 p-1.5 bg-white rounded-md shadow-sm border border-slate-100">
                        <Phone className="w-3 h-3 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-medium uppercase mb-0.5">Referrer Phone</p>
                        <p className="text-sm font-semibold text-slate-900">{customer.referrerPhone}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* After Service Images */}
      {customer?.serviceImages && customer.serviceImages.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-lg">After Service Images ({customer.serviceImages.length})</h2>
          <div className="grid grid-cols-5 gap-3">
            {customer.serviceImages.map((img: string, idx: number) => (
              <button
                key={idx}
                onClick={() => {
                  setSelectedImage(img);
                  setImageIndex(idx);
                }}
                className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 hover:ring-2 hover:ring-blue-500 transition-all"
                data-testid={`image-thumbnail-${idx}`}
              >
                <img src={img} alt={`Service Image ${idx + 1}`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center">
                  <span className="text-white text-xs font-semibold opacity-0 hover:opacity-100">#{idx + 1}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Service History - Show all below */}
      {jobHistory.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-lg">Service History ({jobHistory.length})</h2>
          <div className="grid gap-3">
            {jobHistory.map((job: any) => (
              <Card
                key={job._id}
                className="border-none shadow-md overflow-hidden bg-white max-w-5xl mx-auto w-full"
                data-testid={`card-history-detail-${job._id}`}
              >
                <div className="h-1.5 bg-gradient-to-r from-red-500 to-red-600" />
                <CardContent className="p-4 space-y-3">
                  {/* Header - Service Title if available */}
                  <div className="flex items-center justify-between">
                    {job.serviceName && (
                      <div className="text-sm font-bold text-red-600">{job.serviceName}</div>
                    )}
                    <Badge variant="outline" className="bg-white text-black border-slate-200 text-[10px] font-semibold h-5 px-2">
                      {job.stage?.toUpperCase()}
                    </Badge>
                  </div>
                  
                  {/* Header - Vehicle Info */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h3 className="font-bold text-base text-slate-900">{job.vehicleName}</h3>
                      <p className="text-xs text-slate-400 font-mono uppercase">{job.plateNumber}</p>
                    </div>
                  </div>

                  {/* Amount and Paid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                    <div>
                      <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Date</p>
                      <p className="font-semibold text-slate-900 mt-1">{new Date(job.createdAt).toLocaleDateString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Technician</p>
                      <p className="font-semibold text-slate-900 mt-1">{job.technicianName || 'Not assigned'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Amount</p>
                      <p className="font-bold text-red-700 mt-1">₹{job.totalAmount?.toLocaleString('en-IN') || '0'}</p>
                    </div>
                  </div>

                  {/* Service Items */}
                  {job.serviceItems && job.serviceItems.length > 0 && (
                    <div className="border-t border-slate-100 pt-3">
                      <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-2">Services</p>
                      <div className="space-y-1">
                        {job.serviceItems.map((item: any, idx: number) => {
                          const itemTotal = (item.price || 0) - (item.discount || 0);
                          return (
                            <div key={idx} className="bg-slate-50 p-2 rounded-lg border border-slate-100 space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-medium text-slate-700 truncate">{item.description || item.name || 'Service'}</span>
                                <span className="font-bold text-slate-900 whitespace-nowrap ml-2">₹{item.price?.toLocaleString('en-IN') || '0'}</span>
                              </div>
                              {item.discount > 0 && (
                                <div className="flex items-center justify-between text-[10px] text-red-600 font-medium">
                                  <span>Discount Applied</span>
                                  <span>-₹{item.discount.toLocaleString('en-IN')}</span>
                                </div>
                              )}
                              {item.discount > 0 && (
                                <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-200/50 pt-1">
                                  <span>Item Total</span>
                                  <span className="font-bold">₹{itemTotal.toLocaleString('en-IN')}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Labor Cost */}
                  {job.laborCost > 0 && (
                    <div className="border-t border-slate-100 pt-2 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Labor Charges</span>
                      <span className="font-bold text-slate-900">₹{job.laborCost.toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  {/* Breakdown and GST */}
                  <div className="border-t border-slate-100 pt-3 space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      <span>Breakdown</span>
                      <Badge variant="outline" className={`h-4 text-[9px] px-1 ${customer?.requiresGST ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                        {customer?.requiresGST ? 'GST 18%' : 'NO GST'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Subtotal (after discounts)</span>
                      <span className="font-semibold text-slate-900">
                        ₹{((job.serviceItems?.reduce((sum: number, item: any) => sum + (item.price || 0) - (item.discount || 0), 0) || 0) + (job.laborCost || 0)).toLocaleString('en-IN')}
                      </span>
                    </div>

                    {customer?.requiresGST && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600">GST (18%)</span>
                        <span className="font-semibold text-slate-900">
                          ₹{(Math.round(((job.serviceItems?.reduce((sum: number, item: any) => sum + (item.price || 0) - (item.discount || 0), 0) || 0) + (job.laborCost || 0)) * 0.18)).toLocaleString('en-IN')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Payment Status and Paid Amount */}
                  <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Payment Status</p>
                      <p className="font-semibold text-slate-900 mt-1">{job.paymentStatus}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Paid</p>
                      <p className="font-bold text-slate-900 mt-1">₹{job.paidAmount?.toLocaleString('en-IN') || '0'}</p>
                    </div>
                  </div>

                  {/* Notes */}
                  {job.notes && (
                    <div className="border-t border-slate-100 pt-3">
                      <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1">Notes</p>
                      <p className="text-xs text-slate-600 leading-relaxed">{job.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Image Viewer Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl bg-black border-0">
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full p-1 z-10"
            data-testid="button-close-image-viewer"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="relative w-full aspect-video flex items-center justify-center">
            {selectedImage && (
              <img src={selectedImage} alt={`Service Image ${imageIndex + 1}`} className="max-h-96 max-w-full object-contain" />
            )}
          </div>

          <div className="flex items-center justify-between mt-4 text-white">
            <button
              onClick={() => {
                const newIdx = imageIndex === 0 ? customer.serviceImages.length - 1 : imageIndex - 1;
                setImageIndex(newIdx);
                setSelectedImage(customer.serviceImages[newIdx]);
              }}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded transition-colors"
              data-testid="button-prev-image"
            >
              Previous
            </button>
            <span className="text-sm">
              Image {imageIndex + 1} of {customer?.serviceImages?.length || 0}
            </span>
            <button
              onClick={() => {
                const newIdx = imageIndex === (customer?.serviceImages?.length || 1) - 1 ? 0 : imageIndex + 1;
                setImageIndex(newIdx);
                setSelectedImage(customer?.serviceImages?.[newIdx] || null);
              }}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded transition-colors"
              data-testid="button-next-image"
            >
              Next
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
