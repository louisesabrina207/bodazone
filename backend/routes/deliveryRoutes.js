const express = require('express');
const {
  getDelivery,
  trackDelivery,
  updateDeliveryStatus
} = require('../controllers/deliveryController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/deliveries/:id
 * Get delivery details
 */
router.get('/:id', authenticate, getDelivery);

/**
 * GET /api/deliveries/track/:trackingNumber
 * Track delivery by tracking number (public)
 */
router.get('/track/:trackingNumber', trackDelivery);

/**
 * PUT /api/deliveries/:id/status
 * Update delivery status
 */
router.put('/:id/status', authenticate, updateDeliveryStatus);

module.exports = router;
