import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, MapPin, Edit } from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';
import { mockCustomers, mockOrders } from '../../data/mockData';

export default function CustomerDetailPage() {
  const { id } = useParams();
  const customer = mockCustomers.find(c => c.id === id);
  const customerOrders = mockOrders.filter(o => o.customerId === id);

  if (!customer) {
    return <div>Customer not found</div>;
  }

  const formatCurrency = (value) => new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);

  const getTypeBadgeColor = (type) => {
    const colors = {
      'Wholesale': 'bg-blue-100 text-blue-700',
      'Industrial': 'bg-purple-100 text-purple-700',
      'Contractor': 'bg-amber-100 text-amber-700',
      'Retail': 'bg-gray-100 text-gray-700'
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

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
          <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-btn text-sm hover:bg-gray-50">
            <Edit size={16} />
            Edit
          </button>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-white shadow-card rounded-card p-6 mb-6">
        <div className="flex items-start gap-6">
          <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold">
            {customer.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-heading font-bold text-[#1A1F2E] mb-1">{customer.name}</h3>
            <p className="text-lg text-muted mb-3">{customer.company}</p>
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <Phone size={16} className="text-muted" />
                <span>{customer.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail size={16} className="text-muted" />
                <span>{customer.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin size={16} className="text-muted" />
                <span>{customer.city}, {customer.state} - {customer.pincode}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm text-muted">GST: {customer.gstNumber}</span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getTypeBadgeColor(customer.customerType)}`}>
                {customer.customerType}
              </span>
              <span className="text-sm text-muted">Payment Terms: {customer.paymentTerms}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white shadow-card rounded-card p-4">
          <p className="text-sm text-muted mb-1">Total Orders</p>
          <p className="text-2xl font-heading font-bold text-[#1A1F2E]">{customer.totalOrders}</p>
        </div>
        <div className="bg-white shadow-card rounded-card p-4">
          <p className="text-sm text-muted mb-1">Total Revenue</p>
          <p className="text-2xl font-heading font-bold text-success">{formatCurrency(customer.totalRevenue)}</p>
        </div>
        <div className="bg-white shadow-card rounded-card p-4">
          <p className="text-sm text-muted mb-1">Outstanding Balance</p>
          <p className="text-2xl font-heading font-bold text-danger">{formatCurrency(customer.outstanding)}</p>
        </div>
        <div className="bg-white shadow-card rounded-card p-4">
          <p className="text-sm text-muted mb-1">Credit Limit</p>
          <p className="text-2xl font-heading font-bold text-[#1A1F2E]">{formatCurrency(customer.creditLimit)}</p>
        </div>
      </div>

      {/* Order History */}
      <div className="bg-white shadow-card rounded-card p-5">
        <h3 className="text-lg font-heading font-semibold text-[#1A1F2E] mb-4">Order History</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F7F8FA]">
              <tr>
                <th className="text-left text-xs font-medium text-muted px-4 py-3">Order ID</th>
                <th className="text-left text-xs font-medium text-muted px-4 py-3">Date</th>
                <th className="text-left text-xs font-medium text-muted px-4 py-3">Items</th>
                <th className="text-left text-xs font-medium text-muted px-4 py-3">Amount</th>
                <th className="text-left text-xs font-medium text-muted px-4 py-3">Status</th>
                <th className="text-left text-xs font-medium text-muted px-4 py-3">Payment</th>
              </tr>
            </thead>
            <tbody>
              {customerOrders.map((order) => (
                <tr key={order.id} className="border-t border-border hover:bg-[#F7F8FA]">
                  <td className="px-4 py-3">
                    <Link to={`/orders/${order.id}`} className="font-mono text-xs text-accent hover:underline">
                      {order.id}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm">{order.orderDate}</td>
                  <td className="px-4 py-3 text-sm">{order.items.length} items</td>
                  <td className="px-4 py-3 text-sm font-medium">{formatCurrency(order.grandTotal)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={order.paymentStatus} />
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
