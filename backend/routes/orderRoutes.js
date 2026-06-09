const express = require('express');
const {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder
} = require('../controllers/orderController');
const { authenticate, isRider } = require('../middleware/auth');
const { validate, createOrderSchema } = require('../middleware/validation');

const router = express.Router();

/**
 * POST /api/orders
 * Create new order
 */
router.post('/', 
  authenticate, 
  validate(createOrderSchema), 
  createOrder
);

/**
 * GET /api/orders
 * Get current user's orders
 */
router.get('/', 
  authenticate, 
  getMyOrders
);

/**
 * GET /api/orders/:id
 * Get order details
 */
router.get('/:id', 
  authenticate, 
  getOrderById
);

/**
 * POST /api/orders/:id/cancel
 * Cancel an order
 */
router.post('/:id/cancel', 
  authenticate, 
  cancelOrder
);

module.exports = router;
