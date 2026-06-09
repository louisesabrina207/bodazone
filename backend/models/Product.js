const { sequelize, Sequelize } = require('../config/database');

const Product = sequelize.define('Product', {
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
  name: {
    type: Sequelize.STRING(150),
    allowNull: false,
    trim: true
  },
  category: {
    type: Sequelize.ENUM(
      'tires',
      'brakes',
      'engines',
      'batteries',
      'lights',
      'suspension',
      'exhaust',
      'chain',
      'sprockets',
      'clutch',
      'oil',
      'filters',
      'spark_plugs',
      'mirrors',
      'seats',
      'helmets',
      'accessories',
      'other'
    ),
    allowNull: false
  },
  description: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  price: {
    type: Sequelize.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  deliveryFee: {
    type: Sequelize.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: 0
    }
    ,
    field: 'delivery_fee'
  },
  stock: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  reorderLevel: {
    type: Sequelize.INTEGER,
    defaultValue: 5
  },
  image: {
    type: Sequelize.STRING(255),
    allowNull: true
  },
  images: {
    type: Sequelize.JSON,
    defaultValue: [],
    comment: 'Array of image URLs'
  },
  specifications: {
    type: Sequelize.JSON,
    allowNull: true,
    comment: 'Product specifications as JSON'
  },
  compatibility: {
    type: Sequelize.JSON,
    allowNull: true,
    comment: 'Compatible motorbike models'
  },
  rating: {
    type: Sequelize.FLOAT(3, 2),
    defaultValue: 0.0,
    validate: {
      min: 0,
      max: 5
    }
  },
  totalRatings: {
    type: Sequelize.INTEGER,
    defaultValue: 0
  },
  sold: {
    type: Sequelize.INTEGER,
    defaultValue: 0
  },
  isActive: {
    type: Sequelize.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'products',
  timestamps: true,
  indexes: [
    { fields: ['seller_id'] },
    { fields: ['category'] },
    { fields: ['name'] }
  ]
});

module.exports = Product;
