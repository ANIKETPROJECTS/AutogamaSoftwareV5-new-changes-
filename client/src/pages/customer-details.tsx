import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, MapPin, Car, Mail, DollarSign, Wrench, ArrowLeft, Calendar, User, X } from "lucide-react";
import { Link, useRoute } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export default function CustomerDetails() {
  const [match, params] = useRoute("/customer-details/:id");
  const customerId = params?.id;
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageIndex, setImageIndex] = useState(0);

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: () => api.customers.list(),
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ["jobs"],
    queryFn: () => api.jobs.list(),
  });

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
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <Link href="/registered-customers">
          <Button variant="outline" size="sm" data-testid="button-back">
            Back
          </Button>
        </Link>
      </div>

      {/* Customer Info - Compact Layout */}
      <Card className="border border-amber-200 dark:border-amber-800" data-testid={`customer-details-${customerId}`}>
        <CardContent className="p-4 space-y-3">
          {/* Header */}
          <div>
            <h1 className="font-bold text-2xl">{customer.name}</h1>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-2 gap-3">
            {/* Left Column - Contact & Service */}
            <div className="space-y-3">
              {/* Contact Information */}
              <div>
                <p className="font-semibold text-sm mb-1">Contact</p>
                <div className="space-y-1 text-xs">
                  <p>{customer.phone}</p>
                  {customer.email && <p className="truncate">{customer.email}</p>}
                  {customer.address && <p className="line-clamp-2 text-xs">{customer.address}</p>}
                </div>
              </div>

              {/* Service Information */}
              {customer.service && (
                <div>
                  <p className="font-semibold text-sm mb-1">Service</p>
                  <div className="p-2 bg-gray-50 rounded border border-gray-200 text-xs space-y-1">
                    <p className="line-clamp-2">{customer.service}</p>
                    {customer.serviceCost && (
                      <div className="font-semibold">
                        ₹{customer.serviceCost.toLocaleString('en-IN')}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Vehicles & History */}
            <div className="space-y-3">
              {/* Vehicles */}
              {customer.vehicles && customer.vehicles.length > 0 && (
                <div>
                  <p className="font-semibold text-sm mb-1">Vehicles</p>
                  <div className="space-y-1">
                    {customer.vehicles.slice(0, 2).map((vehicle: any, i: number) => (
                      <div key={i} className="p-2 bg-gray-50 rounded border border-gray-200 text-xs">
                        <div className="font-medium">
                          <span className="truncate">{vehicle.make} {vehicle.model}</span>
                        </div>
                        {vehicle.plateNumber && (
                          <span className="text-xs bg-background px-1.5 py-0.5 rounded mt-1 inline-block">{vehicle.plateNumber}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Action Button */}
          <Link href={`/customer-service?customerId=${customer._id}`} className="block">
            <Button className="w-full bg-blue-500 hover:bg-blue-600 text-sm h-9" data-testid={`button-create-service-${customer._id}`}>
              Create Service
            </Button>
          </Link>
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
                className="border border-amber-200 dark:border-amber-800"
                data-testid={`card-history-detail-${job._id}`}
              >
                <CardContent className="p-4 space-y-3">
                  {/* Header - Service Title if available */}
                  {job.serviceName && (
                    <div className="text-sm font-bold text-primary">{job.serviceName}</div>
                  )}
                  
                  {/* Header - Vehicle Info */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h3 className="font-bold text-base">{job.vehicleName}</h3>
                      <p className="text-xs text-muted-foreground">{job.plateNumber}</p>
                    </div>
                    <span className="text-xs bg-accent px-2 py-1 rounded font-medium">{job.stage}</span>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground font-medium">Date</p>
                      <p className="mt-1">{new Date(job.createdAt).toLocaleDateString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground font-medium">Technician</p>
                      <p className="mt-1">{job.technicianName || 'Not assigned'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground font-medium">Amount</p>
                      <p className="font-bold text-primary mt-1">₹{job.totalAmount?.toLocaleString('en-IN') || '0'}</p>
                    </div>
                  </div>

                  {/* Service Items */}
                  {job.serviceItems && job.serviceItems.length > 0 && (
                    <div className="border-t pt-3">
                      <p className="font-semibold text-xs mb-2">Services</p>
                      <div className="space-y-1">
                        {job.serviceItems.map((item: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded border border-gray-200">
                            <span className="truncate">{item.description || item.name || 'Service'}</span>
                            {item.cost && <span className="font-medium whitespace-nowrap ml-2">₹{item.cost.toLocaleString('en-IN')}</span>}
                            {item.price && <span className="font-medium whitespace-nowrap ml-2">₹{item.price.toLocaleString('en-IN')}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Payment Status */}
                  <div className="border-t pt-3 flex items-center justify-between">
                    <div className="text-xs">
                      <p className="text-muted-foreground font-medium">Payment Status</p>
                      <p className="mt-1">{job.paymentStatus}</p>
                    </div>
                    {job.paidAmount > 0 && (
                      <div className="text-xs text-right">
                        <p className="text-muted-foreground font-medium">Paid</p>
                        <p className="mt-1 font-bold">₹{job.paidAmount.toLocaleString('en-IN')}</p>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {job.notes && (
                    <div className="border-t pt-3">
                      <p className="font-semibold text-xs mb-1">Notes</p>
                      <p className="text-xs text-muted-foreground">{job.notes}</p>
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
