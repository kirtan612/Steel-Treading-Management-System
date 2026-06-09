const { Order, Invoice, Customer, Inventory, User } = require("../models");
const { Op } = require("sequelize");
const { sequelize } = require("../config/database");

// GET /api/v1/reports/dashboard
const getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

    // Sales/Revenue stats — use invoices for accurate revenue
    const invoiceRevenueStats = await Invoice.findOne({
      attributes: [
        [sequelize.literal(`SUM(CASE WHEN "issueDate" >= '${startOfMonth.toISOString()}' THEN "grandTotal" ELSE 0 END)`), 'thisMonthValue'],
        [sequelize.literal(`COUNT(CASE WHEN "issueDate" >= '${startOfMonth.toISOString()}' THEN 1 END)`), 'thisMonthCount'],
        [sequelize.literal(`SUM(CASE WHEN "issueDate" >= '${lastMonth.toISOString()}' AND "issueDate" < '${startOfMonth.toISOString()}' THEN "grandTotal" ELSE 0 END)`), 'lastMonthValue'],
        [sequelize.literal(`COUNT(CASE WHEN "issueDate" >= '${lastMonth.toISOString()}' AND "issueDate" < '${startOfMonth.toISOString()}' THEN 1 END)`), 'lastMonthCount'],
        [sequelize.literal(`SUM(CASE WHEN "issueDate" >= '${startOfYear.toISOString()}' THEN "grandTotal" ELSE 0 END)`), 'thisYearValue'],
        [sequelize.literal(`COUNT(CASE WHEN "issueDate" >= '${startOfYear.toISOString()}' THEN 1 END)`), 'thisYearCount'],
      ],
      raw: true
    });

    // Order counts for this month
    const salesStats = await Order.findOne({
      attributes: [
        [sequelize.literal(`COUNT(CASE WHEN "createdAt" >= '${startOfMonth.toISOString()}' THEN 1 END)`), 'thisMonthCount'],
        [sequelize.literal(`SUM(CASE WHEN "createdAt" >= '${startOfMonth.toISOString()}' THEN "grandTotal" ELSE 0 END)`), 'thisMonthValue'],
        [sequelize.literal(`COUNT(CASE WHEN "createdAt" >= '${startOfYear.toISOString()}' THEN 1 END)`), 'thisYearCount'],
        [sequelize.literal(`SUM(CASE WHEN "createdAt" >= '${startOfYear.toISOString()}' THEN "grandTotal" ELSE 0 END)`), 'thisYearValue'],
        [sequelize.literal(`COUNT(CASE WHEN "createdAt" >= '${lastMonth.toISOString()}' AND "createdAt" < '${startOfMonth.toISOString()}' THEN 1 END)`), 'lastMonthCount'],
        [sequelize.literal(`SUM(CASE WHEN "createdAt" >= '${lastMonth.toISOString()}' AND "createdAt" < '${startOfMonth.toISOString()}' THEN "grandTotal" ELSE 0 END)`), 'lastMonthValue'],
      ],
      where: { isDeleted: false, status: { [Op.ne]: 'cancelled' } },
      raw: true
    });

    // Invoice stats overview and overdue
    const invoiceStats = await Invoice.findOne({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalInvoices'],
        [sequelize.fn('SUM', sequelize.col('grandTotal')), 'totalAmount'],
        [sequelize.fn('SUM', sequelize.col('amountPaid')), 'totalPaid'],
        [sequelize.literal('SUM("grandTotal" - "amountPaid")'), 'pending']
      ],
      raw: true
    });

    const overdueStats = await Invoice.findOne({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.literal('SUM("grandTotal" - "amountPaid")'), 'amount']
      ],
      where: {
        status: { [Op.in]: ['unpaid', 'partial'] },
        dueDate: { [Op.lt]: today }
      },
      raw: true
    });

    // Customer count
    const customerCount = await Customer.count({ where: { isDeleted: false, isActive: true } });

    // Inventory stats
    const inventoryStats = await Inventory.findOne({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalItems'],
        [sequelize.literal('SUM("stockQty" * "sellingPrice")'), 'totalValue'],
        [sequelize.literal('SUM(CASE WHEN "stockQty" <= "reorderLevel" THEN 1 ELSE 0 END)'), 'lowStock'],
        [sequelize.literal('SUM(CASE WHEN "stockQty" = 0 THEN 1 ELSE 0 END)'), 'outOfStock']
      ],
      where: { isDeleted: false },
      raw: true
    });

    // Recent orders
    const recentOrdersRaw = await Order.findAll({
      where: { isDeleted: false },
      order: [['createdAt', 'DESC']],
      limit: 5,
      include: [{ model: Customer, as: 'customer', attributes: ['id', 'name', 'company'] }],
      attributes: ['id', 'orderNumber', 'status', 'grandTotal', 'createdAt']
    });

    const recentOrders = recentOrdersRaw.map(o => {
      const json = o.toJSON();
      if (json.customer) {
        json.customer = {
          _id: json.customer.id,
          name: json.customer.name,
          company: json.customer.company
        };
      }
      return json;
    });

    // Top customers by value
    const topCustomersRaw = await Order.findAll({
      attributes: [
        'customerId',
        [sequelize.fn('COUNT', sequelize.col('Order.id')), 'totalOrders'],
        [sequelize.fn('SUM', sequelize.col('grandTotal')), 'totalValue']
      ],
      where: { isDeleted: false, status: { [Op.ne]: 'cancelled' } },
      group: ['customerId', 'customer.id'],
      include: [{
        model: Customer,
        as: 'customer',
        attributes: ['name', 'company']
      }],
      order: [[sequelize.literal('"totalValue"'), 'DESC']],
      limit: 5
    });

    const topCustomers = topCustomersRaw.map(item => {
      const json = item.toJSON();
      return {
        name: json.customer?.name || null,
        company: json.customer?.company || null,
        totalOrders: parseInt(json.totalOrders),
        totalValue: parseFloat(parseFloat(json.totalValue).toFixed(2))
      };
    });

    const result = {
      sales: {
        thisMonth: {
          count: parseInt(salesStats.thisMonthCount || 0),
          value: parseFloat(parseFloat(invoiceRevenueStats.thisMonthValue || 0).toFixed(2))
        },
        thisYear: {
          count: parseInt(salesStats.thisYearCount || 0),
          value: parseFloat(parseFloat(invoiceRevenueStats.thisYearValue || 0).toFixed(2))
        },
        lastMonth: {
          count: parseInt(salesStats.lastMonthCount || 0),
          value: parseFloat(parseFloat(invoiceRevenueStats.lastMonthValue || 0).toFixed(2))
        }
      },
      invoices: {
        overview: {
          totalInvoices: parseInt(invoiceStats.totalInvoices || 0),
          totalAmount: parseFloat(parseFloat(invoiceStats.totalAmount || 0).toFixed(2)),
          totalPaid: parseFloat(parseFloat(invoiceStats.totalPaid || 0).toFixed(2)),
          pending: parseFloat(parseFloat(invoiceStats.pending || 0).toFixed(2))
        },
        overdue: {
          count: parseInt(overdueStats.count || 0),
          amount: parseFloat(parseFloat(overdueStats.amount || 0).toFixed(2))
        }
      },
      customers: { total: customerCount },
      inventory: {
        totalItems: parseInt(inventoryStats.totalItems || 0),
        totalValue: parseFloat(parseFloat(inventoryStats.totalValue || 0).toFixed(2)),
        lowStock: parseInt(inventoryStats.lowStock || 0),
        outOfStock: parseInt(inventoryStats.outOfStock || 0)
      },
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

    const matchStage = {
      isDeleted: false,
      status: { [Op.ne]: "cancelled" }
    };

    if (startDate && endDate) {
      matchStage.createdAt = {
        [Op.gte]: new Date(startDate),
        [Op.lte]: new Date(new Date(endDate).setHours(23, 59, 59, 999))
      };
    }

    if (customerId) matchStage.customerId = customerId;

    let groupByFields = [];
    let selectFields = [
      [sequelize.fn('COUNT', sequelize.col('id')), 'orderCount'],
      [sequelize.fn('SUM', sequelize.col('grandTotal')), 'totalValue'],
      [sequelize.fn('AVG', sequelize.col('grandTotal')), 'avgOrderValue']
    ];

    switch (period) {
      case "day":
        selectFields.push([sequelize.literal('EXTRACT(YEAR FROM "createdAt")'), 'year']);
        selectFields.push([sequelize.literal('EXTRACT(MONTH FROM "createdAt")'), 'month']);
        selectFields.push([sequelize.literal('EXTRACT(DAY FROM "createdAt")'), 'day']);
        groupByFields = [
          sequelize.literal('EXTRACT(YEAR FROM "createdAt")'),
          sequelize.literal('EXTRACT(MONTH FROM "createdAt")'),
          sequelize.literal('EXTRACT(DAY FROM "createdAt")')
        ];
        break;
      case "week":
        selectFields.push([sequelize.literal('EXTRACT(YEAR FROM "createdAt")'), 'year']);
        selectFields.push([sequelize.literal('EXTRACT(WEEK FROM "createdAt")'), 'week']);
        groupByFields = [
          sequelize.literal('EXTRACT(YEAR FROM "createdAt")'),
          sequelize.literal('EXTRACT(WEEK FROM "createdAt")')
        ];
        break;
      case "quarter":
        selectFields.push([sequelize.literal('EXTRACT(YEAR FROM "createdAt")'), 'year']);
        selectFields.push([sequelize.literal('CEIL(EXTRACT(MONTH FROM "createdAt") / 3.0)'), 'quarter']);
        groupByFields = [
          sequelize.literal('EXTRACT(YEAR FROM "createdAt")'),
          sequelize.literal('CEIL(EXTRACT(MONTH FROM "createdAt") / 3.0)')
        ];
        break;
      case "year":
        selectFields.push([sequelize.literal('EXTRACT(YEAR FROM "createdAt")'), 'year']);
        groupByFields = [
          sequelize.literal('EXTRACT(YEAR FROM "createdAt")')
        ];
        break;
      default: // month
        selectFields.push([sequelize.literal('EXTRACT(YEAR FROM "createdAt")'), 'year']);
        selectFields.push([sequelize.literal('EXTRACT(MONTH FROM "createdAt")'), 'month']);
        groupByFields = [
          sequelize.literal('EXTRACT(YEAR FROM "createdAt")'),
          sequelize.literal('EXTRACT(MONTH FROM "createdAt")')
        ];
    }

    const rawSalesData = await Order.findAll({
      attributes: selectFields,
      where: matchStage,
      group: groupByFields,
      order: groupByFields.map(f => [f, 'ASC']),
      raw: true
    });

    const salesData = rawSalesData.map(item => {
      const _id = {};
      if (item.year !== undefined) _id.year = parseInt(item.year);
      if (item.month !== undefined) _id.month = parseInt(item.month);
      if (item.day !== undefined) _id.day = parseInt(item.day);
      if (item.week !== undefined) _id.week = parseInt(item.week);
      if (item.quarter !== undefined) _id.quarter = parseInt(item.quarter);

      return {
        _id,
        orderCount: parseInt(item.orderCount),
        totalValue: parseFloat(parseFloat(item.totalValue || 0).toFixed(2)),
        avgOrderValue: parseFloat(parseFloat(item.avgOrderValue || 0).toFixed(2))
      };
    });

    // Summary stats
    const summaryRaw = await Order.findOne({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalOrders'],
        [sequelize.fn('SUM', sequelize.col('grandTotal')), 'totalValue'],
        [sequelize.fn('AVG', sequelize.col('grandTotal')), 'avgOrderValue'],
        [sequelize.fn('MAX', sequelize.col('grandTotal')), 'maxOrderValue'],
        [sequelize.fn('MIN', sequelize.col('grandTotal')), 'minOrderValue']
      ],
      where: matchStage,
      raw: true
    });

    const summary = {
      totalOrders: parseInt(summaryRaw.totalOrders || 0),
      totalValue: parseFloat(parseFloat(summaryRaw.totalValue || 0).toFixed(2)),
      avgOrderValue: parseFloat(parseFloat(summaryRaw.avgOrderValue || 0).toFixed(2)),
      maxOrderValue: parseFloat(parseFloat(summaryRaw.maxOrderValue || 0).toFixed(2)),
      minOrderValue: parseFloat(parseFloat(summaryRaw.minOrderValue || 0).toFixed(2))
    };

    // Top items sold using PostgreSQL jsonb_array_elements
    let whereClause = `WHERE o."isDeleted" = false AND o.status != 'cancelled'`;
    const replacements = {};
    if (startDate && endDate) {
      whereClause += ` AND o."createdAt" >= :startDate AND o."createdAt" <= :endDate`;
      replacements.startDate = new Date(startDate).toISOString();
      replacements.endDate = new Date(endDate).toISOString();
    }
    if (customerId) {
      whereClause += ` AND o."customerId" = :customerId`;
      replacements.customerId = customerId;
    }

    const topItemsRaw = await sequelize.query(
      `SELECT 
        item->>'itemName' as "itemName",
        SUM((item->>'quantity')::numeric) as "quantitySold",
        SUM((item->>'subtotal')::numeric) as "revenue"
       FROM orders o, jsonb_array_elements(o.items) as item
       ${whereClause}
       GROUP BY item->>'itemName'
       ORDER BY "quantitySold" DESC
       LIMIT 10`,
      {
        replacements,
        type: sequelize.QueryTypes.SELECT
      }
    );

    const topItems = topItemsRaw.map(item => ({
      _id: item.itemName,
      quantitySold: parseFloat(item.quantitySold || 0),
      revenue: parseFloat(parseFloat(item.revenue || 0).toFixed(2))
    }));

    res.json({
      success: true,
      data: {
        salesData,
        summary,
        topItems
      }
    });
  } catch (error) { next(error); }
};

