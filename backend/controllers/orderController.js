const Order = require("../models/Order");
const Customer = require("../models/Customer");
const Inventory = require("../models/Inventory");
const { generateOrderNumber } = require("../utils/generateNumbers");
const calcGST = require("../utils/calcGST");
const { validationResult } = require("express-validator");

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
      query.$or = [
        { orderNumber: { $regex: search, $options: "i" } }
      ];
    }

    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (customerId) query.customer = customerId;

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    const orders = await Order.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .populate("customer", "name company phone customerCode")
      .populate("createdBy", "name")
      .populate("statusHistory.changedBy", "name");

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      data: {
        orders,
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
    const order = await Order.findOne({ _id: req.params.id, isDeleted: false })
      .populate("customer")
      .populate("createdBy", "name email")
      .populate("statusHistory.changedBy", "name");
    
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.json({ success: true, data: order });
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
    const customer = await Customer.findById(customerId);
    if (!customer || !customer.isActive) {
      return res.status(400).json({ success: false, message: "Invalid or inactive customer" });
    }

    // Validate and populate items
    const populatedItems = [];
    let subtotal = 0;

    for (const item of items) {
      const inventoryItem = await Inventory.findById(item.inventoryItem);
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
        subtotal: parseFloat(itemSubtotal.toFixed(2))
      });
    }

    // Calculate taxes
    const taxableAmount = subtotal - discountAmount;
    const { cgst, sgst, igst, totalTax } = calcGST(
      taxableAmount,
      customer.billingAddress?.state || "Gujarat"
    );

    const grandTotal = taxableAmount + totalTax;
    const orderNumber = await generateOrderNumber();

    const order = new Order({
      orderNumber,
      customer: customerId,
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

    await order.save();
    await order.populate([
      { path: "customer", select: "name company phone" },
      { path: "createdBy", select: "name" }
    ]);

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: order
    });
  } catch (error) { next(error); }
};

// PUT /api/v1/orders/:id
const updateOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, isDeleted: false });
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

    // Recalculate order totals if items changed
    if (items) {
      const populatedItems = [];
      let subtotal = 0;

      for (const item of items) {
        const inventoryItem = await Inventory.findById(item.inventoryItem);
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
          subtotal: parseFloat(itemSubtotal.toFixed(2))
        });
      }

      const customer = await Customer.findById(order.customer);
      const taxableAmount = subtotal - discountAmount;
      const { cgst, sgst, igst, totalTax } = calcGST(
        taxableAmount,
        customer.billingAddress?.state || "Gujarat"
      );

      order.items = populatedItems;
      order.subtotal = parseFloat(subtotal.toFixed(2));
      order.discountAmount = parseFloat(discountAmount.toFixed(2));
      order.taxableAmount = parseFloat(taxableAmount.toFixed(2));
      order.cgst = cgst;
      order.sgst = sgst;
      order.igst = igst;
      order.totalTax = totalTax;
      order.grandTotal = parseFloat((taxableAmount + totalTax).toFixed(2));
    }

    if (notes !== undefined) order.notes = notes;

    await order.save();
    await order.populate([
      { path: "customer", select: "name company phone" },
      { path: "createdBy", select: "name" }
    ]);

    res.json({
      success: true,
      message: "Order updated successfully",
      data: order
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

    const order = await Order.findOne({ _id: req.params.id, isDeleted: false });
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
        await Inventory.findByIdAndUpdate(
          item.inventoryItem,
          { $inc: { stockQty: -item.quantity } },
          { runValidators: false }
        );
      }
    }

    // Restore inventory if order is cancelled from confirmed
    if (status === "cancelled" && currentStatus === "confirmed") {
      for (const item of order.items) {
        await Inventory.findByIdAndUpdate(
          item.inventoryItem,
          { $inc: { stockQty: item.quantity } },
          { runValidators: false }
        );
      }
    }

    order.status = status;
    order.statusHistory.push({
      status,
      changedBy: req.user.id,
      note: note || `Status changed to ${status}`
    });

    await order.save();

    res.json({
      success: true,
      message: `Order status updated to ${status}`,
      data: { status, statusHistory: order.statusHistory }
    });
  } catch (error) { next(error); }
};

// DELETE /api/v1/orders/:id
const deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, isDeleted: false });
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

    order.isDeleted = true;
    await order.save();

    res.json({ success: true, message: "Order deleted successfully" });
  } catch (error) { next(error); }
};

// GET /api/v1/orders/stats
const getOrderStats = async (req, res, next) => {
  try {
    const stats = await Order.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalValue: { $sum: "$grandTotal" },
          draftOrders: { $sum: { $cond: [{ $eq: ["$status", "draft"] }, 1, 0] } },
          confirmedOrders: { $sum: { $cond: [{ $eq: ["$status", "confirmed"] }, 1, 0] } },
          dispatchedOrders: { $sum: { $cond: [{ $eq: ["$status", "dispatched"] }, 1, 0] } },
          deliveredOrders: { $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] } }
        }
      }
    ]);

    const monthlyStats = await Order.aggregate([
      {
        $match: {
          isDeleted: false,
          createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 11)) }
        }
      },
      {
        $group: {
          _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
          count: { $sum: 1 },
          value: { $sum: "$grandTotal" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    const result = {
      ...stats[0] || { totalOrders: 0, totalValue: 0, draftOrders: 0, confirmedOrders: 0, dispatchedOrders: 0, deliveredOrders: 0 },
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