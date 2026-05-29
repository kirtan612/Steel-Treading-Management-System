import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';
import { mockOrders, mockCustomers } from '../../data/mockData';

export default function OrderDetailPage() {
  const { id } = useParams();
  const order = mockOrders.find(o => o.id === id);
  const customer = mockCustomers.find(c => c.id === order?.customerId);

  if (!order) return <div>Order not found</div>;

  const formatCurrency = (value) => new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value);

  const statusSteps = ['Pending', 'Confirmed', 'Dispatched', 'Delivered'];
  const currentStepIndex = statusSteps.indexOf(order.status);

  return (
    <div>
      <div className="mb-6">
        <Link to="/orders" className="inline-flex items-center gap-2 text-sm text-muted hover:text-[#1A1F2E] mb-3">
          <ArrowLeft size={16} />
          Back to Orders
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-heading font-bold text-[#1A1F2E] font-mono">{order.id}</h2>
            <p className="text-sm text-muted mt-1">Order Date: {order.orderDate}</p>
          </div>
          <StatusBadge status={order.status} />
        </div>
      </div>

      {/* Status Timeline */}
      <div className="bg-white shadow-card rounded-card p-6 mb-6">
        <div className="flex items-center justify-between">
          {statusSteps.map((step, index) => (
            <div key={step} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  index <= currentStepIndex ? 'bg-success text-white' : 'bg-gray-200 text-gray-400'
                }`}>
                  {index < currentStepIndex ? <Check size={20} /> : index + 1}
                </div>
                <p className="text-xs mt-2 font-medium">{step}</p>
              </div>
              {index < statusSteps.length - 1 && (
                <div className={`flex-1 h-1 mx-2 ${
                  index < currentStepIndex ? 'bg-success' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <div className="bg-white shadow-card rounded-card p-5">
            <h3 className="text-lg font-heading font-semibold text-[#1A1F2E] mb-3">Customer Information</h3>
            <div className="space-y-2 text-sm">
              <p><span className="text-muted">Name:</span> <span className="font-medium">{customer?.name}</span></p>
              <p><span className="text-muted">Company:</span> {customer?.company}</p>
              <p><span className="text-muted">Phone:</span> {customer?.phone}</p>
              <p><span className="text-muted">GST:</span> <span className="font-mono text-xs">{customer?.gstNumber}</span></p>
              <p><span className="text-muted">Address:</span> {customer?.city}, {customer?.state} - {customer?.pincode}</p>
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
                  {order.items.map((item, index) => (
                    <tr key={index} className="border-t border-border">
                      <td className="px-3 py-2">{item.name}</td>
                      <td className="px-3 py-2">{item.qty}</td>
                      <td className="px-3 py-2">{item.unit}</td>
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
                  <div className="flex justify-between">
                    <span className="text-muted">CGST (9%):</span>
                    <span>{formatCurrency(order.cgst)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">SGST (9%):</span>
                    <span>{formatCurrency(order.sgst)}</span>
                  </div>
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
            <h3 className="text-lg font-heading font-semibold text-[#1A1F2E]">Order Summary</h3>
            
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-muted text-xs mb-1">Order Date</p>
                <p className="font-medium">{order.orderDate}</p>
              </div>
              <div>
                <p className="text-muted text-xs mb-1">Expected Delivery</p>
                <p className="font-medium">{order.expectedDelivery}</p>
              </div>
              <div>
                <p className="text-muted text-xs mb-1">Total Amount</p>
                <p className="text-xl font-heading font-bold text-accent">{formatCurrency(order.grandTotal)}</p>
              </div>
              <div>
                <p className="text-muted text-xs mb-1">Payment Status</p>
                <StatusBadge status={order.paymentStatus} />
              </div>
            </div>

            <div className="pt-4 border-t border-border space-y-2">
              <select className="w-full px-3 py-2 border border-border rounded-btn text-sm">
                <option>{order.status}</option>
                <option>Pending</option>
                <option>Confirmed</option>
                <option>Dispatched</option>
                <option>Delivered</option>
              </select>
              <button className="w-full px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-btn text-sm font-medium">
                Update Status
              </button>
              {(order.status === 'Confirmed' || order.status === 'Delivered') && (
                <button className="w-full px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-btn text-sm font-medium">
                  Generate Invoice
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
