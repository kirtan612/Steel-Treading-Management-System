import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Package } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import { mockInventory } from '../../data/mockData';

export default function InventoryPage() {
  const navigate = useNavigate();
  const [inventory, setInventory] = useState(mockInventory);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.itemCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'All' || item.pipeType === typeFilter;
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedInventory = filteredInventory.slice(startIndex, startIndex + itemsPerPage);

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      setInventory(inventory.filter(item => item.id !== id));
    }
  };

  const formatCurrency = (value) => `₹${value}`;

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle="Manage your steel pipe stock"
        action={{
          label: 'Add Item',
          icon: Plus,
          onClick: () => navigate('/inventory/new')
        }}
      />

      {/* Filters */}
      <div className="bg-white shadow-card rounded-card p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search by name or item code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option>All</option>
            <option>ERW</option>
            <option>GI Pipe</option>
            <option>Seamless</option>
            <option>Hollow Section</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option>All</option>
            <option>In Stock</option>
            <option>Low Stock</option>
            <option>Out of Stock</option>
          </select>
        </div>
        <p className="text-sm text-muted mt-3">
          Showing {filteredInventory.length} of {inventory.length} items
        </p>
      </div>

      {/* Table */}
      {paginatedInventory.length === 0 ? (
        <div className="bg-white shadow-card rounded-card">
          <EmptyState icon={Package} message="No inventory items found" />
        </div>
      ) : (
        <>
          <div className="bg-white shadow-card rounded-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#F7F8FA]">
                  <tr>
                    <th className="text-left text-xs font-medium text-muted px-4 py-3">Item Code</th>
                    <th className="text-left text-xs font-medium text-muted px-4 py-3">Item Name</th>
                    <th className="text-left text-xs font-medium text-muted px-4 py-3">Type</th>
                    <th className="text-left text-xs font-medium text-muted px-4 py-3">Size</th>
                    <th className="text-left text-xs font-medium text-muted px-4 py-3">Grade</th>
                    <th className="text-left text-xs font-medium text-muted px-4 py-3">Stock</th>
                    <th className="text-left text-xs font-medium text-muted px-4 py-3">Unit Price</th>
                    <th className="text-left text-xs font-medium text-muted px-4 py-3">Status</th>
                    <th className="text-left text-xs font-medium text-muted px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedInventory.map((item) => (
                    <tr key={item.id} className="border-t border-border hover:bg-[#F7F8FA]">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-muted">{item.itemCode}</span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">{item.name}</td>
                      <td className="px-4 py-3 text-sm">{item.pipeType}</td>
                      <td className="px-4 py-3 text-sm">
                        {item.outerDiameter}mm × {item.wallThickness}mm
                      </td>
                      <td className="px-4 py-3 text-sm">{item.grade}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={item.status === 'Out of Stock' ? 'text-danger font-medium' : ''}>
                          {item.stockQty} {item.unit}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{formatCurrency(item.sellingPrice)}/{item.unit}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/inventory/${item.id}/edit`)}
                            className="text-primary hover:text-primary-hover"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-danger hover:text-danger/80"
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-border rounded-btn text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="text-sm text-muted">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-border rounded-btn text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
