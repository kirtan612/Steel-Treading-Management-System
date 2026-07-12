import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, MapPin, FileText, X, CreditCard, Receipt } from 'lucide-react';
import toast from 'react-hot-toast';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { api } from '../../utils/api';

export default function CustomerDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [ledgerData, setLedgerData] = useState(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  useEffect(() => {
    const fetchCustomerDetail = async () => {
      try {
        setLoading(true);
        const result = await api.get(`/customers/${id}`);
        if (result.success) {
          setData(result.data);
        }
      } catch (error) {
        toast.error(error.message || 'Failed to fetch customer details');
      } finally {
        setLoading(false);
      }
    };
    fetchCustomerDetail();
  }, [id]);

  const fetchLedger = async () => {
    try {
      setLedgerLoading(true);
      const result = await api.get(`/customers/${id}/ledger`);
      if (result.success) {
        setLedgerData(result.data);
        setLedgerOpen(true);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to fetch customer ledger');
    } finally {
      setLedgerLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center bg-white shadow-card rounded-card">
        <LoadingSpinner />
      </div>
    );
  }

  if (!data || !data.customer) {
    return (
      <div className="bg-white shadow-card rounded-card p-8 text-center text-muted">
        Customer not found
      </div>
    );
  }

  const { customer, stats, recentOrders = [] } = data;

  const formatCurrency = (value) => new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value || 0);

  const getTypeBadgeColor = (type) => {
    const colors = {
      'Wholesale': 'bg-blue-100 text-blue-700',
      'Industrial': 'bg-purple-100 text-purple-700',
      'Contractor': 'bg-amber-100 text-amber-700',
      'Retail': 'bg-gray-100 text-gray-700'
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  const nameInitials = customer.name
    ? customer.name.split(' ').map(n => n[0]).join('').slice(0, 2)
    : 'C';

  const address = customer.billingAddress || {};
  const hasAddress = address.street || address.city || address.state || address.pincode;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link to="/customers" className="inline-flex items-center gap-2 text-sm text-muted hover:text-[#1A1F2E] mb-3">
          <ArrowLeft size={16} />
          Back to Customers
        </Link>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h2 className="text-xl sm:text-2xl font-heading font-bold text-[#1A1F2E]">{customer.name}</h2>
          <button
            onClick={fetchLedger}
            disabled={ledgerLoading}
            className="w-full sm:w-auto px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
          >
            {ledgerLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <FileText size={16} />
                View Ledger
              </>
            )}
          </button>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-white shadow-card rounded-card p-6 mb-6">
        <div className="flex flex-col md:flex-row items-start gap-6">
          <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold flex-shrink-0">
            {nameInitials}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-heading font-bold text-[#1A1F2E] mb-1">{customer.name}</h3>
            {customer.company && <p className="text-lg text-muted mb-3">{customer.company}</p>}
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <Phone size={16} className="text-muted" />
                <span>{customer.phone}</span>
              </div>
              {customer.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail size={16} className="text-muted" />
                  <span>{customer.email}</span>
                </div>
              )}
              {hasAddress && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin size={16} className="text-muted" />
                  <span>
                    {address.street ? `${address.street}, ` : ''}
                    {address.city ? `${address.city}, ` : ''}
                    {address.state ? `${address.state} ` : ''}
                    {address.pincode ? `- ${address.pincode}` : ''}
                  </span>
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {customer.gstNumber && (
                <span className="font-mono text-sm text-muted">GST: {customer.gstNumber}</span>
              )}
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getTypeBadgeColor(customer.customerType)}`}>
                {customer.customerType}
              </span>
              <span className="text-sm text-muted">Payment Terms: {customer.paymentTerms || '30 days'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white shadow-card rounded-card p-4">
          <p className="text-sm text-muted mb-1">Total Orders</p>
          <p className="text-2xl font-heading font-bold text-[#1A1F2E]">{stats.totalOrders || 0}</p>
        </div>
        <div className="bg-white shadow-card rounded-card p-4">
          <p className="text-sm text-muted mb-1">Total Sales</p>
          <p className="text-2xl font-heading font-bold text-success">{formatCurrency(stats.totalRevenue)}</p>
        </div>
        <div className="bg-white shadow-card rounded-card p-4">
          <p className="text-sm text-muted mb-1">Credit Limit</p>
          <p className="text-2xl font-heading font-bold text-[#1A1F2E]">{formatCurrency(customer.creditLimit)}</p>
        </div>
      </div>

      {/* Order History */}
      <div className="bg-white shadow-card rounded-card p-5">
        <h3 className="text-lg font-heading font-semibold text-[#1A1F2E] mb-4">Recent Orders</h3>
        <div className="overflow-x-auto">
          {recentOrders.length === 0 ? (
            <p className="text-sm text-muted py-4 text-center">No order history found</p>
          ) : (
            <table className="w-full">
              <thead className="bg-[#F7F8FA]">
                <tr>
                  <th className="text-left text-xs font-medium text-muted px-4 py-3">Order Number</th>
                  <th className="text-left text-xs font-medium text-muted px-4 py-3">Date</th>
                  <th className="text-left text-xs font-medium text-muted px-4 py-3">Amount</th>
                  <th className="text-left text-xs font-medium text-muted px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => {
                  const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  });
                  return (
                    <tr key={order.id} className="border-t border-border hover:bg-[#F7F8FA]">
                      <td className="px-4 py-3">
                        <Link to={`/orders/${order.id}`} className="font-mono text-xs text-accent hover:underline">
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm">{orderDate}</td>
                      <td className="px-4 py-3 text-sm font-medium">{formatCurrency(order.grandTotal)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={order.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Ledger Modal */}
      {ledgerOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-xl font-heading font-bold text-[#1A1F2E]">Customer Ledger</h3>
                <p className="text-muted text-sm">{customer?.name}</p>
              </div>
              <button
                onClick={() => setLedgerOpen(false)}
                className="p-2 hover:bg-[#F7F8FA] rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {!ledgerData ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Financial Summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-600 mb-1">Total Purchase Amount</p>
                      <p className="text-xl font-bold text-blue-800">{formatCurrency(ledgerData.summary.totalPurchases)}</p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-sm text-green-600 mb-1">Total Paid</p>
                      <p className="text-xl font-bold text-green-800">{formatCurrency(ledgerData.summary.totalPaid)}</p>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <p className="text-sm text-orange-600 mb-1">Outstanding Balance</p>
                      <p className="text-xl font-bold text-orange-800">{formatCurrency(ledgerData.summary.outstandingBalance)}</p>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <p className="text-sm text-purple-600 mb-1">Credit Available</p>
                      <p className="text-xl font-bold text-purple-800">{formatCurrency(ledgerData.summary.creditAvailable)}</p>
                    </div>
                  </div>

                  {/* Credit Summary */}
                  {ledgerData.summary.creditLimit > 0 && (
                    <div className="bg-white border border-border rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-[#1A1F2E] mb-3">Credit Summary</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span>Credit Limit</span>
                          <span className="font-medium">{formatCurrency(ledgerData.summary.creditLimit)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Credit Used</span>
                          <span className="font-medium">{formatCurrency(ledgerData.summary.creditUsed)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${ledgerData.summary.creditUtilization > 80 ? 'bg-red-500' : ledgerData.summary.creditUtilization > 60 ? 'bg-orange-500' : 'bg-green-500'}`}
                            style={{ width: `${Math.min(100, ledgerData.summary.creditUtilization)}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-muted">
                          <span>Utilization: {ledgerData.summary.creditUtilization.toFixed(1)}%</span>
                          <span>Available: {formatCurrency(ledgerData.summary.creditAvailable)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Invoice History */}
                  <div className="bg-white border border-border rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-[#1A1F2E] mb-4 flex items-center gap-2">
                      <Receipt size={20} />
                      Invoice History
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[640px]">
                        <thead className="bg-[#F7F8FA]">
                          <tr>
                            <th className="text-left text-xs font-medium text-muted px-3 py-2">Invoice #</th>
                            <th className="text-left text-xs font-medium text-muted px-3 py-2">Date</th>
                            <th className="text-left text-xs font-medium text-muted px-3 py-2">Due Date</th>
                            <th className="text-right text-xs font-medium text-muted px-3 py-2">Amount</th>
                            <th className="text-right text-xs font-medium text-muted px-3 py-2 hidden sm:table-cell">Paid</th>
                            <th className="text-right text-xs font-medium text-muted px-3 py-2">Balance</th>
                            <th className="text-left text-xs font-medium text-muted px-3 py-2">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ledgerData.invoices.length === 0 ? (
                            <tr>
                              <td colSpan="7" className="px-3 py-8 text-center text-muted">
                                No invoices found
                              </td>
                            </tr>
                          ) : (
                            ledgerData.invoices.map((invoice) => (
                              <tr key={invoice.id} className="border-t border-border hover:bg-[#F7F8FA]">
                                <td className="px-3 py-3">
                                  <Link 
                                    to={`/invoices/${invoice.id}`}
                                    className="font-mono text-xs text-accent hover:underline"
                                  >
                                    {invoice.invoiceNumber}
                                  </Link>
                                </td>
                                <td className="px-3 py-3 text-sm">
                                  {new Date(invoice.issueDate).toLocaleDateString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                  })}
                                </td>
                                <td className="px-3 py-3 text-sm">
                                  {new Date(invoice.dueDate).toLocaleDateString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                  })}
                                </td>
                                <td className="px-3 py-3 text-sm text-right font-medium">
                                  {formatCurrency(invoice.amount)}
                                </td>
                                <td className="px-3 py-3 text-sm text-right text-green-600 hidden sm:table-cell">
                                  {formatCurrency(invoice.paid)}
                                </td>
                                <td className="px-3 py-3 text-sm text-right font-medium">
                                  {formatCurrency(invoice.balance)}
                                </td>
                                <td className="px-3 py-3">
                                  <StatusBadge status={invoice.status} />
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Payment History */}
                  <div className="bg-white border border-border rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-[#1A1F2E] mb-4 flex items-center gap-2">
                      <CreditCard size={20} />
                      Payment History
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[640px]">
                        <thead className="bg-[#F7F8FA]">
                          <tr>
                            <th className="text-left text-xs font-medium text-muted px-3 py-2">Date</th>
                            <th className="text-left text-xs font-medium text-muted px-3 py-2">Invoice #</th>
                            <th className="text-right text-xs font-medium text-muted px-3 py-2">Amount</th>
                            <th className="text-left text-xs font-medium text-muted px-3 py-2 hidden sm:table-cell">Method</th>
                            <th className="text-left text-xs font-medium text-muted px-3 py-2 hidden sm:table-cell">Reference</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ledgerData.paymentHistory.length === 0 ? (
                            <tr>
                              <td colSpan="5" className="px-3 py-8 text-center text-muted">
                                No payments found
                              </td>
                            </tr>
                          ) : (
                            ledgerData.paymentHistory.map((payment) => (
                              <tr key={payment.id} className="border-t border-border hover:bg-[#F7F8FA]">
                                <td className="px-3 py-3 text-sm">
                                  {new Date(payment.date).toLocaleDateString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                  })}
                                </td>
                                <td className="px-3 py-3">
                                  <Link 
                                    to={`/invoices/${payment.invoiceId}`}
                                    className="font-mono text-xs text-accent hover:underline"
                                  >
                                    {payment.invoiceNumber}
                                  </Link>
                                </td>
                                <td className="px-3 py-3 text-sm text-right font-medium text-green-600">
                                  {formatCurrency(payment.amount)}
                                </td>
                                <td className="px-3 py-3 text-sm hidden sm:table-cell">
                                  {payment.method || 'Cash'}
                                </td>
                                <td className="px-3 py-3 text-sm text-muted hidden sm:table-cell">
                                  {payment.reference || '-'}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
