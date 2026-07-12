import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Printer, Edit, Truck, CheckCircle, FileText, Calendar, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/ui/PageHeader';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatusBadge from '../../components/ui/StatusBadge';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { api } from '../../utils/api';

export default function DeliveryChallanDetailPage() {
  const { id } = useParams();
  const [challan, setChallan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deliveryModal, setDeliveryModal] = useState({ isOpen: false });
  const [deliveryData, setDeliveryData] = useState({
    receivedBy: '',
    receivedDate: new Date().toISOString().split('T')[0],
    customerSignature: 'Received in good condition'
  });
  const [processingDelivery, setProcessingDelivery] = useState(false);

  useEffect(() => {
    fetchChallanDetail();
  }, [id]);

  const fetchChallanDetail = async () => {
    try {
      setLoading(true);
      const result = await api.get(`/delivery-challans/${id}`);
      if (result.success) {
        setChallan(result.data);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to fetch delivery challan details');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleMarkDelivered = async () => {
    try {
      setProcessingDelivery(true);
      const result = await api.post(`/delivery-challans/${id}/mark-delivered`, {
        ...deliveryData,
        receivedDate: new Date(deliveryData.receivedDate).toISOString()
      });
      
      if (result.success) {
        toast.success('Delivery challan marked as delivered');
        setDeliveryModal({ isOpen: false });
        fetchChallanDetail(); // Refresh data
      }
    } catch (error) {
      toast.error(error.message || 'Failed to mark as delivered');
    } finally {
      setProcessingDelivery(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (value) => new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value || 0);

  const getStatusColor = (status) => {
    const colors = {
      'generated': 'bg-blue-100 text-blue-700',
      'dispatched': 'bg-yellow-100 text-yellow-700',
      'delivered': 'bg-green-100 text-green-700',
      'cancelled': 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!challan) {
    return (
      <div className="bg-white shadow-card rounded-card p-8 text-center text-muted">
        Delivery challan not found
      </div>
    );
  }

  return (
    <div>
      <div className="print:hidden">
        <PageHeader
          title={`Delivery Challan ${challan.challanNumber}`}
          subtitle="View and manage delivery challan details"
          showBackButton
          backTo="/delivery-challans"
          action={
            <div className="flex items-center gap-2">
              {challan.status === 'dispatched' && (
                <button
                  onClick={() => setDeliveryModal({ isOpen: true })}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  <CheckCircle size={16} />
                  Mark Delivered
                </button>
              )}
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90"
              >
                <Printer size={16} />
                Print Challan
              </button>
            </div>
          }
        />
      </div>

      {/* Printable Delivery Challan */}
      <div className="bg-white shadow-card rounded-card print:shadow-none print:rounded-none">
        <div className="p-8 print:p-6">
          {/* Header */}
          <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">DELIVERY CHALLAN</h1>
            <div className="flex justify-between items-center text-sm">
              <div>
                <p className="font-semibold">SteelTrack Industries</p>
                <p>123 Industrial Area, Steel City</p>
                <p>Gujarat - 380001</p>
                <p>GST: 24ABCDE1234F1Z5</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-lg font-bold">{challan.challanNumber}</p>
                <p>Date: {formatDate(challan.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Challan Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Customer Details */}
            <div className="border border-gray-300 p-4">
              <h3 className="font-semibold text-gray-800 mb-3 border-b pb-1">CONSIGNEE DETAILS</h3>
              <div className="space-y-1 text-sm">
                <p className="font-medium">{challan.order?.customer?.name}</p>
                {challan.order?.customer?.company && (
                  <p>{challan.order.customer.company}</p>
                )}
                <div className="mt-2">
                  <p>{challan.order?.customer?.billingStreet}</p>
                  <p>{challan.order?.customer?.billingCity}, {challan.order?.customer?.billingState}</p>
                  <p>PIN: {challan.order?.customer?.billingPincode}</p>
                </div>
                {challan.order?.customer?.gstNumber && (
                  <p className="mt-2 font-mono text-xs">GST: {challan.order.customer.gstNumber}</p>
                )}
              </div>
            </div>

            {/* Transport Details */}
            <div className="border border-gray-300 p-4">
              <h3 className="font-semibold text-gray-800 mb-3 border-b pb-1">TRANSPORT DETAILS</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Vehicle Number:</span>
                  <span className="font-mono">{challan.vehicleNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Driver Name:</span>
                  <span>{challan.driverName}</span>
                </div>
                {challan.driverPhone && (
                  <div className="flex justify-between">
                    <span>Driver Phone:</span>
                    <span>{challan.driverPhone}</span>
                  </div>
                )}
                {challan.transporterName && (
                  <div className="flex justify-between">
                    <span>Transporter:</span>
                    <span>{challan.transporterName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Dispatch Date:</span>
                  <span>{formatDate(challan.dispatchDate)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* E-Way Bill Details */}
          {challan.eWayBillNo && (
            <div className="border border-gray-300 p-4 mb-6">
              <h3 className="font-semibold text-gray-800 mb-3 border-b pb-1">E-WAY BILL DETAILS</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">E-Way Bill No:</span>
                  <p className="font-mono">{challan.eWayBillNo}</p>
                </div>
                {challan.eWayBillDate && (
                  <div>
                    <span className="text-gray-600">Generated:</span>
                    <p>{formatDate(challan.eWayBillDate)}</p>
                  </div>
                )}
                {challan.eWayBillValidUpto && (
                  <div>
                    <span className="text-gray-600">Valid Until:</span>
                    <p>{formatDate(challan.eWayBillValidUpto)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Items Table */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 mb-3 border-b pb-1">MATERIAL DETAILS</h3>
            <table className="w-full border-collapse border border-gray-300 text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-3 py-2 text-left">S.No</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Description</th>
                  <th className="border border-gray-300 px-3 py-2 text-center">Quantity</th>
                  <th className="border border-gray-300 px-3 py-2 text-right">Rate</th>
                  <th className="border border-gray-300 px-3 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {challan.items?.map((item, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 px-3 py-2">{index + 1}</td>
                    <td className="border border-gray-300 px-3 py-2">{item.name}</td>
                    <td className="border border-gray-300 px-3 py-2 text-center">{item.quantity}</td>
                    <td className="border border-gray-300 px-3 py-2 text-right">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-right">
                      {formatCurrency(item.totalPrice)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-50 font-semibold">
                  <td colSpan="4" className="border border-gray-300 px-3 py-2 text-right">
                    Total Amount:
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-right">
                    {formatCurrency(challan.subtotal)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Status and Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Status</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(challan.status)}`}>
                {challan.status.charAt(0).toUpperCase() + challan.status.slice(1)}
              </span>
              {challan.status === 'delivered' && (
                <div className="mt-3 text-sm">
                  <p><strong>Received by:</strong> {challan.receivedBy}</p>
                  <p><strong>Received on:</strong> {formatDate(challan.receivedDate)}</p>
                </div>
              )}
            </div>
            {challan.notes && (
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Notes</h3>
                <p className="text-sm text-gray-600">{challan.notes}</p>
              </div>
            )}
          </div>

          {/* Signature Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 pt-6 border-t border-gray-300">
            <div className="text-center">
              <div className="h-16 border-b border-gray-300 mb-2"></div>
              <p className="text-sm font-medium">Prepared by</p>
              <p className="text-xs text-gray-600">{challan.creator?.name}</p>
            </div>
            <div className="text-center">
              <div className="h-16 border-b border-gray-300 mb-2"></div>
              <p className="text-sm font-medium">Driver Signature</p>
              <p className="text-xs text-gray-600">{challan.driverName}</p>
            </div>
            <div className="text-center">
              <div className="h-16 border-b border-gray-300 mb-2 flex items-end justify-center pb-2">
                {challan.status === 'delivered' && challan.customerSignature && (
                  <span className="text-xs italic text-gray-600">{challan.customerSignature}</span>
                )}
              </div>
              <p className="text-sm font-medium">Customer Signature</p>
              <p className="text-xs text-gray-600">Receiver</p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-xs text-gray-500 border-t pt-4">
            <p>This is a computer generated delivery challan and does not require signature.</p>
            <p>Order Reference: {challan.order?.orderNumber}</p>
          </div>
        </div>
      </div>

      {/* Mark as Delivered Modal */}
      <ConfirmModal
        isOpen={deliveryModal.isOpen}
        title="Mark as Delivered"
        message={
          <div className="space-y-4">
            <p>Mark this delivery challan as delivered by filling the details below:</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Received by
                </label>
                <input
                  type="text"
                  value={deliveryData.receivedBy}
                  onChange={(e) => setDeliveryData(prev => ({ ...prev, receivedBy: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Name of the person who received"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Received Date
                </label>
                <input
                  type="date"
                  value={deliveryData.receivedDate}
                  onChange={(e) => setDeliveryData(prev => ({ ...prev, receivedDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Signature/Note
                </label>
                <textarea
                  value={deliveryData.customerSignature}
                  onChange={(e) => setDeliveryData(prev => ({ ...prev, customerSignature: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  rows={2}
                  placeholder="Signature note or acknowledgment"
                />
              </div>
            </div>
          </div>
        }
        confirmLabel={processingDelivery ? "Processing..." : "Mark as Delivered"}
        onConfirm={handleMarkDelivered}
        onCancel={() => setDeliveryModal({ isOpen: false })}
        danger={false}
      />
    </div>
  );
}