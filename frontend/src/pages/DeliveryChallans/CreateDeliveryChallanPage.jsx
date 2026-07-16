import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Truck, FileText, Calendar, User } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/ui/PageHeader';
import { FormField } from '../../components/ui/FormField';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { api } from '../../utils/api';

export default function CreateDeliveryChallanPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');

  const [formData, setFormData] = useState({
    orderId: orderId || '',
    vehicleNumber: '',
    driverName: '',
    driverPhone: '',
    transporterName: '',
    eWayBillNo: '',
    eWayBillDate: '',
    eWayBillValidUpto: '',
    dispatchDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (orderId) {
      const order = orders.find(o => o.id === orderId);
      setSelectedOrder(order);
    }
  }, [orderId, orders]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      // Fetch confirmed orders that don't have delivery challans yet
      const result = await api.get('/orders?status=confirmed&limit=100');
      
      if (result.success) {
        // Handle nested orders array in response
        setOrders(result.data?.orders || result.data || []);
      }
    } catch (error) {
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // If order is selected, fetch order details
    if (name === 'orderId' && value) {
      const order = orders.find(o => o.id === value);
      setSelectedOrder(order);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.orderId) {
      toast.error('Please select an order');
      return;
    }

    if (!formData.vehicleNumber.trim()) {
      toast.error('Vehicle number is required');
      return;
    }

    if (!formData.driverName.trim()) {
      toast.error('Driver name is required');
      return;
    }

    try {
      setSubmitting(true);
      
      const submitData = {
        ...formData,
        dispatchDate: formData.dispatchDate ? new Date(formData.dispatchDate).toISOString() : new Date().toISOString(),
        eWayBillDate: formData.eWayBillDate ? new Date(formData.eWayBillDate).toISOString() : null,
        eWayBillValidUpto: formData.eWayBillValidUpto ? new Date(formData.eWayBillValidUpto).toISOString() : null
      };

      const result = await api.post('/delivery-challans', submitData);
      
      if (result.success) {
        toast.success('Delivery challan generated successfully');
        navigate(`/delivery-challans/${result.data.id}`);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to generate delivery challan');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (value) => new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value || 0);

  return (
    <div>
      <PageHeader
        title="Generate Delivery Challan"
        subtitle="Create a new delivery challan for order dispatch"
        showBackButton
        backTo="/delivery-challans"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white shadow-card rounded-card p-6 space-y-6">
            {/* Order Selection */}
            <div>
              <h3 className="text-lg font-semibold text-[#1A1F2E] mb-4 flex items-center gap-2">
                <FileText size={20} />
                Order Details
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <FormField
                  label="Select Order"
                  name="orderId"
                  type="select"
                  value={formData.orderId}
                  onChange={handleInputChange}
                  required
                  disabled={loading || !!orderId}
                  options={[
                    { value: '', label: 'Select an order' },
                    ...orders.map(order => ({
                      value: order.id,
                      label: `${order.orderNumber} - ${order.customer?.name} - ${formatCurrency(order.grandTotal)}`
                    }))
                  ]}
                />
                
                {selectedOrder && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Order Summary</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-blue-600">Customer</p>
                        <p className="font-medium">{selectedOrder.customer?.name}</p>
                        {selectedOrder.customer?.company && (
                          <p className="text-blue-700">{selectedOrder.customer.company}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-blue-600">Order Value</p>
                        <p className="font-medium">{formatCurrency(selectedOrder.grandTotal)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Vehicle & Driver Details */}
            <div>
              <h3 className="text-lg font-semibold text-[#1A1F2E] mb-4 flex items-center gap-2">
                <Truck size={20} />
                Vehicle & Driver Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  label="Vehicle Number"
                  name="vehicleNumber"
                  value={formData.vehicleNumber}
                  onChange={handleInputChange}
                  placeholder="e.g., GJ01AB1234"
                  required
                />
                
                <FormField
                  label="Driver Name"
                  name="driverName"
                  value={formData.driverName}
                  onChange={handleInputChange}
                  placeholder="Enter driver name"
                  required
                />
                
                <FormField
                  label="Driver Phone"
                  name="driverPhone"
                  type="tel"
                  value={formData.driverPhone}
                  onChange={handleInputChange}
                  placeholder="9876543210"
                />
                
                <FormField
                  label="Transporter Name"
                  name="transporterName"
                  value={formData.transporterName}
                  onChange={handleInputChange}
                  placeholder="Transporter company name"
                />
              </div>
            </div>

            {/* E-Way Bill Details */}
            <div>
              <h3 className="text-lg font-semibold text-[#1A1F2E] mb-4 flex items-center gap-2">
                <FileText size={20} />
                E-Way Bill Details (Optional)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField
                  label="E-Way Bill Number"
                  name="eWayBillNo"
                  value={formData.eWayBillNo}
                  onChange={handleInputChange}
                  placeholder="e.g., 123456789012"
                />
                
                <FormField
                  label="E-Way Bill Date"
                  name="eWayBillDate"
                  type="date"
                  value={formData.eWayBillDate}
                  onChange={handleInputChange}
                />
                
                <FormField
                  label="Valid Up To"
                  name="eWayBillValidUpto"
                  type="date"
                  value={formData.eWayBillValidUpto}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* Dispatch Details */}
            <div>
              <h3 className="text-lg font-semibold text-[#1A1F2E] mb-4 flex items-center gap-2">
                <Calendar size={20} />
                Dispatch Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  label="Dispatch Date"
                  name="dispatchDate"
                  type="date"
                  value={formData.dispatchDate}
                  onChange={handleInputChange}
                  required
                />
                
                <FormField
                  label="Notes"
                  name="notes"
                  as="textarea"
                  rows={3}
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Any additional notes..."
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => navigate('/delivery-challans')}
                className="px-6 py-2 border border-border rounded-lg hover:bg-[#F7F8FA]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !formData.orderId}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
              >
                {submitting && <LoadingSpinner size="sm" />}
                {submitting ? 'Generating...' : 'Generate Challan'}
              </button>
            </div>
          </form>
        </div>

        {/* Order Items Preview */}
        {selectedOrder && (
          <div className="bg-white shadow-card rounded-card p-6">
            <h3 className="text-lg font-semibold text-[#1A1F2E] mb-4">Order Items</h3>
            <div className="space-y-3">
              {selectedOrder.items?.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-border last:border-b-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#1A1F2E]">{item.name}</p>
                    <p className="text-xs text-muted">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-sm font-medium text-[#1A1F2E]">
                    {formatCurrency(item.totalPrice)}
                  </div>
                </div>
              ))}
              <div className="pt-3 border-t border-border">
                <div className="flex justify-between items-center font-semibold">
                  <span>Total Amount</span>
                  <span>{formatCurrency(selectedOrder.grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}