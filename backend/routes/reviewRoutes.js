const express = require('express');
const {
  createReview,
  getProductReviews,
  getSellerReviews
} = require('../controllers/reviewController');
const { authenticate } = require('../middleware/auth');
const { validate, createReviewSchema } = require('../middleware/validation');

const router = express.Router();

/**
 * POST /api/reviews
 * Create a product review
 */
router.post('/', 
  authenticate, 
  validate(createReviewSchema), 
  createReview
);

/**
 * GET /api/reviews/product/:productId
 * Get reviews for a product
 */
router.get('/product/:productId', getProductReviews);

/**
 * GET /api/reviews/seller/:sellerId
 * Get reviews for a seller
 */
router.get('/seller/:sellerId', getSellerReviews);

module.exports = router;
