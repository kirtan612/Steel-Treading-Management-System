const router = require("express").Router();
const {
  getDashboardStats,
  getSalesReport,
  getInventoryReport,
  getCustomerReport,
  getFinancialReport
} = require("../controllers/reportController");
const { protect } = require("../middleware/authMiddleware");

// All routes require authentication
router.use(protect);

// GET /api/v1/reports/dashboard
router.get("/dashboard", getDashboardStats);

// GET /api/v1/reports/sales
router.get("/sales", getSalesReport);

// GET /api/v1/reports/inventory
router.get("/inventory", getInventoryReport);

// GET /api/v1/reports/customers
router.get("/customers", getCustomerReport);

// GET /api/v1/reports/financial
router.get("/financial", getFinancialReport);

module.exports = router;