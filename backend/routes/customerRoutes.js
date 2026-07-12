const router = require("express").Router();
const {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerLedger
} = require("../controllers/customerController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const { body } = require("express-validator");

// Validation rules
const customerValidation = [
  body("name").trim().isLength({ min: 2, max: 100 }).withMessage("Name must be between 2-100 characters"),
  body("phone").isMobilePhone("en-IN").withMessage("Enter a valid Indian mobile number"),
  body("email").optional().isEmail().withMessage("Enter a valid email"),
  body("gstNumber").optional().matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).withMessage("Invalid GST number format"),
  body("customerType").optional().isIn(["Retail", "Wholesale", "Contractor", "Industrial"]).withMessage("Invalid customer type"),
  body("creditLimit").optional().isFloat({ min: 0 }).withMessage("Credit limit must be a positive number"),
  body("billingAddress.pincode").optional().matches(/^[1-9][0-9]{5}$/).withMessage("Invalid pincode format")
];

// All routes require authentication
router.use(protect);

/**
 * @swagger
 * /api/v1/customers:
 *   get:
 *     tags: [Customers]
 *     summary: Get all customers with pagination
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
 *           enum: [Retail, Wholesale, Contractor, Industrial]
 *     responses:
 *       200:
 *         description: Paginated customer list
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
 *                     $ref: '#/components/schemas/Customer'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 */
router.get("/", getCustomers);

/**
 * @swagger
 * /api/v1/customers/{id}:
 *   get:
 *     tags: [Customers]
 *     summary: Get customer details with order history and revenue stats
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
 *         description: Customer details with stats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   allOf:
 *                     - $ref: '#/components/schemas/Customer'
 *                     - type: object
 *                       properties:
 *                         orders:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Order'
 *                         stats:
 *                           type: object
 *                           properties:
 *                             totalOrders:
 *                               type: integer
 *                             totalRevenue:
 *                               type: number
 */
router.get("/:id", getCustomer);

/**
 * @swagger
 * /api/v1/customers/{id}/ledger:
 *   get:
 *     tags: [Customers]
 *     summary: Get customer ledger with financial summary, invoice history, and payment history
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
 *         description: Customer ledger data
 */
router.get("/:id/ledger", getCustomerLedger);

/**
 * @swagger
 * /api/v1/customers:
 *   post:
 *     tags: [Customers]
 *     summary: Create new customer
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
 *               - phone
 *             properties:
 *               name:
 *                 type: string
 *               company:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               billingAddress:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   pincode:
 *                     type: string
 *               gstNumber:
 *                 type: string
 *               customerType:
 *                 type: string
 *                 enum: [Retail, Wholesale, Contractor, Industrial]
 *               creditLimit:
 *                 type: number
 *               paymentTerms:
 *                 type: string
 *     responses:
 *       201:
 *         description: Customer created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Customer'
 */
router.post("/", authorize("admin", "sales"), customerValidation, createCustomer);

/**
 * @swagger
 * /api/v1/customers/{id}:
 *   put:
 *     tags: [Customers]
 *     summary: Update customer details
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
 *               company:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               billingAddress:
 *                 type: object
 *               gstNumber:
 *                 type: string
 *               customerType:
 *                 type: string
 *               creditLimit:
 *                 type: number
 *               paymentTerms:
 *                 type: string
 *     responses:
 *       200:
 *         description: Customer updated successfully
 */
router.put("/:id", authorize("admin", "sales"), customerValidation, updateCustomer);

/**
 * @swagger
 * /api/v1/customers/{id}:
 *   delete:
 *     tags: [Customers]
 *     summary: Soft delete customer (admin only)
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
 *         description: Customer deleted successfully
 *       403:
 *         description: Admin only
 */
router.delete("/:id", authorize("admin"), deleteCustomer);

module.exports = router;