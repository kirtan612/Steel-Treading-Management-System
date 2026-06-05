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

/**
 * @swagger
 * /api/v1/reports/revenue:
 *   get:
 *     tags: [Reports]
 *     summary: Get revenue summary with monthly breakdown and top customers
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Revenue report with summary, monthly breakdown, top customers, outstanding balance
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalRevenue:
 *                           type: number
 *                         totalOrders:
 *                           type: integer
 *                         avgOrderValue:
 *                           type: number
 *                     monthly:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           month:
 *                             type: string
 *                           revenue:
 *                             type: number
 *                           orders:
 *                             type: integer
 *                     topCustomers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           customer:
 *                             type: string
 *                           revenue:
 *                             type: number
 *                           orders:
 *                             type: integer
 *                     outstandingBalance:
 *                       type: number
 */
router.get("/sales", getSalesReport);

/**
 * @swagger
 * /api/v1/reports/inventory:
 *   get:
 *     tags: [Reports]
 *     summary: Get inventory summary with stock value breakdown
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Inventory report
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalItems:
 *                       type: integer
 *                     totalStockValue:
 *                       type: number
 *                     lowStockCount:
 *                       type: integer
 *                     outOfStockCount:
 *                       type: integer
 *                     byType:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                           count:
 *                             type: integer
 *                           value:
 *                             type: number
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/InventoryItem'
 */
router.get("/inventory", getInventoryReport);

// GET /api/v1/reports/customers
router.get("/customers", getCustomerReport);

/**
 * @swagger
 * /api/v1/reports/orders:
 *   get:
 *     tags: [Reports]
 *     summary: Get order summary with status breakdown and fulfillment rate
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Order summary report
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     byStatus:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           status:
 *                             type: string
 *                           count:
 *                             type: integer
 *                     last7Days:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                           orders:
 *                             type: integer
 *                     fulfillmentRate:
 *                       type: number
 *                       description: Percentage of orders fulfilled
 */
router.get("/financial", getFinancialReport);

module.exports = router;