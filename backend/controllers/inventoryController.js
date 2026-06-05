const Inventory = require("../models/Inventory");
const { validationResult } = require("express-validator");

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
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { itemCode: { $regex: search, $options: "i" } },
        { grade: { $regex: search, $options: "i" } }
      ];
    }

    if (type) query.pipeType = type;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    let items = await Inventory.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .populate("createdBy", "name");

    // Apply status filter after fetching (based on virtual status field)
    if (status) {
      items = items.filter(item => {
        const itemStatus = item.stockQty === 0 ? "Out of Stock" : 
                          item.stockQty <= item.reorderLevel ? "Low Stock" : "In Stock";
        return itemStatus.toLowerCase().replace(/ /g, "-") === status;
      });
    }

    const total = await Inventory.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: items,
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
    const items = await Inventory.find({ 
      isDeleted: false,
      $expr: { $lte: ["$stockQty", "$reorderLevel"] }
    })
    .sort({ stockQty: 1 })
    .populate("createdBy", "name");

    res.json({
      success: true,
      data: items,
      message: `Found ${items.length} items with low stock`
    });
  } catch (error) { next(error); }
};

// GET /api/v1/inventory/:id
const getInventoryItem = async (req, res, next) => {
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

    const item = new Inventory({
      ...req.body,
      createdBy: req.user._id
    });

    await item.save();
    await item.populate("createdBy", "name");

    res.status(201).json({
      success: true,
      message: "Inventory item created successfully",
      data: item
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
  } catch (error) { next(error); }
};

// DELETE /api/v1/inventory/:id
const deleteInventoryItem = async (req, res, next) => {
  try {
    const item = await Inventory.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );

    if (!item) {
      return res.status(404).json({ success: false, message: "Inventory item not found" });
    }

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