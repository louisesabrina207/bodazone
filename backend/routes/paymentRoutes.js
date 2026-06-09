const express = require('express');
const {
  initiatePayment,
  mpesaCallback,
  verifyPayment,
  queryPaymentStatus,
  retryPayment,
  getPaymentHistory
} = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');
const { validate, initiatePaymentSchema } = require('../middleware/validation');

const router = express.Router();

/**
 * POST /api/payments/initiate
 * Initiate M-Pesa payment for an order
 */
router.post('/initiate', 
  authenticate, 
  validate(initiatePaymentSchema), 
  initiatePayment
);

/**
 * POST /api/payments/mpesa-callback
 * M-Pesa callback endpoint (no auth needed)
 */
router.post('/mpesa-callback', mpesaCallback);

/**
 * POST /api/payments/query-status
 * Query payment status from M-Pesa
 */
router.post('/query-status', 
  authenticate, 
  queryPaymentStatus
);

/**
 * POST /api/payments/retry
 * Retry a failed payment by sending a new STK push
 */
router.post('/retry', authenticate, retryPayment);

/**
 * GET /api/payments/history
 * Get user's payment history
 */
router.get('/history', 
  authenticate, 
  getPaymentHistory
);

/**
 * GET /api/payments/:orderId/verify
 * Verify payment status for an order
 */
router.get('/:orderId/verify', 
  authenticate, 
  verifyPayment
);

module.exports = router;
