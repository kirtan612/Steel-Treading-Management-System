const router = require("express").Router();
const {
  getInventory,
  getInventoryItem,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  getLowStock
} = require("../controllers/inventoryController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const { body } = require("express-validator");

// Validation rules
const inventoryValidation = [
  body("name").trim().isLength({ min: 2, max: 200 }).withMessage("Name must be between 2-200 characters"),
  body("pipeType").isIn(["ERW", "Seamless", "GI Pipe", "Hollow Section", "MS Pipe"]).withMessage("Invalid pipe type"),
  body("outerDiameter").isFloat({ min: 0 }).withMessage("Outer diameter must be a positive number"),
  body("wallThickness").isFloat({ min: 0 }).withMessage("Wall thickness must be a positive number"),
  body("unit").isIn(["kg", "mt", "pcs"]).withMessage("Unit must be kg, mt, or pcs"),
  body("stockQty").isFloat({ min: 0 }).withMessage("Stock quantity must be a positive number"),
  body("reorderLevel").isFloat({ min: 0 }).withMessage("Reorder level must be a positive number"),
  body("purchasePrice").isFloat({ min: 0 }).withMessage("Purchase price must be a positive number"),
  body("sellingPrice").isFloat({ min: 0 }).withMessage("Selling price must be a positive number"),
  body("hsnCode").optional().isString().withMessage("HSN code must be a string")
];

// All routes require authentication
router.use(protect);

/**
 * @swagger
 * /api/v1/inventory:
 *   get:
 *     tags: [Inventory]
 *     summary: Get all inventory items with pagination and filters
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
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [ERW, Seamless, GI Pipe, Hollow Section, MS Pipe]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [In Stock, Low Stock, Out of Stock]
 *     responses:
 *       200:
 *         description: Paginated list of inventory items
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
 *                     $ref: '#/components/schemas/InventoryItem'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 */
router.get("/", getInventory);

/**
 * @swagger
 * /api/v1/inventory/low-stock:
 *   get:
 *     tags: [Inventory]
 *     summary: Get all items below reorder level
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of low stock items with count
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
 *                     $ref: '#/components/schemas/InventoryItem'
 *                 count:
 *                   type: integer
 */
router.get("/low-stock", getLowStock);

/**
 * @swagger
 * /api/v1/inventory/{id}:
 *   get:
 *     tags: [Inventory]
 *     summary: Get single inventory item by ID
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
 *         description: Single inventory item
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/InventoryItem'
 *       404:
 *         description: Item not found
 */
router.get("/:id", getInventoryItem);

/**
 * @swagger
 * /api/v1/inventory:
 *   post:
 *     tags: [Inventory]
 *     summary: Create new inventory item
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - pipeType
 *               - outerDiameter
 *               - wallThickness
 *               - unit
 *               - stockQty
 *               - reorderLevel
 *               - purchasePrice
 *               - sellingPrice
 *             properties:
 *               name:
 *                 type: string
 *               pipeType:
 *                 type: string
 *                 enum: [ERW, Seamless, GI Pipe, Hollow Section, MS Pipe]
 *               grade:
 *                 type: string
 *               outerDiameter:
 *                 type: number
 *               wallThickness:
 *                 type: number
 *               unit:
 *                 type: string
 *                 enum: [kg, mt, pcs]
 *               stockQty:
 *                 type: number
 *               reorderLevel:
 *                 type: number
 *               purchasePrice:
 *                 type: number
 *               sellingPrice:
 *                 type: number
 *               hsnCode:
 *                 type: string
 *               location:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Inventory item created successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Insufficient role
 */
router.post("/", authorize("admin", "inventory"), inventoryValidation, createInventoryItem);

/**
 * @swagger
 * /api/v1/inventory/{id}:
 *   put:
 *     tags: [Inventory]
 *     summary: Update inventory item
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
 *             properties:
 *               name:
 *                 type: string
 *               pipeType:
 *                 type: string
 *               grade:
 *                 type: string
 *               outerDiameter:
 *                 type: number
 *               wallThickness:
 *                 type: number
 *               unit:
 *                 type: string
 *               stockQty:
 *                 type: number
 *               reorderLevel:
 *                 type: number
 *               purchasePrice:
 *                 type: number
 *               sellingPrice:
 *                 type: number
 *               hsnCode:
 *                 type: string
 *               location:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated inventory item
 */
router.put("/:id", authorize("admin", "inventory"), inventoryValidation, updateInventoryItem);

/**
 * @swagger
 * /api/v1/inventory/{id}:
 *   delete:
 *     tags: [Inventory]
 *     summary: Soft delete inventory item (admin only)
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
 *         description: Item deleted successfully
 *       403:
 *         description: Admin only
 */
router.delete("/:id", authorize("admin"), deleteInventoryItem);

module.exports = router;
