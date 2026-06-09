const { sequelize, Sequelize } = require('../config/database');

const SellerRating = sequelize.define('SellerRating', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  sellerId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: 'sellers',
      key: 'id'
    }
  },
  riderId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  orderId: {
    type: Sequelize.INTEGER,
    allowNull: true,
    references: {
      model: 'orders',
      key: 'id'
    }
  },
  rating: {
    type: Sequelize.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5
    }
  },
  communicationRating: {
    type: Sequelize.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 5
    }
  },
  deliveryRating: {
    type: Sequelize.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 5
    }
  },
  qualityRating: {
    type: Sequelize.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 5
    }
  },
  comment: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  isVisible: {
    type: Sequelize.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'seller_ratings',
  timestamps: true,
  indexes: [
    { fields: ['seller_id'] },
    { fields: ['rider_id'] }
  ]
});

module.exports = SellerRating;
