const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DeliveryChallan = sequelize.define('DeliveryChallan', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  challanNumber: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false
  },
  orderId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'orders',
      key: 'id'
    }
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
    allowNull: false
  },
  vehicleNumber: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  driverName: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  driverPhone: {
    type: DataTypes.STRING(15),
    allowNull: true
  },
  dispatchDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  transporterName: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  // E-Way Bill fields
  eWayBillNo: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  eWayBillDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  eWayBillValidUpto: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // Dispatch details
  dispatchedBy: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  receivedBy: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  receivedDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  customerSignature: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Base64 encoded signature or placeholder text'
  },
  status: {
    type: DataTypes.ENUM('generated', 'dispatched', 'delivered', 'cancelled'),
    defaultValue: 'generated'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  subtotal: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  totalQuantity: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
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
  tableName: 'delivery_challans',
  timestamps: true,
  hooks: {
    beforeCreate: async (challan) => {
      if (!challan.challanNumber) {
        const count = await DeliveryChallan.count();
        const currentDate = new Date();
        const year = currentDate.getFullYear().toString().slice(-2);
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        challan.challanNumber = `DC${year}${month}${String(count + 1).padStart(4, '0')}`;
      }
    }
  }
});

module.exports = DeliveryChallan;