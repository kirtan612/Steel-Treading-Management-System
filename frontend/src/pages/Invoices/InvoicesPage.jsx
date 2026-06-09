import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, Download, FileText } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { api } from '../../utils/api';

export default function InvoicesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const result = await api.get('/invoices?limit=100');
      if (result.success) {
        setInvoices(result.data.invoices || []);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [location.key]);

  const getInvoiceStatus = (inv) => {
    const status = inv.status?.toLowerCase() || '';
    if (status === 'paid') return 'Paid';
    if (status === 'partial') return 'Partial';
    
    const isOverdue = new Date(inv.dueDate) < new Date();
    if (isOverdue && status !== 'paid') return 'Overdue';
    
    return 'Unpaid';
  };

  const statusCounts = {
    'All': invoices.length,
    'Paid': invoices.filter(i => getInvoiceStatus(i) === 'Paid').length,
    'Partial': invoices.filter(i => getInvoiceStatus(i) === 'Partial').length,
    'Unpaid': invoices.filter(i => getInvoiceStatus(i) === 'Unpaid').length,
    'Overdue': invoices.filter(i => getInvoiceStatus(i) === 'Overdue').length,
  };

  const filteredInvoices = invoices.filter(inv => {
    const invStatus = getInvoiceStatus(inv);
    return statusFilter === 'All' || invStatus === statusFilter;
  });

  const formatCurrency = (value) => new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value || 0);

  return (
    <div>
      <PageHeader title="Invoices" subtitle="Manage customer invoices" />

      {/* Summary Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {Object.entries(statusCounts).map(([status, count]) => (
          <div key={status} className="bg-white shadow-card rounded-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2 h-2 rounded-full ${
                status === 'Paid' ? 'bg-[#2E7D52]' :
                status === 'Partial' ? 'bg-[#D97706]' :
                status === 'Unpaid' ? 'bg-[#DC2626]' :
                status === 'Overdue' ? 'bg-[#DC2626]' : 'bg-primary'
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
      {loading ? (
        <div className="py-20 bg-white shadow-card rounded-card flex justify-center">
          <LoadingSpinner />
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="bg-white shadow-card rounded-card">
          <EmptyState 
            icon={FileText}
            title={statusFilter !== 'All' ? "No invoices found" : "No invoices yet"}
            message={statusFilter !== 'All' ? "No invoices match your current filter" : "Invoices will appear here once orders are confirmed and fulfilled"}
            actionLabel={statusFilter !== 'All' ? "Clear Filter" : null}
            onAction={statusFilter !== 'All' ? () => setStatusFilter('All') : null}
          />
        </div>
      ) : (
        <div className="bg-white shadow-card rounded-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[768px]">
              <thead className="bg-[#F7F8FA]">
                <tr>
                  <th className="text-left text-xs font-medium text-muted px-4 py-3">Invoice #</th>
                  <th className="text-left text-xs font-medium text-muted px-4 py-3">Customer</th>
                  <th className="text-left text-xs font-medium text-muted px-4 py-3 hidden md:table-cell">Order ID</th>
                  <th className="text-left text-xs font-medium text-muted px-4 py-3 hidden sm:table-cell">Issue Date</th>
                  <th className="text-left text-xs font-medium text-muted px-4 py-3 hidden lg:table-cell">Due Date</th>
                  <th className="text-left text-xs font-medium text-muted px-4 py-3">Amount</th>
                  <th className="text-left text-xs font-medium text-muted px-4 py-3 hidden md:table-cell">Paid</th>
                  <th className="text-left text-xs font-medium text-muted px-4 py-3 hidden sm:table-cell">Balance</th>
                  <th className="text-left text-xs font-medium text-muted px-4 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-muted px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice) => {
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
                    <tr key={invoice.id} className="border-t border-border hover:bg-[#F7F8FA]">
                      <td className="px-4 py-3">
                        <Link
                          to={`/invoices/${invoice.id}`}
                          className="font-mono text-xs text-accent hover:underline font-bold"
                        >
                          {invoice.invoiceNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm">{invoice.customer?.name || 'N/A'}</td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {invoice.order ? (
                          <Link to={`/orders/${invoice.order.id}`} className="font-mono text-xs text-accent hover:underline">
                            {invoice.order.orderNumber}
                          </Link>
                        ) : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm hidden sm:table-cell">{issueDateStr}</td>
                      <td className="px-4 py-3 text-sm hidden lg:table-cell">{dueDateStr}</td>
                      <td className="px-4 py-3 text-sm font-medium">{formatCurrency(invoice.grandTotal)}</td>
                      <td className="px-4 py-3 text-sm hidden md:table-cell">{formatCurrency(invoice.amountPaid)}</td>
                      <td className="px-4 py-3 text-sm hidden sm:table-cell">
                        <span className={invoice.balance > 0 ? 'text-danger font-medium' : ''}>
                          {formatCurrency(invoice.balance)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={getInvoiceStatus(invoice)} />
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
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
