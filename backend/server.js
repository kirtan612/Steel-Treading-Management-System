// Validate environment variables FIRST before anything else
require("dotenv").config();
const validateEnv = require("./config/validateEnv");
validateEnv();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const compression = require("compression");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
const { connectDB } = require("./config/database");
const errorHandler = require("./middleware/errorHandler");

// Import models to register associations
require('./models');

// Route imports
const authRoutes      = require("./routes/authRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const customerRoutes  = require("./routes/customerRoutes");
const orderRoutes     = require("./routes/orderRoutes");
const invoiceRoutes   = require("./routes/invoiceRoutes");
const reportRoutes    = require("./routes/reportRoutes");

// Connect to PostgreSQL
connectDB();

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  dnsPrefetchControl: false,
  expectCt: false,
  frameguard: false,
  hidePoweredBy: false,
  hsts: false,
  ieNoOpen: false,
  noSniff: false,
  originAgentCluster: false,
  permittedCrossDomainPolicies: false,
  referrerPolicy: false,
  xssFilter: false,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false,
}));
app.use(cors({
  origin: (origin, callback) => {
    const allowed = [process.env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:5174', `http://localhost:${process.env.PORT || 5000}`];
    if (!origin || allowed.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
}));

// Parsers - reduced limit for security (1MB is sufficient for ERP operations)
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());

// Response compression for bandwidth optimization
app.use(compression());

// Logging (dev only)
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Swagger UI
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: "SteelTrack API Docs",
  customCss: ".swagger-ui .topbar { background-color: #1B3A5C; } .swagger-ui .topbar .download-url-wrapper { display: none; }"
}));

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
app.use("/api/v1/auth",      authRoutes);
app.use("/api/v1/inventory", inventoryRoutes);
app.use("/api/v1/customers", customerRoutes);
app.use("/api/v1/orders",    orderRoutes);
app.use("/api/v1/invoices",  invoiceRoutes);
app.use("/api/v1/reports",   reportRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 SteelTrack Server running on port ${PORT} [${process.env.NODE_ENV}]`);
});