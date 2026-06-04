const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  street:  { type: String, trim: true },
  city:    { type: String, trim: true },
  state:   { type: String, trim: true },
  pincode: { type: String, trim: true, match: [/^[1-9][0-9]{5}$/, "Invalid pincode"] },
}, { _id: false });

const customerSchema = new mongoose.Schema({
  customerCode: { type: String, unique: true, sparse: true },
  name:         { type: String, required: [true, "Customer name is required"], trim: true },
  company:      { type: String, trim: true },
  phone: {
    type: String, required: [true, "Phone is required"],
    match: [/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"],
  },
  alternatePhone: { type: String },
  email:          { type: String, lowercase: true, trim: true },
  billingAddress:  addressSchema,
  shippingAddress: addressSchema,
  sameAsBilling:   { type: Boolean, default: true },
  gstNumber: {
    type: String, trim: true, uppercase: true,
    match: [
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
      "Invalid GST number format",
    ],
  },
  panNumber:    { type: String, trim: true, uppercase: true },
  customerType: {
    type: String, enum: ["Retail", "Wholesale", "Contractor", "Industrial"],
    default: "Retail",
  },
  creditLimit:   { type: Number, default: 0, min: 0 },
  paymentTerms:  {
    type: String,
    enum: ["Immediate", "15 days", "30 days", "45 days"], default: "30 days",
  },
  notes:     { type: String, trim: true },
  isActive:  { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

customerSchema.pre("save", async function (next) {
  if (!this.customerCode) {
    const count = await mongoose.model("Customer").countDocuments();
    this.customerCode = `CUST-${String(count + 1).padStart(4, "0")}`;
  }
  next();
});

customerSchema.index({ name: "text", company: "text", phone: "text" });
customerSchema.index({ isDeleted: 1 });

module.exports = mongoose.model("Customer", customerSchema);