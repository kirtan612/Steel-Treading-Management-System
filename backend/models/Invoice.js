const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  amount:      { type: Number, required: true, min: 0.01 },
  paymentDate: { type: Date, default: Date.now },
  mode: {
    type: String,
    enum: ["Cash", "Cheque", "NEFT", "RTGS", "UPI"], default: "NEFT",
  },
  reference:  { type: String, trim: true },
  notes:      { type: String, trim: true },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  recordedAt: { type: Date, default: Date.now },
}, { _id: true });

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, unique: true },
  order:         { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  customer:      { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },

  issueDate:  { type: Date, default: Date.now },
  dueDate:    { type: Date, required: true },

  items:          { type: Array, required: true },
  subtotal:       { type: Number, required: true },
  discountAmount: { type: Number, default: 0 },
  taxableAmount:  { type: Number, required: true },
  cgst:           { type: Number, default: 0 },
  sgst:           { type: Number, default: 0 },
  igst:           { type: Number, default: 0 },
  totalTax:       { type: Number, default: 0 },
  grandTotal:     { type: Number, required: true },
  amountPaid:     { type: Number, default: 0 },

  status: {
    type: String,
    enum: ["unpaid", "partial", "paid", "overdue"], default: "unpaid",
  },
  payments:          { type: [paymentSchema], default: [] },
  notes:             { type: String },
  termsAndConditions:{ type: String },
  createdBy:         { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

// Virtual: balance
invoiceSchema.virtual("balance").get(function () {
  return parseFloat((this.grandTotal - this.amountPaid).toFixed(2));
});

// Auto-update status based on payment
invoiceSchema.pre("save", function (next) {
  if (this.amountPaid <= 0)             this.status = "unpaid";
  else if (this.amountPaid >= this.grandTotal) this.status = "paid";
  else                                  this.status = "partial";
  next();
});

invoiceSchema.set("toJSON",   { virtuals: true });
invoiceSchema.set("toObject", { virtuals: true });

invoiceSchema.index({ customer: 1, createdAt: -1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ dueDate: 1, status: 1 });

module.exports = mongoose.model("Invoice", invoiceSchema);