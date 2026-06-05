const router = require("express").Router();
const {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  addPayment,
  getOverdueInvoices,
  deleteInvoice,
  getInvoiceStats
} = require("../controllers/invoiceController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const { body } = require("express-validator");

// Validation rules
const invoiceValidation = [
  body("orderId").isMongoId().withMessage("Valid order ID is required"),
  body("dueDate").isISO8601().withMessage("Valid due date is required"),
  body("notes").optional().isString().withMessage("Notes must be a string"),
  body("termsAndConditions").optional().isString().withMessage("Terms must be a string")
];

const paymentValidation = [
  body("amount").isFloat({ min: 0.01 }).withMessage("Payment amount must be greater than 0"),
  body("mode").isIn(["Cash", "Cheque", "NEFT", "RTGS", "UPI"]).withMessage("Invalid payment mode"),
  body("paymentDate").optional().isISO8601().withMessage("Invalid payment date"),
  body("reference").optional().isString().withMessage("Reference must be a string"),
  body("notes").optional().isString().withMessage("Notes must be a string")
];

const updateInvoiceValidation = [
  body("dueDate").optional().isISO8601().withMessage("Valid due date is required"),
  body("notes").optional().isString().withMessage("Notes must be a string"),
  body("termsAndConditions").optional().isString().withMessage("Terms must be a string")
];

// All routes require authentication
router.use(protect);

// GET /api/v1/invoices/stats
router.get("/stats", getInvoiceStats);

// GET /api/v1/invoices/overdue
router.get("/overdue", getOverdueInvoices);

/**
 * @swagger
 * /api/v1/invoices:
 *   get:
 *     tags: [Invoices]
 *     summary: Get all invoices with filters
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
 *           enum: [unpaid, partial, paid, overdue]
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
 *         description: Paginated invoices
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
 *                     $ref: '#/components/schemas/Invoice'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 */
router.get("/", getAllInvoices);

/**
 * @swagger
 * /api/v1/invoices/{id}:
 *   get:
 *     tags: [Invoices]
 *     summary: Get full invoice details with payment history
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
 *         description: Invoice with customer, order, payments array
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Invoice'
 */
router.get("/:id", getInvoiceById);

/**
 * @swagger
 * /api/v1/invoices:
 *   post:
 *     tags: [Invoices]
 *     summary: Generate invoice from a confirmed order
 *     description: Order must be confirmed/dispatched/delivered. One invoice per order.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *             properties:
 *               orderId:
 *                 type: string
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *               termsAndConditions:
 *                 type: string
 *     responses:
 *       201:
 *         description: Invoice generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Invoice'
 *       400:
 *         description: Order not confirmed or invoice already exists
 */
router.post("/", authorize("admin", "sales"), invoiceValidation, createInvoice);

// PUT /api/v1/invoices/:id
router.put("/:id", authorize("admin", "sales"), updateInvoiceValidation, updateInvoice);

/**
 * @swagger
 * /api/v1/invoices/{id}/payment:
 *   post:
 *     tags: [Invoices]
 *     summary: Record a payment against an invoice
 *     description: Amount cannot exceed remaining balance
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
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *               paymentDate:
 *                 type: string
 *                 format: date-time
 *               mode:
 *                 type: string
 *                 enum: [Cash, Cheque, NEFT, RTGS, UPI]
 *               reference:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment recorded successfully, updated invoice with new payment in history
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Invoice'
 */
router.post("/:id/payments", authorize("admin", "sales"), paymentValidation, addPayment);

// DELETE /api/v1/invoices/:id
router.delete("/:id", authorize("admin"), deleteInvoice);

module.exports = router;