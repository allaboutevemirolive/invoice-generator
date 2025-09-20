import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Upload, X, ChevronDown, ChevronUp } from "lucide-react";
import { InvoiceData, InvoiceItem } from "@/types/invoice";

interface InvoiceFormProps {
  invoiceData: InvoiceData;
  onUpdateInvoice: (data: InvoiceData) => void;
}

export const InvoiceForm = ({ invoiceData, onUpdateInvoice }: InvoiceFormProps) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      sku: "",
      itemName: "",
      quantity: 1,
      unit: "pcs",
      unitPrice: 0,
      amount: 0,
      discount: 0,
      discountType: 'fixed',
      taxes: [{
        id: Date.now().toString() + '_tax1',
        name: 'VAT',
        rate: 10,
        amount: 0
      }],
      totalTax: 0,
      lineTotal: 0,
    };
    
    const updatedData = {
      ...invoiceData,
      items: [...invoiceData.items, newItem],
    };
    onUpdateInvoice(updatedData);
  };

  const addTaxToItem = (itemId: string) => {
    const updatedItems = invoiceData.items.map(item => {
      if (item.id === itemId) {
        const newTax = {
          id: Date.now().toString() + '_tax_' + Math.random(),
          name: 'Tax',
          rate: 0,
          amount: 0
        };
        return { ...item, taxes: [...item.taxes, newTax] };
      }
      return item;
    });
    
    const updatedData = { ...invoiceData, items: updatedItems };
    calculateTotals(updatedData);
  };

  const removeTaxFromItem = (itemId: string, taxId: string) => {
    const updatedItems = invoiceData.items.map(item => {
      if (item.id === itemId) {
        return { ...item, taxes: item.taxes.filter(tax => tax.id !== taxId) };
      }
      return item;
    });
    
    const updatedData = { ...invoiceData, items: updatedItems };
    calculateTotals(updatedData);
  };

  const updateTax = (itemId: string, taxId: string, field: 'name' | 'rate', value: string | number) => {
    const updatedItems = invoiceData.items.map(item => {
      if (item.id === itemId) {
        const updatedTaxes = item.taxes.map(tax => {
          if (tax.id === taxId) {
            return { ...tax, [field]: value };
          }
          return tax;
        });
        return { ...item, taxes: updatedTaxes };
      }
      return item;
    });
    
    const updatedData = { ...invoiceData, items: updatedItems };
    recalculateItemTotals(updatedData);
  };

  const recalculateItemTotals = (data: InvoiceData) => {
    const updatedItems = data.items.map(item => {
      const updatedItem = { ...item };
      
      // Calculate discount amount
      let discountAmount = 0;
      if (updatedItem.discountType === 'percentage') {
        discountAmount = updatedItem.amount * (updatedItem.discount / 100);
      } else {
        discountAmount = updatedItem.discount;
      }
      
      // Amount after discount
      const amountAfterDiscount = updatedItem.amount - discountAmount;
      
      let updatedTaxes, totalTax, lineTotal;
      
      if (data.taxInclusive) {
        // Tax Inclusive: extract tax from the total amount
        lineTotal = amountAfterDiscount;
        
        // Calculate total tax rate
        const totalTaxRate = updatedItem.taxes.reduce((sum, tax) => sum + tax.rate, 0);
        
        // Extract tax from the total amount
        totalTax = amountAfterDiscount * (totalTaxRate / (100 + totalTaxRate));
        
        // Calculate individual tax amounts proportionally
        updatedTaxes = updatedItem.taxes.map(tax => ({
          ...tax,
          amount: totalTax * (tax.rate / totalTaxRate) || 0
        }));
      } else {
        // Tax Exclusive: add tax on top of the amount
        const taxableAmount = amountAfterDiscount;
        
        // Calculate individual tax amounts
        updatedTaxes = updatedItem.taxes.map(tax => ({
          ...tax,
          amount: taxableAmount * (tax.rate / 100)
        }));
        
        // Calculate total tax
        totalTax = updatedTaxes.reduce((sum, tax) => sum + tax.amount, 0);
        
        // Line total is taxable amount plus tax
        lineTotal = taxableAmount + totalTax;
      }
      
      updatedItem.taxes = updatedTaxes;
      updatedItem.totalTax = totalTax;
      updatedItem.lineTotal = lineTotal;
      
      return updatedItem;
    });
    
    const finalData = { ...data, items: updatedItems };
    calculateTotals(finalData);
  };

  const removeItem = (id: string) => {
    const updatedData = {
      ...invoiceData,
      items: invoiceData.items.filter(item => item.id !== id),
    };
    calculateTotals(updatedData);
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    const updatedItems = invoiceData.items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        // Recalculate amounts when relevant fields change
        if (field === 'quantity' || field === 'unitPrice') {
          updatedItem.amount = updatedItem.quantity * updatedItem.unitPrice;
        }
        
        return updatedItem;
      }
      return item;
    });
    
    const updatedData = { ...invoiceData, items: updatedItems };
    recalculateItemTotals(updatedData);
  };

  const calculateTotals = (data: InvoiceData) => {
    const subtotal = data.items.reduce((sum, item) => sum + item.lineTotal, 0);
    const tax = data.items.reduce((sum, item) => sum + item.totalTax, 0);
    const total = subtotal;
    
    onUpdateInvoice({
      ...data,
      subtotal,
      tax,
      total,
    });
  };

  const updateField = (field: keyof InvoiceData, value: string) => {
    onUpdateInvoice({ ...invoiceData, [field]: value });
  };

  const updatePaymentTerms = (terms: string) => {
    let updatedData = { ...invoiceData, paymentTerms: terms };
    
    // Auto-calculate due date based on payment terms
    if (invoiceData.invoiceDate) {
      const invoiceDate = new Date(invoiceData.invoiceDate);
      let dueDate = new Date(invoiceDate);
      
      switch (terms) {
        case 'upon-receipt':
          // Due date same as invoice date
          break;
        case 'net-7':
          dueDate.setDate(invoiceDate.getDate() + 7);
          break;
        case 'net-15':
          dueDate.setDate(invoiceDate.getDate() + 15);
          break;
        case 'net-30':
          dueDate.setDate(invoiceDate.getDate() + 30);
          break;
        default:
          break;
      }
      
      updatedData.dueDate = dueDate.toISOString().split('T')[0];
    }
    
    // Auto-populate payment terms note
    let paymentNote = '';
    switch (terms) {
      case 'upon-receipt':
        paymentNote = 'Payment is due upon receipt of this invoice.';
        break;
      case 'net-7':
        paymentNote = 'Payment is due within 7 days of invoice date.';
        break;
      case 'net-15':
        paymentNote = 'Payment is due within 15 days of invoice date.';
        break;
      case 'net-30':
        paymentNote = 'Payment is due within 30 days of invoice date.';
        break;
      default:
        paymentNote = '';
    }
    
    // Preserve existing notes if they don't contain payment terms
    const existingNotes = updatedData.notes || '';
    const paymentTermsRegex = /Payment is due (upon receipt|within \d+ days) of (this invoice|invoice date)\./g;
    const notesWithoutPaymentTerms = existingNotes.replace(paymentTermsRegex, '').trim();
    
    updatedData.notes = paymentNote + (notesWithoutPaymentTerms ? '\n\n' + notesWithoutPaymentTerms : '');
    
    onUpdateInvoice(updatedData);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('File size should be less than 2MB');
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        onUpdateInvoice({ ...invoiceData, companyLogo: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    onUpdateInvoice({ ...invoiceData, companyLogo: undefined });
  };

  const toggleAdvancedFields = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  return (
    <div className="space-y-6">
      {/* Invoice Details */}
      <Card className="bg-invoice-header">
        <CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="invoiceNumber">Invoice Number</Label>
              <Input
                id="invoiceNumber"
                value={invoiceData.invoiceNumber}
                onChange={(e) => updateField('invoiceNumber', e.target.value)}
                placeholder="INV-001"
              />
            </div>
            <div>
              <Label htmlFor="currency">Currency</Label>
              <select
                id="currency"
                value={invoiceData.currency}
                onChange={(e) => updateField('currency', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="$">$ USD</option>
                <option value="€">€ EUR</option>
                <option value="£">£ GBP</option>
                <option value="¥">¥ JPY</option>
                <option value="₹">₹ INR</option>
                <option value="₽">₽ RUB</option>
                <option value="₩">₩ KRW</option>
                <option value="₨">₨ PKR</option>
                <option value="₦">₦ NGN</option>
                <option value="₡">₡ CRC</option>
                <option value="RM">RM MYR</option>
                <option value="S$">S$ SGD</option>
                <option value="฿">฿ THB</option>
                <option value="₱">₱ PHP</option>
                <option value="Rp">Rp IDR</option>
                <option value="₫">₫ VND</option>
                <option value="HK$">HK$ HKD</option>
                <option value="NT$">NT$ TWD</option>
                <option value="৳">৳ BDT</option>
              </select>
            </div>
            <div>
              <Label htmlFor="invoiceDate">Invoice Date</Label>
              <Input
                id="invoiceDate"
                type="date"
                value={invoiceData.invoiceDate}
                onChange={(e) => updateField('invoiceDate', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={invoiceData.dueDate}
                onChange={(e) => updateField('dueDate', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company Details */}
      <Card>
        <CardHeader>
          <CardTitle>Your Company Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              value={invoiceData.companyName}
              onChange={(e) => updateField('companyName', e.target.value)}
              placeholder="Your Company Name"
            />
          </div>
          
          {/* Logo Upload */}
          <div>
            <Label>Company Logo</Label>
            <div className="mt-2">
              {invoiceData.companyLogo ? (
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <img 
                      src={invoiceData.companyLogo} 
                      alt="Company Logo" 
                      className="w-16 h-16 object-contain border border-invoice-border rounded"
                    />
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={removeLogo}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remove Logo
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-invoice-border rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Upload your company logo
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    PNG, JPG up to 2MB
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <label className="cursor-pointer">
                      <Upload className="h-4 w-4 mr-2" />
                      Choose File
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleLogoUpload}
                      />
                    </label>
                  </Button>
                </div>
              )}
            </div>
          </div>
          <div>
            <Label htmlFor="companyAddressLine1">Address Line 1</Label>
            <Input
              id="companyAddressLine1"
              value={invoiceData.companyAddressLine1}
              onChange={(e) => updateField('companyAddressLine1', e.target.value)}
              placeholder="Street address"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="companyCity">City</Label>
              <Input
                id="companyCity"
                value={invoiceData.companyCity}
                onChange={(e) => updateField('companyCity', e.target.value)}
                placeholder="City"
              />
            </div>
            <div>
              <Label htmlFor="companyState">State/Province</Label>
              <Input
                id="companyState"
                value={invoiceData.companyState}
                onChange={(e) => updateField('companyState', e.target.value)}
                placeholder="State/Province"
              />
            </div>
            <div>
              <Label htmlFor="companyZip">ZIP/Postal Code</Label>
              <Input
                id="companyZip"
                value={invoiceData.companyZip}
                onChange={(e) => updateField('companyZip', e.target.value)}
                placeholder="ZIP/Postal Code"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="companyCountry">Country</Label>
            <Input
              id="companyCountry"
              value={invoiceData.companyCountry}
              onChange={(e) => updateField('companyCountry', e.target.value)}
              placeholder="Country"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="companyBusinessId">Business ID (optional)</Label>
              <Input
                id="companyBusinessId"
                value={invoiceData.companyBusinessId || ''}
                onChange={(e) => updateField('companyBusinessId', e.target.value)}
                placeholder="Registration No."
              />
            </div>
            <div>
              <Label htmlFor="companyTaxId">Tax ID (optional)</Label>
              <Input
                id="companyTaxId"
                value={invoiceData.companyTaxId || ''}
                onChange={(e) => updateField('companyTaxId', e.target.value)}
                placeholder="Tax Identification Number"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="companyEmail">Email</Label>
              <Input
                id="companyEmail"
                type="email"
                value={invoiceData.companyEmail}
                onChange={(e) => updateField('companyEmail', e.target.value)}
                placeholder="company@email.com"
              />
            </div>
            <div>
              <Label htmlFor="companyPhone">Phone</Label>
              <Input
                id="companyPhone"
                value={invoiceData.companyPhone}
                onChange={(e) => updateField('companyPhone', e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Client Details */}
      <Card>
        <CardHeader>
          <CardTitle>Bill To</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="clientName">Client Name</Label>
            <Input
              id="clientName"
              value={invoiceData.clientName}
              onChange={(e) => updateField('clientName', e.target.value)}
              placeholder="Client Name"
            />
          </div>
          <div>
            <Label htmlFor="clientAddressLine1">Address Line 1</Label>
            <Input
              id="clientAddressLine1"
              value={invoiceData.clientAddressLine1}
              onChange={(e) => updateField('clientAddressLine1', e.target.value)}
              placeholder="Street address"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="clientCity">City</Label>
              <Input
                id="clientCity"
                value={invoiceData.clientCity}
                onChange={(e) => updateField('clientCity', e.target.value)}
                placeholder="City"
              />
            </div>
            <div>
              <Label htmlFor="clientState">State/Province</Label>
              <Input
                id="clientState"
                value={invoiceData.clientState}
                onChange={(e) => updateField('clientState', e.target.value)}
                placeholder="State/Province"
              />
            </div>
            <div>
              <Label htmlFor="clientZip">ZIP/Postal Code</Label>
              <Input
                id="clientZip"
                value={invoiceData.clientZip}
                onChange={(e) => updateField('clientZip', e.target.value)}
                placeholder="ZIP/Postal Code"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="clientCountry">Country</Label>
            <Input
              id="clientCountry"
              value={invoiceData.clientCountry}
              onChange={(e) => updateField('clientCountry', e.target.value)}
              placeholder="Country"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="clientBusinessId">Business ID (optional)</Label>
              <Input
                id="clientBusinessId"
                value={invoiceData.clientBusinessId || ''}
                onChange={(e) => updateField('clientBusinessId', e.target.value)}
                placeholder="Registration No."
              />
            </div>
            <div>
              <Label htmlFor="clientTaxId">Tax ID (optional)</Label>
              <Input
                id="clientTaxId"
                value={invoiceData.clientTaxId || ''}
                onChange={(e) => updateField('clientTaxId', e.target.value)}
                placeholder="Tax Identification Number"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="clientEmail">Client Email</Label>
              <Input
                id="clientEmail"
                type="email"
                value={invoiceData.clientEmail}
                onChange={(e) => updateField('clientEmail', e.target.value)}
                placeholder="client@email.com"
              />
            </div>
            <div>
              <Label htmlFor="clientPhone">Phone</Label>
              <Input
                id="clientPhone"
                value={invoiceData.clientPhone}
                onChange={(e) => updateField('clientPhone', e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Invoice Items</CardTitle>
          <div className="flex items-center space-x-2">
            <input
              id="taxInclusive"
              type="checkbox"
              checked={invoiceData.taxInclusive}
              onChange={(e) => {
                // Update tax mode and recalculate all items
                const updatedData = { ...invoiceData, taxInclusive: e.target.checked };
                recalculateItemTotals(updatedData);
              }}
              className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2"
            />
            <Label htmlFor="taxInclusive" className="text-sm font-normal">Tax Inclusive</Label>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {invoiceData.items.map((item, index) => (
              <div key={item.id} className="border border-invoice-border rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-sm font-medium text-muted-foreground">Item #{index + 1}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(item.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Line 1: Primary Info */}
                <div className="grid grid-cols-12 gap-4 mb-4">
                  <div className="col-span-12 md:col-span-6 lg:col-span-7">
                    <Label htmlFor={`itemName-${item.id}`}>Item Name</Label>
                    <Input
                      id={`itemName-${item.id}`}
                      value={item.itemName}
                      onChange={(e) => updateItem(item.id, 'itemName', e.target.value)}
                      placeholder="Enter item name or description"
                      className="text-base"
                    />
                  </div>
                  <div className="col-span-6 md:col-span-3 lg:col-span-2">
                    <Label htmlFor={`quantity-${item.id}`}>Quantity</Label>
                    <Input
                      id={`quantity-${item.id}`}
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="col-span-6 md:col-span-3 lg:col-span-3">
                    <Label htmlFor={`unitPrice-${item.id}`}>Unit Price ({invoiceData.currency})</Label>
                    <Input
                      id={`unitPrice-${item.id}`}
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                {/* Line 2: Calculated Amount */}
                <div className="mb-4">
                  <Label>Amount</Label>
                  <div className="text-2xl font-semibold text-primary">
                    {invoiceData.currency}{item.amount.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {item.quantity} × {invoiceData.currency}{item.unitPrice.toFixed(2)}
                  </p>
                </div>

                {/* Line 3: Advanced Fields Toggle */}
                <div className="space-y-4">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleAdvancedFields(item.id)}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {expandedItems.has(item.id) ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-2" />
                        Hide advanced options
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-2" />
                        + Add SKU, Discount, Tax
                      </>
                    )}
                  </Button>

                  {expandedItems.has(item.id) && (
                    <div className="space-y-4 pt-4 border-t border-invoice-border">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`sku-${item.id}`}>SKU</Label>
                          <Input
                            id={`sku-${item.id}`}
                            value={item.sku}
                            onChange={(e) => updateItem(item.id, 'sku', e.target.value)}
                            placeholder="SKU-001"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`unit-${item.id}`}>Unit</Label>
                          <Input
                            id={`unit-${item.id}`}
                            value={item.unit}
                            onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                            placeholder="pcs, hrs, kg"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor={`discount-${item.id}`}>Discount</Label>
                        <div className="flex gap-2">
                          <Input
                            id={`discount-${item.id}`}
                            type="number"
                            value={item.discount}
                            onChange={(e) => updateItem(item.id, 'discount', parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                            className="flex-1"
                            placeholder="0"
                          />
                          <select
                            value={item.discountType}
                            onChange={(e) => updateItem(item.id, 'discountType', e.target.value)}
                            className="px-3 py-2 border border-input bg-background rounded-md text-sm min-w-[60px] z-50"
                          >
                            <option value="fixed">{invoiceData.currency}</option>
                            <option value="percentage">%</option>
                          </select>
                        </div>
                      </div>
                      
                      {/* Multiple Taxes Section */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label>Taxes</Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addTaxToItem(item.id)}
                            type="button"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Tax
                          </Button>
                        </div>
                        
                        {item.taxes.map((tax, taxIndex) => (
                          <div key={tax.id} className="flex gap-2 items-center">
                            <Input
                              placeholder="Tax name (e.g. VAT, GST)"
                              value={tax.name}
                              onChange={(e) => updateTax(item.id, tax.id, 'name', e.target.value)}
                              className="flex-1"
                            />
                            <Input
                              type="number"
                              placeholder="Rate %"
                              value={tax.rate}
                              onChange={(e) => updateTax(item.id, tax.id, 'rate', parseFloat(e.target.value) || 0)}
                              min="0"
                              step="0.01"
                              className="w-20"
                            />
                            {item.taxes.length > 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeTaxFromItem(item.id, tax.id)}
                                type="button"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="pt-3 border-t border-invoice-border">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Total Tax: {invoiceData.currency}{item.totalTax.toFixed(2)}</span>
                          <span className="font-medium">Line Total: {invoiceData.currency}{item.lineTotal.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {invoiceData.items.length > 0 && (
              <div className="flex justify-center pt-4">
                <Button onClick={addItem} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another Item
                </Button>
              </div>
            )}
            
            {invoiceData.items.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-6">No items added yet.</p>
                <Button onClick={addItem} size="lg" className="bg-foreground text-background hover:bg-foreground/90">
                  <Plus className="h-5 w-5 mr-2" />
                  Add Your First Item
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Terms & Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Terms & Additional Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="paymentTerms">Payment Terms</Label>
            <select
              id="paymentTerms"
              value={invoiceData.paymentTerms}
              onChange={(e) => updatePaymentTerms(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Select payment terms</option>
              <option value="upon-receipt">Upon Receipt</option>
              <option value="net-7">NET 7 (7 days)</option>
              <option value="net-15">NET 15 (15 days)</option>
              <option value="net-30">NET 30 (30 days)</option>
            </select>
          </div>
          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={invoiceData.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="Additional information, special instructions, etc."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
