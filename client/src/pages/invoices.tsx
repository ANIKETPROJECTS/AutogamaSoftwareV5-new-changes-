import { useQuery, useMutation } from "@tanstack/react-query";
import { api, queryClient } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
  CreditCard,
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
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentMode, setPaymentMode] = useState<string>("Cash");
  const printRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => api.invoices.list(),
  });

  const markPaidMutation = useMutation({
    mutationFn: (data: { invoiceId: string; paymentMode: string }) => 
      api.invoices.markPaid(data.invoiceId, undefined, data.paymentMode),
    onSuccess: (updatedInvoice: any) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      if (selectedInvoice && updatedInvoice) {
        setSelectedInvoice(updatedInvoice);
      }
      setPaymentDialogOpen(false);
      toast({ title: "Invoice marked as paid" });
    },
    onError: () => {
      toast({ title: "Failed to mark invoice as paid", variant: "destructive" });
    },
  });

  let filteredInvoices = invoices.filter((invoice: any) => {
    const matchesSearch =
      invoice.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      invoice.plateNumber?.toLowerCase().includes(search.toLowerCase()) ||
      invoice.invoiceNumber?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = 
      filterStatus === "all" ||
      (filterStatus === "paid" && invoice.paymentStatus === "Paid") ||
      (filterStatus === "unpaid" && invoice.paymentStatus !== "Paid");
    
    return matchesSearch && matchesStatus;
  });

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
                .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
                .logo { height: 60px; }
                .company-info { text-align: right; }
                .company-name { font-size: 24px; font-weight: bold; }
                .invoice-info { display: flex; justify-content: space-between; margin-bottom: 20px; }
                .customer-info { margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                th { background-color: #f5f5f5; }
                .totals { text-align: right; }
                .total-row { font-weight: bold; font-size: 18px; }
                .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; }
                @media print { body { print-color-adjust: exact; } }
              </style>
            </head>
            <body>
              ${printRef.current.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }
    }
  };

  const handleDownload = async () => {
    if (!selectedInvoice || !printRef.current) return;
    
    const html2pdf = (await import('html2pdf.js')).default;
    const element = printRef.current;
    const opt = {
      margin: 1,
      filename: `Invoice_${selectedInvoice.invoiceNumber}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' as const }
    };

    html2pdf().set(opt).from(element).save();
  };

  const isLoading = invoicesLoading;

  const getLogo = () => {
    return (
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
          <Car className="w-6 h-6 text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight text-slate-900">AUTOGAMMA</span>
      </div>
    );
  };

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
                          onClick={() => {
                            setSelectedInvoice(invoice);
                            setPaymentDialogOpen(true);
                          }}
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
            </DialogTitle>
          </DialogHeader>

          {selectedInvoice && (
            <div ref={printRef} className="space-y-6">
              <div className="header flex justify-between items-center">
                {getLogo()}
                <div className="text-right">
                  <h2 className="text-xl font-bold">Tax Invoice</h2>
                  <p className="text-sm text-muted-foreground">{selectedInvoice.invoiceNumber}</p>
                </div>
              </div>

              <div className="flex justify-between gap-4 flex-wrap">
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
                <div className="text-right">
                  <h3 className="font-semibold mb-2">Vehicle Details</h3>
                  <p className="font-medium flex items-center justify-end gap-1">
                    <Car className="w-4 h-4" /> {selectedInvoice.vehicleName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Plate: {selectedInvoice.plateNumber}
                  </p>
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Invoice Date</p>
                    <p className="font-bold">
                      {new Date(selectedInvoice.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-3">Items & Services</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-3">Description</th>
                        <th className="text-right p-3">Unit Price</th>
                        <th className="text-right p-3">Discount</th>
                        <th className="text-right p-3">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.items?.map((item: any, index: number) => (
                        <tr key={`item-${index}`} className="border-t">
                          <td className="p-3">
                            {item.description}
                            <Badge variant="outline" className="ml-2 text-xs bg-slate-50">
                              {item.type}
                            </Badge>
                          </td>
                          <td className="text-right p-3">
                            <IndianRupee className="w-3 h-3 inline" />
                            {item.unitPrice.toLocaleString("en-IN")}
                          </td>
                          <td className="text-right p-3 text-red-600">
                            {item.discount > 0 ? (
                              <>
                                -<IndianRupee className="w-3 h-3 inline" />
                                {item.discount.toLocaleString("en-IN")}
                              </>
                            ) : "—"}
                          </td>
                          <td className="text-right p-3 font-semibold">
                            <IndianRupee className="w-3 h-3 inline" />
                            {item.total.toLocaleString("en-IN")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-between items-start gap-8">
                <div className="flex-1">
                  {selectedInvoice.notes && (
                    <div className="text-sm">
                      <p className="font-semibold mb-1">Notes:</p>
                      <p className="text-muted-foreground italic">{selectedInvoice.notes}</p>
                    </div>
                  )}
                  {selectedInvoice.paymentStatus === "Paid" && selectedInvoice.paymentMode && (
                    <div className="mt-4 flex items-center gap-2 text-green-700 bg-green-50 p-2 rounded-md w-fit border border-green-200">
                      <CreditCard className="w-4 h-4" />
                      <span className="text-sm font-semibold uppercase tracking-wider">
                        Paid via {selectedInvoice.paymentMode}
                      </span>
                    </div>
                  )}
                </div>
                <div className="w-72 space-y-2">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="flex items-center">
                      <IndianRupee className="w-3 h-3" />
                      {selectedInvoice.subtotal.toLocaleString("en-IN")}
                    </span>
                  </div>
                  {selectedInvoice.tax > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Tax ({selectedInvoice.taxRate}%):</span>
                      <span className="flex items-center">
                        <IndianRupee className="w-3 h-3" />
                        {selectedInvoice.tax.toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}
                  {selectedInvoice.discount > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Total Discount:</span>
                      <span className="flex items-center">
                        -<IndianRupee className="w-3 h-3" />
                        {selectedInvoice.discount.toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-bold text-lg text-slate-900 pt-2">
                    <span>Grand Total:</span>
                    <span className="flex items-center">
                      <IndianRupee className="w-4 h-4" />
                      {selectedInvoice.totalAmount.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>Amount Paid:</span>
                    <span className="flex items-center">
                      <IndianRupee className="w-3 h-3" />
                      {selectedInvoice.paidAmount.toLocaleString("en-IN")}
                    </span>
                  </div>
                  {(selectedInvoice.totalAmount - selectedInvoice.paidAmount) > 0 && (
                    <div className="flex justify-between text-sm font-semibold text-red-600">
                      <span>Balance Due:</span>
                      <span className="flex items-center">
                        <IndianRupee className="w-3 h-3" />
                        {(selectedInvoice.totalAmount - selectedInvoice.paidAmount).toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="footer mt-12 text-center text-xs text-slate-400">
                <p>This is a computer-generated invoice. No signature is required.</p>
                <p className="mt-1 font-bold">AUTOGAMMA - Premium Auto Detailing Studio</p>
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-start items-center gap-3 mt-6 sm:justify-start">
            <Button 
              className="flex items-center gap-2"
              onClick={handlePrint}
              data-testid="button-print-modal"
            >
              <Printer className="w-4 h-4" />
              Print Invoice
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={handleDownload}
              data-testid="button-download-modal"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mark as Paid</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Payment Method</label>
              <Select value={paymentMode} onValueChange={setPaymentMode}>
                <SelectTrigger data-testid="select-payment-mode">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="Card">Card</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-slate-500">
              This will record a full payment for invoice <span className="font-bold">{selectedInvoice?.invoiceNumber}</span>.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => markPaidMutation.mutate({ 
                invoiceId: selectedInvoice?._id, 
                paymentMode 
              })}
              disabled={markPaidMutation.isPending}
              data-testid="button-confirm-payment"
            >
              Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
