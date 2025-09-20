export interface TaxEntry {
  id: string;
  name: string;
  rate: number; // percentage
  amount: number;
}

export interface InvoiceItem {
  id: string;
  sku: string;
  itemName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
  discount: number;
  discountType: 'percentage' | 'fixed'; // percentage or fixed amount
  taxes: TaxEntry[];
  totalTax: number;
  lineTotal: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  currency: string;
  
  // Company details
  companyName: string;
  companyLogo?: string;
  companyBusinessId?: string;
  companyTaxId?: string;
  companyAddressLine1: string;
  companyCity: string;
  companyState: string;
  companyZip: string;
  companyCountry: string;
  companyEmail: string;
  companyPhone: string;
  
  // Client details
  clientName: string;
  clientBusinessId?: string;
  clientTaxId?: string;
  clientAddressLine1: string;
  clientCity: string;
  clientState: string;
  clientZip: string;
  clientCountry: string;
  clientEmail: string;
  clientPhone: string;
  
  // Invoice items
  items: InvoiceItem[];
  
  // Totals
  subtotal: number;
  tax: number;
  total: number;
  
  // Tax calculation mode
  taxInclusive: boolean;
  
  // Payment Terms
  paymentTerms: string;
  
  // Notes
  notes: string;
}
