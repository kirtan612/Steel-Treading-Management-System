const { Order, Customer, Inventory, User } = require("../models");
const { generateOrderNumber } = require("../utils/generateNumbers");
const calcGST = require("../utils/calcGST");
const { validationResult } = require("express-validator");
const { Op } = require("sequelize");

/**
 * SECURITY NOTE: SQL Injection Protection
 * Sequelize ORM uses parameterized queries which prevent SQL injection.
 * Never bypass Sequelize with raw SQL unless absolutely necessary.
 */
const { sequelize } = require("../config/database");

// Helper to resolve/populate user names in JSONB statusHistory array
const populateStatusHistory = async (orders) => {
  const isArray = Array.isArray(orders);
  const ordersList = isArray ? orders : [orders];
  
  // Extract all changedBy user IDs
  const userIds = new Set();
  ordersList.forEach(order => {
    const history = order.statusHistory || [];
    history.forEach(h => {
      if (h.changedBy) userIds.add(h.changedBy);
    });
  });

  if (userIds.size === 0) return;

  // Fetch users
  const users = await User.findAll({
    where: { id: Array.from(userIds) },
    attributes: ['id', 'name']
  });

  const userMap = {};
  users.forEach(u => {
    userMap[u.id] = u.name;
  });

  // Attach populated user details to statusHistory
  ordersList.forEach(order => {
    const history = order.statusHistory || [];
    order.statusHistory = history.map(h => ({
      ...h,
      changedBy: h.changedBy ? { id: h.changedBy, name: userMap[h.changedBy] || 'Unknown' } : null
    }));
  });
};

const formatOrderResponse = (orderInstance) => {
  if (!orderInstance) return null;
  const order = orderInstance.toJSON ? orderInstance.toJSON() : { ...orderInstance };
  
  if (order.creator) {
    order.createdBy = order.creator;
    delete order.creator;
  }
  return order;
};

// GET /api/v1/orders
const getAllOrders = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      status = "",
      paymentStatus = "",
      customerId = "",
      startDate = "",
      endDate = "",
      sortBy = "createdAt",
      sortOrder = "desc"
    } = req.query;

    const skip = (page - 1) * limit;
    const query = { isDeleted: false };

    // Search functionality
    if (search) {
      query.orderNumber = { [Op.iLike]: `%${search}%` };
    }

    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (customerId) query.customerId = customerId;

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt[Op.gte] = new Date(startDate);
      if (endDate) query.createdAt[Op.lte] = new Date(endDate);
    }

    const { rows: orders, count: total } = await Order.findAndCountAll({
      where: query,
      order: [[sortBy, sortOrder.toUpperCase()]],
      offset: parseInt(skip),
      limit: parseInt(limit),
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'name', 'company', 'phone', 'customerCode'] },
        { model: User, as: 'creator', attributes: ['name'] }
      ]
    });

    const formattedOrders = orders.map(formatOrderResponse);
    await populateStatusHistory(formattedOrders);

    res.json({
      success: true,
      data: {
        orders: formattedOrders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          hasNext: skip + orders.length < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) { next(error); }
};

// GET /api/v1/orders/:id
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, isDeleted: false },
      include: [
        { model: Customer, as: 'customer' },
        { model: User, as: 'creator', attributes: ['name', 'email'] }
      ]
    });
    
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const formattedOrder = formatOrderResponse(order);
    await populateStatusHistory(formattedOrder);

    res.json({ success: true, data: formattedOrder });
  } catch (error) { next(error); }
};

