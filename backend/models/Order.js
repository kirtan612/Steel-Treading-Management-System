const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  inventoryItem: { type: mongoose.Schema.Types.ObjectId, ref: "Inventory" },
  itemName:   { type: String, required: true },
  itemCode:   { type: String },
  size:       { type: String },
  grade:      { type: String },
  quantity:   { type: Number, required: true, min: 0.001 },
  unit:       { type: String, required: true },
  unitPrice:  { type: Number, required: true, min: 0 },
  discount:   { type: Number, default: 0, min: 0, max: 100 },
  subtotal:   { type: Number, required: true, min: 0 },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },
  customer:    { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
  items:       { type: [orderItemSchema], validate: [(v) => v.length > 0, "At least one item required"] },

  subtotal:       { type: Number, required: true, min: 0 },
  discountAmount: { type: Number, default: 0, min: 0 },
  taxableAmount:  { type: Number, required: true, min: 0 },
  cgst:           { type: Number, default: 0 },
  sgst:           { type: Number, default: 0 },
  igst:           { type: Number, default: 0 },
  totalTax:       { type: Number, default: 0 },
  grandTotal:     { type: Number, required: true, min: 0 },

  status: {
    type: String,
    enum: ["draft", "confirmed", "dispatched", "delivered", "cancelled"],
    default: "draft",
  },
  paymentStatus: {
    type: String, enum: ["unpaid", "partial", "paid"], default: "unpaid",
  },
  expectedDelivery: { type: Date },
  notes:            { type: String, trim: true },
  statusHistory: [{
    status:    { type: String },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    note:      { type: String },
  }],
  isDeleted: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

orderSchema.index({ orderNumber: 1 });
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ status: 1, isDeleted: 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Order", orderSchema);