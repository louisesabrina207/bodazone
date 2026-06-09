const { Op, fn, col } = require('sequelize');
const { User, Seller, Product, Order, Payment, Delivery, OrderItem } = require('../models');
const { SUCCESSFUL_PAYMENT_STATUSES } = require('../utils/paymentStatus');
const { getOrderWithDelivery, getOrdersWithDelivery } = require('../utils/orderStatusSync');
const emailService = require('../services/emailService');

exports.getDashboard = async (req, res) => {
  try {
    const [
      totalUsers,
      totalSellers,
      pendingSellers,
      totalProducts,
      totalOrders,
      totalRevenue
    ] = await Promise.all([
      User.count(),
      Seller.count(),
      Seller.count({ where: { verificationStatus: 'pending' } }),
      Product.count(),
      Order.count(),
      Payment.sum('amount', { where: { status: { [Op.in]: SUCCESSFUL_PAYMENT_STATUSES } } })
    ]);

    const recentOrders = await Order.findAll({
      limit: 8,
      order: [['createdAt', 'DESC']],
      include: [{ model: User, attributes: ['id', 'name', 'email'] }]
    });

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalSellers,
          pendingSellers,
          totalProducts,
          totalOrders,
          totalRevenue: Number(totalRevenue || 0)
        },
        recentOrders
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard data' });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, status, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (role) where.role = role;
    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};