// POST /api/v1/orders
const createOrder = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: "Validation failed", errors: errors.array() });
    }

    const { customer: customerId, items, discountAmount = 0, notes } = req.body;

    // Validate customer
    const customer = await Customer.findByPk(customerId);
    if (!customer || !customer.isActive) {
      return res.status(400).json({ success: false, message: "Invalid or inactive customer" });
    }

    // Validate and populate items
    const populatedItems = [];
    let subtotal = 0;

    for (const item of items) {
      const inventoryItem = await Inventory.findByPk(item.inventoryItem);
      if (!inventoryItem) {
        return res.status(400).json({ success: false, message: `Inventory item not found: ${item.inventoryItem}` });
      }

      const itemSubtotal = item.quantity * item.unitPrice * (1 - item.discount / 100);
      subtotal += itemSubtotal;

      populatedItems.push({
        ...item,
        itemName: inventoryItem.name,
        itemCode: inventoryItem.itemCode,
        grade: inventoryItem.grade,
        hsnCode: inventoryItem.hsnCode || "73063010",
        subtotal: parseFloat(itemSubtotal.toFixed(2))
      });
    }

    // Calculate taxes
    const taxableAmount = subtotal - discountAmount;
    const customerState = customer.billingState || "Gujarat";
    const { cgst, sgst, igst, totalTax } = calcGST(taxableAmount, customerState, customer.gstNumber);

    const grandTotal = taxableAmount + totalTax;
    const orderNumber = await generateOrderNumber();

    const order = await Order.create({
      orderNumber,
      customerId,
      items: populatedItems,
      subtotal: parseFloat(subtotal.toFixed(2)),
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      taxableAmount: parseFloat(taxableAmount.toFixed(2)),
      cgst,
      sgst,
      igst,
      totalTax,
      grandTotal: parseFloat(grandTotal.toFixed(2)),
      notes,
      statusHistory: [{
        status: "draft",
        changedBy: req.user.id,
        note: "Order created"
      }],
      createdBy: req.user.id
    });

    const savedOrder = await Order.findByPk(order.id, {
      include: [
        { model: Customer, as: 'customer', attributes: ['name', 'company', 'phone'] },
        { model: User, as: 'creator', attributes: ['name'] }
      ]
    });

    const formattedOrder = formatOrderResponse(savedOrder);
    await populateStatusHistory(formattedOrder);

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: formattedOrder
    });
  } catch (error) { next(error); }
};

// PUT /api/v1/orders/:id
const updateOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({ where: { id: req.params.id, isDeleted: false } });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Only allow updates for draft orders
    if (order.status !== "draft") {
      return res.status(400).json({ success: false, message: "Only draft orders can be edited" });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: "Validation failed", errors: errors.array() });
    }

    const { items, discountAmount = 0, notes } = req.body;
    const updateFields = {};

    // Recalculate order totals if items changed
    if (items) {
      const populatedItems = [];
      let subtotal = 0;

      for (const item of items) {
        const inventoryItem = await Inventory.findByPk(item.inventoryItem);
        if (!inventoryItem) {
          return res.status(400).json({ success: false, message: `Inventory item not found: ${item.inventoryItem}` });
        }

        const itemSubtotal = item.quantity * item.unitPrice * (1 - item.discount / 100);
        subtotal += itemSubtotal;

        populatedItems.push({
          ...item,
          itemName: inventoryItem.name,
          itemCode: inventoryItem.itemCode,
          grade: inventoryItem.grade,
          hsnCode: inventoryItem.hsnCode || "73063010",
          subtotal: parseFloat(itemSubtotal.toFixed(2))
        });
      }

      const customer = await Customer.findByPk(order.customerId);
      const taxableAmount = subtotal - discountAmount;
      const customerState = customer.billingState || "Gujarat";
      const { cgst, sgst, igst, totalTax } = calcGST(taxableAmount, customerState, customer.gstNumber);

      updateFields.items = populatedItems;
      updateFields.subtotal = parseFloat(subtotal.toFixed(2));
      updateFields.discountAmount = parseFloat(discountAmount.toFixed(2));
      updateFields.taxableAmount = parseFloat(taxableAmount.toFixed(2));
      updateFields.cgst = cgst;
      updateFields.sgst = sgst;
      updateFields.igst = igst;
      updateFields.totalTax = totalTax;
      updateFields.grandTotal = parseFloat((taxableAmount + totalTax).toFixed(2));
    }

    if (notes !== undefined) updateFields.notes = notes;

    await order.update(updateFields);

    const updatedOrder = await Order.findByPk(order.id, {
      include: [
        { model: Customer, as: 'customer', attributes: ['name', 'company', 'phone'] },
        { model: User, as: 'creator', attributes: ['name'] }
      ]
    });

    const formattedOrder = formatOrderResponse(updatedOrder);
    await populateStatusHistory(formattedOrder);

    res.json({
      success: true,
      message: "Order updated successfully",
      data: formattedOrder
    });
  } catch (error) { next(error); }
};

