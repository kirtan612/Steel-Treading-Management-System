const { DeliveryChallan, Order, Customer, User } = require("../models");
const { Op } = require("sequelize");
const { validationResult } = require("express-validator");

// GET /api/v1/delivery-challans
const getDeliveryChallans = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      status = "",
      orderId = ""
    } = req.query;

    const skip = (page - 1) * limit;
    const query = {};

    // Search functionality
    if (search) {
      query[Op.or] = [
        { challanNumber: { [Op.iLike]: `%${search}%` } },
        { vehicleNumber: { [Op.iLike]: `%${search}%` } },
        { driverName: { [Op.iLike]: `%${search}%` } },
        { eWayBillNo: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (status) query.status = status;
    if (orderId) query.orderId = orderId;

    const { rows: challans, count: total } = await DeliveryChallan.findAndCountAll({
      where: query,
      order: [['createdAt', 'DESC']],
      offset: parseInt(skip),
      limit: parseInt(limit),
      include: [
        { 
          model: Order, 
          as: 'order', 
          attributes: ['orderNumber', 'status', 'grandTotal'],
          include: [
            { model: Customer, as: 'customer', attributes: ['name', 'company'] }
          ]
        },
        { model: User, as: 'creator', attributes: ['name'] }
      ]
    });

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: challans,
      pagination: {
        total,
        page: parseInt(page),
        totalPages
      }
    });
  } catch (error) { next(error); }
};

// GET /api/v1/delivery-challans/:id
const getDeliveryChallan = async (req, res, next) => {
  try {
    const challan = await DeliveryChallan.findByPk(req.params.id, {
      include: [
        { 
          model: Order, 
          as: 'order', 
          attributes: ['orderNumber', 'status', 'grandTotal', 'items'],
          include: [
            { 
              model: Customer, 
              as: 'customer', 
              attributes: ['name', 'company', 'phone', 'email', 'gstNumber', 
                          'billingStreet', 'billingCity', 'billingState', 'billingPincode'] 
            }
          ]
        },
        { model: User, as: 'creator', attributes: ['name', 'email'] }
      ]
    });
    
    if (!challan) {
      return res.status(404).json({ success: false, message: "Delivery challan not found" });
    }

    res.json({ 
      success: true, 
      data: challan
    });
  } catch (error) { next(error); }
};

// POST /api/v1/delivery-challans
const createDeliveryChallan = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: "Validation failed", 
        errors: errors.array() 
      });
    }

    // Verify order exists and is not cancelled
    const order = await Order.findOne({
      where: { id: req.body.orderId, isDeleted: false },
      include: [{ model: Customer, as: 'customer' }]
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.status === 'cancelled') {
      return res.status(400).json({ success: false, message: "Cannot create challan for cancelled order" });
    }

    // Calculate totals from order items
    const subtotal = order.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    const totalQuantity = order.items.reduce((sum, item) => sum + (item.quantity || 0), 0);

    const challanData = {
      ...req.body,
      customerId: order.customerId,
      items: order.items,
      subtotal: parseFloat(subtotal.toFixed(2)),
      totalQuantity: parseFloat(totalQuantity.toFixed(2)),
      createdBy: req.user.id
    };

    const challan = await DeliveryChallan.create(challanData);

    // Update order status to dispatched if not already
    if (order.status === 'confirmed') {
      await order.update({ status: 'dispatched' });
    }

    const savedChallan = await DeliveryChallan.findByPk(challan.id, {
      include: [
        { 
          model: Order, 
          as: 'order', 
          include: [{ model: Customer, as: 'customer' }]
        },
        { model: User, as: 'creator', attributes: ['name'] }
      ]
    });

    res.status(201).json({
      success: true,
      message: "Delivery challan created successfully",
      data: savedChallan
    });
  } catch (error) { next(error); }
};

// PUT /api/v1/delivery-challans/:id
const updateDeliveryChallan = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: "Validation failed", 
        errors: errors.array() 
      });
    }

    const challan = await DeliveryChallan.findByPk(req.params.id);

    if (!challan) {
      return res.status(404).json({ success: false, message: "Delivery challan not found" });
    }

    if (challan.status === 'cancelled') {
      return res.status(400).json({ success: false, message: "Cannot update cancelled challan" });
    }

    await challan.update(req.body);

    const updatedChallan = await DeliveryChallan.findByPk(challan.id, {
      include: [
        { 
          model: Order, 
          as: 'order', 
          include: [{ model: Customer, as: 'customer' }]
        },
        { model: User, as: 'creator', attributes: ['name'] }
      ]
    });

    res.json({
      success: true,
      message: "Delivery challan updated successfully",
      data: updatedChallan
    });
  } catch (error) { next(error); }
};

// DELETE /api/v1/delivery-challans/:id (Cancel)
const cancelDeliveryChallan = async (req, res, next) => {
  try {
    const challan = await DeliveryChallan.findByPk(req.params.id, {
      include: [{ model: Order, as: 'order' }]
    });

    if (!challan) {
      return res.status(404).json({ success: false, message: "Delivery challan not found" });
    }

    if (challan.status === 'delivered') {
      return res.status(400).json({ success: false, message: "Cannot cancel delivered challan" });
    }

    await challan.update({ status: 'cancelled' });

    // Revert order status if needed
    if (challan.order && challan.order.status === 'dispatched') {
      await challan.order.update({ status: 'confirmed' });
    }

    res.json({ 
      success: true, 
      message: "Delivery challan cancelled successfully" 
    });
  } catch (error) { next(error); }
};

// POST /api/v1/delivery-challans/:id/mark-delivered
const markAsDelivered = async (req, res, next) => {
  try {
    const { receivedBy, receivedDate, customerSignature } = req.body;
    
    const challan = await DeliveryChallan.findByPk(req.params.id, {
      include: [{ model: Order, as: 'order' }]
    });

    if (!challan) {
      return res.status(404).json({ success: false, message: "Delivery challan not found" });
    }

    if (challan.status === 'cancelled') {
      return res.status(400).json({ success: false, message: "Cannot mark cancelled challan as delivered" });
    }

    await challan.update({
      status: 'delivered',
      receivedBy,
      receivedDate: receivedDate || new Date(),
      customerSignature
    });

    // Update order status to delivered
    if (challan.order) {
      await challan.order.update({ status: 'delivered' });
    }

    res.json({
      success: true,
      message: "Delivery challan marked as delivered",
      data: challan
    });
  } catch (error) { next(error); }
};

module.exports = {
  getDeliveryChallans,
  getDeliveryChallan,
  createDeliveryChallan,
  updateDeliveryChallan,
  cancelDeliveryChallan,
  markAsDelivered
};