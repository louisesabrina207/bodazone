const { sequelize, Sequelize } = require('../config/database');

const Review = sequelize.define('Review', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  productId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id'
    }
  },
  orderId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: 'orders',
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
  sellerId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: 'sellers',
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
  title: {
    type: Sequelize.STRING(100),
    allowNull: true
  },
  comment: {
    type: Sequelize.TEXT,
    allowNull: false
  },
  quality: {
    type: Sequelize.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 5
    }
  },
  deliverySpeed: {
    type: Sequelize.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 5
    }
  },
  sellerService: {
    type: Sequelize.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 5
    }
  },
  images: {
    type: Sequelize.JSON,
    defaultValue: [],
    comment: 'Array of review image URLs'
  },
  verified: {
    type: Sequelize.BOOLEAN,
    defaultValue: true,
    comment: 'Whether user actually purchased the item'
  },
  helpful: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
    comment: 'Number of people who found review helpful'
  },
  isVisible: {
    type: Sequelize.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'reviews',
  timestamps: true,
  indexes: [
    { fields: ['product_id'] },
    { fields: ['rider_id'] },
    { fields: ['order_id'] }
  ]
});

module.exports = Review;
