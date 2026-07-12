const { sequelize } = require('../config/database');
const User = require('./User');
const Customer = require('./Customer');
const Inventory = require('./Inventory');
const Order = require('./Order');
const Invoice = require('./Invoice');
const DeliveryChallan = require('./DeliveryChallan');

// Define Associations

// User associations
User.hasMany(Customer, { foreignKey: 'createdBy', as: 'customers' });
User.hasMany(Inventory, { foreignKey: 'createdBy', as: 'inventoryItems' });
User.hasMany(Order, { foreignKey: 'createdBy', as: 'orders' });
User.hasMany(Invoice, { foreignKey: 'createdBy', as: 'invoices' });
User.hasMany(DeliveryChallan, { foreignKey: 'createdBy', as: 'deliveryChallans' });

// Customer associations
Customer.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Customer.hasMany(Order, { foreignKey: 'customerId', as: 'orders' });
Customer.hasMany(Invoice, { foreignKey: 'customerId', as: 'invoices' });
Customer.hasMany(DeliveryChallan, { foreignKey: 'customerId', as: 'deliveryChallans' });

// Inventory associations
Inventory.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// Order associations
Order.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });
Order.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Order.hasOne(Invoice, { foreignKey: 'orderId', as: 'invoice' });
Order.hasMany(DeliveryChallan, { foreignKey: 'orderId', as: 'deliveryChallans' });

// Invoice associations
Invoice.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
Invoice.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });
Invoice.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// DeliveryChallan associations
DeliveryChallan.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
DeliveryChallan.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });
DeliveryChallan.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

module.exports = {
  sequelize,
  User,
  Customer,
  Inventory,
  Order,
  Invoice,
  DeliveryChallan
};
