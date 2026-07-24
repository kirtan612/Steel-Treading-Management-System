import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Search, Eye, Edit, Trash2, Users as UsersIcon, X, Save } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmModal from '../../components/ui/ConfirmModal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { api } from '../../utils/api';
import { FormField, inputClass } from '../../components/ui/FormField';
import { validators } from '../../utils/validators';


export default function CustomersPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [summary, setSummary] = useState({ totalCustomers: 0, activeCustomers: 0, totalRevenue: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, customerId: null, customerName: '' });
  const [deletingId, setDeletingId] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('Add Customer');
  const [modalForm, setModalForm] = useState({
    id: '',
    name: '',
    company: '',
    phone: '',
    email: '',
    customerType: 'Retail',
    creditLimit: '0',
    billingAddress: {
      street: '',
      city: '',
      state: '',
      pincode: ''
    }
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const result = await api.get('/reports/customers');
      if (result.success) {
        setCustomers(result.data.customers || []);
        setSummary(result.data.summary || { totalCustomers: 0, activeCustomers: 0, totalRevenue: 0 });
      }
    } catch (error) {
      toast.error(error.message || 'Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (value) => new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value || 0);

  const getTypeBadgeColor = (type) => {
    const colors = {
      'Wholesale': 'bg-blue-100 text-blue-700',
      'Industrial': 'bg-purple-100 text-purple-700',
      'Contractor': 'bg-amber-100 text-amber-700',
      'Retail': 'bg-gray-100 text-gray-700'
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  const openDeleteModal = (id, name) => {
    setDeleteModal({ isOpen: true, customerId: id, customerName: name });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, customerId: null, customerName: '' });
  };

  const confirmDelete = async () => {
    const customerId = deleteModal.customerId;
    setDeletingId(customerId);
    closeDeleteModal();

    try {
      const result = await api.delete(`/customers/${customerId}`);
      if (result.success) {
        toast.success('Customer deleted successfully');
        fetchCustomers();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to delete customer');
    } finally {
      setDeletingId(null);
    }
  };

  const handleOpenAddModal = () => {
    setModalTitle('Add Customer');
    setModalForm({
      id: '',
      name: '',
      company: '',
      phone: '',
      email: '',
      customerType: 'Retail',
      creditLimit: '0',
      gstNumber: '',
      panNumber: '',
      billingAddress: {
        street: '',
        city: '',
        state: '',
        pincode: ''
      }
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (customer) => {
    setModalTitle('Edit Customer');
    setModalForm({
      id: customer.id,
      name: customer.name || '',
      company: customer.company || '',
      phone: customer.phone || '',
      email: customer.email || '',
      customerType: customer.customerType || 'Retail',
      creditLimit: String(customer.creditLimit || '0'),
      gstNumber: customer.gstNumber || '',
      panNumber: customer.panNumber || '',
      billingAddress: {
        street: customer.billingAddress?.street || '',
        city: customer.billingAddress?.city || '',
        state: customer.billingAddress?.state || '',
        pincode: customer.billingAddress?.pincode || ''
      }
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleFormChange = (field, subfield) => (e) => {
    const value = e.target.value;
    if (subfield) {
      setModalForm(prev => ({
        ...prev,
        [field]: {
          ...prev[field],
          [subfield]: value
        }
      }));
    } else {
      let extra = {};
      if (field === 'gstNumber') {
        const cleanGst = value.trim().toUpperCase();
        if (cleanGst.length >= 12 && /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}/.test(cleanGst)) {
          extra.panNumber = cleanGst.substring(2, 12);
        }
      }
      setModalForm(prev => ({
        ...prev,
        [field]: value,
        ...extra
      }));
    }
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!modalForm.name.trim()) newErrors.name = 'Name is required';
    if (!modalForm.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[6-9]\d{9}$/.test(modalForm.phone.trim())) {
      newErrors.phone = 'Enter a valid 10-digit Indian mobile number';
    }

    if (modalForm.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(modalForm.email.trim())) {
      newErrors.email = 'Enter a valid email address';
    }

    if (modalForm.billingAddress.pincode.trim() && !/^[1-9][0-9]{5}$/.test(modalForm.billingAddress.pincode.trim())) {
      newErrors.pincode = 'Enter a valid 6-digit PIN code';
    }

    // GSTIN validation
    if (modalForm.gstNumber.trim()) {
      const gstErr = validators.gstNumber(modalForm.gstNumber);
      if (gstErr) {
        newErrors.gstNumber = gstErr;
      } else {
        const matchErr = validators.gstMatchesState(modalForm.gstNumber, modalForm.billingAddress.state);
        if (matchErr) {
          newErrors.gstNumber = matchErr;
        }
      }
    }

    // PAN validation
    if (modalForm.panNumber.trim()) {
      const panErr = validators.panNumber(modalForm.panNumber);
      if (panErr) {
        newErrors.panNumber = panErr;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        name: modalForm.name.trim(),
        company: modalForm.company.trim() || undefined,
        phone: modalForm.phone.trim(),
        email: modalForm.email.trim() || undefined,
        customerType: modalForm.customerType,
        creditLimit: parseFloat(modalForm.creditLimit) || 0,
        gstNumber: modalForm.gstNumber.trim().toUpperCase() || undefined,
        panNumber: modalForm.panNumber.trim().toUpperCase() || undefined,
        billingAddress: {
          street: modalForm.billingAddress.street.trim() || undefined,
          city: modalForm.billingAddress.city.trim() || undefined,
          state: modalForm.billingAddress.state.trim() || undefined,
          pincode: modalForm.billingAddress.pincode.trim() || undefined
        }
      };

      let result;
      if (modalForm.id) {
        result = await api.put(`/customers/${modalForm.id}`, payload);
      } else {
        result = await api.post('/customers', payload);
      }

      if (result.success) {
        toast.success(modalForm.id ? 'Customer updated successfully' : 'Customer created successfully');
        setIsModalOpen(false);
        fetchCustomers();
      }
    } catch (error) {
      toast.error(error.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle="Manage your customer relationships"
        action={{
          label: 'Add Customer',
          icon: Plus,
          onClick: handleOpenAddModal
        }}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white shadow-card rounded-card p-4">
          <p className="text-sm text-muted mb-1">Total Customers</p>
          <p className="text-2xl font-heading font-bold text-[#1A1F2E]">{summary.totalCustomers}</p>
        </div>
        <div className="bg-white shadow-card rounded-card p-4">
          <p className="text-sm text-muted mb-1">Active Customers</p>
          <p className="text-2xl font-heading font-bold text-[#1A1F2E]">{summary.activeCustomers}</p>
        </div>
        <div className="bg-white shadow-card rounded-card p-4 sm:col-span-2 lg:col-span-1">
          <p className="text-sm text-muted mb-1">Total Sales / Revenue</p>
          <p className="text-2xl font-heading font-bold text-success">{formatCurrency(summary.totalRevenue)}</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white shadow-card rounded-card p-4 mb-6">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA3AE]" />
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
      {loading ? (
        <div className="py-20 bg-white shadow-card rounded-card flex justify-center">
          <LoadingSpinner />
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="bg-white shadow-card rounded-card">
          <EmptyState 
            icon={UsersIcon}
            title={searchTerm ? "No results found" : "No customers yet"}
            message={searchTerm ? "Try different search terms" : "Add your first customer to start managing orders"}
            actionLabel={searchTerm ? null : "Add Customer"}
            onAction={searchTerm ? null : handleOpenAddModal}
          />
        </div>
      ) : (
        <div className="bg-white shadow-card rounded-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-[#F7F8FA]">
                <tr>
                  <th className="text-left text-xs font-medium text-muted px-4 py-3">Customer</th>
                  <th className="text-left text-xs font-medium text-muted px-4 py-3">Company</th>
                  <th className="text-left text-xs font-medium text-muted px-4 py-3 hidden sm:table-cell">Phone</th>
                  <th className="text-left text-xs font-medium text-muted px-4 py-3 hidden md:table-cell">City</th>
                  <th className="text-left text-xs font-medium text-muted px-4 py-3">Type</th>
                  <th className="text-left text-xs font-medium text-muted px-4 py-3 hidden sm:table-cell">Total Orders</th>
                  <th className="text-left text-xs font-medium text-muted px-4 py-3">Total Sales</th>
                  <th className="text-left text-xs font-medium text-muted px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => {
                  const nameInitials = customer.name
                    ? customer.name.split(' ').map(n => n[0]).join('').slice(0, 2)
                    : 'C';
                  return (
                    <tr key={customer.id} className="border-t border-border hover:bg-[#F7F8FA]">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                            {nameInitials}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{customer.name}</p>
                            <p className="text-xs text-muted hidden md:block">{customer.email || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">{customer.company || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm hidden sm:table-cell">{customer.phone}</td>
                      <td className="px-4 py-3 text-sm hidden md:table-cell">{customer.billingAddress?.city || 'N/A'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeBadgeColor(customer.customerType)}`}>
                          {customer.customerType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm hidden sm:table-cell">{customer.totalOrders}</td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {formatCurrency(customer.totalValue)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/customers/${customer.id}`)}
                            disabled={deletingId === customer.id}
                            className="text-primary hover:text-primary-hover disabled:opacity-50"
                            title="View"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(customer)}
                            disabled={deletingId === customer.id}
                            className="text-muted hover:text-[#1A1F2E] disabled:opacity-50"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => openDeleteModal(customer.id, customer.name)}
                            disabled={deletingId === customer.id}
                            className="text-danger hover:text-danger/80 disabled:opacity-50"
                            title="Delete"
                          >
                            {deletingId === customer.id ? (
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
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-card shadow-card w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-lg font-heading font-semibold text-[#1A1F2E]">{modalTitle}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#9AA3AE] hover:text-[#5A6473]">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <FormField label="Customer Name" error={errors.name} required>
                <input
                  type="text"
                  value={modalForm.name}
                  onChange={handleFormChange('name')}
                  placeholder="e.g. Rajesh Patel"
                  className={inputClass(errors.name)}
                />
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Company Name">
                  <input
                    type="text"
                    value={modalForm.company}
                    onChange={handleFormChange('company')}
                    placeholder="e.g. Patel Steel Works"
                    className={inputClass()}
                  />
                </FormField>
                <FormField label="Customer Type">
                  <select
                    value={modalForm.customerType}
                    onChange={handleFormChange('customerType')}
                    className={inputClass()}
                  >
                    <option value="Retail">Retail</option>
                    <option value="Wholesale">Wholesale</option>
                    <option value="Contractor">Contractor</option>
                    <option value="Industrial">Industrial</option>
                  </select>
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Phone Number" error={errors.phone} required>
                  <input
                    type="text"
                    value={modalForm.phone}
                    onChange={handleFormChange('phone')}
                    placeholder="e.g. 9876543210"
                    className={inputClass(errors.phone)}
                  />
                </FormField>
                <FormField label="Email Address" error={errors.email}>
                  <input
                    type="email"
                    value={modalForm.email}
                    onChange={handleFormChange('email')}
                    placeholder="e.g. name@company.com"
                    className={inputClass(errors.email)}
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="GST Number" error={errors.gstNumber}>
                  <input
                    type="text"
                    value={modalForm.gstNumber}
                    onChange={handleFormChange('gstNumber')}
                    placeholder="e.g. 24ABCDE1234F1Z5"
                    className={inputClass(errors.gstNumber)}
                  />
                </FormField>
                <FormField label="PAN Number" error={errors.panNumber}>
                  <input
                    type="text"
                    value={modalForm.panNumber}
                    onChange={handleFormChange('panNumber')}
                    placeholder="e.g. ABCDE1234F"
                    className={inputClass(errors.panNumber)}
                  />
                </FormField>
              </div>

              <div className="border-t border-border pt-3">
                <h4 className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">Billing Address</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <input
                      type="text"
                      value={modalForm.billingAddress.street}
                      onChange={handleFormChange('billingAddress', 'street')}
                      placeholder="Street address"
                      className={inputClass()}
                    />
                  </div>
                  <input
                    type="text"
                    value={modalForm.billingAddress.city}
                    onChange={handleFormChange('billingAddress', 'city')}
                    placeholder="City"
                    className={inputClass()}
                  />
                  <input
                    type="text"
                    value={modalForm.billingAddress.state}
                    onChange={handleFormChange('billingAddress', 'state')}
                    placeholder="State"
                    className={inputClass()}
                  />
                  <div className="col-span-2">
                    <FormField label="Pincode" error={errors.pincode}>
                      <input
                        type="text"
                        value={modalForm.billingAddress.pincode}
                        onChange={handleFormChange('billingAddress', 'pincode')}
                        placeholder="e.g. 380015"
                        maxLength={6}
                        className={inputClass(errors.pincode)}
                      />
                    </FormField>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-border rounded-btn text-sm font-medium hover:bg-gray-50 text-[#5A6473]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2 bg-[#E85D26] hover:bg-[#C94D1E] text-white rounded-btn text-sm font-medium disabled:opacity-50"
                >
                  <Save size={16} />
                  {isSubmitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Delete Customer"
        message={`Are you sure you want to delete "${deleteModal.customerName}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={closeDeleteModal}
        danger
      />
    </div>
  );
}
