import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Truck, FileText, Calendar, Filter, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/ui/PageHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { api } from '../../utils/api';
import { useDebounce } from '../../hooks/useDebounce';

export default function DeliveryChallansPage() {
  const [challans, setChallans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, challanId: null });
  const [processingDelete, setProcessingDelete] = useState(false);

  const debouncedSearch = useDebounce(searchTerm, 400);

  const fetchChallans = async (page = 1, search = '', status = '') => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
        ...(status && { status })
      });

      const result = await api.get(`/delivery-challans?${params}`);
      
      if (result.success) {
        setChallans(result.data);
        setPagination(result.pagination);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to fetch delivery challans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallans(1, debouncedSearch, statusFilter);
  }, [debouncedSearch, statusFilter]);

  const handlePageChange = (page) => {
    fetchChallans(page, debouncedSearch, statusFilter);
  };

  const handleDelete = async () => {
    try {
      setProcessingDelete(true);
      await api.delete(`/delivery-challans/${deleteModal.challanId}`);
      
      toast.success('Delivery challan cancelled successfully');
      setDeleteModal({ isOpen: false, challanId: null });
      
      // Refresh the list
      fetchChallans(pagination.page, debouncedSearch, statusFilter);
    } catch (error) {
      toast.error(error.message || 'Failed to cancel delivery challan');
    } finally {
      setProcessingDelete(false);
    }
  };

  const openDeleteModal = (challanId) => {
    setDeleteModal({ isOpen: true, challanId });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      'generated': 'bg-blue-100 text-blue-700',
      'dispatched': 'bg-yellow-100 text-yellow-700',
      'delivered': 'bg-green-100 text-green-700',
      'cancelled': 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'generated', label: 'Generated' },
    { value: 'dispatched', label: 'Dispatched' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  return (
    <div>
      <PageHeader
        title="Delivery Challans"
        subtitle="Manage delivery challans and track dispatches"
        action={
          <Link
            to="/delivery-challans/create"
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90"
          >
            <Plus size={16} />
            Generate Challan
          </Link>
        }
      />

      {/* Filters */}
      <div className="bg-white shadow-card rounded-card p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted" size={16} />
            <input
              type="text"
              placeholder="Search by challan number, vehicle, driver..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Filter size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-48 pl-9 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none bg-white"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Challans List */}
      <div className="bg-white shadow-card rounded-card">
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : challans.length === 0 ? (
          <EmptyState
            icon={Truck}
            title="No delivery challans found"
            message={searchTerm || statusFilter ? "No challans match your current filters" : "Generate your first delivery challan to start tracking dispatches"}
            actionLabel={!(searchTerm || statusFilter) ? "Generate Challan" : "Clear Filters"}
            onAction={() => {
              if (searchTerm || statusFilter) {
                setSearchTerm('');
                setStatusFilter('');
              }
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-[#F7F8FA]">
                <tr>
                  <th className="text-left text-xs font-medium text-muted px-4 py-3">Challan Number</th>
                  <th className="text-left text-xs font-medium text-muted px-4 py-3">Order Number</th>
                  <th className="text-left text-xs font-medium text-muted px-4 py-3">Customer</th>
                  <th className="text-left text-xs font-medium text-muted px-4 py-3">Vehicle Number</th>
                  <th className="text-left text-xs font-medium text-muted px-4 py-3 hidden sm:table-cell">Driver</th>
                  <th className="text-left text-xs font-medium text-muted px-4 py-3">Dispatch Date</th>
                  <th className="text-left text-xs font-medium text-muted px-4 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-muted px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {challans.map((challan) => (
                  <tr key={challan.id} className="border-t border-border hover:bg-[#F7F8FA]">
                    <td className="px-4 py-3">
                      <Link
                        to={`/delivery-challans/${challan.id}`}
                        className="font-mono text-xs text-accent hover:underline"
                      >
                        {challan.challanNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/orders/${challan.order?.id}`}
                        className="font-mono text-xs text-accent hover:underline"
                      >
                        {challan.order?.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-[#1A1F2E]">
                          {challan.order?.customer?.name}
                        </p>
                        {challan.order?.customer?.company && (
                          <p className="text-xs text-muted">{challan.order.customer.company}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm">{challan.vehicleNumber}</span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-sm">{challan.driverName}</span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {formatDate(challan.dispatchDate)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(challan.status)}`}>
                        {challan.status.charAt(0).toUpperCase() + challan.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/delivery-challans/${challan.id}`}
                          className="p-1 text-muted hover:text-primary"
                          title="View Details"
                        >
                          <FileText size={16} />
                        </Link>
                        {challan.status !== 'delivered' && challan.status !== 'cancelled' && (
                          <button
                            onClick={() => openDeleteModal(challan.id)}
                            className="p-1 text-muted hover:text-red-600"
                            title="Cancel Challan"
                          >
                            ❌
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-border flex items-center justify-between">
            <p className="text-sm text-muted">
              Showing {((pagination.page - 1) * 20) + 1} to {Math.min(pagination.page * 20, pagination.total)} of {pagination.total} challans
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1 text-sm border rounded hover:bg-[#F7F8FA] disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1 text-sm border rounded hover:bg-[#F7F8FA] disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Cancel Delivery Challan"
        message="Are you sure you want to cancel this delivery challan? This action cannot be undone."
        confirmLabel={processingDelete ? "Cancelling..." : "Cancel Challan"}
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal({ isOpen: false, challanId: null })}
        danger={true}
      />
    </div>
  );
}