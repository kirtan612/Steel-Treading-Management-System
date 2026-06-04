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

// GET /api/v1/invoices
router.get("/", getAllInvoices);

// GET /api/v1/invoices/:id
router.get("/:id", getInvoiceById);

// POST /api/v1/invoices
router.post("/", authorize("admin", "sales"), invoiceValidation, createInvoice);

// PUT /api/v1/invoices/:id
router.put("/:id", authorize("admin", "sales"), updateInvoiceValidation, updateInvoice);

// POST /api/v1/invoices/:id/payments
router.post("/:id/payments", authorize("admin", "sales"), paymentValidation, addPayment);

// DELETE /api/v1/invoices/:id
router.delete("/:id", authorize("admin"), deleteInvoice);

module.exports = router;