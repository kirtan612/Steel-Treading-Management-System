const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema({
  itemCode: { type: String, unique: true, sparse: true },
  name: {
    type: String, required: [true, "Item name is required"],
    trim: true, minlength: 3, maxlength: 200,
  },
  pipeType: {
    type: String, required: [true, "Pipe type is required"],
    enum: ["ERW", "Seamless", "Hollow Section", "GI Pipe", "MS Pipe"],
  },
  grade: { type: String, required: [true, "Grade is required"], trim: true },
  outerDiameter:  { type: Number, required: [true, "Outer diameter is required"], min: 0 },
  wallThickness:  { type: Number, required: [true, "Wall thickness is required"], min: 0 },
  lengthPerPiece: { type: Number, default: 6, min: 0 },
  weightPerMeter: { type: Number, min: 0 },
  unit: {
    type: String, required: true,
    enum: ["Kg", "Ton", "Piece", "Meter"], default: "Kg",
  },
  stockQty:     { type: Number, required: true, min: 0, default: 0 },
  reorderLevel: { type: Number, required: true, min: 0, default: 0 },
  purchasePrice: { type: Number, required: [true, "Purchase price is required"], min: 0 },
  sellingPrice:  { type: Number, required: [true, "Selling price is required"], min: 0 },
  hsnCode:       { type: String, trim: true, maxlength: 8 },
  location:      { type: String, trim: true },
  description:   { type: String, trim: true, maxlength: 500 },
  isDeleted:     { type: Boolean, default: false },
  createdBy:     { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

// Auto-generate item code before save
inventorySchema.pre("save", async function (next) {
  if (!this.itemCode) {
    const count = await mongoose.model("Inventory").countDocuments();
    this.itemCode = `ITEM-${String(count + 1).padStart(4, "0")}`;
  }
  next();
});

// Virtual: stock status
inventorySchema.virtual("status").get(function () {
  if (this.stockQty === 0) return "Out of Stock";
  if (this.stockQty <= this.reorderLevel) return "Low Stock";
  return "In Stock";
});

inventorySchema.set("toJSON", { virtuals: true });
inventorySchema.set("toObject", { virtuals: true });

// Indexes
inventorySchema.index({ name: "text", itemCode: "text", grade: "text" });
inventorySchema.index({ isDeleted: 1, stockQty: 1 });

module.exports = mongoose.model("Inventory", inventorySchema);