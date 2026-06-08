import { TrendingUp, ShoppingCart, Users, Package, AlertTriangle, ArrowRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line } from 'recharts';
import { Link } from 'react-router-dom';
import StatCard from '../../components/ui/StatCard';
import StatusBadge from '../../components/ui/StatusBadge';
import { mockDashboardStats, mockOrders, mockInventory, mockRevenueChart } from '../../data/mockData';

export default function DashboardPage() {
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
    }).format(value);
  };

  const recentOrders = mockOrders.slice(0, 6);
  const lowStockItems = mockInventory.filter(item => item.stockQty <= item.reorderLevel);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-[#1A1F2E]">
          {getGreeting()}, Admin 👋
        </h1>
        <p className="text-sm text-muted mt-1">Friday, 29 May 2025</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(mockDashboardStats.totalRevenue)}
          icon={TrendingUp}
          growth={mockDashboardStats.revenueGrowth}
          growthLabel="vs last month"
          iconColor="bg-orange-100 text-accent"
        />
        <StatCard
          title="Total Orders"
          value={mockDashboardStats.totalOrders.toLocaleString()}
          icon={ShoppingCart}
          growth={mockDashboardStats.ordersGrowth}
          growthLabel="vs last month"
          iconColor="bg-blue-100 text-blue-600"
        />
        <StatCard
          title="Total Customers"
          value={mockDashboardStats.totalCustomers.toLocaleString()}
          icon={Users}
          growth={mockDashboardStats.customersGrowth}
          growthLabel="vs last month"
          iconColor="bg-green-100 text-green-600"
        />
        <StatCard
          title="Inventory Items"
          value={`${mockDashboardStats.inventoryItems} SKUs`}
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
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted pb-3">Order ID</th>
                  <th className="text-left text-xs font-medium text-muted pb-3">Customer</th>
                  <th className="text-left text-xs font-medium text-muted pb-3">Amount</th>
                  <th className="text-left text-xs font-medium text-muted pb-3">Status</th>
                  <th className="text-left text-xs font-medium text-muted pb-3">Date</th>
                  <th className="text-left text-xs font-medium text-muted pb-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-border hover:bg-[#F7F8FA]">
                    <td className="py-3">
                      <Link to={`/orders/${order.id}`} className="font-mono text-xs text-accent hover:underline">
                        {order.id}
                      </Link>
                    </td>
                    <td className="py-3 text-sm">{order.customerName}</td>
                    <td className="py-3 text-sm font-medium">{formatCurrency(order.grandTotal)}</td>
                    <td className="py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="py-3 text-sm text-muted">{order.orderDate}</td>
                    <td className="py-3">
                      <Link
                        to={`/orders/${order.id}`}
                        className="text-sm text-primary hover:text-primary-hover"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white shadow-card rounded-card p-5 border-l-4 border-danger">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={20} className="text-danger" />
            <h3 className="text-lg font-heading font-semibold text-[#1A1F2E]">Low Stock Alerts</h3>
          </div>
          <div className="space-y-3">
            {lowStockItems.map((item) => (
              <div key={item.id} className="pb-3 border-b border-border last:border-0">
                <p className="text-sm font-medium text-[#1A1F2E] mb-1">{item.name}</p>
                <p className="text-xs text-muted mb-2">
                  {item.stockQty} {item.unit} remaining
                </p>
                <button className="text-xs bg-warning-bg text-warning px-3 py-1 rounded-btn hover:bg-warning/10">
                  Reorder
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white shadow-card rounded-card p-5">
        <h3 className="text-lg font-heading font-semibold text-[#1A1F2E] mb-4">
          Revenue Overview — Last 6 Months
        </h3>
        <ResponsiveContainer width="100%" height={280} className="min-h-[200px] md:min-h-[280px]">
          <AreaChart data={mockRevenueChart}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#E85D26" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#E85D26" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E6EA" />
            <XAxis dataKey="month" stroke="#9AA3AE" style={{ fontSize: '12px' }} />
            <YAxis 
              yAxisId="left"
              stroke="#9AA3AE" 
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke="#1B3A5C" 
              style={{ fontSize: '12px' }}
            />
            <Tooltip 
              formatter={(value, name) => {
                if (name === 'revenue') return [formatCurrency(value), 'Revenue'];
                return [value, 'Orders'];
              }}
              contentStyle={{ borderRadius: '6px', border: '1px solid #E2E6EA' }}
            />
            <Area 
              yAxisId="left"
              type="monotone" 
              dataKey="revenue" 
              stroke="#E85D26" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorRevenue)" 
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="orders" 
              stroke="#1B3A5C" 
              strokeWidth={2}
              dot={{ fill: '#1B3A5C', r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
