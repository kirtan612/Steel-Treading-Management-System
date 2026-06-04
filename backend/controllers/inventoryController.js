const Inventory = require("../models/Inventory");
const { validationResult } = require("express-validator");

// GET /api/v1/inventory
const getAllInventory = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      pipeType = "",
      status = "",
      sortBy = "createdAt",
      sortOrder = "desc"
    } = req.query;

    const skip = (page - 1) * limit;
    const query = { isDeleted: false };

    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { itemCode: { $regex: search, $options: "i" } },
        { grade: { $regex: search, $options: "i" } }
      ];
    }

    if (pipeType) query.pipeType = pipeType;

    // Status filter
    if (status === "out-of-stock") query.stockQty = 0;
    else if (status === "low-stock") query.$expr = { $lte: ["$stockQty", "$reorderLevel"] };

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    const items = await Inventory.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .populate("createdBy", "name");

    const total = await Inventory.countDocuments(query);

    res.json({
      success: true,
      data: {
        items,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          hasNext: skip + items.length < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) { next(error); }
};

// GET /api/v1/inventory/:id
const getInventoryById = async (req, res, next) => {
  try {
    const item = await Inventory.findOne({ _id: req.params.id, isDeleted: false })
      .populate("createdBy", "name email");
    
    if (!item) {
      return res.status(404).json({ success: false, message: "Inventory item not found" });
    }

    res.json({ success: true, data: item });
  } catch (error) { next(error); }
};

// POST /api/v1/inventory
const createInventory = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: "Validation failed", errors: errors.array() });
    }

    const item = new Inventory({
      ...req.body,
      createdBy: req.user.id
    });

    await item.save();
    await item.populate("createdBy", "name");

    res.status(201).json({
      success: true,
      message: "Inventory item created successfully",
      data: item
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "Item code already exists" });
    }
    next(error);
  }
};

// PUT /api/v1/inventory/:id
const updateInventory = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: "Validation failed", errors: errors.array() });
    }

    const item = await Inventory.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      req.body,
      { new: true, runValidators: true }
    ).populate("createdBy", "name");

    if (!item) {
      return res.status(404).json({ success: false, message: "Inventory item not found" });
    }

    res.json({
      success: true,
      message: "Inventory item updated successfully",
      data: item
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "Item code already exists" });
    }
    next(error);
  }
};

// DELETE /api/v1/inventory/:id
const deleteInventory = async (req, res, next) => {
  try {
    const item = await Inventory.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );

    if (!item) {
      return res.status(404).json({ success: false, message: "Inventory item not found" });
    }

    res.json({ success: true, message: "Inventory item deleted successfully" });
  } catch (error) { next(error); }
};

// PATCH /api/v1/inventory/:id/stock
const updateStock = async (req, res, next) => {
  try {
    const { quantity, operation = "set" } = req.body;

    if (typeof quantity !== "number" || quantity < 0) {
      return res.status(400).json({ success: false, message: "Valid quantity is required" });
    }

    const item = await Inventory.findOne({ _id: req.params.id, isDeleted: false });
    if (!item) {
      return res.status(404).json({ success: false, message: "Inventory item not found" });
    }

    let newStock;
    if (operation === "add") newStock = item.stockQty + quantity;
    else if (operation === "subtract") newStock = Math.max(0, item.stockQty - quantity);
    else newStock = quantity;

    item.stockQty = newStock;
    await item.save();

    res.json({
      success: true,
      message: "Stock updated successfully",
      data: { itemCode: item.itemCode, newStock, previousStock: item.stockQty }
    });
  } catch (error) { next(error); }
};

// GET /api/v1/inventory/stats
const getInventoryStats = async (req, res, next) => {
  try {
    const stats = await Inventory.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          totalValue: { $sum: { $multiply: ["$stockQty", "$sellingPrice"] } },
          lowStockItems: {
            $sum: { $cond: [{ $lte: ["$stockQty", "$reorderLevel"] }, 1, 0] }
          },
          outOfStockItems: {
            $sum: { $cond: [{ $eq: ["$stockQty", 0] }, 1, 0] }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalItems: 0,
      totalValue: 0,
      lowStockItems: 0,
      outOfStockItems: 0
    };

    res.json({ success: true, data: result });
  } catch (error) { next(error); }
};

module.exports = {
  getAllInventory,
  getInventoryById,
  createInventory,
  updateInventory,
  deleteInventory,
  updateStock,
  getInventoryStats
};