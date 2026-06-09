/**
 * Order Status Synchronization Utility
 * Ensures Order and Delivery statuses are kept in sync
 * 
 * Delivery Status Flow: pending → processing → in_transit → delivered
 * Order Status Flow: pending → confirmed → processing → shipped → delivered
 */

const ORDER_DELIVERY_STATUS_MAP = {
  // Order Status -> Delivery Status Mapping (Clear single path)
  'pending': 'pending',
  'confirmed': 'processing',
  'processing': 'processing',
  'shipped': 'in_transit',       // Single transit status (no repetition)
  'delivered': 'delivered',
  'cancelled': 'cancelled',
  'returned': 'returned'
};

const DELIVERY_ORDER_STATUS_MAP = {
  // Delivery Status -> Order Status Mapping (Reverse mapping)
  'pending': 'pending',
  'processing': 'processing',
  'in_transit': 'shipped',       // Maps back to shipped (no out_for_delivery confusion)
  'out_for_delivery': 'shipped', // Legacy: also maps to shipped
  'delivered': 'delivered',
  'cancelled': 'cancelled',
  'returned': 'returned'
};

// Valid delivery statuses (normalized - no out_for_delivery in new code)
const VALID_DELIVERY_STATUSES = ['pending', 'processing', 'in_transit', 'delivered', 'cancelled', 'returned'];

// Valid order statuses
const VALID_ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];

/**
 * Update order and sync delivery status
 * @param {Object} order - Order instance from database
 * @param {string} newStatus - New order status
 * @param {Object} options - Additional options (transaction, etc.)
 * @returns {Promise<Object>} - Updated order and delivery
 */
const updateOrderStatusSync = async (order, newStatus, options = {}) => {
  const { transaction } = options;
  
  // Get the corresponding delivery status
  const deliveryStatus = ORDER_DELIVERY_STATUS_MAP[newStatus];
  
  if (!deliveryStatus) {
    throw new Error(`Invalid order status: ${newStatus}`);
  }

  // Update order
  await order.update(
    { status: newStatus },
    { transaction }
  );

  // Update associated delivery
  if (order.Delivery) {
    await order.Delivery.update(
      { status: deliveryStatus },
      { transaction }
    );
  } else {
    // If delivery doesn't exist, fetch it
    const { Delivery } = require('../models');
    const delivery = await Delivery.findOne(
      { where: { orderId: order.id } },
      { transaction }
    );
    if (delivery) {
      await delivery.update(
        { status: deliveryStatus },
        { transaction }
      );
    }
  }

  return {
    order,
    delivery: order.Delivery || null
  };
};

/**
 * Update delivery and sync order status
 * Used when courier/biker updates delivery status
 * @param {Object} delivery - Delivery instance from database
 * @param {string} newStatus - New delivery status
 * @param {Object} options - Additional options (transaction, etc.)
 * @returns {Promise<Object>} - Updated order and delivery
 */
const updateDeliveryStatusSync = async (delivery, newStatus, options = {}) => {
  const { transaction } = options;

  // Get the corresponding order status
  const orderStatus = DELIVERY_ORDER_STATUS_MAP[newStatus];
  
  if (!orderStatus) {
    throw new Error(`Invalid delivery status: ${newStatus}`);
  }

  // Update delivery
  await delivery.update(
    { status: newStatus },
    { transaction }
  );

  // Update associated order
  if (delivery.Order) {
    await delivery.Order.update(
      { status: orderStatus },
      { transaction }
    );
  } else {
    // If order doesn't exist, fetch it
    const { Order } = require('../models');
    const order = await Order.findOne(
      { where: { id: delivery.orderId } },
      { transaction }
    );
    if (order) {
      await order.update(
        { status: orderStatus },
        { transaction }
      );
    }
  }

  return {
    order: delivery.Order || null,
    delivery
  };
};

/**
 * Get order with delivery details (unified view)
 * Returns all relevant info for consistent display
 * @param {number} orderId - Order ID
 * @returns {Promise<Object>} - Complete order with delivery info
 */
const getOrderWithDelivery = async (orderId) => {
  const { Order, OrderItem, Product, Seller, Payment, Delivery, User } = require('../models');
  
  const order = await Order.findByPk(orderId, {
    include: [
      {
        model: OrderItem,
        include: [{ model: Product }, { model: Seller }]
      },
      { model: Delivery },
      { model: Payment },
      { model: User, attributes: ['id', 'name', 'email', 'phone'] }
    ]
  });

  if (!order) {
    throw new Error('Order not found');
  }

  // Ensure delivery exists
  if (!order.Delivery) {
    throw new Error('No delivery record found for order');
  }

  return {
    ...order.toJSON(),
    // Add unified status view
    deliveryStatus: order.Delivery.status,
    trackingInfo: {
      trackingNumber: order.Delivery.trackingNumber,
      status: order.Delivery.status,
      estimatedDeliveryDate: order.Delivery.estimatedDeliveryDate,
      actualDeliveryDate: order.Delivery.actualDeliveryDate,
      currentLocation: order.Delivery.currentLocation,
      updateHistory: order.Delivery.updateHistory
    }
  };
};

/**
 * Get all orders with delivery status (admin view)
 * @param {Object} where - Where clause for filtering
 * @param {Object} options - Query options (limit, offset, order, etc.)
 * @returns {Promise<Object>} - Orders with delivery info
 */
const getOrdersWithDelivery = async (where = {}, options = {}) => {
  const { Order, OrderItem, Product, Seller, Payment, Delivery, User } = require('../models');
  const { limit = 10, offset = 0, order: orderBy = [['createdAt', 'DESC']] } = options;

  const { count, rows } = await Order.findAndCountAll({
    where,
    include: [
      {
        model: OrderItem,
        include: [{ model: Product }, { model: Seller }]
      },
      { model: Delivery },
      { model: Payment, attributes: ['id', 'status', 'method'] },
      { model: User, attributes: ['id', 'name', 'email', 'phone'] }
    ],
    order: orderBy,
    limit,
    offset,
    distinct: true,
    subQuery: false
  });

  return {
    count,
    rows: rows.map(order => ({
      ...order.toJSON(),
      deliveryStatus: order.Delivery?.status || 'pending',
      trackingInfo: order.Delivery ? {
        trackingNumber: order.Delivery.trackingNumber,
        status: order.Delivery.status,
        estimatedDeliveryDate: order.Delivery.estimatedDeliveryDate,
        actualDeliveryDate: order.Delivery.actualDeliveryDate
      } : null
    }))
  };
};

module.exports = {
  updateOrderStatusSync,
  updateDeliveryStatusSync,
  getOrderWithDelivery,
  getOrdersWithDelivery,
  ORDER_DELIVERY_STATUS_MAP,
  DELIVERY_ORDER_STATUS_MAP,
  VALID_DELIVERY_STATUSES,
  VALID_ORDER_STATUSES
};
