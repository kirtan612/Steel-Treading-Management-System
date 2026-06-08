import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { exportToCSV, formatDateForFilename, formatCurrencyForCSV } from '../../utils/exportCSV';

const API_URL = 'http://localhost:5000/api/v1';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('revenue');
  const [dateRange, setDateRange] = useState('thisMonth');
  const [loading, setLoading] = useState(false);
  
  // State for each report type
  const [revenueData, setRevenueData] = useState(null);
  const [inventoryData, setInventoryData] = useState(null);
  const [salesData, setSalesData] = useState(null);

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

  // Calculate date range
  const getDateRange = (range) => {
    const now = new Date();
    let from, to;

    switch (range) {
      case 'thisMonth':
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        to = now;
        break;
      case 'lastMonth':
        from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        to = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'thisQuarter':
        const quarter = Math.floor(now.getMonth() / 3);
        from = new Date(now.getFullYear(), quarter * 3, 1);
        to = now;
        break;
      case 'last6Months':
        from = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        to = now;
        break;
      default:
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        to = now;
    }

    return {
      from: from.toISOString().split('T')[0],
      to: to.toISOString().split('T')[0]
    };
  };

  // Fetch revenue/sales data
  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const { from, to } = getDateRange(dateRange);
      
      const response = await fetch(
        `${API_URL}/reports/sales?startDate=${from}&endDate=${to}&period=month`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) throw new Error('Failed to fetch revenue data');
      
      const result = await response.json();
      if (result.success) {
        setRevenueData(result.data);
        setSalesData(result.data); // Reuse for sales tab
      }
    } catch (error) {
      console.error('Error fetching revenue data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch inventory data
  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/reports/inventory`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch inventory data');
      
      const result = await response.json();
      if (result.success) {
        setInventoryData(result.data);
      }
    } catch (error) {
      console.error('Error fetching inventory data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load data on tab change
  useEffect(() => {
    if (activeTab === 'revenue' || activeTab === 'sales') {
      fetchRevenueData();
    } else if (activeTab === 'inventory') {
      fetchInventoryData();
    } else if (activeTab === 'orders') {
      fetchRevenueData(); // Orders use sales data
    }
  }, [activeTab, dateRange]);

  // CSV Export handlers
  const exportRevenueCSV = () => {
    if (!revenueData) return;
    
    const { from, to } = getDateRange(dateRange);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const csvData = revenueData.salesData.map(item => ({
      Month: monthNames[item._id.month - 1] || '',
      Year: item._id.year,
      Revenue: formatCurrencyForCSV(item.totalValue),
      Orders: item.orderCount
    }));
    
    exportToCSV(csvData, `Revenue-Report-${from}-${to}`);
  };

  const exportInventoryCSV = () => {
    if (!inventoryData) return;
    
    const csvData = inventoryData.items.map(item => ({
      'Item Code': item.itemCode,
      'Name': item.name,
      'Type': item.pipeType,
      'Grade': item.grade || '',
      'Stock Qty': item.stockQty,
      'Unit': item.unit || '',
      'Purchase Price': formatCurrencyForCSV(item.purchasePrice),
      'Selling Price': formatCurrencyForCSV(item.sellingPrice),
      'Total Value': formatCurrencyForCSV(item.stockQty * item.sellingPrice),
      'Status': item.stockQty === 0 ? 'Out of Stock' : 
                item.stockQty <= item.reorderLevel ? 'Low Stock' : 'In Stock'
    }));
    
    const today = formatDateForFilename(new Date());
    exportToCSV(csvData, `Inventory-Report-${today}`);
  };

  const exportOrdersCSV = () => {
    if (!revenueData) return;
    
    const csvData = revenueData.salesData.map(item => ({
      'Period': `${item._id.month}/${item._id.year}`,
      'Orders': item.orderCount,
      'Total Value': formatCurrencyForCSV(item.totalValue)
    }));
    
    const today = formatDateForFilename(new Date());
    exportToCSV(csvData, `Order-Summary-${today}`);
  };

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
          {/* Date Range Selector and Export */}
          <div className="flex justify-between items-center">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border border-border rounded-btn text-sm"
            >
              <option value="thisMonth">This Month</option>
              <option value="lastMonth">Last Month</option>
              <option value="thisQuarter">This Quarter</option>
              <option value="last6Months">Last 6 Months</option>
            </select>
            <button
              onClick={exportRevenueCSV}
              disabled={!revenueData || loading}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-btn text-sm hover:bg-primary/90 disabled:opacity-50"
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>

          {loading && <div className="text-center py-8">Loading...</div>}

          {revenueData && (
            <>
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white shadow-card rounded-card p-4">
                  <p className="text-sm text-muted mb-1">Total Revenue</p>
                  <p className="text-2xl font-heading font-bold text-[#1A1F2E]">
                    {formatCurrency(revenueData.summary?.totalValue || 0)}
                  </p>
                </div>
                <div className="bg-white shadow-card rounded-card p-4">
                  <p className="text-sm text-muted mb-1">Orders</p>
                  <p className="text-2xl font-heading font-bold text-[#1A1F2E]">
                    {revenueData.summary?.totalOrders || 0}
                  </p>
                </div>
                <div className="bg-white shadow-card rounded-card p-4">
                  <p className="text-sm text-muted mb-1">Avg Order Value</p>
                  <p className="text-2xl font-heading font-bold text-[#1A1F2E]">
                    {formatCurrency(revenueData.summary?.avgOrderValue || 0)}
                  </p>
                </div>
                <div className="bg-white shadow-card rounded-card p-4">
                  <p className="text-sm text-muted mb-1">Max Order Value</p>
                  <p className="text-2xl font-heading font-bold text-success">
                    {formatCurrency(revenueData.summary?.maxOrderValue || 0)}
                  </p>
                </div>
              </div>

              {/* Revenue Chart */}
              <div className="bg-white shadow-card rounded-card p-5">
                <h3 className="text-lg font-heading font-semibold text-[#1A1F2E] mb-4">Monthly Revenue</h3>
                <ResponsiveContainer width="100%" height={320} className="min-h-[220px] md:min-h-[320px]">
                  <AreaChart data={revenueData.salesData.map(item => ({
                    month: `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][item._id.month - 1]} ${item._id.year}`,
                    revenue: item.totalValue
                  }))}>
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

              {/* Top Items */}
              {revenueData.topItems && revenueData.topItems.length > 0 && (
                <div className="bg-white shadow-card rounded-card p-5">
                  <h3 className="text-lg font-heading font-semibold text-[#1A1F2E] mb-4">Top Selling Items</h3>
                  <ResponsiveContainer width="100%" height={300} className="min-h-[220px] md:min-h-[300px]">
                    <BarChart data={revenueData.topItems.slice(0, 5)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E6EA" />
                      <XAxis type="number" stroke="#9AA3AE" style={{ fontSize: '12px' }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}K`} />
                      <YAxis dataKey="_id" type="category" stroke="#9AA3AE" style={{ fontSize: '11px' }} width={150} />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Bar dataKey="revenue" fill="#E85D26" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Inventory Tab */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          {/* Export Button */}
          <div className="flex justify-end">
            <button
              onClick={exportInventoryCSV}
              disabled={!inventoryData || loading}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-btn text-sm hover:bg-primary/90 disabled:opacity-50"
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>

          {loading && <div className="text-center py-8">Loading...</div>}

          {inventoryData && (
            <>
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white shadow-card rounded-card p-4">
                  <p className="text-sm text-muted mb-1">Total SKUs</p>
                  <p className="text-2xl font-heading font-bold text-[#1A1F2E]">
                    {inventoryData.summary?.totalItems || 0}
                  </p>
                </div>
                <div className="bg-white shadow-card rounded-card p-4">
                  <p className="text-sm text-muted mb-1">Total Stock Value</p>
                  <p className="text-2xl font-heading font-bold text-[#1A1F2E]">
                    {formatCurrency(inventoryData.summary?.totalStockValue || 0)}
                  </p>
                </div>
                <div className="bg-white shadow-card rounded-card p-4">
                  <p className="text-sm text-muted mb-1">Low Stock</p>
                  <p className="text-2xl font-heading font-bold text-warning">
                    {inventoryData.summary?.lowStockItems || 0}
                  </p>
                </div>
                <div className="bg-white shadow-card rounded-card p-4">
                  <p className="text-sm text-muted mb-1">Out of Stock</p>
                  <p className="text-2xl font-heading font-bold text-danger">
                    {inventoryData.summary?.outOfStockItems || 0}
                  </p>
                </div>
              </div>

              {/* Pie Chart */}
              <div className="bg-white shadow-card rounded-card p-5">
                <h3 className="text-lg font-heading font-semibold text-[#1A1F2E] mb-4">Stock Value by Type</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie 
                      data={inventoryData.categoryStats.map(cat => ({
                        name: cat._id,
                        value: cat.totalValue
                      }))} 
                      cx="50%" 
                      cy="50%" 
                      labelLine={false} 
                      label={(entry) => entry.name} 
                      outerRadius={100} 
                      fill="#8884d8" 
                      dataKey="value"
                    >
                      {inventoryData.categoryStats.map((entry, index) => (
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
                      {inventoryData.items.slice(0, 10).map((item, idx) => (
                        <tr key={idx} className="border-t border-border">
                          <td className="px-3 py-2">{item.name}</td>
                          <td className="px-3 py-2">{item.stockQty}</td>
                          <td className="px-3 py-2">{formatCurrency(item.sellingPrice)}</td>
                          <td className="px-3 py-2 font-medium">{formatCurrency(item.stockQty * item.sellingPrice)}</td>
                          <td className="px-3 py-2 text-xs">
                            <span className={`px-2 py-1 rounded-full ${
                              item.stockQty === 0 ? 'bg-danger-bg text-danger' :
                              item.stockQty <= item.reorderLevel ? 'bg-warning-bg text-warning' :
                              'bg-success-bg text-success'
                            }`}>
                              {item.stockQty === 0 ? 'Out of Stock' :
                               item.stockQty <= item.reorderLevel ? 'Low Stock' : 'In Stock'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {/* Export Button */}
          <div className="flex justify-end">
            <button
              onClick={exportOrdersCSV}
              disabled={!revenueData || loading}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-btn text-sm hover:bg-primary/90 disabled:opacity-50"
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>

          {loading && <div className="text-center py-8">Loading...</div>}

          {revenueData && (
            <>
              {/* Orders by Period Chart */}
              <div className="bg-white shadow-card rounded-card p-5">
                <h3 className="text-lg font-heading font-semibold text-[#1A1F2E] mb-4">Orders Over Time</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueData.salesData.map(item => ({
                    period: `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][item._id.month - 1]}`,
                    orders: item.orderCount
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E6EA" />
                    <XAxis dataKey="period" stroke="#9AA3AE" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#9AA3AE" style={{ fontSize: '12px' }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="orders" stroke="#1B3A5C" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Order Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white shadow-card rounded-card p-4">
                  <p className="text-sm text-muted mb-1">Total Orders</p>
                  <p className="text-2xl font-heading font-bold text-[#1A1F2E]">
                    {revenueData.summary?.totalOrders || 0}
                  </p>
                </div>
                <div className="bg-white shadow-card rounded-card p-4">
                  <p className="text-sm text-muted mb-1">Average Order Value</p>
                  <p className="text-2xl font-heading font-bold text-[#1A1F2E]">
                    {formatCurrency(revenueData.summary?.avgOrderValue || 0)}
                  </p>
                </div>
                <div className="bg-white shadow-card rounded-card p-4">
                  <p className="text-sm text-muted mb-1">Fulfillment Rate</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-success" style={{ width: '95%' }} />
                    </div>
                    <p className="text-xl font-heading font-bold text-success">95%</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Sales Tab */}
      {activeTab === 'sales' && (
        <div className="space-y-6">
          {loading && <div className="text-center py-8">Loading...</div>}

          {salesData && (
            <>
              {/* Top Selling Items */}
              <div className="bg-white shadow-card rounded-card p-5">
                <h3 className="text-lg font-heading font-semibold text-[#1A1F2E] mb-4">Top Selling Items by Revenue</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-[#F7F8FA]">
                      <tr>
                        <th className="text-left px-3 py-2 text-xs">Item</th>
                        <th className="text-left px-3 py-2 text-xs">Quantity Sold</th>
                        <th className="text-left px-3 py-2 text-xs">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salesData.topItems && salesData.topItems.slice(0, 10).map((item, idx) => (
                        <tr key={idx} className="border-t border-border">
                          <td className="px-3 py-2 font-medium">{item._id}</td>
                          <td className="px-3 py-2">{item.quantitySold}</td>
                          <td className="px-3 py-2 font-medium">{formatCurrency(item.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sales Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white shadow-card rounded-card p-4">
                  <p className="text-sm text-muted mb-1">Total Revenue</p>
                  <p className="text-2xl font-heading font-bold text-[#1A1F2E]">
                    {formatCurrency(salesData.summary?.totalValue || 0)}
                  </p>
                </div>
                <div className="bg-white shadow-card rounded-card p-4">
                  <p className="text-sm text-muted mb-1">Max Order</p>
                  <p className="text-2xl font-heading font-bold text-success">
                    {formatCurrency(salesData.summary?.maxOrderValue || 0)}
                  </p>
                </div>
                <div className="bg-white shadow-card rounded-card p-4">
                  <p className="text-sm text-muted mb-1">Min Order</p>
                  <p className="text-2xl font-heading font-bold text-muted">
                    {formatCurrency(salesData.summary?.minOrderValue || 0)}
                  </p>
                </div>
              </div>

              {/* Revenue Trend Chart */}
              <div className="bg-white shadow-card rounded-card p-5">
                <h3 className="text-lg font-heading font-semibold text-[#1A1F2E] mb-4">Revenue Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={salesData.salesData.map(item => ({
                    month: `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][item._id.month - 1]}`,
                    revenue: item.totalValue
                  }))}>
                    <defs>
                      <linearGradient id="colorRevSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1B3A5C" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#1B3A5C" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E6EA" />
                    <XAxis dataKey="month" stroke="#9AA3AE" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#9AA3AE" style={{ fontSize: '12px' }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}K`} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Area type="monotone" dataKey="revenue" stroke="#1B3A5C" strokeWidth={2} fillOpacity={1} fill="url(#colorRevSales)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
