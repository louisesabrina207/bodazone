const { sequelize, Sequelize } = require('../config/database');

const Payment = sequelize.define('Payment', {
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
  userId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  amount: {
    type: Sequelize.DECIMAL(10, 2),
    allowNull: false
  },
  method: {
    type: Sequelize.ENUM('mpesa', 'cash_on_delivery', 'card'),
    allowNull: false
  },
  transactionId: {
    type: Sequelize.STRING(100),
    allowNull: true,
    unique: true
  },
  mpesaReference: {
    type: Sequelize.STRING(100),
    allowNull: true
  },
  mpesaCode: {
    type: Sequelize.STRING(50),
    allowNull: true
  },
  merchantRequestId: {
    type: Sequelize.STRING(100),
    allowNull: true,
    comment: 'M-Pesa merchant request ID for tracking'
  },
  checkoutRequestId: {
    type: Sequelize.STRING(100),
    allowNull: true,
    comment: 'M-Pesa checkout request ID for STK push'
  },
  transactionDate: {
    type: Sequelize.STRING(50),
    allowNull: true,
    comment: 'M-Pesa transaction date and time'
  },
  phoneNumber: {
    type: Sequelize.STRING(20),
    allowNull: true,
    comment: 'M-Pesa phone number for transaction'
  },
  status: {
    type: Sequelize.ENUM('pending', 'verified', 'failed', 'refunded'),
    defaultValue: 'pending'
  },
  verificationDetails: {
    type: Sequelize.JSON,
    allowNull: true,
    comment: 'M-Pesa API response details'
  },
  failureReason: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  transactionMessage: {
    type: Sequelize.TEXT,
    allowNull: true,
    comment: 'Human-readable transaction response or callback message'
  },
  verifiedAt: {
    type: Sequelize.DATE,
    allowNull: true
  },
  failedAt: {
    type: Sequelize.DATE,
    allowNull: true
  },
  refundedAt: {
    type: Sequelize.DATE,
    allowNull: true
  },
  refundReason: {
    type: Sequelize.TEXT,
    allowNull: true
  }
}, {
  tableName: 'payments',
  timestamps: true,
  indexes: [
    { fields: ['order_id'] },
    { fields: ['user_id'] },
    { fields: ['transaction_id'] }
  ]
});

module.exports = Payment;
