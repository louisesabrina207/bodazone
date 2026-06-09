const { Review, Product, Seller, User, Order, sequelize } = require('../models');

/**
 * Create product review
 */
exports.createReview = async (req, res) => {
  try {
    const { productId, orderId, rating, title, comment, quality, deliverySpeed, sellerService } = req.body;

    // Verify order exists and belongs to user
    const order = await Order.findByPk(orderId);
    if (!order || order.riderId !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to review this product'
      });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({
      where: { productId, orderId, riderId: req.userId }
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product for this order'
      });
    }

    const product = await Product.findByPk(productId);
    const sellerId = product.sellerId;

    const review = await Review.create({
      productId,
      orderId,
      riderId: req.userId,
      sellerId,
      rating,
      title,
      comment,
      quality,
      deliverySpeed,
      sellerService
    });

    // Update product rating
    const reviews = await Review.findAll({ where: { productId } });
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await product.update({
      rating: parseFloat(avgRating.toFixed(2)),
      totalRatings: reviews.length
    });

    // Update seller rating
    const sellerReviews = await Review.findAll({ where: { sellerId } });
    const sellerAvgRating = sellerReviews.reduce((sum, r) => sum + r.rating, 0) / sellerReviews.length;
    const seller = await Seller.findByPk(sellerId);
    await seller.update({
      rating: parseFloat(sellerAvgRating.toFixed(2)),
      totalRatings: sellerReviews.length
    });

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: review
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create review'
    });
  }
};

/**
 * Get product reviews
 */
exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const offset = (page - 1) * limit;

    const { count, rows } = await Review.findAndCountAll({
      where: { productId, isVisible: true },
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'profileImage']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset,
      distinct: true
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews'
    });
  }
};

/**
 * Get seller reviews
 */
exports.getSellerReviews = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const offset = (page - 1) * limit;

    const { count, rows } = await Review.findAndCountAll({
      where: { sellerId, isVisible: true },
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'profileImage']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset,
      distinct: true
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get seller reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews'
    });
  }
};

module.exports = exports;
