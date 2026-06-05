const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  orderNumber: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false
  },
  customerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'customers',
      key: 'id'
    }
  },
  items: {
    type: DataTypes.JSONB,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  subtotal: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  discountAmount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  taxableAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  cgst: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  sgst: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  igst: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  totalTax: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  grandTotal: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  status: {
    type: DataTypes.ENUM('draft', 'confirmed', 'dispatched', 'delivered', 'cancelled'),
    defaultValue: 'draft'
  },
  paymentStatus: {
    type: DataTypes.ENUM('unpaid', 'partial', 'paid'),
    defaultValue: 'unpaid'
  },
  expectedDelivery: {
    type: DataTypes.DATE,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  statusHistory: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'orders',
  timestamps: true
});

module.exports = Order;
