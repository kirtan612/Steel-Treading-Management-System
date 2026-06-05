const router = require("express").Router();
const {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer
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

// GET /api/v1/customers
router.get("/", getCustomers);

// GET /api/v1/customers/:id
router.get("/:id", getCustomer);

// POST /api/v1/customers
router.post("/", authorize("admin", "sales"), customerValidation, createCustomer);

// PUT /api/v1/customers/:id
router.put("/:id", authorize("admin", "sales"), customerValidation, updateCustomer);

// DELETE /api/v1/customers/:id
router.delete("/:id", authorize("admin"), deleteCustomer);

module.exports = router;