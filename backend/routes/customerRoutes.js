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

const STATE_GST_CODES = {
  "jammu & kashmir": "01", "jammu and kashmir": "01", "himachal pradesh": "02", "punjab": "03", 
  "chandigarh": "04", "uttarakhand": "05", "uttaranchal": "05", "haryana": "06", "delhi": "07", 
  "ncr": "07", "rajasthan": "08", "uttar pradesh": "09", "bihar": "10", "sikkim": "11", 
  "arunachal pradesh": "12", "nagaland": "13", "manipur": "14", "mizoram": "15", "tripura": "16", 
  "meghalaya": "17", "assam": "18", "west bengal": "19", "jharkhand": "20", "odisha": "21", 
  "orissa": "21", "chhattisgarh": "22", "madhya pradesh": "23", "gujarat": "24", "daman & diu": "25", 
  "daman and diu": "25", "dadra & nagar haveli": "26", "dadra and nagar haveli": "26", 
  "maharashtra": "27", "andhra pradesh": "28", "karnataka": "29", "goa": "30", "lakshadweep": "31", 
  "kerala": "32", "tamil nadu": "33", "puducherry": "34", "pondicherry": "34", 
  "andaman & nicobar islands": "35", "andaman and nicobar islands": "35", "telangana": "36", 
  "andhra pradesh (new)": "37", "ladakh": "38", "other territory": "97",
  
  // State Abbreviations
  "jk": "01", "hp": "02", "pb": "03", "ch": "04", "ut": "05", "hr": "06", "dl": "07",
  "rj": "08", "up": "09", "br": "10", "sk": "11", "ar": "12", "nl": "13", "mn": "14",
  "mz": "15", "tr": "16", "ml": "17", "as": "18", "wb": "19", "jh": "20", "or": "21",
  "od": "21", "cg": "22", "mp": "23", "gj": "24", "dd": "25", "dn": "26", "mh": "27",
  "ap": "28", "ka": "29", "ga": "30", "ld": "31", "kl": "32", "tn": "33", "py": "34",
  "an": "35", "ts": "36", "tg": "36", "la": "38"
};

const getGSTStateCode = (stateName) => {
  if (!stateName) return null;
  const cleanState = stateName.trim().toLowerCase().replace(/\.+/g, '').replace(/\s+/g, ' ');
  if (/^\d{2}$/.test(cleanState)) return cleanState;
  return STATE_GST_CODES[cleanState] || null;
};

// Validation rules
const customerValidation = [
  body("name").trim().isLength({ min: 2, max: 100 }).withMessage("Name must be between 2-100 characters"),
  body("phone").isMobilePhone("en-IN").withMessage("Enter a valid Indian mobile number"),
  body("email").optional({ checkFalsy: true }).isEmail().withMessage("Enter a valid email"),
  body("gstNumber")
    .optional({ checkFalsy: true })
    .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
    .withMessage("Invalid GST number format")
    .custom((gst, { req }) => {
      const stateCode = gst.substring(0, 2);
      const validStateCodes = Object.values(STATE_GST_CODES);
      if (!validStateCodes.includes(stateCode)) {
        throw new Error(`Invalid GST state code "${stateCode}"`);
      }
      
      const billingState = req.body.billingAddress?.state;
      if (billingState) {
        const expectedCode = getGSTStateCode(billingState);
        if (expectedCode && stateCode !== expectedCode) {
          throw new Error(`GSTIN state code (${stateCode}) doesn't match selected state "${billingState}" (${expectedCode})`);
        }
      }
      return true;
    }),
  body("panNumber")
    .optional({ checkFalsy: true })
    .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
    .withMessage("Invalid PAN number format"),
  body("customerType").optional().isIn(["Retail", "Wholesale", "Contractor", "Industrial"]).withMessage("Invalid customer type"),
  body("creditLimit").optional().isFloat({ min: 0 }).withMessage("Credit limit must be a positive number"),
  body("billingAddress.pincode").optional({ checkFalsy: true }).matches(/^[1-9][0-9]{5}$/).withMessage("Invalid pincode format")
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