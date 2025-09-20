import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Download } from "lucide-react";
import { InvoiceData } from "@/types/invoice";
import html2pdf from 'html2pdf.js';

interface InvoicePreviewProps {
  invoiceData: InvoiceData;
}

export const InvoicePreview = ({ invoiceData }: InvoicePreviewProps) => {

  const handleDownloadPDF = () => {
    const element = document.getElementById('invoice-content');
    if (!element) return;
    
    // Get the dimensions of the content
    const rect = element.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Convert pixels to inches (assuming 96 DPI)
    const widthInches = width / 96;
    const heightInches = height / 96;
    
    const opt = {
      margin: 0.2,
      filename: `invoice-${invoiceData.invoiceNumber || 'INV-001'}.pdf`,
      image: { type: 'png' as const, quality: 1 },
      html2canvas: { 
        scale: 2.5, 
        useCORS: true,
        dpi: 300,
        letterRendering: true
      },
      jsPDF: { 
        unit: 'in', 
        format: [widthInches + 0.4, heightInches + 0.4] as [number, number], // Add small margin
        orientation: 'portrait' as const,
        compress: false
      }
    };
    
    html2pdf().set(opt).from(element).save();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex gap-2 print:hidden">
        <Button onClick={handleDownloadPDF}>
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
      </div>

      {/* Invoice Preview */}
      <Card className="bg-background print:shadow-none print:border-none" id="invoice-content">
        <CardContent className="p-8 print:p-12">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            {/* Company Logo */}
            <div className="flex-1 flex justify-center items-center">
              <div>
                {invoiceData.companyLogo ? (
                  <img 
                    src={invoiceData.companyLogo} 
                    alt="Company Logo" 
                    className="w-32 h-32 object-contain"
                  />
                ) : (
                  <div className="w-32 h-32 border-2 border-dashed border-invoice-border rounded-lg flex items-center justify-center">
                    <span className="text-sm text-muted-foreground text-center">Company<br/>Logo</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Invoice Details */}
            <div className="flex-1 flex justify-center items-start">
              <div className="text-left">
                <h1 className="text-3xl font-bold text-foreground mb-3">INVOICE</h1>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>Invoice #: <span className="text-foreground font-medium">{invoiceData.invoiceNumber || 'INV-001'}</span></p>
                  <p>Invoice Date: <span className="text-foreground font-medium">{formatDate(invoiceData.invoiceDate)}</span></p>
                  <p>Due Date: <span className="text-foreground font-medium">{formatDate(invoiceData.dueDate)}</span></p>
                </div>
              </div>
            </div>
          </div>

          {/* Separator */}
          <Separator className="mb-8" />

          {/* Parties Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* FROM Section */}
            <div>
              <div className="mb-4">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wide mb-2 pb-2 border-b border-invoice-border">From</h3>
              </div>
              <div className="bg-invoice-header p-4 rounded-lg">
                <h2 className="text-base font-semibold text-foreground mb-3">
                  {invoiceData.companyName || 'Your Company'}
                </h2>
                
                {/* Company Address */}
                <div className="text-sm text-muted-foreground space-y-1">
                  {invoiceData.companyAddressLine1 && (
                    <p>{invoiceData.companyAddressLine1}</p>
                  )}
                  {(invoiceData.companyCity || invoiceData.companyState || invoiceData.companyZip) && (
                    <p>
                      {[invoiceData.companyCity, invoiceData.companyState, invoiceData.companyZip].filter(Boolean).join(', ')}
                    </p>
                  )}
                  {invoiceData.companyCountry && (
                    <p>{invoiceData.companyCountry}</p>
                  )}
                  {(invoiceData.companyBusinessId || invoiceData.companyTaxId) && (
                    <div className="mt-3 pt-2 border-t border-invoice-border/50 space-y-1">
                      {invoiceData.companyBusinessId && (
                        <p className="text-xs"><span className="font-medium">Business ID:</span> {invoiceData.companyBusinessId}</p>
                      )}
                      {invoiceData.companyTaxId && (
                        <p className="text-xs"><span className="font-medium">Tax ID:</span> {invoiceData.companyTaxId}</p>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Company Contact */}
                {(invoiceData.companyEmail || invoiceData.companyPhone) && (
                  <div className="text-sm text-muted-foreground mt-3 space-y-1 border-t border-invoice-border pt-3">
                    {invoiceData.companyEmail && (
                      <p className="break-all">{invoiceData.companyEmail}</p>
                    )}
                    {invoiceData.companyPhone && (
                      <p>{invoiceData.companyPhone}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* BILL TO Section */}
            <div>
              <div className="mb-4">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wide mb-2 pb-2 border-b border-invoice-border">Bill To</h3>
              </div>
              <div className="bg-invoice-header p-4 rounded-lg">
                <h2 className="text-base font-semibold text-foreground mb-3">{invoiceData.clientName || 'Client Name'}</h2>
                <div className="text-sm text-muted-foreground mt-2">
                  {invoiceData.clientAddressLine1 && <p>{invoiceData.clientAddressLine1}</p>}
                  {(invoiceData.clientCity || invoiceData.clientState || invoiceData.clientZip) && (
                    <p>
                      {[invoiceData.clientCity, invoiceData.clientState, invoiceData.clientZip].filter(Boolean).join(', ')}
                    </p>
                  )}
                  {invoiceData.clientCountry && <p>{invoiceData.clientCountry}</p>}
                  {(invoiceData.clientBusinessId || invoiceData.clientTaxId) && (
                    <div className="mt-3 pt-2 border-t border-invoice-border/50 space-y-1">
                      {invoiceData.clientBusinessId && (
                        <p className="text-xs"><span className="font-medium">Business ID:</span> {invoiceData.clientBusinessId}</p>
                      )}
                      {invoiceData.clientTaxId && (
                        <p className="text-xs"><span className="font-medium">Tax ID:</span> {invoiceData.clientTaxId}</p>
                      )}
                    </div>
                  )}
                </div>
                {(invoiceData.clientEmail || invoiceData.clientPhone) && (
                  <div className="text-sm text-muted-foreground mt-3 space-y-1 border-t border-invoice-border pt-3">
                    {invoiceData.clientEmail && <p>{invoiceData.clientEmail}</p>}
                    {invoiceData.clientPhone && <p>{invoiceData.clientPhone}</p>}
                  </div>
                )}
              </div>
            </div>
          </div>


          {/* Items Table */}
          <div className="mb-8">
            <div className="border border-invoice-border rounded-lg overflow-hidden">
              <div className="bg-invoice-header border-b-2 border-invoice-border">
                <div className="grid grid-cols-12 gap-4 p-4 font-bold text-foreground text-sm">
                  <div className="col-span-6">Item / Description</div>
                  <div className="col-span-2 text-right">Quantity</div>
                  <div className="col-span-2 text-right">Rate</div>
                  <div className="col-span-2 text-right">Amount</div>
                </div>
              </div>
              <div>
                {invoiceData.items.length > 0 ? (
                  invoiceData.items.map((item, index) => (
                    <div key={item.id}>
                      <div className="grid grid-cols-12 gap-4 p-4">
                        <div className="col-span-6">
                          <div className="text-foreground font-semibold text-base">
                            {item.itemName || `Item ${index + 1}`}
                          </div>
                          {(item.sku || item.unit) && (
                            <div className="text-xs text-muted-foreground/70 mt-1 font-normal">
                              {item.sku && <span className="font-mono">SKU: {item.sku}</span>}
                              {item.sku && item.unit && <span className="mx-2">•</span>}
                              {item.unit && <span>Unit: {item.unit}</span>}
                            </div>
                          )}
                        </div>
                        <div className="col-span-2 text-right text-muted-foreground font-mono">
                          {item.quantity}
                        </div>
                        <div className="col-span-2 text-right text-muted-foreground font-mono">
                          {invoiceData.currency}{item.unitPrice.toFixed(2)}
                        </div>
                        <div className="col-span-2 text-right text-foreground font-semibold font-mono">
                          {invoiceData.currency}{item.lineTotal.toFixed(2)}
                        </div>
                      </div>
                      {index < invoiceData.items.length - 1 && (
                        <Separator />
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    Items you add will appear here
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-full max-w-sm">
              <div className="bg-invoice-total border border-invoice-border rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="text-foreground">
                    {invoiceData.currency}{invoiceData.items.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Discount:</span>
                  <span className="text-foreground">
                    -{invoiceData.currency}{invoiceData.items.reduce((sum, item) => {
                      const discountAmount = item.discountType === 'percentage' 
                        ? item.amount * (item.discount / 100)
                        : item.discount;
                      return sum + discountAmount;
                    }, 0).toFixed(2)}
                  </span>
                </div>
                
                {/* Individual Tax Breakdown */}
                {(() => {
                  const taxBreakdown: { [key: string]: number } = {};
                  invoiceData.items.forEach(item => {
                    item.taxes.forEach(tax => {
                      if (tax.amount > 0) {
                        taxBreakdown[tax.name] = (taxBreakdown[tax.name] || 0) + tax.amount;
                      }
                    });
                  });
                  
                  return Object.entries(taxBreakdown).map(([taxName, amount]) => (
                    <div key={taxName} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{taxName}:</span>
                      <span className="text-foreground">{invoiceData.currency}{amount.toFixed(2)}</span>
                    </div>
                  ));
                })()}
                
                <Separator />
                <div className="flex justify-between text-xl font-bold bg-muted/30 -mx-4 px-4 py-3 rounded">
                  <span className="text-foreground">Total:</span>
                  <span className="text-foreground">{invoiceData.currency}{invoiceData.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoiceData.notes && (
            <div>
              <div className="mb-4">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wide mb-2 pb-2 border-b border-invoice-border">Notes</h3>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{invoiceData.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-invoice-border pt-6 mt-8">
            <p className="text-center text-sm text-muted-foreground">
              Thank you for your business!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
