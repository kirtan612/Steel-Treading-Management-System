import { useState } from 'react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { mockRevenueChart, mockCustomers, mockInventory, mockOrders } from '../../data/mockData';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('revenue');

  const formatCurrency = (value) => new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);

  const tabs = [
    { id: 'revenue', label: 'Revenue' },
    { id: 'inventory', label: 'Inventory' },
    { id: 'orders', label: 'Orders' },
    { id: 'sales', label: 'Sales' },
  ];

  // Top customers by revenue
  const topCustomers = mockCustomers
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 5);

  // Inventory by type
  const inventoryByType = mockInventory.reduce((acc, item) => {
    const existing = acc.find(i => i.name === item.pipeType);
    const value = item.stockQty * item.sellingPrice;
    if (existing) {
      existing.value += value;
    } else {
      acc.push({ name: item.pipeType, value });
    }
    return acc;
  }, []);

  // Orders by status
  const ordersByStatus = [
    { name: 'Pending', value: mockOrders.filter(o => o.status === 'Pending').length },
    { name: 'Confirmed', value: mockOrders.filter(o => o.status === 'Confirmed').length },
    { name: 'Dispatched', value: mockOrders.filter(o => o.status === 'Dispatched').length },
    { name: 'Delivered', value: mockOrders.filter(o => o.status === 'Delivered').length },
    { name: 'Cancelled', value: mockOrders.filter(o => o.status === 'Cancelled').length },
  ];

  const COLORS = ['#E85D26', '#1B3A5C', '#2E7D52', '#D97706', '#DC2626'];

  return (
    <div>
      <h2 className="text-2xl font-heading font-bold text-[#1A1F2E] mb-6">Reports</h2>

      {/* Tabs */}
      <div className="bg-white shadow-card rounded-card p-4 mb-6">
        <div className="flex items-center gap-2 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-btn text-sm font-medium whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-[#1A1F2E] hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Revenue Tab */}
      {activeTab === 'revenue' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white shadow-card rounded-card p-4">
              <p className="text-sm text-muted mb-1">Total Revenue</p>
              <p className="text-2xl font-heading font-bold text-[#1A1F2E]">{formatCurrency(4825000)}</p>
            </div>
            <div className="bg-white shadow-card rounded-card p-4">
              <p className="text-sm text-muted mb-1">Orders</p>
              <p className="text-2xl font-heading font-bold text-[#1A1F2E]">1,284</p>
            </div>
            <div className="bg-white shadow-card rounded-card p-4">
              <p className="text-sm text-muted mb-1">Avg Order Value</p>
              <p className="text-2xl font-heading font-bold text-[#1A1F2E]">{formatCurrency(3760)}</p>
            </div>
            <div className="bg-white shadow-card rounded-card p-4">
              <p className="text-sm text-muted mb-1">Outstanding</p>
              <p className="text-2xl font-heading font-bold text-danger">{formatCurrency(317500)}</p>
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="bg-white shadow-card rounded-card p-5">
            <h3 className="text-lg font-heading font-semibold text-[#1A1F2E] mb-4">Monthly Revenue</h3>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={mockRevenueChart}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E85D26" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#E85D26" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E6EA" />
                <XAxis dataKey="month" stroke="#9AA3AE" style={{ fontSize: '12px' }} />
                <YAxis stroke="#9AA3AE" style={{ fontSize: '12px' }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}K`} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Area type="monotone" dataKey="revenue" stroke="#E85D26" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Top Customers */}
          <div className="bg-white shadow-card rounded-card p-5">
            <h3 className="text-lg font-heading font-semibold text-[#1A1F2E] mb-4">Top Customers by Revenue</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topCustomers} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E6EA" />
                <XAxis type="number" stroke="#9AA3AE" style={{ fontSize: '12px' }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}K`} />
                <YAxis dataKey="company" type="category" stroke="#9AA3AE" style={{ fontSize: '11px' }} width={150} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="totalRevenue" fill="#E85D26" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Inventory Tab */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white shadow-card rounded-card p-4">
              <p className="text-sm text-muted mb-1">Total SKUs</p>
              <p className="text-2xl font-heading font-bold text-[#1A1F2E]">89</p>
            </div>
            <div className="bg-white shadow-card rounded-card p-4">
              <p className="text-sm text-muted mb-1">Total Stock Value</p>
              <p className="text-2xl font-heading font-bold text-[#1A1F2E]">₹2.4Cr</p>
            </div>
            <div className="bg-white shadow-card rounded-card p-4">
              <p className="text-sm text-muted mb-1">Low Stock</p>
              <p className="text-2xl font-heading font-bold text-warning">6</p>
            </div>
            <div className="bg-white shadow-card rounded-card p-4">
              <p className="text-sm text-muted mb-1">Out of Stock</p>
              <p className="text-2xl font-heading font-bold text-danger">1</p>
            </div>
          </div>

          {/* Pie Chart */}
          <div className="bg-white shadow-card rounded-card p-5">
            <h3 className="text-lg font-heading font-semibold text-[#1A1F2E] mb-4">Stock Value by Type</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={inventoryByType} cx="50%" cy="50%" labelLine={false} label={(entry) => entry.name} outerRadius={100} fill="#8884d8" dataKey="value">
                  {inventoryByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Inventory Table */}
          <div className="bg-white shadow-card rounded-card p-5">
            <h3 className="text-lg font-heading font-semibold text-[#1A1F2E] mb-4">Inventory Value</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#F7F8FA]">
                  <tr>
                    <th className="text-left px-3 py-2 text-xs">Item</th>
                    <th className="text-left px-3 py-2 text-xs">Stock Qty</th>
                    <th className="text-left px-3 py-2 text-xs">Unit Price</th>
                    <th className="text-left px-3 py-2 text-xs">Total Value</th>
                    <th className="text-left px-3 py-2 text-xs">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {mockInventory.slice(0, 5).map(item => (
                    <tr key={item.id} className="border-t border-border">
                      <td className="px-3 py-2">{item.name}</td>
                      <td className="px-3 py-2">{item.stockQty} {item.unit}</td>
                      <td className="px-3 py-2">{formatCurrency(item.sellingPrice)}</td>
                      <td className="px-3 py-2 font-medium">{formatCurrency(item.stockQty * item.sellingPrice)}</td>
                      <td className="px-3 py-2 text-xs">
                        <span className={`px-2 py-1 rounded-full ${
                          item.status === 'In Stock' ? 'bg-success-bg text-success' :
                          item.status === 'Low Stock' ? 'bg-warning-bg text-warning' :
                          'bg-danger-bg text-danger'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {/* Orders by Status */}
          <div className="bg-white shadow-card rounded-card p-5">
            <h3 className="text-lg font-heading font-semibold text-[#1A1F2E] mb-4">Orders by Status</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={ordersByStatus} cx="50%" cy="50%" labelLine={false} label={(entry) => `${entry.name}: ${entry.value}`} outerRadius={100} fill="#8884d8" dataKey="value">
                  {ordersByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Fulfillment Rate */}
          <div className="bg-white shadow-card rounded-card p-5">
            <h3 className="text-lg font-heading font-semibold text-[#1A1F2E] mb-4">Order Fulfillment Rate</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="h-8 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-success" style={{ width: '94.2%' }} />
                </div>
              </div>
              <p className="text-3xl font-heading font-bold text-success">94.2%</p>
            </div>
          </div>
        </div>
      )}

      {/* Sales Tab */}
      {activeTab === 'sales' && (
        <div className="space-y-6">
          {/* Sales by Customer Type */}
          <div className="bg-white shadow-card rounded-card p-5">
            <h3 className="text-lg font-heading font-semibold text-[#1A1F2E] mb-4">Sales by Customer Type</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Wholesale', value: mockCustomers.filter(c => c.customerType === 'Wholesale').reduce((s, c) => s + c.totalRevenue, 0) },
                    { name: 'Industrial', value: mockCustomers.filter(c => c.customerType === 'Industrial').reduce((s, c) => s + c.totalRevenue, 0) },
                    { name: 'Contractor', value: mockCustomers.filter(c => c.customerType === 'Contractor').reduce((s, c) => s + c.totalRevenue, 0) },
                    { name: 'Retail', value: mockCustomers.filter(c => c.customerType === 'Retail').reduce((s, c) => s + c.totalRevenue, 0) },
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => entry.name}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {[0, 1, 2, 3].map((index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Top Selling Items */}
          <div className="bg-white shadow-card rounded-card p-5">
            <h3 className="text-lg font-heading font-semibold text-[#1A1F2E] mb-4">Top Selling Items</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#F7F8FA]">
                  <tr>
                    <th className="text-left px-3 py-2 text-xs">Item</th>
                    <th className="text-left px-3 py-2 text-xs">Type</th>
                    <th className="text-left px-3 py-2 text-xs">Stock Sold</th>
                    <th className="text-left px-3 py-2 text-xs">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {mockInventory.slice(0, 5).map(item => (
                    <tr key={item.id} className="border-t border-border">
                      <td className="px-3 py-2">{item.name}</td>
                      <td className="px-3 py-2">{item.pipeType}</td>
                      <td className="px-3 py-2">{Math.floor(Math.random() * 5000)} {item.unit}</td>
                      <td className="px-3 py-2 font-medium">{formatCurrency(Math.floor(Math.random() * 500000))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
