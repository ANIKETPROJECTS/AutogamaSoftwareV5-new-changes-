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
  Filter,
  ArrowUpDown,
} from "lucide-react";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Invoices() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"date-desc" | "date-asc" | "amount-desc" | "amount-asc">("date-desc");
  const [filterStatus, setFilterStatus] = useState<"all" | "paid" | "unpaid">("all");
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

  let filteredInvoices = invoices.filter((invoice: any) => {
    // Search filter
    const matchesSearch =
      invoice.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      invoice.plateNumber?.toLowerCase().includes(search.toLowerCase()) ||
      invoice.invoiceNumber?.toLowerCase().includes(search.toLowerCase());
    
    // Status filter
    const matchesStatus = 
      filterStatus === "all" ||
      (filterStatus === "paid" && invoice.paymentStatus === "Paid") ||
      (filterStatus === "unpaid" && invoice.paymentStatus !== "Paid");
    
    return matchesSearch && matchesStatus;
  });

  // Sort
  filteredInvoices = [...filteredInvoices].sort((a: any, b: any) => {
    switch (sortBy) {
      case "date-desc":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "date-asc":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case "amount-desc":
        return (b.totalAmount || 0) - (a.totalAmount || 0);
      case "amount-asc":
        return (a.totalAmount || 0) - (b.totalAmount || 0);
      default:
        return 0;
    }
  });

  const totalRevenue = invoices
    .filter((inv: any) => inv.paymentStatus === "Paid")
    .reduce((sum: number, inv: any) => sum + (inv.totalAmount || 0), 0);
  
  const paidInvoices = invoices.filter((inv: any) => inv.paymentStatus === "Paid").length;
  const unpaidInvoices = invoices.filter((inv: any) => inv.paymentStatus !== "Paid").length;

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-700 border-green-200";
      case "Partially Paid":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
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
    <div className="space-y-8">
      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-green-50 to-white border-red-300 shadow-sm" data-testid="card-total-revenue">
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-600 font-semibold uppercase tracking-wider">Total Revenue</p>
                <p className="text-3xl font-bold mt-3 text-slate-700 flex items-center gap-1">
                  <IndianRupee className="w-6 h-6" />
                  {totalRevenue.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="p-4 bg-gray-100 rounded-lg">
                <IndianRupee className="w-6 h-6 text-slate-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-white border-red-300 shadow-sm" data-testid="card-paid-invoices">
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-600 font-semibold uppercase tracking-wider">Paid Invoices</p>
                <p className="text-3xl font-bold mt-3 text-slate-700">
                  {paidInvoices}
                </p>
              </div>
              <div className="p-4 bg-emerald-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-100 to-white border-red-300 shadow-sm" data-testid="card-unpaid-invoices">
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-700 font-semibold uppercase tracking-wider">Unpaid Invoices</p>
                <p className="text-3xl font-bold mt-3 text-slate-900">
                  {unpaidInvoices}
                </p>
              </div>
              <div className="p-4 bg-slate-200 rounded-lg">
                <FileText className="w-6 h-6 text-slate-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4">
        <Input
          placeholder="Search by customer name, vehicle number, or invoice number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-9 border-slate-300 bg-white text-slate-900 placeholder:text-slate-400"
          data-testid="input-search-billing"
        />
        
        <div className="flex gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-600" />
            <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
              <SelectTrigger className="w-40 h-9" data-testid="select-filter-status">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Invoices</SelectItem>
                <SelectItem value="paid">Paid Only</SelectItem>
                <SelectItem value="unpaid">Unpaid Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-slate-600" />
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-40 h-9" data-testid="select-sort-by">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Newest First</SelectItem>
                <SelectItem value="date-asc">Oldest First</SelectItem>
                <SelectItem value="amount-desc">Highest Amount</SelectItem>
                <SelectItem value="amount-asc">Lowest Amount</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Card className="bg-gradient-to-br from-white to-slate-50 border-slate-200 shadow-sm">
        <CardHeader className="pb-4 border-b border-slate-200 bg-gradient-to-r from-primary/5 to-transparent">
          <CardTitle className="flex items-center gap-3 text-lg text-slate-900 font-semibold">
            <FileText className="w-5 h-5 text-primary" />
            Invoices
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading ? (
            <p className="text-slate-500 text-center py-8">Loading...</p>
          ) : filteredInvoices.length === 0 ? (
            <p className="text-slate-500 text-center py-8">
              No invoices found
            </p>
          ) : (
            <div className="space-y-3">
              {filteredInvoices.map((invoice: any) => (
                <div
                  key={invoice._id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-white to-slate-50 rounded-lg hover:shadow-md transition-all flex-wrap gap-4 border border-slate-200 hover-elevate"
                  data-testid={`invoice-item-${invoice._id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">
                        {invoice.invoiceNumber}
                      </p>
                      <p className="text-sm text-slate-600">
                        {invoice.customerName} - {invoice.plateNumber}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(invoice.createdAt).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="text-right">
                      <p className="font-bold text-slate-900 flex items-center justify-end gap-1">
                        <IndianRupee className="w-4 h-4" />
                        {(invoice.totalAmount || 0).toLocaleString("en-IN")}
                      </p>
                      <p className="text-sm text-slate-500">
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
                        className="border-slate-200 text-slate-700"
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
                        className="border-slate-200 text-slate-700"
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
                        className="border-slate-200 text-slate-700"
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
                          className="bg-gradient-to-r from-slate-600 to-slate-700 text-white hover:shadow-lg transition-all"
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
                            <Badge variant="outline" className={`ml-2 text-xs ${item.type === 'service' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-50 text-slate-600 border-gray-200'}`}>
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
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-1 border border-gray-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Service Cost:</span>
                      <span className="flex items-center">
                        <IndianRupee className="w-3 h-3" />
                        {(selectedInvoice.items?.filter((i: any) => i.type === 'service')?.reduce((sum: number, i: any) => sum + i.total, 0) || 0).toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Items Cost:</span>
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
                    <div className="flex justify-between text-slate-600">
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
                  <div className="flex justify-between text-slate-600">
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
                    className="bg-slate-600 hover:bg-green-700"
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
