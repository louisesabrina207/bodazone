const { 
  Order, 
  OrderItem, 
  Product, 
  Seller, 
  User, 
  Delivery,
  Payment,
  sequelize 
} = require('../models');
const { Op } = require('sequelize');

/**
 * Create new order
 */
exports.createOrder = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { items, shippingAddress, paymentMethod, notes } = req.body;
    const normalizedPaymentMethod = 'mpesa';

    if (paymentMethod && paymentMethod !== 'mpesa') {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Only M-Pesa payment is supported'
      });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one item'
      });
    }

    // Fetch all products and validate stock
    const products = await Product.findAll({
      where: { id: items.map(i => i.productId) }
    });

    let subtotal = 0;
    let shippingCost = 0;
    const orderItems = [];

    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      
      if (!product) {
        await t.rollback();
        return res.status(404).json({
          success: false,
          message: `Product ${item.productId} not found`
        });
      }

      if (product.stock < item.quantity) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}`
        });
      }

      const itemSubtotal = product.price * item.quantity;
      subtotal += itemSubtotal;
      shippingCost += Number(product.deliveryFee || 0) * item.quantity;

      orderItems.push({
        productId: product.id,
        sellerId: product.sellerId,
        productName: product.name,
        quantity: item.quantity,
        price: product.price,
        subtotal: itemSubtotal
      });

      // Update product stock
      await product.update(
        { stock: product.stock - item.quantity },
        { transaction: t }
      );
    }

    // Tax is inclusive in product price. Total = subtotal + dynamic delivery fee.
    const tax = 0;
    const totalAmount = subtotal + shippingCost;

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    // Create order
    const order = await Order.create({
      orderNumber,
      riderId: req.userId,
      paymentMethod: normalizedPaymentMethod,
      subtotal,
      shippingCost,
      tax,
      totalAmount,
      shippingAddress,
      notes,
      status: 'pending',
      paymentStatus: 'pending'
    }, { transaction: t });

    // Create order items
    for (const item of orderItems) {
      await OrderItem.create({
        orderId: order.id,
        ...item
      }, { transaction: t });
    }

    // Create delivery record
    await Delivery.create({
      orderId: order.id,
      trackingNumber: `TRK-${order.id}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
      shippingAddress,
      recipientName: (await User.findByPk(req.userId)).name,
      recipientPhone: (await User.findByPk(req.userId)).phone,
      status: 'pending'
    }, { transaction: t });

    await t.commit();

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod
      }
    });
  } catch (error) {
    await t.rollback();
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order'
    });
  }
};

/**
 * Get rider's orders
 */
exports.getMyOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const where = { riderId: req.userId };
    if (status) where.status = status;

    const offset = (page - 1) * limit;

    const { count, rows } = await Order.findAndCountAll({
      where,
      include: [
        {
          model: OrderItem,
          include: [{ model: Product }, { model: Seller }]
        },
        { model: Delivery },
        { model: User, attributes: ['name', 'email', 'phone'] }
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
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders'
    });
  }
};

/**
 * Get order details
 */
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findByPk(id, {
      include: [
        {
          model: OrderItem,
          include: [{ model: Product }, { model: Seller }]
        },
        { model: Delivery },
        { model: Payment },
        { model: User, attributes: ['name', 'email', 'phone'] }
      ]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check authorization
    if (order.riderId !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order'
    });
  }
};

/**
 * Cancel order (rider)
 */
exports.cancelOrder = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const order = await Order.findByPk(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.riderId !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this order'
      });
    }

    if (['delivered', 'cancelled', 'returned'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel this order'
      });
    }

    // Restore stock
    const items = await OrderItem.findAll({ where: { orderId: id } });
    for (const item of items) {
      const product = await Product.findByPk(item.productId);
      await product.update(
        { stock: product.stock + item.quantity },
        { transaction: t }
      );
    }

    await order.update(
      {
        status: 'cancelled',
        cancellationReason: reason,
        cancelledAt: new Date(),
        paymentStatus: 'refunded'
      },
      { transaction: t }
    );

    await t.commit();

    res.json({
      success: true,
      message: 'Order cancelled successfully'
    });
  } catch (error) {
    await t.rollback();
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order'
    });
  }
};

module.exports = exports;
