const { sequelize, Sequelize } = require('../config/database');

const Seller = sequelize.define('Seller', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  shopName: {
    type: Sequelize.STRING(150),
    allowNull: false,
    trim: true
  },
  shopDescription: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  shopImage: {
    type: Sequelize.STRING(255),
    allowNull: true
  },
  location: {
    type: Sequelize.STRING(200),
    allowNull: true
  },
  businessRegistration: {
    type: Sequelize.STRING(100),
    allowNull: true
  },
  verificationStatus: {
    type: Sequelize.ENUM('pending', 'verified', 'rejected'),
    defaultValue: 'pending'
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
  responsiveness: {
    type: Sequelize.STRING(20),
    defaultValue: 'medium'
  },
  averageDeliveryTime: {
    type: Sequelize.INTEGER,
    defaultValue: 2,
    comment: 'Average delivery time in days'
  },
  isActive: {
    type: Sequelize.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'sellers',
  timestamps: true
});

module.exports = Seller;
