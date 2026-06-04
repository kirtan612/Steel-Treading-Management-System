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

// GET /api/v1/orders/stats
router.get("/stats", getOrderStats);

// GET /api/v1/orders
router.get("/", getAllOrders);

// GET /api/v1/orders/:id
router.get("/:id", getOrderById);

// POST /api/v1/orders
router.post("/", authorize("admin", "sales"), orderValidation, createOrder);

// PUT /api/v1/orders/:id
router.put("/:id", authorize("admin", "sales"), orderValidation, updateOrder);

// PATCH /api/v1/orders/:id/status
router.patch("/:id/status", authorize("admin", "sales"), statusUpdateValidation, updateOrderStatus);

// DELETE /api/v1/orders/:id
router.delete("/:id", authorize("admin"), deleteOrder);

module.exports = router;