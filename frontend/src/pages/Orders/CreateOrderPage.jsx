import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { mockCustomers, mockInventory } from '../../data/mockData';

export default function CreateOrderPage() {
  const navigate = useNavigate();
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [expectedDelivery, setExpectedDelivery] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('Pending');

  const addItem = (inventoryItem) => {
    const newItem = {
      id: Date.now(),
      name: inventoryItem.name,
      qty: 1,
      unit: inventoryItem.unit,
      unitPrice: inventoryItem.sellingPrice,
      discount: 0,
    };
    setOrderItems([...orderItems, newItem]);
    setShowItemPicker(false);
  };

  const updateItem = (id, field, value) => {
    setOrderItems(orderItems.map(item =>
      item.id === id ? { ...item, [field]: parseFloat(value) || 0 } : item
    ));
  };

  const removeItem = (id) => {
    setOrderItems(orderItems.filter(item => item.id !== id));
  };

  const calculateItemSubtotal = (item) => {
    const subtotal = item.qty * item.unitPrice;
    const discountAmount = subtotal * (item.discount / 100);
    return subtotal - discountAmount;
  };

  const subtotal = orderItems.reduce((sum, item) => sum + calculateItemSubtotal(item), 0);
  const discountAmount = orderItems.reduce((sum, item) => {
    const itemSubtotal = item.qty * item.unitPrice;
    return sum + (itemSubtotal * (item.discount / 100));
  }, 0);
  const taxableAmount = subtotal;
  const cgst = taxableAmount * 0.09;
  const sgst = taxableAmount * 0.09;
  const grandTotal = taxableAmount + cgst + sgst;

  const formatCurrency = (value) => `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

  const handleSubmit = () => {
    if (!selectedCustomer) {
      alert('Please select a customer');
      return;
    }
    if (orderItems.length === 0) {
      alert('Please add at least one item');
      return;
    }
    // In real app, would save to backend
    console.log('Creating order:', { selectedCustomer, orderItems, expectedDelivery, notes, status });
    navigate('/orders');
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link to="/orders" className="inline-flex items-center gap-2 text-sm text-muted hover:text-[#1A1F2E] mb-3">
          <ArrowLeft size={16} />
          Back to Orders
        </Link>
        <h2 className="text-2xl font-heading font-bold text-[#1A1F2E]">Create New Order</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left - Order Builder */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Select Customer */}
          <div className="bg-white shadow-card rounded-card p-5">
            <h3 className="text-lg font-heading font-semibold text-[#1A1F2E] mb-4">1. Select Customer</h3>
            <select
              value={selectedCustomer?.id || ''}
              onChange={(e) => setSelectedCustomer(mockCustomers.find(c => c.id === e.target.value))}
              className="w-full px-3 py-2 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Choose a customer...</option>
              {mockCustomers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} - {customer.company}
                </option>
              ))}
            </select>
            {selectedCustomer && (
              <div className="mt-4 p-3 bg-primary-light rounded-btn">
                <p className="text-sm font-medium">{selectedCustomer.name}</p>
                <p className="text-xs text-muted">GST: {selectedCustomer.gstNumber}</p>
                <p className="text-xs text-muted">Payment Terms: {selectedCustomer.paymentTerms}</p>
              </div>
            )}
          </div>

          {/* Step 2: Add Items */}
          <div className="bg-white shadow-card rounded-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-heading font-semibold text-[#1A1F2E]">2. Add Items</h3>
              <button
                onClick={() => setShowItemPicker(!showItemPicker)}
                className="flex items-center gap-2 px-3 py-1.5 bg-accent hover:bg-accent-hover text-white rounded-btn text-sm"
              >
                <Plus size={16} />
                Add Item
              </button>
            </div>

            {showItemPicker && (
              <div className="mb-4 p-3 border border-border rounded-btn max-h-48 overflow-y-auto">
                {mockInventory.filter(i => i.status !== 'Out of Stock').map(item => (
                  <button
                    key={item.id}
                    onClick={() => addItem(item)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded text-sm"
                  >
                    {item.name} - ₹{item.sellingPrice}/{item.unit}
                  </button>
                ))}
              </div>
            )}

            {orderItems.length === 0 ? (
              <p className="text-sm text-muted text-center py-8">No items added yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#F7F8FA]">
                    <tr>
                      <th className="text-left px-2 py-2 text-xs">Item</th>
                      <th className="text-left px-2 py-2 text-xs">Qty</th>
                      <th className="text-left px-2 py-2 text-xs">Unit</th>
                      <th className="text-left px-2 py-2 text-xs">Price</th>
                      <th className="text-left px-2 py-2 text-xs">Disc%</th>
                      <th className="text-left px-2 py-2 text-xs">Subtotal</th>
                      <th className="text-left px-2 py-2 text-xs"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderItems.map(item => (
                      <tr key={item.id} className="border-t border-border">
                        <td className="px-2 py-2">{item.name}</td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            value={item.qty}
                            onChange={(e) => updateItem(item.id, 'qty', e.target.value)}
                            className="w-20 px-2 py-1 border border-border rounded text-sm"
                            min="1"
                          />
                        </td>
                        <td className="px-2 py-2">{item.unit}</td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(item.id, 'unitPrice', e.target.value)}
                            className="w-24 px-2 py-1 border border-border rounded text-sm"
                            min="0"
                            step="0.01"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            value={item.discount}
                            onChange={(e) => updateItem(item.id, 'discount', e.target.value)}
                            className="w-16 px-2 py-1 border border-border rounded text-sm"
                            min="0"
                            max="100"
                          />
                        </td>
                        <td className="px-2 py-2 font-medium">{formatCurrency(calculateItemSubtotal(item))}</td>
                        <td className="px-2 py-2">
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-danger hover:text-danger/80"
                          >
                            <X size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Step 3: Order Details */}
          <div className="bg-white shadow-card rounded-card p-5">
            <h3 className="text-lg font-heading font-semibold text-[#1A1F2E] mb-4">3. Order Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1F2E] mb-1">
                  Expected Delivery Date
                </label>
                <input
                  type="date"
                  value={expectedDelivery}
                  onChange={(e) => setExpectedDelivery(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1F2E] mb-1">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Special instructions or notes..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right - Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow-card rounded-card p-5 sticky top-6">
            <h3 className="text-lg font-heading font-semibold text-[#1A1F2E] mb-4">Order Summary</h3>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-muted">Subtotal:</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Discount:</span>
                <span className="font-medium text-danger">- {formatCurrency(discountAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Taxable Amount:</span>
                <span className="font-medium">{formatCurrency(taxableAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">CGST (9%):</span>
                <span className="font-medium">{formatCurrency(cgst)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">SGST (9%):</span>
                <span className="font-medium">{formatCurrency(sgst)}</span>
              </div>
              <div className="h-px bg-border my-3" />
              <div className="flex justify-between text-lg">
                <span className="font-heading font-bold">Grand Total:</span>
                <span className="font-heading font-bold text-accent">{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-[#1A1F2E] mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option>Pending</option>
                <option>Confirmed</option>
              </select>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleSubmit}
                className="w-full px-4 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-btn text-sm font-medium"
              >
                Confirm Order
              </button>
              <button
                onClick={() => navigate('/orders')}
                className="w-full px-4 py-2.5 border border-border text-[#1A1F2E] rounded-btn text-sm font-medium hover:bg-gray-50"
              >
                Save as Draft
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
