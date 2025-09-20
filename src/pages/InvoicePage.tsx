// src/pages/InvoicePage.tsx

import { useState } from "react";
import { InvoiceForm } from "@/components/InvoiceForm";
import { InvoicePreview } from "@/components/InvoicePreview";
import { InvoiceData } from "@/types/invoice";

const InvoicePage = () => {
  const [invoiceData, setInvoiceData] = useState<InvoiceData>({
    invoiceNumber: "INV-001",
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    currency: "$",
    
    companyName: "",
    companyAddressLine1: "",
    companyCity: "",
    companyState: "",
    companyZip: "",
    companyCountry: "",
    companyEmail: "",
    companyPhone: "",
    
    clientName: "",
    clientAddressLine1: "",
    clientCity: "",
    clientState: "",
    clientZip: "",
    clientCountry: "",
    clientEmail: "",
    clientPhone: "",
    
    items: [],
    
    subtotal: 0,
    tax: 0,
    total: 0,
    taxInclusive: false,
    paymentTerms: "",
    
    notes: "",
  });

  const handleUpdateInvoice = (data: InvoiceData) => {
    setInvoiceData(data);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-foreground">Invoice Generator</h1>
          <p className="text-muted-foreground mt-1">Create professional invoices with ease</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-foreground mb-2">Invoice Details</h2>
              <p className="text-sm text-muted-foreground">Fill in the information below to generate your invoice</p>
            </div>
            <InvoiceForm 
              invoiceData={invoiceData} 
              onUpdateInvoice={handleUpdateInvoice}
            />
          </div>

          {/* Preview Section */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-foreground mb-2">Preview</h2>
              <p className="text-sm text-muted-foreground">Live preview of your invoice</p>
            </div>
            <InvoicePreview invoiceData={invoiceData} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default InvoicePage;
