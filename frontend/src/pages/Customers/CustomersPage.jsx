import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, Edit, Trash2, Users as UsersIcon } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/ui/EmptyState';
import { mockCustomers } from '../../data/mockData';

export default function CustomersPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState(mockCustomers);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      setCustomers(customers.filter(c => c.id !== id));
    }
  };

  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(c => c.totalOrders > 0).length;
  const totalOutstanding = customers.reduce((sum, c) => sum + c.outstanding, 0);

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle="Manage your customer relationships"
        action={{
          label: 'Add Customer',
          icon: Plus,
          onClick: () => alert('Add customer modal would open')
        }}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white shadow-card rounded-card p-4">
          <p className="text-sm text-muted mb-1">Total Customers</p>
          <p className="text-2xl font-heading font-bold text-[#1A1F2E]">{totalCustomers}</p>
        </div>
        <div className="bg-white shadow-card rounded-card p-4">
          <p className="text-sm text-muted mb-1">Active Customers</p>
          <p className="text-2xl font-heading font-bold text-[#1A1F2E]">{activeCustomers}</p>
        </div>
        <div className="bg-white shadow-card rounded-card p-4">
          <p className="text-sm text-muted mb-1">Outstanding Balance</p>
          <p className="text-2xl font-heading font-bold text-danger">{formatCurrency(totalOutstanding)}</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white shadow-card rounded-card p-4 mb-6">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search by name or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Table */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white shadow-card rounded-card">
          <EmptyState icon={UsersIcon} message="No customers found" />
        </div>
      ) : (
        <div className="bg-white shadow-card rounded-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F7F8FA]">
                <tr>
                  <th className="text-left text-xs font-medium text-muted px-4 py-3">Customer</th>
                  <th className="text-left text-xs font-medium text-muted px-4 py-3">Company</th>
                  <th className="text-left text-xs font-medium text-muted px-4 py-3">Phone</th>
                  <th className="text-left text-xs font-medium text-muted px-4 py-3">City</th>
                  <th className="text-left text-xs font-medium text-muted px-4 py-3">Type</th>
                  <th className="text-left text-xs font-medium text-muted px-4 py-3">Total Orders</th>
                  <th className="text-left text-xs font-medium text-muted px-4 py-3">Outstanding</th>
                  <th className="text-left text-xs font-medium text-muted px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="border-t border-border hover:bg-[#F7F8FA]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                          {customer.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{customer.name}</p>
                          <p className="text-xs text-muted">{customer.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{customer.company}</td>
                    <td className="px-4 py-3 text-sm">{customer.phone}</td>
                    <td className="px-4 py-3 text-sm">{customer.city}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeBadgeColor(customer.customerType)}`}>
                        {customer.customerType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{customer.totalOrders}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={customer.outstanding > 0 ? 'text-danger font-medium' : ''}>
                        {formatCurrency(customer.outstanding)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/customers/${customer.id}`)}
                          className="text-primary hover:text-primary-hover"
                          title="View"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          className="text-muted hover:text-[#1A1F2E]"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(customer.id)}
                          className="text-danger hover:text-danger/80"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
