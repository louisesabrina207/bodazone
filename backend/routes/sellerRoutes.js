const express = require('express');
const { authenticate, isSeller } = require('../middleware/auth');
const {
  getMyShop,
  updateMyShop,
  getSellerDashboard,
  getMyOrders,
  updateOrderStatus,
  downloadInventoryInvoice
} = require('../controllers/sellerController');
const { getMyDocuments, uploadMyDocuments } = require('../controllers/sellerController');
const uploadDocs = require('../middleware/uploadDocs');

const router = express.Router();

router.get('/me/dashboard', authenticate, isSeller, getSellerDashboard);
router.get('/me/shop', authenticate, isSeller, getMyShop);
router.put('/me/shop', authenticate, isSeller, updateMyShop);
router.get('/me/orders', authenticate, isSeller, getMyOrders);
router.get('/me/inventory-invoice', authenticate, isSeller, downloadInventoryInvoice);
router.put('/orders/:orderId/status', authenticate, isSeller, updateOrderStatus);

// Seller document endpoints (owner)
router.get('/me/documents', authenticate, isSeller, getMyDocuments);
router.post('/me/documents', authenticate, isSeller, uploadDocs.array('documents', 8), uploadMyDocuments);

// Serve seller's own document file
router.get('/me/documents/:docId/file', authenticate, isSeller, (req, res) => {
  return require('../controllers/sellerController').getMyDocumentFile(req, res);
});

module.exports = router;
