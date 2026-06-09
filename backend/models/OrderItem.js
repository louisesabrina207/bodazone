const { sequelize, Sequelize } = require('../config/database');

const OrderItem = sequelize.define('OrderItem', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orderId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: 'orders',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  productId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id'
    }
  },
  sellerId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: 'sellers',
      key: 'id'
    }
  },
  productName: {
    type: Sequelize.STRING(150),
    allowNull: false
  },
  quantity: {
    type: Sequelize.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  price: {
    type: Sequelize.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Price at time of order'
  },
  subtotal: {
    type: Sequelize.DECIMAL(10, 2),
    allowNull: false,
    comment: 'quantity * price'
  }
}, {
  tableName: 'order_items',
  timestamps: true,
  indexes: [
    { fields: ['order_id'] },
    { fields: ['product_id'] }
  ]
});

module.exports = OrderItem;
