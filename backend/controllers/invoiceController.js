const { Invoice, Order, Customer, User } = require("../models");
const { generateInvoiceNumber } = require("../utils/generateNumbers");
const { validationResult } = require("express-validator");
const { Op } = require("sequelize");
const { sequelize } = require("../config/database");

// Helper to format invoice response including balance property
const formatInvoiceResponse = (invoiceInstance) => {
  if (!invoiceInstance) return null;
  const inv = invoiceInstance.toJSON ? invoiceInstance.toJSON() : { ...invoiceInstance };
  
  if (invoiceInstance.getBalance) {
    inv.balance = invoiceInstance.getBalance();
  } else {
    inv.balance = parseFloat((inv.grandTotal - inv.amountPaid).toFixed(2));
  }
  
  if (inv.creator) {
    inv.createdBy = inv.creator;
    delete inv.creator;
  }
  return inv;
};

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
      query.invoiceNumber = { [Op.iLike]: `%${search}%` };
    }

    if (status) query.status = status;
    if (customerId) query.customerId = customerId;

    // Date range filter
    if (startDate || endDate) {
      query.issueDate = {};
      if (startDate) query.issueDate[Op.gte] = new Date(startDate);
      if (endDate) query.issueDate[Op.lte] = new Date(endDate);
    }

    const { rows: invoices, count: total } = await Invoice.findAndCountAll({
      where: query,
      order: [[sortBy, sortOrder.toUpperCase()]],
      offset: parseInt(skip),
      limit: parseInt(limit),
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'name', 'company', 'phone', 'customerCode'] },
        { model: Order, as: 'order', attributes: ['id', 'orderNumber'] },
        { model: User, as: 'creator', attributes: ['name'] }
      ]
    });

    res.json({
      success: true,
      data: {
        invoices: invoices.map(formatInvoiceResponse),
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
    const invoice = await Invoice.findByPk(req.params.id, {
      include: [
        { model: Customer, as: 'customer' },
        { model: Order, as: 'order' },
        { model: User, as: 'creator', attributes: ['name', 'email'] }
      ]
    });
    
    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }

    // Dynamic populate for payments recordedBy from JSONB array
    const formattedInvoice = formatInvoiceResponse(invoice);
    if (formattedInvoice && formattedInvoice.payments && formattedInvoice.payments.length > 0) {
      const userIds = formattedInvoice.payments.map(p => p.recordedBy).filter(Boolean);
      if (userIds.length > 0) {
        const users = await User.findAll({
          where: { id: userIds },
          attributes: ['id', 'name']
        });
        const userMap = {};
        users.forEach(u => {
          userMap[u.id] = u.name;
        });
        formattedInvoice.payments = formattedInvoice.payments.map(p => ({
          ...p,
          recordedBy: p.recordedBy ? { id: p.recordedBy, name: userMap[p.recordedBy] || 'Unknown' } : null
        }));
      }
    }

    res.json({ success: true, data: formattedInvoice });
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
    const order = await Order.findByPk(orderId, {
      include: [{ model: Customer, as: 'customer' }]
    });
    if (!order || order.isDeleted) {
      return res.status(400).json({ success: false, message: "Invalid order" });
    }

    if (order.status !== "delivered") {
      return res.status(400).json({ success: false, message: "Can only create invoice for delivered orders" });
    }

    // Check if invoice already exists for this order
    const existingInvoice = await Invoice.findOne({ where: { orderId } });
    if (existingInvoice) {
      return res.status(400).json({ success: false, message: "Invoice already exists for this order" });
    }

    const invoiceNumber = await generateInvoiceNumber();

    const invoice = await Invoice.create({
      invoiceNumber,
      orderId,
      customerId: order.customerId,
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

    const savedInvoice = await Invoice.findByPk(invoice.id, {
      include: [
        { model: Customer, as: 'customer', attributes: ['name', 'company', 'phone'] },
        { model: Order, as: 'order', attributes: ['orderNumber'] },
        { model: User, as: 'creator', attributes: ['name'] }
      ]
    });

    res.status(201).json({
      success: true,
      message: "Invoice created successfully",
      data: formatInvoiceResponse(savedInvoice)
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

    const invoice = await Invoice.findByPk(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }

    // Only allow updates to unpaid invoices
    if (invoice.status === "paid") {
      return res.status(400).json({ success: false, message: "Cannot update paid invoices" });
    }

    const updateFields = {};
    if (dueDate !== undefined) updateFields.dueDate = dueDate;
    if (notes !== undefined) updateFields.notes = notes;
    if (termsAndConditions !== undefined) updateFields.termsAndConditions = termsAndConditions;

    await invoice.update(updateFields);

    const updatedInvoice = await Invoice.findByPk(invoice.id, {
      include: [
        { model: Customer, as: 'customer', attributes: ['name', 'company', 'phone'] },
        { model: Order, as: 'order', attributes: ['orderNumber'] }
      ]
    });

    res.json({
      success: true,
      message: "Invoice updated successfully",
      data: formatInvoiceResponse(updatedInvoice)
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

    const invoice = await Invoice.findByPk(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }

    // Validate payment amount
    const remainingAmount = parseFloat((invoice.grandTotal - invoice.amountPaid).toFixed(2));
    if (parseFloat(amount) > remainingAmount) {
      return res.status(400).json({
        success: false,
        message: `Payment amount (${amount}) exceeds remaining balance (${remainingAmount})`
      });
    }

    const payment = {
      amount: parseFloat(amount),
      paymentDate: paymentDate || new Date(),
      mode,
      reference,
      notes,
      recordedBy: req.user.id
    };

    const payments = [...(invoice.payments || []), payment];
    const newAmountPaid = parseFloat((parseFloat(invoice.amountPaid) + parseFloat(amount)).toFixed(2));

    await invoice.update({
      payments,
      amountPaid: newAmountPaid
    });

    await invoice.reload();

    res.json({
      success: true,
      message: "Payment recorded successfully",
      data: {
        payment,
        newBalance: formatInvoiceResponse(invoice).balance,
        status: invoice.status
      }
    });
  } catch (error) { next(error); }
};

// GET /api/v1/invoices/overdue
const getOverdueInvoices = async (req, res, next) => {
  try {
    const overdueInvoices = await Invoice.findAll({
      where: {
        status: { [Op.in]: ["unpaid", "partial"] },
        dueDate: { [Op.lt]: new Date() }
      },
      include: [
        { model: Customer, as: 'customer', attributes: ['name', 'company', 'phone'] },
        { model: Order, as: 'order', attributes: ['orderNumber'] }
      ],
      order: [['dueDate', 'ASC']]
    });

    res.json({ success: true, data: overdueInvoices.map(formatInvoiceResponse) });
  } catch (error) { next(error); }
};

// DELETE /api/v1/invoices/:id
const deleteInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }

    // Only allow deletion of unpaid invoices with no payments
    if (invoice.payments && invoice.payments.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete invoice with recorded payments"
      });
    }

    await invoice.destroy();

    res.json({ success: true, message: "Invoice deleted successfully" });
  } catch (error) { next(error); }
};

// GET /api/v1/invoices/stats
const getInvoiceStats = async (req, res, next) => {
  try {
    const stats = await Invoice.findOne({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalInvoices'],
        [sequelize.fn('SUM', sequelize.col('grandTotal')), 'totalAmount'],
        [sequelize.fn('SUM', sequelize.col('amountPaid')), 'totalPaid'],
        [sequelize.literal('SUM("grandTotal" - "amountPaid")'), 'totalPending'],
        [sequelize.literal('SUM(CASE WHEN "status" = \'unpaid\' THEN 1 ELSE 0 END)'), 'unpaidInvoices'],
        [sequelize.literal('SUM(CASE WHEN "status" = \'partial\' THEN 1 ELSE 0 END)'), 'partialInvoices'],
        [sequelize.literal('SUM(CASE WHEN "status" = \'paid\' THEN 1 ELSE 0 END)'), 'paidInvoices'],
      ],
      raw: true
    });

    const overdueCount = await Invoice.count({
      where: {
        status: { [Op.in]: ["unpaid", "partial"] },
        dueDate: { [Op.lt]: new Date() }
      }
    });

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 11);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const rawMonthlyStats = await Invoice.findAll({
      attributes: [
        [sequelize.literal('EXTRACT(MONTH FROM "issueDate")'), 'month'],
        [sequelize.literal('EXTRACT(YEAR FROM "issueDate")'), 'year'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('grandTotal')), 'amount'],
        [sequelize.fn('SUM', sequelize.col('amountPaid')), 'paid']
      ],
      where: {
        issueDate: {
          [Op.gte]: startDate
        }
      },
      group: [
        sequelize.literal('EXTRACT(YEAR FROM "issueDate")'),
        sequelize.literal('EXTRACT(MONTH FROM "issueDate")')
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
      amount: parseFloat(item.amount || 0),
      paid: parseFloat(item.paid || 0)
    }));

    const result = {
      totalInvoices: parseInt(stats.totalInvoices || 0),
      totalAmount: parseFloat(stats.totalAmount || 0),
      totalPaid: parseFloat(stats.totalPaid || 0),
      totalPending: parseFloat(stats.totalPending || 0),
      unpaidInvoices: parseInt(stats.unpaidInvoices || 0),
      partialInvoices: parseInt(stats.partialInvoices || 0),
      paidInvoices: parseInt(stats.paidInvoices || 0),
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