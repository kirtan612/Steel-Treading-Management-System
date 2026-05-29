import { useParams } from 'react-router-dom';
import { Printer } from 'lucide-react';
import { mockInvoices, mockOrders } from '../../data/mockData';

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const invoice = mockInvoices.find(i => i.id === id);
  const order = mockOrders.find(o => o.id === invoice?.orderId);

  if (!invoice || !order) return <div>Invoice not found</div>;

  const formatCurrency = (value) => new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      {/* Print Button */}
      <div className="mb-6 no-print">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 border border-border rounded-btn text-sm hover:bg-gray-50"
        >
          <Printer size={16} />
          Print / Download PDF
        </button>
      </div>

      {/* Invoice Document */}
      <div className="bg-white shadow-card rounded-card p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between mb-8">
          <div>
            <h1 className="text-2xl font-heading font-bold text-[#1A1F2E] mb-2">STEELTRACK PVT. LTD.</h1>
            <p className="text-sm text-muted">47, GIDC Estate, Phase 2</p>
            <p className="text-sm text-muted">Ahmedabad - 382024, Gujarat</p>
            <p className="text-sm text-muted">GST: 24AAACS1234Z1ZP</p>
            <p className="text-sm text-muted">Phone: +91 79 2634 5678</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-heading font-bold text-[#1A1F2E] mb-2">INVOICE</h2>
            <p className="font-mono text-sm font-bold">{invoice.id}</p>
            <p className="text-sm text-muted mt-2">Date: {invoice.issueDate}</p>
            <p className="text-sm text-muted">Due: {invoice.dueDate}</p>
          </div>
        </div>

        {/* Bill To */}
        <div className="mb-8 p-4 bg-[#F7F8FA] rounded-btn">
          <p className="text-xs font-medium text-muted mb-2">BILL TO:</p>
          <p className="font-medium text-[#1A1F2E]">{invoice.customerName}</p>
          <p className="text-sm text-muted font-mono">GST: {invoice.customerGST}</p>
        </div>

        {/* Items Table */}
        <table className="w-full mb-8">
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
            {order.items.map((item, index) => (
              <tr key={index} className="border-t border-border">
                <td className="px-3 py-2 text-sm">{index + 1}</td>
                <td className="px-3 py-2 text-sm">{item.name}</td>
                <td className="px-3 py-2 text-sm">{item.qty}</td>
                <td className="px-3 py-2 text-sm">{item.unit}</td>
                <td className="px-3 py-2 text-sm">{formatCurrency(item.unitPrice)}</td>
                <td className="px-3 py-2 text-sm text-right">{formatCurrency(item.subtotal)}</td>
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
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">CGST (9%):</span>
                <span>{formatCurrency(order.cgst)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">SGST (9%):</span>
                <span>{formatCurrency(order.sgst)}</span>
              </div>
              <div className="h-px bg-border my-2" />
              <div className="flex justify-between text-lg font-heading font-bold">
                <span>Grand Total:</span>
                <span>{formatCurrency(invoice.grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border pt-6 grid grid-cols-2 gap-8 text-sm">
          <div>
            <p className="text-muted mb-1">Payment Terms: {order.paymentTerms || '15 Days'}</p>
            <p className="text-muted">Status: <span className={`font-medium ${
              invoice.status === 'Paid' ? 'text-success' : 'text-danger'
            }`}>{invoice.status} {invoice.status === 'Paid' && '✓'}</span></p>
          </div>
          <div>
            <p className="text-muted mb-1">Bank: State Bank of India, Ahmedabad</p>
            <p className="text-muted">A/C: 12345678901</p>
            <p className="text-muted">IFSC: SBIN0001234</p>
          </div>
        </div>
      </div>
    </div>
  );
}