// GET /api/v1/reports/inventory
const getInventoryReport = async (req, res, next) => {
  try {
    const { category, lowStock = false } = req.query;

    const matchStage = { isDeleted: false };
    if (category) matchStage.pipeType = category;
    if (lowStock === "true") {
      matchStage.stockQty = {
        [Op.lte]: sequelize.col('reorderLevel')
      };
    }

    const inventoryDataRaw = await Inventory.findAll({
      where: matchStage,
      attributes: ['itemCode', 'name', 'pipeType', 'stockQty', 'reorderLevel', 'sellingPrice', 'purchasePrice'],
      order: [['stockQty', 'ASC']]
    });

    const inventoryData = inventoryDataRaw.map(item => {
      const json = item.toJSON();
      json.sellingPrice = parseFloat(json.sellingPrice);
      json.purchasePrice = parseFloat(json.purchasePrice);
      json.stockQty = parseFloat(json.stockQty);
      json.reorderLevel = parseFloat(json.reorderLevel);
      return json;
    });

    // Summary stats
    const summaryRaw = await Inventory.findOne({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalItems'],
        [sequelize.literal('SUM("stockQty" * "sellingPrice")'), 'totalStockValue'],
        [sequelize.literal('SUM("stockQty" * "purchasePrice")'), 'totalCostValue'],
        [sequelize.literal('SUM(CASE WHEN "stockQty" <= "reorderLevel" THEN 1 ELSE 0 END)'), 'lowStockItems'],
        [sequelize.literal('SUM(CASE WHEN "stockQty" = 0 THEN 1 ELSE 0 END)'), 'outOfStockItems']
      ],
      where: matchStage,
      raw: true
    });

    const summary = {
      totalItems: parseInt(summaryRaw.totalItems || 0),
      totalStockValue: parseFloat(parseFloat(summaryRaw.totalStockValue || 0).toFixed(2)),
      totalCostValue: parseFloat(parseFloat(summaryRaw.totalCostValue || 0).toFixed(2)),
      lowStockItems: parseInt(summaryRaw.lowStockItems || 0),
      outOfStockItems: parseInt(summaryRaw.outOfStockItems || 0)
    };

    // Category breakdown
    const categoryStatsRaw = await Inventory.findAll({
      attributes: [
        ['pipeType', 'pipeType'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'itemCount'],
        [sequelize.fn('SUM', sequelize.col('stockQty')), 'totalStock'],
        [sequelize.literal('SUM("stockQty" * "sellingPrice")'), 'totalValue']
      ],
      where: { isDeleted: false },
      group: ['pipeType'],
      order: [[sequelize.literal('"totalValue"'), 'DESC']],
      raw: true
    });

    const categoryStats = categoryStatsRaw.map(item => ({
      _id: item.pipeType,
      itemCount: parseInt(item.itemCount),
      totalStock: parseFloat(item.totalStock || 0),
      totalValue: parseFloat(parseFloat(item.totalValue || 0).toFixed(2))
    }));

    res.json({
      success: true,
      data: {
        items: inventoryData,
        summary,
        categoryStats
      }
    });
  } catch (error) { next(error); }
};

