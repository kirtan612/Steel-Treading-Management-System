import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Download } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import { mockInvoices } from '../../data/mockData';

export default function InvoicesPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredInvoices = statusFilter === 'All' 
    ? mockInvoices 
    : mockInvoices.filter(inv => inv.status === statusFilter);

  const formatCurrency = (value) => new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value);

  const statusCounts = {
    'All': mockInvoices.length,
    'Paid': mockInvoices.filter(i => i.status === 'Paid').length,
    'Partial': mockInvoices.filter(i => i.status === 'Partial').length,
    'Unpaid': mockInvoices.filter(i => i.status === 'Unpaid').length,
    'Overdue': mockInvoices.filter(i => i.status === 'Overdue').length,
  };

  return (
    <div>
      <PageHeader title="Invoices" subtitle="Manage customer invoices" />

      {/* Summary Chips */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {Object.entries(statusCounts).map(([status, count]) => (
          <div key={status} className="bg-white shadow-card rounded-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2 h-2 rounded-full ${
                status === 'Paid' ? 'bg-success' :
                status === 'Partial' ? 'bg-warning' :
                status === 'Unpaid' ? 'bg-danger' :
                status === 'Overdue' ? 'bg-danger' : 'bg-primary'
              }`} />
              <p className="text-xs text-muted">{status}</p>
            </div>
            <p className="text-xl font-heading font-bold">{count}</p>
          </div>
        ))}
      </div>

      {/* Status Filter */}
      <div className="bg-white shadow-card rounded-card p-4 mb-6">
        <div className="flex items-center gap-2 overflow-x-auto">
          {Object.keys(statusCounts).map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-btn text-sm font-medium whitespace-nowrap ${
                statusFilter === status
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-[#1A1F2E] hover:bg-gray-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow-card rounded-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F7F8FA]">
              <tr>
                <th className="text-left text-xs font-medium text-muted px-4 py-3">Invoice #</th>
                <th className="text-left text-xs font-medium text-muted px-4 py-3">Customer</th>
                <th className="text-left text-xs font-medium text-muted px-4 py-3">Order ID</th>
                <th className="text-left text-xs font-medium text-muted px-4 py-3">Issue Date</th>
                <th className="text-left text-xs font-medium text-muted px-4 py-3">Due Date</th>
                <th className="text-left text-xs font-medium text-muted px-4 py-3">Amount</th>
                <th className="text-left text-xs font-medium text-muted px-4 py-3">Paid</th>
                <th className="text-left text-xs font-medium text-muted px-4 py-3">Balance</th>
                <th className="text-left text-xs font-medium text-muted px-4 py-3">Status</th>
                <th className="text-left text-xs font-medium text-muted px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="border-t border-border hover:bg-[#F7F8FA]">
                  <td className="px-4 py-3">
                    <button
                      onClick={() => navigate(`/invoices/${invoice.id}`)}
                      className="font-mono text-xs text-accent hover:underline"
                    >
                      {invoice.id}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm">{invoice.customerName}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-muted">{invoice.orderId}</span>
                  </td>
                  <td className="px-4 py-3 text-sm">{invoice.issueDate}</td>
                  <td className="px-4 py-3 text-sm">{invoice.dueDate}</td>
                  <td className="px-4 py-3 text-sm font-medium">{formatCurrency(invoice.grandTotal)}</td>
                  <td className="px-4 py-3 text-sm">{formatCurrency(invoice.amountPaid)}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={invoice.balance > 0 ? 'text-danger font-medium' : ''}>
                      {formatCurrency(invoice.balance)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={invoice.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/invoices/${invoice.id}`)}
                        className="text-primary hover:text-primary-hover"
                        title="View"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => alert('PDF download will be available in Phase 5')}
                        className="text-muted hover:text-[#1A1F2E]"
                        title="Download"
                      >
                        <Download size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
