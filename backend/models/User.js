const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: {
    type: String, required: [true, "Name is required"],
    trim: true, minlength: 2, maxlength: 100,
  },
  email: {
    type: String, required: [true, "Email is required"],
    unique: true, lowercase: true, trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email"],
  },
  password: {
    type: String, required: [true, "Password is required"],
    minlength: 6, select: false,
  },
  role: {
    type: String, enum: ["admin", "sales", "viewer"],
    default: "sales",
  },
  isActive:     { type: Boolean, default: true },
  refreshToken: { type: String, select: false },
  lastLogin:    { type: Date },
}, { timestamps: true });

// Hash password before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from toJSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  return obj;
};

module.exports = mongoose.model("User", userSchema);