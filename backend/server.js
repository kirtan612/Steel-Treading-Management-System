require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

// Route imports
const authRoutes      = require("./routes/authRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const customerRoutes  = require("./routes/customerRoutes");
const orderRoutes     = require("./routes/orderRoutes");
const invoiceRoutes   = require("./routes/invoiceRoutes");
const reportRoutes    = require("./routes/reportRoutes");

// Connect to MongoDB
connectDB();

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
}));

// Rate limiting — stricter on auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { success: false, message: "Too many attempts, please try again after 15 minutes" },
});
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: "Too many requests" },
});

// Parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging (dev only)
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "SteelTrack API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// Routes
app.use("/api/v1/auth",      authLimiter,   authRoutes);
app.use("/api/v1/inventory", generalLimiter, inventoryRoutes);
app.use("/api/v1/customers", generalLimiter, customerRoutes);
app.use("/api/v1/orders",    generalLimiter, orderRoutes);
app.use("/api/v1/invoices",  generalLimiter, invoiceRoutes);
app.use("/api/v1/reports",   generalLimiter, reportRoutes);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 SteelTrack Server running on port ${PORT} [${process.env.NODE_ENV}]`);
});