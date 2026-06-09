const { sequelize, Sequelize } = require('../config/database');

const Order = sequelize.define('Order', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orderNumber: {
    type: Sequelize.STRING(50),
    allowNull: false,
    unique: true,
    comment: 'Unique order identifier'
  },
  riderId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  status: {
    type: Sequelize.ENUM(
      'pending',
      'confirmed',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
      'returned'
    ),
    defaultValue: 'pending',
    allowNull: false
  },
  paymentStatus: {
    type: Sequelize.ENUM('pending', 'verified', 'failed', 'refunded'),
    defaultValue: 'pending'
  },
  paymentMethod: {
    type: Sequelize.ENUM('mpesa', 'cash_on_delivery', 'card'),
    defaultValue: 'mpesa'
  },
  subtotal: {
    type: Sequelize.DECIMAL(10, 2),
    allowNull: false
  },
  shippingCost: {
    type: Sequelize.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  tax: {
    type: Sequelize.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  totalAmount: {
    type: Sequelize.DECIMAL(10, 2),
    allowNull: false
  },
  notes: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  shippingAddress: {
    type: Sequelize.JSON,
    allowNull: true,
    comment: 'Shipping address details'
  },
  deliveryDate: {
    type: Sequelize.DATE,
    allowNull: true
  },
  cancellationReason: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  cancelledAt: {
    type: Sequelize.DATE,
    allowNull: true
  }
}, {
  tableName: 'orders',
  timestamps: true,
  indexes: [
    { fields: ['rider_id'] },
    { fields: ['status'] },
    { fields: ['order_number'] }
  ]
});

module.exports = Order;
