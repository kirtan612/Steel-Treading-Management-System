import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { api } from '../../utils/api';

export default function CustomerDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

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
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-heading font-bold text-[#1A1F2E]">{customer.name}</h2>
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
    </div>
  );
}
