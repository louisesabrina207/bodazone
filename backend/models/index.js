const User = require('./User');
const Seller = require('./Seller');
const Product = require('./Product');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const Payment = require('./Payment');
const Delivery = require('./Delivery');
const Review = require('./Review');
const SellerRating = require('./SellerRating');
const Notification = require('./Notification');
const SellerDocument = require('./SellerDocument');
const { sequelize } = require('../config/database');

// Define associations
User.hasOne(Seller, { foreignKey: 'userId', onDelete: 'CASCADE' });
Seller.belongsTo(User, { foreignKey: 'userId' });

Seller.hasMany(Product, { foreignKey: 'sellerId', onDelete: 'CASCADE' });
Product.belongsTo(Seller, { foreignKey: 'sellerId' });

User.hasMany(Order, { foreignKey: 'riderId', onDelete: 'CASCADE' });
Order.belongsTo(User, { foreignKey: 'riderId' });

Order.hasMany(OrderItem, { foreignKey: 'orderId', onDelete: 'CASCADE' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId' });

Product.hasMany(OrderItem, { foreignKey: 'productId' });
OrderItem.belongsTo(Product, { foreignKey: 'productId' });

Seller.hasMany(OrderItem, { foreignKey: 'sellerId' });
OrderItem.belongsTo(Seller, { foreignKey: 'sellerId' });

Order.hasOne(Payment, { foreignKey: 'orderId', onDelete: 'CASCADE' });
Payment.belongsTo(Order, { foreignKey: 'orderId' });

User.hasMany(Payment, { foreignKey: 'userId' });
Payment.belongsTo(User, { foreignKey: 'userId' });

Order.hasOne(Delivery, { foreignKey: 'orderId', onDelete: 'CASCADE' });
Delivery.belongsTo(Order, { foreignKey: 'orderId' });

Product.hasMany(Review, { foreignKey: 'productId', onDelete: 'CASCADE' });
Review.belongsTo(Product, { foreignKey: 'productId' });

User.hasMany(Review, { foreignKey: 'riderId' });
Review.belongsTo(User, { foreignKey: 'riderId' });

Order.hasMany(Review, { foreignKey: 'orderId' });
Review.belongsTo(Order, { foreignKey: 'orderId' });

Seller.hasMany(Review, { foreignKey: 'sellerId' });
Review.belongsTo(Seller, { foreignKey: 'sellerId' });

Seller.hasMany(SellerRating, { foreignKey: 'sellerId', onDelete: 'CASCADE' });
SellerRating.belongsTo(Seller, { foreignKey: 'sellerId' });

Seller.hasMany(SellerDocument, { foreignKey: 'sellerId', onDelete: 'CASCADE' });
SellerDocument.belongsTo(Seller, { foreignKey: 'sellerId' });

User.hasMany(SellerRating, { foreignKey: 'riderId' });
SellerRating.belongsTo(User, { foreignKey: 'riderId' });

User.hasMany(Notification, { foreignKey: 'userId', onDelete: 'CASCADE' });
Notification.belongsTo(User, { foreignKey: 'userId' });

Order.hasMany(Notification, { foreignKey: 'orderId', onDelete: 'CASCADE' });
Notification.belongsTo(Order, { foreignKey: 'orderId' });

module.exports = {
  User,
  Seller,
  Product,
  Order,
  OrderItem,
  Payment,
  Delivery,
  Review,
  SellerRating,
  Notification,
  sequelize
};
