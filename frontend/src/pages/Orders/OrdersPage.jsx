import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Eye } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import { mockOrders } from '../../data/mockData';

export default function OrdersPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredOrders = mockOrders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (value) => new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value);

  const statusCounts = {
    'All': mockOrders.length,
    'Pending': mockOrders.filter(o => o.status === 'Pending').length,
    'Confirmed': mockOrders.filter(o => o.status === 'Confirmed').length,
    'Dispatched': mockOrders.filter(o => o.status === 'Dispatched').length,
    'Delivered': mockOrders.filter(o => o.status === 'Delivered').length,
    'Cancelled': mockOrders.filter(o => o.status === 'Cancelled').length,
  };

  return (
    <div>
      <PageHeader
        title="Orders"
        subtitle="Manage customer orders"
        action={{
          label: 'Create Order',
          icon: Plus,
          onClick: () => navigate('/orders/new')
        }}
      />

      {/* Status Tabs */}
      <div className="bg-white shadow-card rounded-card p-4 mb-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {Object.entries(statusCounts).map(([status, count]) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-btn text-sm font-medium whitespace-nowrap transition-colors ${
                statusFilter === status
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-[#1A1F2E] hover:bg-gray-200'
              }`}
            >
              {status} ({count})
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="bg-white shadow-card rounded-card p-4 mb-6">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search by order ID or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow-card rounded-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F7F8FA]">
              <tr>
                <th className="text-left text-xs font-medium text-muted px-4 py-3">Order ID</th>
                <th className="text-left text-xs font-medium text-muted px-4 py-3">Customer</th>
                <th className="text-left text-xs font-medium text-muted px-4 py-3">Date</th>
                <th className="text-left text-xs font-medium text-muted px-4 py-3">Items</th>
                <th className="text-left text-xs font-medium text-muted px-4 py-3">Amount</th>
                <th className="text-left text-xs font-medium text-muted px-4 py-3">Status</th>
                <th className="text-left text-xs font-medium text-muted px-4 py-3">Payment</th>
                <th className="text-left text-xs font-medium text-muted px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className="border-t border-border hover:bg-[#F7F8FA]">
                  <td className="px-4 py-3">
                    <button
                      onClick={() => navigate(`/orders/${order.id}`)}
                      className="font-mono text-xs text-accent hover:underline"
                    >
                      {order.id}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm">{order.customerName}</td>
                  <td className="px-4 py-3 text-sm text-muted">{order.orderDate}</td>
                  <td className="px-4 py-3 text-sm">{order.items.length} items</td>
                  <td className="px-4 py-3 text-sm font-medium">{formatCurrency(order.grandTotal)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={order.paymentStatus} />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => navigate(`/orders/${order.id}`)}
                      className="text-primary hover:text-primary-hover"
                      title="View"
                    >
                      <Eye size={16} />
                    </button>
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