exports.getSellers = async (req, res) => {
  try {
    const { page = 1, limit = 20, verificationStatus, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const sellerWhere = {};
    if (verificationStatus) sellerWhere.verificationStatus = verificationStatus;

    const userWhere = {};
    if (search) {
      userWhere[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Seller.findAndCountAll({
      where: sellerWhere,
      include: [{
        model: User,
        where: Object.keys(userWhere).length ? userWhere : undefined,
        attributes: ['id', 'name', 'email', 'phone', 'status', 'createdAt']
      }],
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
        pages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get sellers error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch sellers' });
  }
};

const updateSellerState = async ({ seller, verificationStatus, userStatus }) => {
  await seller.update({
    verificationStatus,
    isActive: verificationStatus === 'verified' && userStatus !== 'suspended'
  });

  await User.update(
    { status: userStatus },
    { where: { id: seller.userId } }
  );

  return seller.reload({ include: [{ model: User, attributes: ['id', 'name', 'email', 'phone', 'status'] }] });
};

exports.toggleSellerApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const seller = await Seller.findByPk(id, { include: [{ model: User }] });
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller not found' });
    }

    const nextVerificationStatus = seller.verificationStatus === 'verified' ? 'pending' : 'verified';
    const nextUserStatus = seller.User?.status === 'suspended'
      ? 'suspended'
      : (nextVerificationStatus === 'verified' ? 'active' : 'pending_approval');

    const updatedSeller = await updateSellerState({
      seller,
      verificationStatus: nextVerificationStatus,
      userStatus: nextUserStatus
    });

    if (seller.User?.email) {
      await emailService.sendMail({
        to: seller.User.email,
        subject: `Your BodaZone shop status is now ${nextVerificationStatus}`,
        text: `Hello ${seller.User.name}, your shop ${seller.shopName} is now ${nextVerificationStatus}.`,
        html: `<p>Hello ${seller.User.name},</p><p>Your shop <strong>${seller.shopName}</strong> is now <strong>${nextVerificationStatus}</strong>.</p>`
      });
    }

    res.json({ success: true, message: `Seller status updated to ${nextVerificationStatus}`, data: updatedSeller });
  } catch (error) {
    console.error('Toggle seller approval error:', error);
    res.status(500).json({ success: false, message: 'Failed to update seller status' });
  }
};

exports.suspendSeller = async (req, res) => {
  try {
    const { id } = req.params;
    const seller = await Seller.findByPk(id, { include: [{ model: User }] });
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller not found' });
    }

    const nextUserStatus = seller.User?.status === 'suspended'
      ? (seller.verificationStatus === 'verified' ? 'active' : 'pending_approval')
      : 'suspended';

    const updatedSeller = await updateSellerState({
      seller,
      verificationStatus: seller.verificationStatus,
      userStatus: nextUserStatus
    });

    if (seller.User?.email) {
      await emailService.sendMail({
        to: seller.User.email,
        subject: `Your BodaZone seller account has been ${nextUserStatus === 'suspended' ? 'suspended' : 'restored'}`,
        text: `Hello ${seller.User.name}, your seller account status is now ${nextUserStatus}.`,
        html: `<p>Hello ${seller.User.name},</p><p>Your seller account status is now <strong>${nextUserStatus}</strong>.</p>`
      });
    }

    res.json({ success: true, message: `Seller account ${nextUserStatus === 'suspended' ? 'suspended' : 'restored'}`, data: updatedSeller });
  } catch (error) {
    console.error('Suspend seller error:', error);
    res.status(500).json({ success: false, message: 'Failed to update seller suspension' });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = status ? { status } : {};

    const { count, rows } = await Payment.findAndCountAll({
      where,
      include: [
        { model: Order, attributes: ['id', 'orderNumber', 'totalAmount', 'paymentMethod'] },
        { model: User, attributes: ['id', 'name', 'email'] }
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
        pages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch transactions' });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = status ? { status } : {};

    const { count, rows } = await Order.findAndCountAll({
      where,
      include: [{ model: User, attributes: ['id', 'name', 'email'] }],
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
        pages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get admin orders error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
};

exports.getReports = async (req, res) => {
  try {
    const topProducts = await Product.findAll({
      limit: 10,
      order: [['sold', 'DESC']],
      attributes: ['id', 'name', 'category', 'sold', 'price']
    });

    const monthlyPayments = await Payment.findAll({
      attributes: [
        [fn('DATE_FORMAT', col('created_at'), '%Y-%m'), 'month'],
        [fn('SUM', col('amount')), 'total']
      ],
      where: { status: { [Op.in]: SUCCESSFUL_PAYMENT_STATUSES } },
      group: [fn('DATE_FORMAT', col('created_at'), '%Y-%m')],
      order: [[fn('DATE_FORMAT', col('created_at'), '%Y-%m'), 'ASC']]
    });

    res.json({
      success: true,
      data: {
        topProducts,
        monthlyPayments
      }
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch reports' });
  }
};

/**
 * Get detailed order tracking information (admin view)
 */
exports.getOrderTracking = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await getOrderWithDelivery(orderId);

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Get order tracking error:', error);
    if (error.message === 'Order not found') {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch order tracking' });
  }
};

/**
 * Get all orders with tracking (admin dashboard)
 */
exports.getAllOrdersTracking = async (req, res) => {
  try {
    const { status, paymentStatus, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) {
      where.status = status;
    }
    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    const result = await getOrdersWithDelivery(where, {
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total: result.count,
        page: parseInt(page),
        pages: Math.ceil(result.count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get all orders tracking error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch orders tracking' });
  }
};

/**
 * Get orders by status (admin analytics)
 */
exports.getOrdersByStatus = async (req, res) => {
  try {
    const statusCounts = await Order.findAll({
      attributes: [
        'status',
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    const statusBreakdown = {};
    statusCounts.forEach(item => {
      statusBreakdown[item.status] = parseInt(item.count, 10);
    });

    res.json({
      success: true,
      data: statusBreakdown
    });
  } catch (error) {
    console.error('Get orders by status error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch orders by status' });
  }
};

const path = require('path');
const fs = require('fs');

exports.getSellerDocuments = async (req, res) => {
  try {
    const { id } = req.params;
    const seller = await Seller.findByPk(id);
    if (!seller) return res.status(404).json({ success: false, message: 'Seller not found' });

    const SellerDocument = require('../models/SellerDocument');
    const docs = await SellerDocument.findAll({ where: { sellerId: seller.id }, order: [['createdAt', 'DESC']] });

    // Prefer explicit backend public URL if configured (useful behind proxies)
    const hostBase = process.env.BACKEND_PUBLIC_URL || `${req.protocol}://${req.get('host')}`;

    // Provide both direct static URL and a protected download URL that routes through the API
    const data = docs.map(d => ({
      id: d.id,
      filename: d.filename,
      url: `${hostBase}${d.path}`,
      downloadUrl: `${hostBase}/api/admin/sellers/${seller.id}/documents/${d.id}/file`,
      status: d.status,
      createdAt: d.createdAt
    }));

    res.json({ success: true, data });
  } catch (error) {
    console.error('Get seller documents error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch seller documents' });
  }
};

/**
 * Serve a seller document file (admin-only)
 */
exports.getSellerDocumentFile = async (req, res) => {
  try {
    const { sellerId, docId } = req.params;
    const SellerDocument = require('../models/SellerDocument');
    const doc = await SellerDocument.findOne({ where: { id: docId, sellerId } });
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });

    const filePath = path.join(__dirname, '..', doc.path);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File not found on server' });
    }

    // Set appropriate headers; rely on stored mimeType when available
    const options = {};
    if (doc.mimeType) options.headers = { 'Content-Type': doc.mimeType };

    return res.sendFile(filePath, options, (err) => {
      if (err) {
        console.error('Error sending seller document file:', err);
        if (!res.headersSent) res.status(500).json({ success: false, message: 'Failed to send file' });
      }
    });
  } catch (error) {
    console.error('Get seller document file error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch document file' });
  }
};

exports.approveSellerDocument = async (req, res) => {
  try {
    const { sellerId, docId } = req.params;
    const SellerDocument = require('../models/SellerDocument');
    const doc = await SellerDocument.findOne({ where: { id: docId, sellerId } });
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });

    await doc.update({ status: 'approved' });

    res.json({ success: true, message: 'Document approved', data: { id: doc.id, status: doc.status } });
  } catch (error) {
    console.error('Approve seller document error:', error);
    res.status(500).json({ success: false, message: 'Failed to approve document' });
  }
};

exports.rejectSellerDocument = async (req, res) => {
  try {
    const { sellerId, docId } = req.params;
    const { reason } = req.body;
    const SellerDocument = require('../models/SellerDocument');
    const doc = await SellerDocument.findOne({ where: { id: docId, sellerId } });
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });

    await doc.update({ status: 'rejected' });

    res.json({ success: true, message: 'Document rejected', data: { id: doc.id, status: doc.status, reason: reason || null } });
  } catch (error) {
    console.error('Reject seller document error:', error);
    res.status(500).json({ success: false, message: 'Failed to reject document' });
  }
};

/**
 * Verify a seller (admin action) after reviewing documents
 */
exports.verifySeller = async (req, res) => {
  try {
    const { id } = req.params;
    const seller = await Seller.findByPk(id, { include: [{ model: User }] });
    if (!seller) return res.status(404).json({ success: false, message: 'Seller not found' });

    await seller.update({ verificationStatus: 'verified', isActive: true });
    if (seller.User) {
      await seller.User.update({ status: 'active' });

      // send notification email
      const emailService = require('../services/emailService');
      await emailService.sendMail({
        to: seller.User.email,
        subject: 'Your shop has been verified',
        text: `Hello ${seller.User.name}, your shop ${seller.shopName} has been verified by the admin. You can now create products.`,
        html: `<p>Hello ${seller.User.name},</p><p>Your shop <strong>${seller.shopName}</strong> has been <strong>verified</strong> by the admin. You can now create products and manage your shop.</p>`
      });
    }

    res.json({ success: true, message: 'Seller verified successfully', data: seller });
  } catch (error) {
    console.error('Verify seller error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify seller' });
  }
};
