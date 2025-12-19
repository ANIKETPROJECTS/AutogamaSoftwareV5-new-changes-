import { useQuery, useMutation } from "@tanstack/react-query";
import { api, queryClient } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  IndianRupee,
  FileText,
  Download,
  Search,
  Eye,
  Printer,
  Car,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
} from "lucide-react";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Invoices() {
  const [search, setSearch] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => api.invoices.list(),
  });

  const markPaidMutation = useMutation({
    mutationFn: (invoiceId: string) => api.invoices.markPaid(invoiceId),
    onSuccess: (updatedInvoice: any) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      if (selectedInvoice && updatedInvoice) {
        setSelectedInvoice(updatedInvoice);
      }
      toast({ title: "Invoice marked as paid" });
    },
    onError: () => {
      toast({ title: "Failed to mark invoice as paid", variant: "destructive" });
    },
  });

  const filteredInvoices = invoices.filter(
    (invoice: any) =>
      invoice.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      invoice.plateNumber?.toLowerCase().includes(search.toLowerCase()) ||
      invoice.invoiceNumber?.toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenue = invoices
    .filter((inv: any) => inv.paymentStatus === "Paid")
    .reduce((sum: number, inv: any) => sum + (inv.totalAmount || 0), 0);
  
  const paidInvoices = invoices.filter((inv: any) => inv.paymentStatus === "Paid").length;
  const unpaidInvoices = invoices.filter((inv: any) => inv.paymentStatus !== "Paid").length;

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "Paid":
        return "bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400";
      case "Partially Paid":
        return "bg-yellow-100 dark:bg-yellow-950/50 text-yellow-700 dark:text-yellow-400";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const handlePrint = () => {
    if (printRef.current) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Invoice ${selectedInvoice?.invoiceNumber}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .company-name { font-size: 24px; font-weight: bold; }
                .invoice-info { display: flex; justify-content: space-between; margin-bottom: 20px; }
                .customer-info { margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                th { background-color: #f5f5f5; }
                .totals { text-align: right; }
                .total-row { font-weight: bold; font-size: 18px; }
                @media print { body { print-color-adjust: exact; } }
              </style>
            </head>
            <body>
              ${printRef.current.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const handleDownload = () => {
    if (!selectedInvoice) return;
    
    const invoiceText = `
Invoice: ${selectedInvoice.invoiceNumber}
Date: ${new Date(selectedInvoice.createdAt).toLocaleDateString('en-IN')}

Customer: ${selectedInvoice.customerName}
Phone: ${selectedInvoice.customerPhone}
Vehicle: ${selectedInvoice.vehicleName} - ${selectedInvoice.plateNumber}

Items:
${selectedInvoice.items.map((item: any) => 
  `${item.description} - Qty: ${item.quantity} x Rs.${item.unitPrice} = Rs.${item.total}`
).join('\n')}

Subtotal: Rs.${selectedInvoice.subtotal.toLocaleString('en-IN')}
Tax (${selectedInvoice.taxRate}%): Rs.${selectedInvoice.tax.toLocaleString('en-IN')}
Discount: Rs.${selectedInvoice.discount.toLocaleString('en-IN')}
Total: Rs.${selectedInvoice.totalAmount.toLocaleString('en-IN')}
Paid: Rs.${selectedInvoice.paidAmount.toLocaleString('en-IN')}
Balance: Rs.${(selectedInvoice.totalAmount - selectedInvoice.paidAmount).toLocaleString('en-IN')}
    `;
    
    const blob = new Blob([invoiceText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedInvoice.invoiceNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const isLoading = invoicesLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight" data-testid="text-invoices-title">
          Invoices & Tracking
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage invoices, track payments, and view billing records
        </p>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800" data-testid="card-total-revenue">
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">Total Revenue</p>
                <p className="text-3xl font-bold mt-1 text-green-900 dark:text-green-100 flex items-center">
                  <IndianRupee className="w-6 h-6" />
                  {totalRevenue.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-lg">
                <IndianRupee className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800" data-testid="card-paid-invoices">
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Paid Invoices</p>
                <p className="text-3xl font-bold mt-1 text-emerald-900 dark:text-emerald-100">
                  {paidInvoices}
                </p>
              </div>
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
                <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-50 border-gray-200" data-testid="card-unpaid-invoices">
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-gray-600 font-medium">Unpaid Invoices</p>
                <p className="text-3xl font-bold mt-1 text-gray-900">
                  {unpaidInvoices}
                </p>
              </div>
              <div className="p-3 bg-gray-200 rounded-lg">
                <FileText className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by customer name, vehicle number, or invoice number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
          data-testid="input-search-billing"
        />
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            Invoices
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-center py-8">Loading...</p>
          ) : filteredInvoices.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No invoices found
            </p>
          ) : (
            <div className="space-y-3">
              {filteredInvoices.map((invoice: any) => (
                <div
                  key={invoice._id}
                  className="flex items-center justify-between p-4 bg-accent/30 rounded-lg hover:bg-accent/50 transition-colors flex-wrap gap-4"
                  data-testid={`invoice-item-${invoice._id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <FileText className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {invoice.invoiceNumber}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {invoice.customerName} - {invoice.plateNumber}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(invoice.createdAt).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="text-right">
                      <p className="font-bold text-foreground flex items-center justify-end">
                        <IndianRupee className="w-4 h-4" />
                        {(invoice.totalAmount || 0).toLocaleString("en-IN")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Paid: <IndianRupee className="w-3 h-3 inline" />
                        {(invoice.paidAmount || 0).toLocaleString("en-IN")}
                      </p>
                    </div>
                    <Badge className={getPaymentStatusColor(invoice.paymentStatus)}>
                      {invoice.paymentStatus}
                    </Badge>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setSelectedInvoice(invoice);
                          setViewDialogOpen(true);
                        }}
                        data-testid={`button-view-invoice-${invoice._id}`}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setSelectedInvoice(invoice);
                          setTimeout(handlePrint, 100);
                        }}
                        data-testid={`button-print-invoice-${invoice._id}`}
                      >
                        <Printer className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setSelectedInvoice(invoice);
                          setTimeout(handleDownload, 100);
                        }}
                        data-testid={`button-download-invoice-${invoice._id}`}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      {invoice.paymentStatus !== "Paid" && (
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => markPaidMutation.mutate(invoice._id)}
                          disabled={markPaidMutation.isPending}
                          data-testid={`button-mark-paid-${invoice._id}`}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Mark Paid
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between gap-4">
              <span>Invoice {selectedInvoice?.invoiceNumber}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={handlePrint}>
                  <Printer className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleDownload}>
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedInvoice && (
            <div ref={printRef} className="space-y-6">
              <div className="header text-center">
                <h2 className="company-name text-2xl font-bold">Auto Garage CRM</h2>
                <p className="text-muted-foreground">Tax Invoice</p>
              </div>

              <div className="flex justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-sm text-muted-foreground">Invoice Number</p>
                  <p className="font-bold">{selectedInvoice.invoiceNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-bold">
                    {new Date(selectedInvoice.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Customer Details</h3>
                  <p className="font-medium">{selectedInvoice.customerName}</p>
                  {selectedInvoice.customerPhone && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {selectedInvoice.customerPhone}
                    </p>
                  )}
                  {selectedInvoice.customerEmail && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Mail className="w-3 h-3" /> {selectedInvoice.customerEmail}
                    </p>
                  )}
                  {selectedInvoice.customerAddress && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {selectedInvoice.customerAddress}
                    </p>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Vehicle Details</h3>
                  <p className="font-medium flex items-center gap-1">
                    <Car className="w-4 h-4" /> {selectedInvoice.vehicleName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Plate: {selectedInvoice.plateNumber}
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-3">Items & Services</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-3">Description</th>
                        <th className="text-center p-3">Qty</th>
                        <th className="text-right p-3">Unit Price</th>
                        <th className="text-right p-3">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.items?.map((item: any, index: number) => (
                        <tr key={index} className="border-t">
                          <td className="p-3">
                            {item.description}
                            <Badge variant="outline" className={`ml-2 text-xs ${item.type === 'service' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                              {item.type === 'service' ? 'Service' : 'Material'}
                            </Badge>
                          </td>
                          <td className="text-center p-3">{item.quantity}</td>
                          <td className="text-right p-3">
                            <IndianRupee className="w-3 h-3 inline" />
                            {item.unitPrice.toLocaleString("en-IN")}
                          </td>
                          <td className="text-right p-3">
                            <IndianRupee className="w-3 h-3 inline" />
                            {item.total.toLocaleString("en-IN")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {selectedInvoice.items?.length > 0 && (
                  <div className="mt-3 p-3 bg-accent/30 rounded-lg space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Service Cost:</span>
                      <span className="flex items-center">
                        <IndianRupee className="w-3 h-3" />
                        {(selectedInvoice.items?.filter((i: any) => i.type === 'service')?.reduce((sum: number, i: any) => sum + i.total, 0) || 0).toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Items Cost:</span>
                      <span className="flex items-center">
                        <IndianRupee className="w-3 h-3" />
                        {(selectedInvoice.items?.filter((i: any) => i.type === 'material')?.reduce((sum: number, i: any) => sum + i.total, 0) || 0).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="flex items-center">
                      <IndianRupee className="w-3 h-3" />
                      {selectedInvoice.subtotal.toLocaleString("en-IN")}
                    </span>
                  </div>
                  {selectedInvoice.taxRate > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">GST ({selectedInvoice.taxRate}%):</span>
                      <span className="flex items-center">
                        <IndianRupee className="w-3 h-3" />
                        {selectedInvoice.tax.toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}
                  {selectedInvoice.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount:</span>
                      <span className="flex items-center">
                        -<IndianRupee className="w-3 h-3" />
                        {selectedInvoice.discount.toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span className="flex items-center">
                      <IndianRupee className="w-4 h-4" />
                      {selectedInvoice.totalAmount.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Paid:</span>
                    <span className="flex items-center">
                      <IndianRupee className="w-3 h-3" />
                      {selectedInvoice.paidAmount.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold text-orange-600">
                    <span>Balance Due:</span>
                    <span className="flex items-center">
                      <IndianRupee className="w-3 h-3" />
                      {(selectedInvoice.totalAmount - selectedInvoice.paidAmount).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Badge className={`${getPaymentStatusColor(selectedInvoice.paymentStatus)} w-fit`}>
                  {selectedInvoice.paymentStatus}
                </Badge>
                {selectedInvoice.paymentStatus !== "Paid" && (
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => markPaidMutation.mutate(selectedInvoice._id)}
                    disabled={markPaidMutation.isPending}
                    data-testid="button-mark-paid-dialog"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark as Paid
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
