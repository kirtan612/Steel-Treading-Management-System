const Customer = require("../models/Customer");
const Order = require("../models/Order");
const Invoice = require("../models/Invoice");
const { validationResult } = require("express-validator");

// GET /api/v1/customers
const getAllCustomers = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      customerType = "",
      isActive = "",
      sortBy = "createdAt",
      sortOrder = "desc"
    } = req.query;

    const skip = (page - 1) * limit;
    const query = { isDeleted: false };

    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { customerCode: { $regex: search, $options: "i" } }
      ];
    }

    if (customerType) query.customerType = customerType;
    if (isActive !== "") query.isActive = isActive === "true";

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    const customers = await Customer.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .populate("createdBy", "name");

    const total = await Customer.countDocuments(query);

    res.json({
      success: true,
      data: {
        customers,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          hasNext: skip + customers.length < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) { next(error); }
};

// GET /api/v1/customers/:id
const getCustomerById = async (req, res, next) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id, isDeleted: false })
      .populate("createdBy", "name email");
    
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    // Get customer statistics
    const orderStats = await Order.aggregate([
      { $match: { customer: customer._id, isDeleted: false } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalValue: { $sum: "$grandTotal" },
          pendingOrders: { $sum: { $cond: [{ $in: ["$status", ["draft", "confirmed"]] }, 1, 0] } }
        }
      }
    ]);

    const invoiceStats = await Invoice.aggregate([
      { $match: { customer: customer._id } },
      {
        $group: {
          _id: null,
          totalInvoices: { $sum: 1 },
          totalAmount: { $sum: "$grandTotal" },
          totalPaid: { $sum: "$amountPaid" },
          pendingAmount: { $sum: { $subtract: ["$grandTotal", "$amountPaid"] } }
        }
      }
    ]);

    const stats = {
      orders: orderStats[0] || { totalOrders: 0, totalValue: 0, pendingOrders: 0 },
      invoices: invoiceStats[0] || { totalInvoices: 0, totalAmount: 0, totalPaid: 0, pendingAmount: 0 }
    };

    res.json({ success: true, data: { customer, stats } });
  } catch (error) { next(error); }
};

// POST /api/v1/customers
const createCustomer = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: "Validation failed", errors: errors.array() });
    }

    // Handle shipping address same as billing
    let customerData = { ...req.body, createdBy: req.user.id };
    if (customerData.sameAsBilling && customerData.billingAddress) {
      customerData.shippingAddress = { ...customerData.billingAddress };
    }

    const customer = new Customer(customerData);
    await customer.save();
    await customer.populate("createdBy", "name");

    res.status(201).json({
      success: true,
      message: "Customer created successfully",
      data: customer
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "Customer code already exists" });
    }
    next(error);
  }
};

// PUT /api/v1/customers/:id
const updateCustomer = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: "Validation failed", errors: errors.array() });
    }

    // Handle shipping address same as billing
    let updateData = { ...req.body };
    if (updateData.sameAsBilling && updateData.billingAddress) {
      updateData.shippingAddress = { ...updateData.billingAddress };
    }

    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      updateData,
      { new: true, runValidators: true }
    ).populate("createdBy", "name");

    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    res.json({
      success: true,
      message: "Customer updated successfully",
      data: customer
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "Customer code already exists" });
    }
    next(error);
  }
};

// DELETE /api/v1/customers/:id
const deleteCustomer = async (req, res, next) => {
  try {
    // Check if customer has orders
    const orderCount = await Order.countDocuments({ customer: req.params.id, isDeleted: false });
    if (orderCount > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete customer with existing orders"
      });
    }

    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );

    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    res.json({ success: true, message: "Customer deleted successfully" });
  } catch (error) { next(error); }
};

// PATCH /api/v1/customers/:id/status
const toggleCustomerStatus = async (req, res, next) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id, isDeleted: false });
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    customer.isActive = !customer.isActive;
    await customer.save();

    res.json({
      success: true,
      message: `Customer ${customer.isActive ? 'activated' : 'deactivated'} successfully`,
      data: { isActive: customer.isActive }
    });
  } catch (error) { next(error); }
};

// GET /api/v1/customers/stats
const getCustomerStats = async (req, res, next) => {
  try {
    const stats = await Customer.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          activeCustomers: { $sum: { $cond: ["$isActive", 1, 0] } },
          inactiveCustomers: { $sum: { $cond: ["$isActive", 0, 1] } }
        }
      }
    ]);

    const customerTypes = await Customer.aggregate([
      { $match: { isDeleted: false, isActive: true } },
      { $group: { _id: "$customerType", count: { $sum: 1 } } }
    ]);

    const result = {
      ...stats[0] || { totalCustomers: 0, activeCustomers: 0, inactiveCustomers: 0 },
      customerTypes: customerTypes.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    };

    res.json({ success: true, data: result });
  } catch (error) { next(error); }
};

module.exports = {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  toggleCustomerStatus,
  getCustomerStats
};