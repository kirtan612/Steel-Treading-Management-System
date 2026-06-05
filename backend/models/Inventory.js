const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Inventory = sequelize.define('Inventory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  itemCode: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: true
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      len: [3, 200],
      notEmpty: true
    }
  },
  pipeType: {
    type: DataTypes.ENUM('ERW', 'Seamless', 'Hollow Section', 'GI Pipe', 'MS Pipe'),
    allowNull: false
  },
  grade: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  outerDiameter: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  wallThickness: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  lengthPerPiece: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 6,
    validate: {
      min: 0
    }
  },
  weightPerMeter: {
    type: DataTypes.DECIMAL(10, 2),
    validate: {
      min: 0
    }
  },
  unit: {
    type: DataTypes.ENUM('Kg', 'Ton', 'Piece', 'Meter'),
    allowNull: false,
    defaultValue: 'Kg'
  },
  stockQty: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  reorderLevel: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  purchasePrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  sellingPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  hsnCode: {
    type: DataTypes.STRING(8),
    allowNull: true
  },
  location: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  description: {
    type: DataTypes.STRING(500),
    allowNull: true
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
  tableName: 'inventory',
  timestamps: true,
  hooks: {
    beforeCreate: async (item) => {
      if (!item.itemCode) {
        const count = await Inventory.count();
        item.itemCode = `ITEM-${String(count + 1).padStart(4, '0')}`;
      }
    }
  }
});

// Virtual field for status
Inventory.prototype.getStatus = function() {
  if (this.stockQty === 0) return 'Out of Stock';
  if (parseFloat(this.stockQty) <= parseFloat(this.reorderLevel)) return 'Low Stock';
  return 'In Stock';
};

module.exports = Inventory;
