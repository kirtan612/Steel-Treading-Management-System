const router = require("express").Router();
const {
  getDeliveryChallans,
  getDeliveryChallan,
  createDeliveryChallan,
  updateDeliveryChallan,
  cancelDeliveryChallan,
  markAsDelivered
} = require("../controllers/deliveryChallanController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const { body } = require("express-validator");

// Validation rules
const challanValidation = [
  body("orderId").isUUID().withMessage("Valid order ID is required"),
  body("vehicleNumber").trim().isLength({ min: 2, max: 20 }).withMessage("Vehicle number must be between 2-20 characters"),
  body("driverName").trim().isLength({ min: 2, max: 100 }).withMessage("Driver name must be between 2-100 characters"),
  body("driverPhone").optional().isMobilePhone("en-IN").withMessage("Enter a valid Indian mobile number"),
  body("dispatchDate").optional().isISO8601().withMessage("Enter a valid dispatch date"),
  body("eWayBillNo").optional().isLength({ max: 20 }).withMessage("E-Way bill number too long"),
  body("transporterName").optional().isLength({ max: 200 }).withMessage("Transporter name too long")
];

const updateValidation = [
  body("vehicleNumber").optional().trim().isLength({ min: 2, max: 20 }).withMessage("Vehicle number must be between 2-20 characters"),
  body("driverName").optional().trim().isLength({ min: 2, max: 100 }).withMessage("Driver name must be between 2-100 characters"),
  body("driverPhone").optional().isMobilePhone("en-IN").withMessage("Enter a valid Indian mobile number"),
  body("eWayBillNo").optional().isLength({ max: 20 }).withMessage("E-Way bill number too long"),
  body("transporterName").optional().isLength({ max: 200 }).withMessage("Transporter name too long")
];

// All routes require authentication
router.use(protect);

/**
 * @swagger
 * /api/v1/delivery-challans:
 *   get:
 *     tags: [Delivery Challans]
 *     summary: Get all delivery challans with pagination
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [generated, dispatched, delivered, cancelled]
 *       - in: query
 *         name: orderId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Paginated delivery challans list
 */
router.get("/", getDeliveryChallans);

/**
 * @swagger
 * /api/v1/delivery-challans/{id}:
 *   get:
 *     tags: [Delivery Challans]
 *     summary: Get delivery challan details
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
 *         description: Delivery challan details
 */
router.get("/:id", getDeliveryChallan);

/**
 * @swagger
 * /api/v1/delivery-challans:
 *   post:
 *     tags: [Delivery Challans]
 *     summary: Create new delivery challan
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
 *               - vehicleNumber
 *               - driverName
 *             properties:
 *               orderId:
 *                 type: string
 *               vehicleNumber:
 *                 type: string
 *               driverName:
 *                 type: string
 *               driverPhone:
 *                 type: string
 *               transporterName:
 *                 type: string
 *               eWayBillNo:
 *                 type: string
 *               eWayBillDate:
 *                 type: string
 *                 format: date
 *               dispatchDate:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Delivery challan created successfully
 */
router.post("/", authorize("admin", "sales"), challanValidation, createDeliveryChallan);

/**
 * @swagger
 * /api/v1/delivery-challans/{id}:
 *   put:
 *     tags: [Delivery Challans]
 *     summary: Update delivery challan
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
 *         description: Delivery challan updated successfully
 */
router.put("/:id", authorize("admin", "sales"), updateValidation, updateDeliveryChallan);

/**
 * @swagger
 * /api/v1/delivery-challans/{id}/mark-delivered:
 *   post:
 *     tags: [Delivery Challans]
 *     summary: Mark delivery challan as delivered
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               receivedBy:
 *                 type: string
 *               receivedDate:
 *                 type: string
 *                 format: date-time
 *               customerSignature:
 *                 type: string
 *     responses:
 *       200:
 *         description: Delivery challan marked as delivered
 */
router.post("/:id/mark-delivered", authorize("admin", "sales"), markAsDelivered);

/**
 * @swagger
 * /api/v1/delivery-challans/{id}:
 *   delete:
 *     tags: [Delivery Challans]
 *     summary: Cancel delivery challan
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
 *         description: Delivery challan cancelled successfully
 */
router.delete("/:id", authorize("admin"), cancelDeliveryChallan);

module.exports = router;