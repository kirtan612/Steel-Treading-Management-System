const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Customer = sequelize.define('Customer', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  customerCode: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  company: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING(15),
    allowNull: false,
    validate: {
      is: /^[6-9]\d{9}$/
    }
  },
  alternatePhone: {
    type: DataTypes.STRING(15),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      isEmail: true
    },
    set(value) {
      if (value) {
        this.setDataValue('email', value.toLowerCase().trim());
      }
    }
  },
  // Billing Address
  billingStreet: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  billingCity: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  billingState: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  billingPincode: {
    type: DataTypes.STRING(6),
    allowNull: true,
    validate: {
      is: /^[1-9][0-9]{5}$/
    }
  },
  // Shipping Address
  shippingStreet: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  shippingCity: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  shippingState: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  shippingPincode: {
    type: DataTypes.STRING(6),
    allowNull: true
  },
  sameAsBilling: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  gstNumber: {
    type: DataTypes.STRING(15),
    allowNull: true,
    validate: {
      is: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
    },
    set(value) {
      if (value) {
        this.setDataValue('gstNumber', value.toUpperCase().trim());
      }
    }
  },
  panNumber: {
    type: DataTypes.STRING(10),
    allowNull: true,
    set(value) {
      if (value) {
        this.setDataValue('panNumber', value.toUpperCase().trim());
      }
    }
  },
  customerType: {
    type: DataTypes.ENUM('Retail', 'Wholesale', 'Contractor', 'Industrial'),
    defaultValue: 'Retail'
  },
  creditLimit: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  paymentTerms: {
    type: DataTypes.ENUM('Immediate', '15 days', '30 days', '45 days'),
    defaultValue: '30 days'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
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
  tableName: 'customers',
  timestamps: true,
  hooks: {
    beforeCreate: async (customer) => {
      if (!customer.customerCode) {
        const count = await Customer.count();
        customer.customerCode = `CUST-${String(count + 1).padStart(4, '0')}`;
      }
    }
  }
});

module.exports = Customer;
