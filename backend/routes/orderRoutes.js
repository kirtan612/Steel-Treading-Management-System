const router = require("express").Router();
const {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  updateOrderStatus,
  deleteOrder,
  getOrderStats
} = require("../controllers/orderController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const { body } = require("express-validator");

// Validation rules
const orderValidation = [
  body("customer").isMongoId().withMessage("Valid customer ID is required"),
  body("items").isArray({ min: 1 }).withMessage("At least one item is required"),
  body("items.*.inventoryItem").isMongoId().withMessage("Valid inventory item ID is required"),
  body("items.*.quantity").isFloat({ min: 0.001 }).withMessage("Quantity must be greater than 0"),
  body("items.*.unitPrice").isFloat({ min: 0 }).withMessage("Unit price must be a positive number"),
  body("items.*.discount").optional().isFloat({ min: 0, max: 100 }).withMessage("Discount must be between 0-100%"),
  body("discountAmount").optional().isFloat({ min: 0 }).withMessage("Discount amount must be positive")
];

const statusUpdateValidation = [
  body("status").isIn(["draft", "confirmed", "dispatched", "delivered", "cancelled"]).withMessage("Invalid status"),
  body("note").optional().isString().withMessage("Note must be a string")
];

// All routes require authentication
router.use(protect);

/**
 * @swagger
 * /api/v1/orders:
 *   get:
 *     tags: [Orders]
 *     summary: Get all orders with filters
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, confirmed, dispatched, delivered, cancelled]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
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
 *         description: Paginated orders with customer info populated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 */
router.get("/", getAllOrders);

// GET /api/v1/orders/stats
router.get("/stats", getOrderStats);

/**
 * @swagger
 * /api/v1/orders/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Get full order details
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Full order with customer, items, statusHistory, tax breakdown
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 */
router.get("/:id", getOrderById);

/**
 * @swagger
 * /api/v1/orders:
 *   post:
 *     tags: [Orders]
 *     summary: Create a new order
 *     description: If status is confirmed, inventory stock is automatically deducted
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customer
 *               - items
 *             properties:
 *               customer:
 *                 type: string
 *                 description: Customer ID
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - inventoryItem
 *                     - quantity
 *                     - unitPrice
 *                   properties:
 *                     inventoryItem:
 *                       type: string
 *                       description: Inventory item ID
 *                     quantity:
 *                       type: number
 *                       minimum: 0.001
 *                     unitPrice:
 *                       type: number
 *                       minimum: 0
 *                     discount:
 *                       type: number
 *                       minimum: 0
 *                       maximum: 100
 *               status:
 *                 type: string
 *                 enum: [draft, confirmed]
 *                 default: draft
 *               expectedDelivery:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Insufficient stock error or validation error
 */
router.post("/", authorize("admin", "sales"), orderValidation, createOrder);

// PUT /api/v1/orders/:id
router.put("/:id", authorize("admin", "sales"), orderValidation, updateOrder);

/**
 * @swagger
 * /api/v1/orders/{id}/status:
 *   patch:
 *     tags: [Orders]
 *     summary: Update order status
 *     description: Confirming deducts stock. Cancelling a confirmed/dispatched order restores stock.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [draft, confirmed, dispatched, delivered, cancelled]
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order status updated successfully
 */
router.patch("/:id/status", authorize("admin", "sales"), statusUpdateValidation, updateOrderStatus);

/**
 * @swagger
 * /api/v1/orders/{id}:
 *   delete:
 *     tags: [Orders]
 *     summary: Delete draft order (admin only)
 *     description: Only draft orders can be deleted
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order deleted successfully
 *       400:
 *         description: Order is not in draft status
 */
router.delete("/:id", authorize("admin"), deleteOrder);

module.exports = router;