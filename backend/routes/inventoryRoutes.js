const router = require("express").Router();
const {
  getAllInventory,
  getInventoryById,
  createInventory,
  updateInventory,
  deleteInventory,
  updateStock,
  getInventoryStats
} = require("../controllers/inventoryController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const { body } = require("express-validator");

// Validation rules
const inventoryValidation = [
  body("name").trim().isLength({ min: 3, max: 200 }).withMessage("Name must be between 3-200 characters"),
  body("pipeType").isIn(["ERW", "Seamless", "Hollow Section", "GI Pipe", "MS Pipe"]).withMessage("Invalid pipe type"),
  body("grade").trim().notEmpty().withMessage("Grade is required"),
  body("outerDiameter").isFloat({ min: 0 }).withMessage("Outer diameter must be a positive number"),
  body("wallThickness").isFloat({ min: 0 }).withMessage("Wall thickness must be a positive number"),
  body("purchasePrice").isFloat({ min: 0 }).withMessage("Purchase price must be a positive number"),
  body("sellingPrice").isFloat({ min: 0 }).withMessage("Selling price must be a positive number"),
  body("stockQty").isFloat({ min: 0 }).withMessage("Stock quantity must be a positive number"),
  body("reorderLevel").isFloat({ min: 0 }).withMessage("Reorder level must be a positive number")
];

// All routes require authentication
router.use(protect);

// GET /api/v1/inventory/stats
router.get("/stats", getInventoryStats);

// GET /api/v1/inventory
router.get("/", getAllInventory);

// GET /api/v1/inventory/:id
router.get("/:id", getInventoryById);

// POST /api/v1/inventory
router.post("/", authorize("admin", "sales"), inventoryValidation, createInventory);

// PUT /api/v1/inventory/:id
router.put("/:id", authorize("admin", "sales"), inventoryValidation, updateInventory);

// PATCH /api/v1/inventory/:id/stock
router.patch("/:id/stock", authorize("admin", "sales"), updateStock);

// DELETE /api/v1/inventory/:id
router.delete("/:id", authorize("admin"), deleteInventory);

module.exports = router;