const mongoose = require("mongoose");
const Order = require("../models/Order");
const Invoice = require("../models/Invoice");
const Customer = require("../models/Customer");
const Inventory = require("../models/Inventory");

// GET /api/v1/reports/dashboard
const getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    // Sales stats
    const salesStats = await Order.aggregate([
      { $match: { isDeleted: false, status: { $ne: "cancelled" } } },
      {
        $facet: {
          thisMonth: [
            { $match: { createdAt: { $gte: startOfMonth } } },
            { $group: { _id: null, count: { $sum: 1 }, value: { $sum: "$grandTotal" } } }
          ],
          thisYear: [
            { $match: { createdAt: { $gte: startOfYear } } },
            { $group: { _id: null, count: { $sum: 1 }, value: { $sum: "$grandTotal" } } }
          ],
          lastMonth: [
            { $match: { createdAt: { $gte: lastMonth, $lt: startOfMonth } } },
            { $group: { _id: null, count: { $sum: 1 }, value: { $sum: "$grandTotal" } } }
          ]
        }
      }
    ]);

    // Invoice stats
    const invoiceStats = await Invoice.aggregate([
      {
        $facet: {
          overview: [
            {
              $group: {
                _id: null,
                totalInvoices: { $sum: 1 },
                totalAmount: { $sum: "$grandTotal" },
                totalPaid: { $sum: "$amountPaid" },
                pending: { $sum: { $subtract: ["$grandTotal", "$amountPaid"] } }
              }
            }
          ],
          overdue: [
            {
              $match: {
                status: { $in: ["unpaid", "partial"] },
                dueDate: { $lt: today }
              }
            },
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
                amount: { $sum: { $subtract: ["$grandTotal", "$amountPaid"] } }
              }
            }
          ]
        }
      }
    ]);

    // Customer and inventory counts
    const customerCount = await Customer.countDocuments({ isDeleted: false, isActive: true });
    const inventoryStats = await Inventory.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          totalValue: { $sum: { $multiply: ["$stockQty", "$sellingPrice"] } },
          lowStock: { $sum: { $cond: [{ $lte: ["$stockQty", "$reorderLevel"] }, 1, 0] } },
          outOfStock: { $sum: { $cond: [{ $eq: ["$stockQty", 0] }, 1, 0] } }
        }
      }
    ]);

    // Recent orders
    const recentOrders = await Order.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("customer", "name company")
      .select("orderNumber status grandTotal createdAt");

    // Top customers by value
    const topCustomers = await Order.aggregate([
      { $match: { isDeleted: false, status: { $ne: "cancelled" } } },
      {
        $group: {
          _id: "$customer",
          totalOrders: { $sum: 1 },
          totalValue: { $sum: "$grandTotal" }
        }
      },
      { $sort: { totalValue: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "customers",
          localField: "_id",
          foreignField: "_id",
          as: "customer"
        }
      },
      { $unwind: "$customer" },
      {
        $project: {
          name: "$customer.name",
          company: "$customer.company",
          totalOrders: 1,
          totalValue: 1
        }
      }
    ]);

    const result = {
      sales: {
        thisMonth: salesStats[0]?.thisMonth[0] || { count: 0, value: 0 },
        thisYear: salesStats[0]?.thisYear[0] || { count: 0, value: 0 },
        lastMonth: salesStats[0]?.lastMonth[0] || { count: 0, value: 0 }
      },
      invoices: {
        overview: invoiceStats[0]?.overview[0] || { totalInvoices: 0, totalAmount: 0, totalPaid: 0, pending: 0 },
        overdue: invoiceStats[0]?.overdue[0] || { count: 0, amount: 0 }
      },
      customers: { total: customerCount },
      inventory: inventoryStats[0] || { totalItems: 0, totalValue: 0, lowStock: 0, outOfStock: 0 },
      recentOrders,
      topCustomers
    };

    res.json({ success: true, data: result });
  } catch (error) { next(error); }
};

// GET /api/v1/reports/sales
const getSalesReport = async (req, res, next) => {
  try {
    const {
      startDate,
      endDate,
      customerId,
      period = "month" // day, week, month, quarter, year
    } = req.query;

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }

    const matchStage = {
      isDeleted: false,
      status: { $ne: "cancelled" },
      ...dateFilter
    };

    if (customerId) matchStage.customer = mongoose.Types.ObjectId(customerId);

    // Group by period
    let groupByDate;
    switch (period) {
      case "day":
        groupByDate = {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" }
        };
        break;
      case "week":
        groupByDate = {
          year: { $year: "$createdAt" },
          week: { $week: "$createdAt" }
        };
        break;
      case "quarter":
        groupByDate = {
          year: { $year: "$createdAt" },
          quarter: {
            $ceil: { $divide: [{ $month: "$createdAt" }, 3] }
          }
        };
        break;
      case "year":
        groupByDate = { year: { $year: "$createdAt" } };
        break;
      default: // month
        groupByDate = {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" }
        };
    }

    const salesData = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: groupByDate,
          orderCount: { $sum: 1 },
          totalValue: { $sum: "$grandTotal" },
          avgOrderValue: { $avg: "$grandTotal" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
    ]);

    // Summary stats
    const summary = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalValue: { $sum: "$grandTotal" },
          avgOrderValue: { $avg: "$grandTotal" },
          maxOrderValue: { $max: "$grandTotal" },
          minOrderValue: { $min: "$grandTotal" }
        }
      }
    ]);

    // Top items sold
    const topItems = await Order.aggregate([
      { $match: matchStage },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.itemName",
          quantitySold: { $sum: "$items.quantity" },
          revenue: { $sum: "$items.subtotal" }
        }
      },
      { $sort: { quantitySold: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        salesData,
        summary: summary[0] || { totalOrders: 0, totalValue: 0, avgOrderValue: 0, maxOrderValue: 0, minOrderValue: 0 },
        topItems
      }
    });
  } catch (error) { next(error); }
};

