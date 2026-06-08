import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Search, Edit, Trash2, Package } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { mockInventory } from '../../data/mockData';

export default function InventoryPage() {
  const navigate = useNavigate();
  const [inventory, setInventory] = useState(mockInventory);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, itemId: null, itemName: '' });
  const [deletingId, setDeletingId] = useState(null);
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

  const openDeleteModal = (id, name) => {
    setDeleteModal({ isOpen: true, itemId: id, itemName: name });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, itemId: null, itemName: '' });
  };

  const confirmDelete = async () => {
    const itemId = deleteModal.itemId;
    setDeletingId(itemId);
    closeDeleteModal();

    try {
      // Optimistically remove from UI
      setInventory(inventory.filter(item => item.id !== itemId));
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast.success('Item deleted successfully');
    } catch (error) {
      // Revert on error
      toast.error('Failed to delete item');
    } finally {
      setDeletingId(null);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setTypeFilter('All');
    setStatusFilter('All');
  };

  const hasActiveFilters = searchTerm || typeFilter !== 'All' || statusFilter !== 'All';

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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="sm:col-span-2 relative">
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
          <EmptyState 
            icon={Package}
            title={hasActiveFilters ? "No results found" : "No inventory items found"}
            message={hasActiveFilters ? "Try different filters or search terms" : "Add your first steel pipe item to get started"}
            actionLabel={hasActiveFilters ? "Clear Filters" : "Add Item"}
            onAction={hasActiveFilters ? clearFilters : () => navigate('/inventory/new')}
          />
        </div>
      ) : (
        <>
          <div className="bg-white shadow-card rounded-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead className="bg-[#F7F8FA]">
                  <tr>
                    <th className="text-left text-xs font-medium text-muted px-4 py-3">Item Code</th>
                    <th className="text-left text-xs font-medium text-muted px-4 py-3">Item Name</th>
                    <th className="text-left text-xs font-medium text-muted px-4 py-3">Type</th>
                    <th className="text-left text-xs font-medium text-muted px-4 py-3 hidden sm:table-cell">Size</th>
                    <th className="text-left text-xs font-medium text-muted px-4 py-3 hidden sm:table-cell">Grade</th>
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
                      <td className="px-4 py-3 text-sm hidden sm:table-cell">
                        {item.outerDiameter}mm × {item.wallThickness}mm
                      </td>
                      <td className="px-4 py-3 text-sm hidden sm:table-cell">{item.grade}</td>
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
                            disabled={deletingId === item.id}
                            className="text-primary hover:text-primary-hover disabled:opacity-50"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => openDeleteModal(item.id, item.name)}
                            disabled={deletingId === item.id}
                            className="text-danger hover:text-danger/80 disabled:opacity-50"
                          >
                            {deletingId === item.id ? (
                              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : (
                              <Trash2 size={16} />
                            )}
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

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Delete Item"
        message={`Are you sure you want to delete "${deleteModal.itemName}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={closeDeleteModal}
        danger
      />
    </div>
  );
}
