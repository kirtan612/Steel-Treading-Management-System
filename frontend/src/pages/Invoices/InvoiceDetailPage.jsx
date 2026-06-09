import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Printer, Download, ArrowLeft, CreditCard, X, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { generateInvoicePDF } from '../../utils/generateInvoicePDF';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { api } from '../../utils/api';
import { FormField, inputClass } from '../../components/ui/FormField';

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Payment modal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('Bank Transfer');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  const fetchInvoiceDetail = async () => {
    try {
      setLoading(true);
      const result = await api.get(`/invoices/${id}`);
      if (result.success) {
        setInvoice(result.data);
        setPaymentAmount(String(result.data.balance || 0));
      }
    } catch (error) {
      toast.error(error.message || 'Failed to fetch invoice details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoiceDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="py-20 flex justify-center bg-white shadow-card rounded-card">
        <LoadingSpinner />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="bg-white shadow-card rounded-card p-8 text-center text-muted">
        Invoice not found
      </div>
    );
  }

  const formatCurrency = (value) => new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value || 0);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    setIsGeneratingPDF(true);
    
    // Brief timeout for UX (show loading state)
    setTimeout(() => {
      const pdfData = {
        invoiceNumber: invoice.invoiceNumber,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        customer: {
          name: invoice.customer?.name || 'N/A',
          company: invoice.customer?.company || '',
          gstNumber: invoice.customer?.gstNumber || '',
          billingAddress: invoice.customer?.billingAddress || {
            street: '',
            city: '',
            state: '',
            pincode: '',
          },
        },
        items: (invoice.items || []).map(item => ({
          itemName: item.itemName,
          size: '',
          grade: item.grade || '',
          quantity: item.quantity,
          unit: item.unit,
          rate: item.unitPrice,
          amount: item.subtotal,
        })),
        subtotal: invoice.subtotal,
        cgst: invoice.cgst,
        sgst: invoice.sgst,
        igst: invoice.igst,
        totalTax: invoice.totalTax,
        grandTotal: invoice.grandTotal,
        amountPaid: invoice.amountPaid,
        balance: invoice.balance,
        status: invoice.status,
        termsAndConditions: invoice.termsAndConditions || 'Payment due within 30 days',
        notes: invoice.notes || '',
      };

      generateInvoicePDF(pdfData);
      setIsGeneratingPDF(false);
    }, 300);
  };

  const handleOpenPaymentModal = () => {
    setPaymentAmount(String(invoice.balance || 0));
    setPaymentMode('Bank Transfer');
    setPaymentReference('');
    setPaymentNotes('');
    setIsPaymentModalOpen(true);
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }
    if (parseFloat(paymentAmount) > invoice.balance) {
      toast.error(`Amount exceeds remaining balance (${formatCurrency(invoice.balance)})`);
      return;
    }

    try {
      setIsSubmittingPayment(true);
      const result = await api.post(`/invoices/${invoice.id}/payments`, {
        amount: parseFloat(paymentAmount),
        mode: paymentMode,
        reference: paymentReference.trim() || undefined,
        notes: paymentNotes.trim() || undefined,
        paymentDate: new Date().toISOString()
      });

      if (result.success) {
        toast.success('Payment recorded successfully!');
        setIsPaymentModalOpen(false);
        fetchInvoiceDetail();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to record payment');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const issueDateStr = new Date(invoice.issueDate).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const dueDateStr = new Date(invoice.dueDate).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div>
      {/* Action Buttons */}
      <div className="mb-6 no-print flex gap-3 items-center">
        <Link to="/invoices" className="p-2 rounded-[6px] text-[#5A6473] hover:bg-white hover:text-[#1A1F2E] border border-transparent hover:border-[#E2E6EA] transition-all">
          <ArrowLeft size={18} />
        </Link>
        <button
          onClick={handleDownloadPDF}
          disabled={isGeneratingPDF}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-btn text-sm hover:bg-primary/95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGeneratingPDF ? (
            <>
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </>
          ) : (
            <>
              <Download size={16} />
              Download PDF
            </>
          )}
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 border border-border rounded-btn text-sm hover:bg-gray-50 bg-white"
        >
          <Printer size={16} />
          Print
        </button>
        {invoice.balance > 0 && (
          <button
            onClick={handleOpenPaymentModal}
            className="flex items-center gap-2 px-4 py-2 bg-[#2E7D52] text-white rounded-btn text-sm hover:bg-[#2E7D52]/90 ml-auto font-medium"
          >
            <CreditCard size={16} />
            Record Payment
          </button>
        )}
      </div>

      {/* Invoice Document */}
      <div className="bg-white shadow-card rounded-card p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between mb-8">
          <div>
            <h1 className="text-2xl font-heading font-bold text-[#1A1F2E] mb-2">STEELTRACK PVT. LTD.</h1>
            <p className="text-sm text-muted">123 Industrial Area, Phase 2</p>
            <p className="text-sm text-muted">Mumbai - 400001</p>
            <p className="text-sm text-muted">GST: 27AABCU9603R1ZX</p>
            <p className="text-sm text-muted">Phone: +91 98765 43210</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-heading font-bold text-[#1A1F2E] mb-2">INVOICE</h2>
            <p className="font-mono text-sm font-bold">{invoice.invoiceNumber}</p>
            <p className="text-sm text-muted mt-2">Date: {issueDateStr}</p>
            <p className="text-sm text-muted">Due: {dueDateStr}</p>
          </div>
        </div>

        {/* Bill To */}
        <div className="mb-8 p-4 bg-[#F7F8FA] rounded-btn">
          <p className="text-xs font-medium text-muted mb-2">BILL TO:</p>
          <p className="font-semibold text-[#1A1F2E] text-base">{invoice.customer?.name || 'N/A'}</p>
          {invoice.customer?.company && <p className="text-sm text-muted">{invoice.customer.company}</p>}
          {invoice.customer?.gstNumber && <p className="text-xs text-muted font-mono mt-1">GSTIN: {invoice.customer.gstNumber}</p>}
        </div>

        {/* Items Table */}
        <table className="w-full mb-8 text-sm">
          <thead className="bg-[#F7F8FA]">
            <tr>
              <th className="text-left text-xs font-medium text-muted px-3 py-2">#</th>
              <th className="text-left text-xs font-medium text-muted px-3 py-2">Description</th>
              <th className="text-left text-xs font-medium text-muted px-3 py-2">Qty</th>
              <th className="text-left text-xs font-medium text-muted px-3 py-2">Unit</th>
              <th className="text-left text-xs font-medium text-muted px-3 py-2">Rate</th>
              <th className="text-right text-xs font-medium text-muted px-3 py-2">Amount</th>
            </tr>
          </thead>
          <tbody>
            {(invoice.items || []).map((item, index) => (
              <tr key={index} className="border-t border-border">
                <td className="px-3 py-2 text-sm text-muted">{index + 1}</td>
                <td className="px-3 py-2 text-sm font-medium">{item.itemName}</td>
                <td className="px-3 py-2 text-sm">{item.quantity}</td>
                <td className="px-3 py-2 text-sm text-muted">{item.unit}</td>
                <td className="px-3 py-2 text-sm">{formatCurrency(item.unitPrice)}</td>
                <td className="px-3 py-2 text-sm text-right font-medium">{formatCurrency(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-80">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Subtotal:</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              {invoice.discountAmount > 0 && (
                <div className="flex justify-between text-danger">
                  <span>Discount:</span>
                  <span>- {formatCurrency(invoice.discountAmount)}</span>
                </div>
              )}
              {invoice.cgst > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted">CGST (9%):</span>
                  <span>{formatCurrency(invoice.cgst)}</span>
                </div>
              )}
              {invoice.sgst > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted">SGST (9%):</span>
                  <span>{formatCurrency(invoice.sgst)}</span>
                </div>
              )}
              {invoice.igst > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted">IGST (18%):</span>
                  <span>{formatCurrency(invoice.igst)}</span>
                </div>
              )}
              <div className="h-px bg-border my-2" />
              <div className="flex justify-between text-lg font-heading font-bold text-accent">
                <span>Grand Total:</span>
                <span>{formatCurrency(invoice.grandTotal)}</span>
              </div>
              <div className="flex justify-between text-success font-medium">
                <span>Amount Paid:</span>
                <span>{formatCurrency(invoice.amountPaid)}</span>
              </div>
              <div className="flex justify-between text-danger font-bold">
                <span>Balance Due:</span>
                <span>{formatCurrency(invoice.balance)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border pt-6 grid grid-cols-2 gap-8 text-sm">
          <div>
            <p className="text-muted mb-1">Payment Terms: {invoice.termsAndConditions || '30 Days'}</p>
            <p className="text-muted">Status: <span className={`font-semibold uppercase ${
              invoice.balance === 0 ? 'text-[#2E7D52]' : 'text-[#DC2626]'
            }`}>{invoice.balance === 0 ? 'Paid ✓' : invoice.amountPaid > 0 ? 'Partial' : 'Unpaid'}</span></p>
          </div>
          <div>
            <p className="text-muted mb-1">Bank Name: State Bank of India</p>
            <p className="text-muted">A/C Number: 1234567890123456</p>
            <p className="text-muted">IFSC Code: SBIN0001234</p>
          </div>
        </div>

        {/* Payments History */}
        {invoice.payments && invoice.payments.length > 0 && (
          <div className="border-t border-border pt-6 mt-6">
            <h4 className="text-sm font-semibold text-[#1A1F2E] mb-3">Payments History</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#F7F8FA]">
                  <tr>
                    <th className="text-left px-2 py-1 text-xs text-muted font-medium">Date</th>
                    <th className="text-left px-2 py-1 text-xs text-muted font-medium">Mode</th>
                    <th className="text-left px-2 py-1 text-xs text-muted font-medium">Reference</th>
                    <th className="text-right px-2 py-1 text-xs text-muted font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.payments.map((p, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="px-2 py-1.5 text-muted">
                        {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('en-IN') : 'N/A'}
                      </td>
                      <td className="px-2 py-1.5 font-medium">{p.mode}</td>
                      <td className="px-2 py-1.5 text-muted font-mono text-xs">{p.reference || 'N/A'}</td>
                      <td className="px-2 py-1.5 text-right font-medium text-success">{formatCurrency(p.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-card shadow-card w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-lg font-heading font-semibold text-[#1A1F2E]">Record Payment</h3>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-[#9AA3AE] hover:text-[#5A6473]">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
              <FormField label="Amount to Pay (₹)" required>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  max={invoice.balance}
                  step="0.01"
                  min="0.01"
                  className={inputClass()}
                />
              </FormField>

              <FormField label="Payment Mode" required>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className={inputClass()}
                >
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                  <option value="UPI">UPI</option>
                </select>
              </FormField>

              <FormField label="Transaction / Reference ID">
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="e.g. Txn12345678"
                  className={inputClass()}
                />
              </FormField>

              <FormField label="Notes">
                <textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  rows={2}
                  placeholder="Payment remarks..."
                  className={`${inputClass()} resize-none`}
                />
              </FormField>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 border border-border rounded-btn text-sm font-medium hover:bg-gray-50 text-[#5A6473]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPayment}
                  className="flex items-center gap-2 px-5 py-2 bg-[#2E7D52] hover:bg-[#2E7D52]/90 text-white rounded-btn text-sm font-semibold active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  <Save size={16} />
                  {isSubmittingPayment ? 'Saving...' : 'Save Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
