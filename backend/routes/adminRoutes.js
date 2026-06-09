const express = require('express');
const { authenticate, isAdmin } = require('../middleware/auth');
const {
  getDashboard,
  getUsers,
  getSellers,
  toggleSellerApproval,
  suspendSeller,
  getTransactions,
  getOrders,
  getReports,
  getSellerDocuments,
  getOrderTracking,
  getAllOrdersTracking,
  getOrdersByStatus
} = require('../controllers/adminController');

const router = express.Router();

/**
 * GET /api/admin/dashboard
 * Get admin dashboard statistics
 */
router.get('/dashboard', authenticate, isAdmin, (req, res) => {
  return getDashboard(req, res);
});

/**
 * GET /api/admin/users
 * Get all users (admin only)
 */
router.get('/users', authenticate, isAdmin, (req, res) => {
  return getUsers(req, res);
});

/**
 * GET /api/admin/sellers
 * Get all sellers (admin only)
 */
router.get('/sellers', authenticate, isAdmin, (req, res) => {
  return getSellers(req, res);
});

/**
 * PATCH /api/admin/sellers/:id/approval
 * Toggle seller approval between verified and pending
 */
router.patch('/sellers/:id/approval', authenticate, isAdmin, (req, res) => {
  return toggleSellerApproval(req, res);
});

/**
 * PATCH /api/admin/sellers/:id/suspend
 * Suspend or restore seller access
 */
router.patch('/sellers/:id/suspend', authenticate, isAdmin, (req, res) => {
  return suspendSeller(req, res);
});

/**
 * GET /api/admin/transactions
 */
router.get('/transactions', authenticate, isAdmin, (req, res) => {
  return getTransactions(req, res);
});

/**
 * GET /api/admin/orders
 */
router.get('/orders', authenticate, isAdmin, (req, res) => {
  return getOrders(req, res);
});

/**
 * GET /api/admin/reports
 */
router.get('/reports', authenticate, isAdmin, (req, res) => {
  return getReports(req, res);
});

/**
 * GET /api/admin/orders/tracking
 * Get all orders with tracking info (admin dashboard)
 */
router.get('/orders/tracking', authenticate, isAdmin, (req, res) => {
  return getAllOrdersTracking(req, res);
});

/**
 * GET /api/admin/orders/status
 * Get orders breakdown by status
 */
router.get('/orders/status', authenticate, isAdmin, (req, res) => {
  return getOrdersByStatus(req, res);
});

/**
 * GET /api/admin/sellers/:id/documents
 * Get uploaded documents for a seller
 */
router.get('/sellers/:id/documents', authenticate, isAdmin, (req, res) => {
  return getSellerDocuments(req, res);
});

/**
 * GET /api/admin/sellers/:sellerId/documents/:docId/file
 * Serve a seller document file (admin only)
 */
router.get('/sellers/:sellerId/documents/:docId/file', authenticate, isAdmin, (req, res) => {
  return require('../controllers/adminController').getSellerDocumentFile(req, res);
});

/**
 * PATCH /api/admin/sellers/:sellerId/documents/:docId/approve
 */
router.patch('/sellers/:sellerId/documents/:docId/approve', authenticate, isAdmin, (req, res) => {
  return require('../controllers/adminController').approveSellerDocument(req, res);
});

/**
 * PATCH /api/admin/sellers/:sellerId/documents/:docId/reject
 */
router.patch('/sellers/:sellerId/documents/:docId/reject', authenticate, isAdmin, (req, res) => {
  return require('../controllers/adminController').rejectSellerDocument(req, res);
});

/**
 * PATCH /api/admin/sellers/:id/verify
 * Explicitly verify a seller after checking documents
 */
router.patch('/sellers/:id/verify', authenticate, isAdmin, (req, res) => {
  return require('../controllers/adminController').verifySeller(req, res);
});

/**
 * GET /api/admin/orders/:orderId/tracking
 * Get detailed tracking info for specific order
 */
router.get('/orders/:orderId/tracking', authenticate, isAdmin, (req, res) => {
  return getOrderTracking(req, res);
});

module.exports = router;