// GET /api/v1/reports/inventory
const getInventoryReport = async (req, res, next) => {
  try {
    const { category, lowStock = false } = req.query;

    let matchStage = { isDeleted: false };
    if (category) matchStage.pipeType = category;
    if (lowStock === "true") {
      matchStage.$expr = { $lte: ["$stockQty", "$reorderLevel"] };
    }

    const inventoryData = await Inventory.find(matchStage)
      .select("itemCode name pipeType stockQty reorderLevel sellingPrice purchasePrice")
      .sort({ stockQty: 1 });

    // Summary stats
    const summary = await Inventory.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          totalStockValue: { $sum: { $multiply: ["$stockQty", "$sellingPrice"] } },
          totalCostValue: { $sum: { $multiply: ["$stockQty", "$purchasePrice"] } },
          lowStockItems: { $sum: { $cond: [{ $lte: ["$stockQty", "$reorderLevel"] }, 1, 0] } },
          outOfStockItems: { $sum: { $cond: [{ $eq: ["$stockQty", 0] }, 1, 0] } }
        }
      }
    ]);

    // Category breakdown
    const categoryStats = await Inventory.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: "$pipeType",
          itemCount: { $sum: 1 },
          totalStock: { $sum: "$stockQty" },
          totalValue: { $sum: { $multiply: ["$stockQty", "$sellingPrice"] } }
        }
      },
      { $sort: { totalValue: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        items: inventoryData,
        summary: summary[0] || { totalItems: 0, totalStockValue: 0, totalCostValue: 0, lowStockItems: 0, outOfStockItems: 0 },
        categoryStats
      }
    });
  } catch (error) { next(error); }
};

// GET /api/v1/reports/customers
const getCustomerReport = async (req, res, next) => {
  try {
    const { customerType, startDate, endDate } = req.query;

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }

    // Customer analysis with order data
    const customerData = await Customer.aggregate([
      { $match: { isDeleted: false, ...(customerType && { customerType }) } },
      {
        $lookup: {
          from: "orders",
          let: { customerId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$customer", "$$customerId"] },
                isDeleted: false,
                status: { $ne: "cancelled" },
                ...dateFilter
              }
            }
          ],
          as: "orders"
        }
      },
      {
        $addFields: {
          totalOrders: { $size: "$orders" },
          totalValue: { $sum: "$orders.grandTotal" },
          avgOrderValue: { $avg: "$orders.grandTotal" },
          lastOrderDate: { $max: "$orders.createdAt" }
        }
      },
      {
        $project: {
          name: 1,
          company: 1,
          customerType: 1,
          phone: 1,
          email: 1,
          createdAt: 1,
          totalOrders: 1,
          totalValue: 1,
          avgOrderValue: 1,
          lastOrderDate: 1
        }
      },
      { $sort: { totalValue: -1 } }
    ]);

    // Summary stats
    const summary = {
      totalCustomers: customerData.length,
      activeCustomers: customerData.filter(c => c.totalOrders > 0).length,
      totalRevenue: customerData.reduce((sum, c) => sum + (c.totalValue || 0), 0),
      avgCustomerValue: customerData.length > 0 ? 
        customerData.reduce((sum, c) => sum + (c.totalValue || 0), 0) / customerData.length : 0
    };

    // Customer type breakdown
    const typeBreakdown = customerData.reduce((acc, customer) => {
      const type = customer.customerType || "Unknown";
      if (!acc[type]) acc[type] = { count: 0, revenue: 0 };
      acc[type].count++;
      acc[type].revenue += customer.totalValue || 0;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        customers: customerData,
        summary,
        typeBreakdown
      }
    });
  } catch (error) { next(error); }
};

// GET /api/v1/reports/financial
const getFinancialReport = async (req, res, next) => {
  try {
    const { startDate, endDate, period = "month" } = req.query;

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        issueDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }

    // Revenue vs Collections
    const financialData = await Invoice.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            year: { $year: "$issueDate" },
            month: { $month: "$issueDate" }
          },
          totalInvoiced: { $sum: "$grandTotal" },
          totalCollected: { $sum: "$amountPaid" },
          pending: { $sum: { $subtract: ["$grandTotal", "$amountPaid"] } }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    // Outstanding analysis
    const outstandingData = await Invoice.aggregate([
      {
        $match: {
          status: { $in: ["unpaid", "partial"] }
        }
      },
      {
        $addFields: {
          daysOverdue: {
            $divide: [
              { $subtract: [new Date(), "$dueDate"] },
              1000 * 60 * 60 * 24
            ]
          },
          outstandingAmount: { $subtract: ["$grandTotal", "$amountPaid"] }
        }
      },
      {
        $bucket: {
          groupBy: "$daysOverdue",
          boundaries: [0, 30, 60, 90, Number.POSITIVE_INFINITY],
          default: "Current",
          output: {
            count: { $sum: 1 },
            amount: { $sum: "$outstandingAmount" }
          }
        }
      }
    ]);

    // Payment mode analysis
    const paymentModes = await Invoice.aggregate([
      { $unwind: "$payments" },
      {
        $group: {
          _id: "$payments.mode",
          count: { $sum: 1 },
          amount: { $sum: "$payments.amount" }
        }
      },
      { $sort: { amount: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        financialData,
        outstandingData,
        paymentModes
      }
    });
  } catch (error) { next(error); }
};

module.exports = {
  getDashboardStats,
  getSalesReport,
  getInventoryReport,
  getCustomerReport,
  getFinancialReport
};