const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Invoice = sequelize.define('Invoice', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  invoiceNumber: {
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
  issueDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  items: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  subtotal: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  discountAmount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  taxableAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
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
    allowNull: false
  },
  amountPaid: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM('unpaid', 'partial', 'paid', 'overdue'),
    defaultValue: 'unpaid'
  },
  payments: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  termsAndConditions: {
    type: DataTypes.TEXT,
    allowNull: true
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
  tableName: 'invoices',
  timestamps: true,
  hooks: {
    beforeSave: (invoice) => {
      // Auto-update status based on payment
      const paid = parseFloat(invoice.amountPaid);
      const total = parseFloat(invoice.grandTotal);
      
      if (paid <= 0) {
        invoice.status = 'unpaid';
      } else if (paid >= total) {
        invoice.status = 'paid';
      } else {
        invoice.status = 'partial';
      }
    }
  }
});

// Virtual field for balance
Invoice.prototype.getBalance = function() {
  return parseFloat((this.grandTotal - this.amountPaid).toFixed(2));
};

module.exports = Invoice;
