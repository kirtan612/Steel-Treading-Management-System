const Invoice = require("../models/Invoice");
const Order = require("../models/Order");
const Customer = require("../models/Customer");
const { generateInvoiceNumber } = require("../utils/generateNumbers");
const { validationResult } = require("express-validator");

// GET /api/v1/invoices
const getAllInvoices = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      status = "",
      customerId = "",
      startDate = "",
      endDate = "",
      sortBy = "createdAt",
      sortOrder = "desc"
    } = req.query;

    const skip = (page - 1) * limit;
    const query = {};

    // Search functionality
    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: "i" } }
      ];
    }

    if (status) query.status = status;
    if (customerId) query.customer = customerId;

    // Date range filter
    if (startDate || endDate) {
      query.issueDate = {};
      if (startDate) query.issueDate.$gte = new Date(startDate);
      if (endDate) query.issueDate.$lte = new Date(endDate);
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    const invoices = await Invoice.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .populate("customer", "name company phone customerCode")
      .populate("order", "orderNumber")
      .populate("createdBy", "name");

    const total = await Invoice.countDocuments(query);

    res.json({
      success: true,
      data: {
        invoices,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          hasNext: skip + invoices.length < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) { next(error); }
};

// GET /api/v1/invoices/:id
const getInvoiceById = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate("customer")
      .populate("order")
      .populate("createdBy", "name email")
      .populate("payments.recordedBy", "name");
    
    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }

    res.json({ success: true, data: invoice });
  } catch (error) { next(error); }
};

// POST /api/v1/invoices
const createInvoice = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: "Validation failed", errors: errors.array() });
    }

    const { orderId, dueDate, notes, termsAndConditions } = req.body;

    // Validate order
    const order = await Order.findById(orderId).populate("customer");
    if (!order || order.isDeleted) {
      return res.status(400).json({ success: false, message: "Invalid order" });
    }

    if (order.status !== "delivered") {
      return res.status(400).json({ success: false, message: "Can only create invoice for delivered orders" });
    }

    // Check if invoice already exists for this order
    const existingInvoice = await Invoice.findOne({ order: orderId });
    if (existingInvoice) {
      return res.status(400).json({ success: false, message: "Invoice already exists for this order" });
    }

    const invoiceNumber = await generateInvoiceNumber();

    const invoice = new Invoice({
      invoiceNumber,
      order: orderId,
      customer: order.customer._id,
      dueDate,
      items: order.items,
      subtotal: order.subtotal,
      discountAmount: order.discountAmount,
      taxableAmount: order.taxableAmount,
      cgst: order.cgst,
      sgst: order.sgst,
      igst: order.igst,
      totalTax: order.totalTax,
      grandTotal: order.grandTotal,
      notes,
      termsAndConditions,
      createdBy: req.user.id
    });

    await invoice.save();
    await invoice.populate([
      { path: "customer", select: "name company phone" },
      { path: "order", select: "orderNumber" },
      { path: "createdBy", select: "name" }
    ]);

    res.status(201).json({
      success: true,
      message: "Invoice created successfully",
      data: invoice
    });
  } catch (error) { next(error); }
};

// PUT /api/v1/invoices/:id
const updateInvoice = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: "Validation failed", errors: errors.array() });
    }

    const { dueDate, notes, termsAndConditions } = req.body;

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }

    // Only allow updates to unpaid invoices
    if (invoice.status === "paid") {
      return res.status(400).json({ success: false, message: "Cannot update paid invoices" });
    }

    if (dueDate !== undefined) invoice.dueDate = dueDate;
    if (notes !== undefined) invoice.notes = notes;
    if (termsAndConditions !== undefined) invoice.termsAndConditions = termsAndConditions;

    await invoice.save();
    await invoice.populate([
      { path: "customer", select: "name company phone" },
      { path: "order", select: "orderNumber" }
    ]);

    res.json({
      success: true,
      message: "Invoice updated successfully",
      data: invoice
    });
  } catch (error) { next(error); }
};

// POST /api/v1/invoices/:id/payments
const addPayment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: "Validation failed", errors: errors.array() });
    }

    const { amount, paymentDate, mode, reference, notes } = req.body;

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }

    // Validate payment amount
    const remainingAmount = invoice.grandTotal - invoice.amountPaid;
    if (amount > remainingAmount) {
      return res.status(400).json({
        success: false,
        message: `Payment amount (${amount}) exceeds remaining balance (${remainingAmount})`
      });
    }

    const payment = {
      amount,
      paymentDate: paymentDate || new Date(),
      mode,
      reference,
      notes,
      recordedBy: req.user.id
    };

    invoice.payments.push(payment);
    invoice.amountPaid += amount;

    await invoice.save();

    res.json({
      success: true,
      message: "Payment recorded successfully",
      data: {
        payment,
        newBalance: invoice.balance,
        status: invoice.status
      }
    });
  } catch (error) { next(error); }
};

// GET /api/v1/invoices/overdue
const getOverdueInvoices = async (req, res, next) => {
  try {
    const overdueInvoices = await Invoice.find({
      status: { $in: ["unpaid", "partial"] },
      dueDate: { $lt: new Date() }
    })
    .populate("customer", "name company phone")
    .populate("order", "orderNumber")
    .sort({ dueDate: 1 });

    res.json({ success: true, data: overdueInvoices });
  } catch (error) { next(error); }
};

// DELETE /api/v1/invoices/:id
const deleteInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }

    // Only allow deletion of unpaid invoices with no payments
    if (invoice.payments.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete invoice with recorded payments"
      });
    }

    await Invoice.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: "Invoice deleted successfully" });
  } catch (error) { next(error); }
};

// GET /api/v1/invoices/stats
const getInvoiceStats = async (req, res, next) => {
  try {
    const stats = await Invoice.aggregate([
      {
        $group: {
          _id: null,
          totalInvoices: { $sum: 1 },
          totalAmount: { $sum: "$grandTotal" },
          totalPaid: { $sum: "$amountPaid" },
          totalPending: { $sum: { $subtract: ["$grandTotal", "$amountPaid"] } },
          unpaidInvoices: { $sum: { $cond: [{ $eq: ["$status", "unpaid"] }, 1, 0] } },
          partialInvoices: { $sum: { $cond: [{ $eq: ["$status", "partial"] }, 1, 0] } },
          paidInvoices: { $sum: { $cond: [{ $eq: ["$status", "paid"] }, 1, 0] } }
        }
      }
    ]);

    const overdueCount = await Invoice.countDocuments({
      status: { $in: ["unpaid", "partial"] },
      dueDate: { $lt: new Date() }
    });

    const monthlyStats = await Invoice.aggregate([
      {
        $match: {
          issueDate: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 11)) }
        }
      },
      {
        $group: {
          _id: { month: { $month: "$issueDate" }, year: { $year: "$issueDate" } },
          count: { $sum: 1 },
          amount: { $sum: "$grandTotal" },
          paid: { $sum: "$amountPaid" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    const result = {
      ...stats[0] || { totalInvoices: 0, totalAmount: 0, totalPaid: 0, totalPending: 0, unpaidInvoices: 0, partialInvoices: 0, paidInvoices: 0 },
      overdueCount,
      monthlyStats
    };

    res.json({ success: true, data: result });
  } catch (error) { next(error); }
};

module.exports = {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  addPayment,
  getOverdueInvoices,
  deleteInvoice,
  getInvoiceStats
};