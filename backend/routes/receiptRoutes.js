const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const receiptController = require('../controllers/receiptController');

// Get receipt availability
router.get('/:orderId/available', authenticate, receiptController.canDownloadReceipt);

// Download receipt PDF
router.get('/:orderId/download', authenticate, receiptController.generateReceipt);

module.exports = router;
