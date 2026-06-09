import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { TrendingUp, ShoppingCart, Users, Package, AlertTriangle, ArrowRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';
import StatCard from '../../components/ui/StatCard';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { api } from '../../utils/api';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [salesReport, setSalesReport] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);

  const location = useLocation();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  const getTodayDate = () => {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d.toISOString();
  };

  const getSixMonthsAgoDate = () => {
    const d = new Date();
    d.setMonth(d.getMonth() - 5);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [dashRes, salesRes, lowStockRes] = await Promise.all([
          api.get('/reports/dashboard'),
          api.get(`/reports/sales?startDate=${getSixMonthsAgoDate()}&endDate=${getTodayDate()}&period=month`),
          api.get('/inventory/low-stock'),
        ]);

        if (dashRes.success) setData(dashRes.data);
        if (salesRes.success) setSalesReport(salesRes.data);
        if (lowStockRes.success) setLowStock(lowStockRes.data);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [location.key]);

  if (loading) {
    return <LoadingSpinner />;
  }

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const userName = user?.name || 'User';

  const todayStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Calculate Growth percentages
  const thisMonthVal = data?.sales?.thisMonth?.value || 0;
  const lastMonthVal = data?.sales?.lastMonth?.value || 0;
  const revenueGrowth = lastMonthVal > 0 ? ((thisMonthVal - lastMonthVal) / lastMonthVal) * 100 : 0;

  const thisMonthCount = data?.sales?.thisMonth?.count || 0;
  const lastMonthCount = data?.sales?.lastMonth?.count || 0;
  const ordersGrowth = lastMonthCount > 0 ? ((thisMonthCount - lastMonthCount) / lastMonthCount) * 100 : 0;

  // Chart Formatting
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const chartData = salesReport?.salesData?.map(item => ({
    month: monthNames[item._id.month - 1] || `${item._id.month}/${item._id.year}`,
    revenue: item.totalValue,
    orders: item.orderCount
  })) || [];

  const recentOrders = data?.recentOrders || [];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-[#1A1F2E]">
          {getGreeting()}, {userName} 👋
        </h1>
        <p className="text-sm text-muted mt-1">{todayStr}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Revenue (This Month)"
          value={formatCurrency(thisMonthVal)}
          icon={TrendingUp}
          growth={parseFloat(revenueGrowth.toFixed(1))}
          growthLabel="vs last month"
          iconColor="bg-orange-100 text-accent"
        />
        <StatCard
          title="Orders (This Month)"
          value={thisMonthCount.toLocaleString()}
          icon={ShoppingCart}
          growth={parseFloat(ordersGrowth.toFixed(1))}
          growthLabel="vs last month"
          iconColor="bg-blue-100 text-blue-600"
        />
        <StatCard
          title="Total Customers"
          value={(data?.customers?.total || 0).toLocaleString()}
          icon={Users}
          iconColor="bg-green-100 text-green-600"
        />
        <StatCard
          title="Inventory Items"
          value={`${data?.inventory?.totalItems || 0} SKUs`}
          icon={Package}
          iconColor="bg-purple-100 text-purple-600"
        />
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white shadow-card rounded-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-heading font-semibold text-[#1A1F2E]">Recent Orders</h3>
            <Link to="/orders" className="text-sm text-accent hover:text-accent-hover flex items-center gap-1">
              View All Orders <ArrowRight size={14} />
            </Link>
          </div>
          <div className="overflow-x-auto rounded-b-[8px]">
            {recentOrders.length === 0 ? (
              <p className="text-sm text-muted py-4 text-center">No recent orders found</p>
            ) : (
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs font-medium text-muted pb-3">Order Number</th>
                    <th className="text-left text-xs font-medium text-muted pb-3">Customer</th>
                    <th className="text-left text-xs font-medium text-muted pb-3">Amount</th>
                    <th className="text-left text-xs font-medium text-muted pb-3">Status</th>
                    <th className="text-left text-xs font-medium text-muted pb-3">Date</th>
                    <th className="text-left text-xs font-medium text-muted pb-3">Action</th>
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
                      <tr key={order.id} className="border-b border-border hover:bg-[#F7F8FA]">
                        <td className="py-3">
                          <Link to={`/orders/${order.id}`} className="font-mono text-xs text-accent hover:underline">
                            {order.orderNumber}
                          </Link>
                        </td>
                        <td className="py-3 text-sm">{order.customer?.name || 'N/A'}</td>
                        <td className="py-3 text-sm font-medium">{formatCurrency(order.grandTotal)}</td>
                        <td className="py-3">
                          <StatusBadge status={order.status} />
                        </td>
                        <td className="py-3 text-sm text-muted">{orderDate}</td>
                        <td className="py-3">
                          <Link
                            to={`/orders/${order.id}`}
                            className="text-sm text-primary hover:text-primary-hover"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white shadow-card rounded-card p-5 border-l-4 border-danger">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={20} className="text-danger" />
            <h3 className="text-lg font-heading font-semibold text-[#1A1F2E]">Low Stock Alerts</h3>
          </div>
          <div className="space-y-3">
            {lowStock.length === 0 ? (
              <p className="text-sm text-muted py-4 text-center">All items are sufficiently stocked</p>
            ) : (
              lowStock.slice(0, 5).map((item) => (
                <div key={item.id} className="pb-3 border-b border-border last:border-0">
                  <p className="text-sm font-medium text-[#1A1F2E] mb-1">{item.name}</p>
                  <p className="text-xs text-muted mb-2">
                    {item.stockQty} {item.unit} remaining
                  </p>
                  <Link 
                    to={`/inventory/${item.id}/edit`}
                    className="text-xs bg-warning-bg text-warning px-3 py-1 rounded-btn hover:bg-warning/10"
                  >
                    Restock
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white shadow-card rounded-card p-5">
        <h3 className="text-lg font-heading font-semibold text-[#1A1F2E] mb-4">
          Revenue Overview
        </h3>
        {chartData.length === 0 ? (
          <p className="text-sm text-muted py-8 text-center">No sales history available</p>
        ) : (
          <ResponsiveContainer width="100%" height={280} className="min-h-[200px] md:min-h-[280px]">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E85D26" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#E85D26" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E6EA" />
              <XAxis dataKey="month" stroke="#9AA3AE" style={{ fontSize: '12px' }} />
              <YAxis 
                stroke="#9AA3AE" 
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
              />
              <Tooltip 
                formatter={(value) => [formatCurrency(value), 'Revenue']}
                contentStyle={{ borderRadius: '6px', border: '1px solid #E2E6EA' }}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#E85D26" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