// GET /api/v1/reports/customers
const getCustomerReport = async (req, res, next) => {
  try {
    const { customerType, startDate, endDate } = req.query;

    let dateFilterClause = "";
    const replacements = {};
    if (startDate && endDate) {
      dateFilterClause = ` AND o."createdAt" >= :startDate AND o."createdAt" <= :endDate`;
      replacements.startDate = new Date(startDate).toISOString();
      replacements.endDate = new Date(endDate).toISOString();
    }

    let customerTypeClause = "";
    if (customerType) {
      customerTypeClause = ` AND c."customerType" = :customerType`;
      replacements.customerType = customerType;
    }

    const customerDataRaw = await sequelize.query(
      `SELECT 
        c.id,
        c.name,
        c.company,
        c."customerType",
        c.phone,
        c.email,
        c."createdAt",
        COUNT(o.id) as "totalOrders",
        COALESCE(SUM(o."grandTotal"), 0) as "totalValue",
        COALESCE(AVG(o."grandTotal"), 0) as "avgOrderValue",
        MAX(o."createdAt") as "lastOrderDate"
       FROM customers c
       LEFT JOIN orders o ON o."customerId" = c.id AND o."isDeleted" = false AND o.status != 'cancelled' ${dateFilterClause}
       WHERE c."isDeleted" = false ${customerTypeClause}
       GROUP BY c.id
       ORDER BY "totalValue" DESC`,
      {
        replacements,
        type: sequelize.QueryTypes.SELECT
      }
    );

    const customerData = customerDataRaw.map(c => ({
      id: c.id,
      name: c.name,
      company: c.company,
      customerType: c.customerType,
      phone: c.phone,
      email: c.email,
      createdAt: c.createdAt,
      totalOrders: parseInt(c.totalOrders || 0),
      totalValue: parseFloat(parseFloat(c.totalValue || 0).toFixed(2)),
      avgOrderValue: parseFloat(parseFloat(c.avgOrderValue || 0).toFixed(2)),
      lastOrderDate: c.lastOrderDate
    }));

    // Summary stats
    const summary = {
      totalCustomers: customerData.length,
      activeCustomers: customerData.filter(c => c.totalOrders > 0).length,
      totalRevenue: parseFloat(customerData.reduce((sum, c) => sum + (c.totalValue || 0), 0).toFixed(2)),
      avgCustomerValue: customerData.length > 0 ? 
        parseFloat((customerData.reduce((sum, c) => sum + (c.totalValue || 0), 0) / customerData.length).toFixed(2)) : 0
    };

    // Customer type breakdown
    const typeBreakdown = customerData.reduce((acc, customer) => {
      const type = customer.customerType || "Unknown";
      if (!acc[type]) acc[type] = { count: 0, revenue: 0 };
      acc[type].count++;
      acc[type].revenue += customer.totalValue || 0;
      return acc;
    }, {});

    // Format revenue in breakdown to 2 decimal places
    Object.keys(typeBreakdown).forEach(type => {
      typeBreakdown[type].revenue = parseFloat(typeBreakdown[type].revenue.toFixed(2));
    });

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
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.issueDate = {
        [Op.gte]: new Date(startDate),
        [Op.lte]: new Date(endDate)
      };
    }

    // Revenue vs Collections
    const financialDataRaw = await Invoice.findAll({
      attributes: [
        [sequelize.literal('EXTRACT(MONTH FROM "issueDate")'), 'month'],
        [sequelize.literal('EXTRACT(YEAR FROM "issueDate")'), 'year'],
        [sequelize.fn('SUM', sequelize.col('grandTotal')), 'totalInvoiced'],
        [sequelize.fn('SUM', sequelize.col('amountPaid')), 'totalCollected'],
        [sequelize.literal('SUM("grandTotal" - "amountPaid")'), 'pending']
      ],
      where: dateFilter,
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

    const financialData = financialDataRaw.map(item => ({
      _id: { month: parseInt(item.month), year: parseInt(item.year) },
      totalInvoiced: parseFloat(parseFloat(item.totalInvoiced || 0).toFixed(2)),
      totalCollected: parseFloat(parseFloat(item.totalCollected || 0).toFixed(2)),
      pending: parseFloat(parseFloat(item.pending || 0).toFixed(2))
    }));

    // Outstanding analysis (Aging buckets)
    const rawOutstanding = await sequelize.query(
      `SELECT 
        CASE 
          WHEN EXTRACT(DAY FROM (NOW() - "dueDate")) < 0 THEN 'Current'
          WHEN EXTRACT(DAY FROM (NOW() - "dueDate")) BETWEEN 0 AND 30 THEN '0-30'
          WHEN EXTRACT(DAY FROM (NOW() - "dueDate")) BETWEEN 31 AND 60 THEN '30-60'
          WHEN EXTRACT(DAY FROM (NOW() - "dueDate")) BETWEEN 61 AND 90 THEN '60-90'
          ELSE '90+'
        END as "bucket",
        COUNT(id) as "count",
        SUM("grandTotal" - "amountPaid") as "amount"
       FROM invoices
       WHERE status IN ('unpaid', 'partial')
       GROUP BY "bucket"`,
      {
        type: sequelize.QueryTypes.SELECT
      }
    );

    const outstandingData = [
      { _id: 0, count: 0, amount: 0 },
      { _id: 30, count: 0, amount: 0 },
      { _id: 60, count: 0, amount: 0 },
      { _id: 90, count: 0, amount: 0 }
    ];

    rawOutstanding.forEach(row => {
      const amt = parseFloat(parseFloat(row.amount || 0).toFixed(2));
      const cnt = parseInt(row.count || 0);
      if (row.bucket === '0-30') {
        outstandingData[0].count = cnt;
        outstandingData[0].amount = amt;
      } else if (row.bucket === '30-60') {
        outstandingData[1].count = cnt;
        outstandingData[1].amount = amt;
      } else if (row.bucket === '60-90') {
        outstandingData[2].count = cnt;
        outstandingData[2].amount = amt;
      } else if (row.bucket === '90+') {
        outstandingData[3].count = cnt;
        outstandingData[3].amount = amt;
      }
    });

    // Payment mode analysis
    const paymentModesRaw = await sequelize.query(
      `SELECT 
        p->>'mode' as "mode",
        COUNT(*) as "count",
        SUM((p->>'amount')::numeric) as "amount"
       FROM invoices, jsonb_array_elements(payments) as p
       GROUP BY p->>'mode'
       ORDER BY "amount" DESC`,
      {
        type: sequelize.QueryTypes.SELECT
      }
    );

    const paymentModes = paymentModesRaw.map(pm => ({
      _id: pm.mode,
      count: parseInt(pm.count || 0),
      amount: parseFloat(parseFloat(pm.amount || 0).toFixed(2))
    }));

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