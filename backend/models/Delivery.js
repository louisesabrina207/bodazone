const { sequelize, Sequelize } = require('../config/database');

const Delivery = sequelize.define('Delivery', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orderId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: 'orders',
      key: 'id'
    }
  },
  trackingNumber: {
    type: Sequelize.STRING(50),
    allowNull: false,
    unique: true
  },
  status: {
    type: Sequelize.ENUM(
      'pending',
      'processing',
      'in_transit',
      'out_for_delivery',
      'delivered',
      'failed',
      'returned'
    ),
    defaultValue: 'pending'
  },
  shippingAddress: {
    type: Sequelize.JSON,
    allowNull: false,
    comment: 'Full shipping address details'
  },
  recipientName: {
    type: Sequelize.STRING(100),
    allowNull: false
  },
  recipientPhone: {
    type: Sequelize.STRING(20),
    allowNull: false
  },
  estimatedDeliveryDate: {
    type: Sequelize.DATE,
    allowNull: true
  },
  actualDeliveryDate: {
    type: Sequelize.DATE,
    allowNull: true
  },
  deliveryProof: {
    type: Sequelize.JSON,
    allowNull: true,
    comment: 'Photos or signature proof'
  },
  failureReason: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  courierName: {
    type: Sequelize.STRING(100),
    allowNull: true
  },
  courierPhone: {
    type: Sequelize.STRING(20),
    allowNull: true
  },
  courierId: {
    type: Sequelize.INTEGER,
    allowNull: true
  },
  currentLocation: {
    type: Sequelize.JSON,
    allowNull: true,
    comment: 'GPS coordinates or location description'
  },
  updateHistory: {
    type: Sequelize.JSON,
    defaultValue: [],
    comment: 'Array of status update events'
  }
}, {
  tableName: 'deliveries',
  timestamps: true,
  indexes: [
    { fields: ['order_id'] },
    { fields: ['tracking_number'] },
    { fields: ['status'] }
  ]
});

module.exports = Delivery;