// PATCH /api/v1/orders/:id/status
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, note = "" } = req.body;
    
    const validStatuses = ["draft", "confirmed", "dispatched", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const order = await Order.findOne({ where: { id: req.params.id, isDeleted: false } });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Status transition validation
    const currentStatus = order.status;
    const validTransitions = {
      draft: ["confirmed", "cancelled"],
      confirmed: ["dispatched", "cancelled"],
      dispatched: ["delivered"],
      delivered: [],
      cancelled: []
    };

    if (!validTransitions[currentStatus].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from ${currentStatus} to ${status}`
      });
    }

    // Update inventory for confirmed orders (reduce stock)
    if (status === "confirmed" && currentStatus === "draft") {
      for (const item of order.items) {
        const invItem = await Inventory.findByPk(item.inventoryItem);
        if (invItem) {
          const newQty = parseFloat(invItem.stockQty) - parseFloat(item.quantity);
          await invItem.update({ stockQty: newQty });
        }
      }
    }

    // Restore inventory if order is cancelled from confirmed
    if (status === "cancelled" && currentStatus === "confirmed") {
      for (const item of order.items) {
        const invItem = await Inventory.findByPk(item.inventoryItem);
        if (invItem) {
          const newQty = parseFloat(invItem.stockQty) + parseFloat(item.quantity);
          await invItem.update({ stockQty: newQty });
        }
      }
    }

    const history = [...(order.statusHistory || []), {
      status,
      changedBy: req.user.id,
      note: note || `Status changed to ${status}`,
      changedAt: new Date()
    }];

    await order.update({
      status,
      statusHistory: history
    });

    res.json({
      success: true,
      message: `Order status updated to ${status}`,
      data: { status, statusHistory: history }
    });
  } catch (error) { next(error); }
};

// DELETE /api/v1/orders/:id
const deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({ where: { id: req.params.id, isDeleted: false } });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Only allow deletion of draft or cancelled orders
    if (!["draft", "cancelled"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: "Only draft or cancelled orders can be deleted"
      });
    }

    await order.update({ isDeleted: true });

    res.json({ success: true, message: "Order deleted successfully" });
  } catch (error) { next(error); }
};

// GET /api/v1/orders/stats
const getOrderStats = async (req, res, next) => {
  try {
    const stats = await Order.findOne({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalOrders'],
        [sequelize.fn('SUM', sequelize.col('grandTotal')), 'totalValue'],
        [sequelize.literal('SUM(CASE WHEN "status" = \'draft\' THEN 1 ELSE 0 END)'), 'draftOrders'],
        [sequelize.literal('SUM(CASE WHEN "status" = \'confirmed\' THEN 1 ELSE 0 END)'), 'confirmedOrders'],
        [sequelize.literal('SUM(CASE WHEN "status" = \'dispatched\' THEN 1 ELSE 0 END)'), 'dispatchedOrders'],
        [sequelize.literal('SUM(CASE WHEN "status" = \'delivered\' THEN 1 ELSE 0 END)'), 'deliveredOrders'],
      ],
      where: { isDeleted: false },
      raw: true
    });

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 11);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const rawMonthlyStats = await Order.findAll({
      attributes: [
        [sequelize.literal('EXTRACT(MONTH FROM "createdAt")'), 'month'],
        [sequelize.literal('EXTRACT(YEAR FROM "createdAt")'), 'year'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('grandTotal')), 'value']
      ],
      where: {
        isDeleted: false,
        createdAt: {
          [Op.gte]: startDate
        }
      },
      group: [
        sequelize.literal('EXTRACT(YEAR FROM "createdAt")'),
        sequelize.literal('EXTRACT(MONTH FROM "createdAt")')
      ],
      order: [
        [sequelize.literal('year'), 'ASC'],
        [sequelize.literal('month'), 'ASC']
      ],
      raw: true
    });

    const monthlyStats = rawMonthlyStats.map(item => ({
      _id: { month: parseInt(item.month), year: parseInt(item.year) },
      count: parseInt(item.count),
      value: parseFloat(item.value || 0)
    }));

    const result = {
      totalOrders: parseInt(stats.totalOrders || 0),
      totalValue: parseFloat(stats.totalValue || 0),
      draftOrders: parseInt(stats.draftOrders || 0),
      confirmedOrders: parseInt(stats.confirmedOrders || 0),
      dispatchedOrders: parseInt(stats.dispatchedOrders || 0),
      deliveredOrders: parseInt(stats.deliveredOrders || 0),
      monthlyStats
    };

    res.json({ success: true, data: result });
  } catch (error) { next(error); }
};

module.exports = {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  updateOrderStatus,
  deleteOrder,
  getOrderStats
};