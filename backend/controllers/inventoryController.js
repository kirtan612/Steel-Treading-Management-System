const { Inventory, User } = require("../models");
const { Op } = require("sequelize");
const { sequelize } = require("../config/database");
const { validationResult } = require("express-validator");

/**
 * SECURITY NOTE: SQL Injection Protection
 * All database queries in this controller use Sequelize ORM with parameterized queries,
 * which automatically protects against SQL injection attacks.
 * DO NOT bypass Sequelize with raw SQL queries unless absolutely necessary.
 * If raw queries are needed, always use parameterized queries with replacements.
 */

// Helper to format inventory response including virtual status
const formatInventoryResponse = (itemInstance) => {
  if (!itemInstance) return null;
  const item = itemInstance.toJSON ? itemInstance.toJSON() : { ...itemInstance };
  
  if (itemInstance.getStatus) {
    item.status = itemInstance.getStatus();
  } else {
    item.status = item.stockQty === 0 ? "Out of Stock" : 
                  parseFloat(item.stockQty) <= parseFloat(item.reorderLevel) ? "Low Stock" : "In Stock";
  }

  if (item.creator) {
    item.createdBy = item.creator;
    delete item.creator;
  }
  return item;
};

// GET /api/v1/inventory
const getInventory = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      type = "",
      status = "",
      sortBy = "createdAt",
      sortOrder = "desc"
    } = req.query;

    const skip = (page - 1) * limit;
    const query = { isDeleted: false };

    // Search functionality
    if (search) {
      query[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { itemCode: { [Op.iLike]: `%${search}%` } },
        { grade: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (type) query.pipeType = type;

    const items = await Inventory.findAll({
      where: query,
      order: [[sortBy, sortOrder.toUpperCase()]],
      offset: parseInt(skip),
      limit: parseInt(limit),
      include: [
        { model: User, as: 'creator', attributes: ['name'] }
      ]
    });

    let formattedItems = items.map(formatInventoryResponse);

    if (status) {
      formattedItems = formattedItems.filter(item => {
        return item.status.toLowerCase().replace(/ /g, "-") === status;
      });
    }

    const total = await Inventory.count({ where: query });
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: formattedItems,
      pagination: {
        total,
        page: parseInt(page),
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) { next(error); }
};

// GET /api/v1/inventory/low-stock
const getLowStock = async (req, res, next) => {
  try {
    const items = await Inventory.findAll({
      where: {
        isDeleted: false,
        stockQty: {
          [Op.lte]: sequelize.col('reorderLevel')
        }
      },
      order: [['stockQty', 'ASC']],
      include: [
        { model: User, as: 'creator', attributes: ['name'] }
      ]
    });

    res.json({
      success: true,
      data: items.map(formatInventoryResponse),
      message: `Found ${items.length} items with low stock`
    });
  } catch (error) { next(error); }
};

// GET /api/v1/inventory/:id
const getInventoryItem = async (req, res, next) => {
  try {
    const item = await Inventory.findOne({
      where: { id: req.params.id, isDeleted: false },
      include: [
        { model: User, as: 'creator', attributes: ['name', 'email'] }
      ]
    });
    
    if (!item) {
      return res.status(404).json({ success: false, message: "Inventory item not found" });
    }

    res.json({ success: true, data: formatInventoryResponse(item) });
  } catch (error) { next(error); }
};

// POST /api/v1/inventory
const createInventoryItem = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: "Validation failed", 
        errors: errors.array() 
      });
    }

    const itemData = {
      ...req.body,
      createdBy: req.user.id
    };

    const item = await Inventory.create(itemData);

    const savedItem = await Inventory.findByPk(item.id, {
      include: [
        { model: User, as: 'creator', attributes: ['name'] }
      ]
    });

    res.status(201).json({
      success: true,
      message: "Inventory item created successfully",
      data: formatInventoryResponse(savedItem)
    });
  } catch (error) { next(error); }
};

// PUT /api/v1/inventory/:id
const updateInventoryItem = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: "Validation failed", 
        errors: errors.array() 
      });
    }

    const item = await Inventory.findOne({
      where: { id: req.params.id, isDeleted: false }
    });

    if (!item) {
      return res.status(404).json({ success: false, message: "Inventory item not found" });
    }

    await item.update(req.body);

    const updatedItem = await Inventory.findByPk(item.id, {
      include: [
        { model: User, as: 'creator', attributes: ['name'] }
      ]
    });

    res.json({
      success: true,
      message: "Inventory item updated successfully",
      data: formatInventoryResponse(updatedItem)
    });
  } catch (error) { next(error); }
};

// DELETE /api/v1/inventory/:id
const deleteInventoryItem = async (req, res, next) => {
  try {
    const item = await Inventory.findOne({
      where: { id: req.params.id, isDeleted: false }
    });

    if (!item) {
      return res.status(404).json({ success: false, message: "Inventory item not found" });
    }

    await item.update({ isDeleted: true });

    res.json({ 
      success: true, 
      message: "Inventory item deleted successfully" 
    });
  } catch (error) { next(error); }
};

module.exports = {
  getInventory,
  getLowStock,
  getInventoryItem,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem
};