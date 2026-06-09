const { sequelize, Sequelize } = require('../config/database');

const SellerDocument = sequelize.define('SellerDocument', {
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
  filename: {
    type: Sequelize.STRING(255),
    allowNull: false
  },
  path: {
    type: Sequelize.STRING(255),
    allowNull: false
  },
  mimeType: {
    type: Sequelize.STRING(100),
    allowNull: true
  },
  status: {
    type: Sequelize.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending'
  }
}, {
  tableName: 'seller_documents',
  timestamps: true
});

module.exports = SellerDocument;
