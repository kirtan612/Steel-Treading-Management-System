import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Search, Eye, ShoppingCart } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { api } from '../../utils/api';

export default function OrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const result = await api.get('/orders?limit=100');
      if (result.success) {
        setOrders(result.data.orders || []);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const mapStatusLabel = (status) => {
    if (status === 'draft') return 'Pending';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const mappedFilter = statusFilter === 'Pending' ? 'draft' : statusFilter.toLowerCase();
    const matchesStatus = statusFilter === 'All' || order.status === mappedFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (value) => new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value || 0);

  const statusCounts = {
    'All': orders.length,
    'Pending': orders.filter(o => o.status === 'draft').length,
    'Confirmed': orders.filter(o => o.status === 'confirmed').length,
    'Dispatched': orders.filter(o => o.status === 'dispatched').length,
    'Delivered': orders.filter(o => o.status === 'delivered').length,
    'Cancelled': orders.filter(o => o.status === 'cancelled').length,
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
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA3AE]" />
          <input
            type="text"
            placeholder="Search by order number or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-20 bg-white shadow-card rounded-card flex justify-center">
          <LoadingSpinner />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white shadow-card rounded-card">
          <EmptyState 
            icon={ShoppingCart}
            title={searchTerm || statusFilter !== 'All' ? "No orders found" : "No orders yet"}
            message={searchTerm || statusFilter !== 'All' ? "No orders match your current filters" : "Create your first order to get started"}
            actionLabel={searchTerm || statusFilter !== 'All' ? "Clear Filters" : "Create Order"}
            onAction={() => {
              if (searchTerm || statusFilter !== 'All') {
                setSearchTerm('');
                setStatusFilter('All');
              } else {
                navigate('/orders/new');
              }
            }}
          />
        </div>
      ) : (
        <div className="bg-white shadow-card rounded-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-[#F7F8FA]">
                <tr>
                  <th className="text-left text-xs font-medium text-muted px-4 py-3">Order Number</th>
                  <th className="text-left text-xs font-medium text-muted px-4 py-3">Customer</th>
                  <th className="text-left text-xs font-medium text-muted px-4 py-3 hidden sm:table-cell">Date</th>
                  <th className="text-left text-xs font-medium text-muted px-4 py-3 hidden md:table-cell">Items</th>
                  <th className="text-left text-xs font-medium text-muted px-4 py-3">Amount</th>
                  <th className="text-left text-xs font-medium text-muted px-4 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-muted px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  });
                  return (
                    <tr key={order.id} className="border-t border-border hover:bg-[#F7F8FA]">
                      <td className="px-4 py-3">
                        <Link
                          to={`/orders/${order.id}`}
                          className="font-mono text-xs text-accent hover:underline"
                        >
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm">{order.customer?.name || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-muted hidden sm:table-cell">{orderDate}</td>
                      <td className="px-4 py-3 text-sm hidden md:table-cell">{(order.items || []).length} items</td>
                      <td className="px-4 py-3 text-sm font-medium">{formatCurrency(order.grandTotal)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={mapStatusLabel(order.status)} />
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
