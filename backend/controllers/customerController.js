const Customer = require("../models/Customer");
const Order = require("../models/Order");
const { validationResult } = require("express-validator");

// GET /api/v1/customers
const getCustomers = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      customerType = ""
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

    const customers = await Customer.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("createdBy", "name");

    const total = await Customer.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: customers,
      pagination: {
        total,
        page: parseInt(page),
        totalPages
      }
    });
  } catch (error) { next(error); }
};

// GET /api/v1/customers/:id
const getCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id, isDeleted: false })
      .populate("createdBy", "name email");
    
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    // Get customer statistics from orders (exclude cancelled)
    const orderStats = await Order.aggregate([
      { 
        $match: { 
          customer: customer._id, 
          isDeleted: false,
          status: { $ne: "cancelled" }
        } 
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$grandTotal" }
        }
      }
    ]);

    // Get last 20 orders
    const recentOrders = await Order.find({
      customer: customer._id,
      isDeleted: false
    })
    .sort({ createdAt: -1 })
    .limit(20)
    .select("orderNumber status grandTotal createdAt");

    const stats = orderStats[0] || { totalOrders: 0, totalRevenue: 0 };

    res.json({ 
      success: true, 
      data: {
        customer,
        stats,
        recentOrders
      }
    });
  } catch (error) { next(error); }
};

// POST /api/v1/customers
const createCustomer = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: "Validation failed", 
        errors: errors.array() 
      });
    }

    const customer = new Customer({
      ...req.body,
      createdBy: req.user._id
    });

    await customer.save();
    await customer.populate("createdBy", "name");

    res.status(201).json({
      success: true,
      message: "Customer created successfully",
      data: customer
    });
  } catch (error) { next(error); }
};

// PUT /api/v1/customers/:id
const updateCustomer = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: "Validation failed", 
        errors: errors.array() 
      });
    }

    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      req.body,
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
  } catch (error) { next(error); }
};

// DELETE /api/v1/customers/:id
const deleteCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );

    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    res.json({ 
      success: true, 
      message: "Customer deleted successfully" 
    });
  } catch (error) { next(error); }
};

module.exports = {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer
};