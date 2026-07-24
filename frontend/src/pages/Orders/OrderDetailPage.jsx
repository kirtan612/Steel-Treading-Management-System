import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { api } from '../../utils/api';

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      const result = await api.get(`/orders/${id}`);
      if (result.success) {
        setOrder(result.data);
        setSelectedStatus(mapStatusLabel(result.data.status));
      }
    } catch (error) {
      toast.error(error.message || 'Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetail();
  }, [id]);

  const mapStatusLabel = (status) => {
    if (status === 'draft') return 'Pending';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const labelToValueMap = {
    'Pending': 'draft',
    'Confirmed': 'confirmed',
    'Dispatched': 'dispatched',
    'Delivered': 'delivered',
    'Cancelled': 'cancelled'
  };

  const statusSteps = ['Pending', 'Confirmed', 'Dispatched', 'Delivered'];

  if (loading) {
    return (
      <div className="py-20 flex justify-center bg-white shadow-card rounded-card">
        <LoadingSpinner />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-white shadow-card rounded-card p-8 text-center text-muted">
        Order not found
      </div>
    );
  }

  const currentStepIndex = statusSteps.indexOf(mapStatusLabel(order.status));

  const formatCurrency = (value) => new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value || 0);

  const getNextTransitions = (status) => {
    switch (status) {
      case 'draft':
        return ['Pending', 'Confirmed', 'Cancelled'];
      case 'confirmed':
        return ['Confirmed', 'Dispatched', 'Cancelled'];
      case 'dispatched':
        return ['Dispatched', 'Delivered'];
      default:
        return [mapStatusLabel(status)];
    }
  };

  const handleUpdateStatus = async () => {
    const backendStatus = labelToValueMap[selectedStatus];
    if (backendStatus === order.status) return;

    try {
      setUpdatingStatus(true);
      const result = await api.patch(`/orders/${id}/status`, {
        status: backendStatus,
        note: `Status updated to ${selectedStatus} via details panel`
      });
      if (result.success) {
        toast.success(`Order status updated to ${selectedStatus}`);
        fetchOrderDetail();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleGenerateInvoice = async () => {
    try {
      setGeneratingInvoice(true);
      const todayStr = new Date().toISOString().split('T')[0];
      
      const result = await api.post('/invoices', {
        orderId: order.id,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days due
        termsAndConditions: order.paymentTerms ? `Payment due within ${order.paymentTerms}` : 'Payment due within 30 days'
      });
      if (result.success) {
        toast.success('Invoice generated successfully!');
        navigate(`/invoices/${result.data.id}`);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to generate invoice');
    } finally {
      setGeneratingInvoice(false);
    }
  };

  const customer = order.customer || {};
  const items = order.items || [];
  const addressString = [
    customer.billingStreet,
    customer.billingCity,
    customer.billingState,
    customer.billingPincode ? `- ${customer.billingPincode}` : ''
  ].filter(Boolean).join(', ');

  const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div>
      <div className="mb-6">
        <Link to="/orders" className="inline-flex items-center gap-2 text-sm text-muted hover:text-[#1A1F2E] mb-3">
          <ArrowLeft size={16} />
          Back to Orders
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-heading font-bold text-[#1A1F2E] font-mono">{order.orderNumber}</h2>
            <p className="text-sm text-muted mt-1">Order Date: {orderDate}</p>
          </div>
          <StatusBadge status={mapStatusLabel(order.status)} />
        </div>
      </div>

      {/* Status Timeline */}
      {order.status !== 'cancelled' && (
        <div className="bg-white shadow-card rounded-card p-6 mb-6">
          <div className="flex items-center justify-between">
            {statusSteps.map((step, index) => (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-heading font-bold ${
                    index <= currentStepIndex ? 'bg-[#2E7D52] text-white' : 'bg-gray-200 text-gray-400'
                  }`}>
                    {index < currentStepIndex ? <Check size={20} /> : index + 1}
                  </div>
                  <p className="text-xs mt-2 font-medium">{step}</p>
                </div>
                {index < statusSteps.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 ${
                    index < currentStepIndex ? 'bg-[#2E7D52]' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <div className="bg-white shadow-card rounded-card p-5">
            <h3 className="text-lg font-heading font-semibold text-[#1A1F2E] mb-3">Customer Information</h3>
            <div className="space-y-2 text-sm">
              <p><span className="text-muted">Name:</span> <span className="font-medium">{customer.name || 'N/A'}</span></p>
              {customer.company && <p><span className="text-muted">Company:</span> {customer.company}</p>}
              <p><span className="text-muted">Phone:</span> {customer.phone}</p>
              {customer.gstNumber && (
                <p><span className="text-muted">GSTIN:</span> <span className="font-mono text-xs">{customer.gstNumber}</span></p>
              )}
              {customer.panNumber && (
                <p><span className="text-muted">PAN:</span> <span className="font-mono text-xs">{customer.panNumber}</span></p>
              )}
              {addressString && <p><span className="text-muted">Address:</span> {addressString}</p>}
            </div>
          </div>

          {/* Items */}
          <div className="bg-white shadow-card rounded-card p-5">
            <h3 className="text-lg font-heading font-semibold text-[#1A1F2E] mb-3">Order Items</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#F7F8FA]">
                  <tr>
                    <th className="text-left px-3 py-2 text-xs">Item</th>
                    <th className="text-left px-3 py-2 text-xs">Qty</th>
                    <th className="text-left px-3 py-2 text-xs">Unit</th>
                    <th className="text-left px-3 py-2 text-xs">Price</th>
                    <th className="text-left px-3 py-2 text-xs">Disc%</th>
                    <th className="text-left px-3 py-2 text-xs">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index} className="border-t border-border">
                      <td className="px-3 py-2 font-medium">{item.itemName}</td>
                      <td className="px-3 py-2">{item.quantity}</td>
                      <td className="px-3 py-2 text-muted">{item.unit}</td>
                      <td className="px-3 py-2">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-3 py-2">{item.discount}%</td>
                      <td className="px-3 py-2 font-medium">{formatCurrency(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Tax Breakdown */}
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex justify-end">
                <div className="w-64 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted">Subtotal:</span>
                    <span>{formatCurrency(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Discount:</span>
                    <span className="text-danger">- {formatCurrency(order.discountAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Taxable Amount:</span>
                    <span>{formatCurrency(order.taxableAmount)}</span>
                  </div>
                  {order.cgst > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted">CGST (9%):</span>
                      <span>{formatCurrency(order.cgst)}</span>
                    </div>
                  )}
                  {order.sgst > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted">SGST (9%):</span>
                      <span>{formatCurrency(order.sgst)}</span>
                    </div>
                  )}
                  {order.igst > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted">IGST (18%):</span>
                      <span>{formatCurrency(order.igst)}</span>
                    </div>
                  )}
                  <div className="h-px bg-border my-2" />
                  <div className="flex justify-between text-lg font-heading font-bold">
                    <span>Grand Total:</span>
                    <span className="text-accent">{formatCurrency(order.grandTotal)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="bg-white shadow-card rounded-card p-5">
              <h3 className="text-lg font-heading font-semibold text-[#1A1F2E] mb-3">Notes</h3>
              <p className="text-sm text-muted">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Right Column - Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow-card rounded-card p-5 space-y-4">
            <h3 className="text-lg font-heading font-semibold text-[#1A1F2E]">Actions</h3>
            
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-muted text-xs mb-1">Expected Delivery</p>
                <p className="font-medium">
                  {order.expectedDelivery 
                    ? new Date(order.expectedDelivery).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-muted text-xs mb-1">Total Amount</p>
                <p className="text-xl font-heading font-bold text-accent">{formatCurrency(order.grandTotal)}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-border space-y-2">
              <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1">Update Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-btn text-sm"
                disabled={order.status === 'delivered' || order.status === 'cancelled' || updatingStatus}
              >
                {getNextTransitions(order.status).map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <button
                onClick={handleUpdateStatus}
                disabled={order.status === 'delivered' || order.status === 'cancelled' || updatingStatus}
                className="w-full px-4 py-2 bg-primary hover:bg-primary/95 text-white rounded-btn text-sm font-medium disabled:opacity-50"
              >
                {updatingStatus ? 'Updating...' : 'Update Status'}
              </button>
              {(order.status === 'confirmed' || order.status === 'dispatched') && (
                <Link
                  to={`/delivery-challans/create?orderId=${order.id}`}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-btn text-sm font-medium text-center flex items-center justify-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
                    <path d="M15 18H9"/>
                    <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
                    <circle cx="17" cy="18" r="2"/>
                    <circle cx="7" cy="18" r="2"/>
                  </svg>
                  Generate Challan
                </Link>
              )}
              {order.status === 'delivered' && (
                <button
                  onClick={handleGenerateInvoice}
                  disabled={generatingInvoice}
                  className="w-full px-4 py-2 bg-accent hover:bg-accent/95 text-white rounded-btn text-sm font-medium disabled:opacity-50"
                >
                  {generatingInvoice ? 'Generating Invoice...' : 'Generate Invoice'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
