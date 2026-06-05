const { Op } = require("sequelize");
const Order   = require("../models/Order");
const Invoice = require("../models/Invoice");

const generateOrderNumber = async () => {
  const year = new Date().getFullYear();
  const count = await Order.count({
    where: {
      createdAt: {
        [Op.gte]: new Date(`${year}-01-01`),
        [Op.lt]:  new Date(`${year + 1}-01-01`),
      },
    },
  });
  const seq = String(count + 1).padStart(4, "0");
  return `ORD-${year}-${seq}`;
};

const generateInvoiceNumber = async () => {
  const year = new Date().getFullYear();
  const count = await Invoice.count({
    where: {
      createdAt: {
        [Op.gte]: new Date(`${year}-01-01`),
        [Op.lt]:  new Date(`${year + 1}-01-01`),
      },
    },
  });
  const seq = String(count + 1).padStart(4, "0");
  return `INV-${year}-${seq}`;
};

module.exports = { generateOrderNumber, generateInvoiceNumber };