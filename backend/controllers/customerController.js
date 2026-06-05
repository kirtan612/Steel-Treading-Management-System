const { Customer, Order, User } = require("../models");
const { Op } = require("sequelize");
const { validationResult } = require("express-validator");

// Helper to format customer database record back to nested frontend format
const formatCustomerResponse = (customerInstance) => {
  if (!customerInstance) return null;
  const c = customerInstance.toJSON ? customerInstance.toJSON() : { ...customerInstance };
  
  c.billingAddress = {
    street: c.billingStreet || "",
    city: c.billingCity || "",
    state: c.billingState || "",
    pincode: c.billingPincode || ""
  };
  
  c.shippingAddress = {
    street: c.shippingStreet || "",
    city: c.shippingCity || "",
    state: c.shippingState || "",
    pincode: c.shippingPincode || ""
  };
  
  delete c.billingStreet;
  delete c.billingCity;
  delete c.billingState;
  delete c.billingPincode;
  delete c.shippingStreet;
  delete c.shippingCity;
  delete c.shippingState;
  delete c.shippingPincode;

  if (c.creator) {
    c.createdBy = c.creator;
    delete c.creator;
  }
  
  return c;
};

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
      query[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { company: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } },
        { customerCode: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (customerType) query.customerType = customerType;

    const { rows: customers, count: total } = await Customer.findAndCountAll({
      where: query,
      order: [['createdAt', 'DESC']],
      offset: parseInt(skip),
      limit: parseInt(limit),
      include: [
        { model: User, as: 'creator', attributes: ['name'] }
      ]
    });

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: customers.map(formatCustomerResponse),
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
    const customer = await Customer.findOne({
      where: { id: req.params.id, isDeleted: false },
      include: [
        { model: User, as: 'creator', attributes: ['name', 'email'] }
      ]
    });
    
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    // Get customer statistics from orders (exclude cancelled)
    const totalOrders = await Order.count({
      where: {
        customerId: customer.id,
        isDeleted: false,
        status: { [Op.ne]: "cancelled" }
      }
    });

    const totalRevenue = await Order.sum('grandTotal', {
      where: {
        customerId: customer.id,
        isDeleted: false,
        status: { [Op.ne]: "cancelled" }
      }
    }) || 0;

    const stats = {
      totalOrders,
      totalRevenue: parseFloat(parseFloat(totalRevenue).toFixed(2))
    };

    // Get last 20 orders
    const recentOrders = await Order.findAll({
      where: {
        customerId: customer.id,
        isDeleted: false
      },
      order: [['createdAt', 'DESC']],
      limit: 20,
      attributes: ['id', 'orderNumber', 'status', 'grandTotal', 'createdAt']
    });

    res.json({ 
      success: true, 
      data: {
        customer: formatCustomerResponse(customer),
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

    const customerData = {
      ...req.body,
      createdBy: req.user.id
    };

    // Flatten address objects if they exist in request body
    if (req.body.billingAddress) {
      customerData.billingStreet = req.body.billingAddress.street;
      customerData.billingCity = req.body.billingAddress.city;
      customerData.billingState = req.body.billingAddress.state;
      customerData.billingPincode = req.body.billingAddress.pincode;
      delete customerData.billingAddress;
    }

    if (req.body.shippingAddress) {
      customerData.shippingStreet = req.body.shippingAddress.street;
      customerData.shippingCity = req.body.shippingAddress.city;
      customerData.shippingState = req.body.shippingAddress.state;
      customerData.shippingPincode = req.body.shippingAddress.pincode;
      delete customerData.shippingAddress;
    }

    const customer = await Customer.create(customerData);

    const savedCustomer = await Customer.findByPk(customer.id, {
      include: [
        { model: User, as: 'creator', attributes: ['name'] }
      ]
    });

    res.status(201).json({
      success: true,
      message: "Customer created successfully",
      data: formatCustomerResponse(savedCustomer)
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

    const customer = await Customer.findOne({
      where: { id: req.params.id, isDeleted: false }
    });

    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    const updateData = { ...req.body };

    // Flatten address objects if they exist in request body
    if (req.body.billingAddress) {
      updateData.billingStreet = req.body.billingAddress.street;
      updateData.billingCity = req.body.billingAddress.city;
      updateData.billingState = req.body.billingAddress.state;
      updateData.billingPincode = req.body.billingAddress.pincode;
      delete updateData.billingAddress;
    }

    if (req.body.shippingAddress) {
      updateData.shippingStreet = req.body.shippingAddress.street;
      updateData.shippingCity = req.body.shippingAddress.city;
      updateData.shippingState = req.body.shippingAddress.state;
      updateData.shippingPincode = req.body.shippingAddress.pincode;
      delete updateData.shippingAddress;
    }

    await customer.update(updateData);

    const updatedCustomer = await Customer.findByPk(customer.id, {
      include: [
        { model: User, as: 'creator', attributes: ['name'] }
      ]
    });

    res.json({
      success: true,
      message: "Customer updated successfully",
      data: formatCustomerResponse(updatedCustomer)
    });
  } catch (error) { next(error); }
};

// DELETE /api/v1/customers/:id
const deleteCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findOne({
      where: { id: req.params.id, isDeleted: false }
    });

    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    await customer.update({ isDeleted: true });

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