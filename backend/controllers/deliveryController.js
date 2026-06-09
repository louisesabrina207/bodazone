const { Delivery, Order, User, Notification } = require('../models');
const { createNotification } = require('./notificationController');
const { updateDeliveryStatusSync } = require('../utils/orderStatusSync');
const emailService = require('../services/emailService');

/**
 * Get delivery details
 */
exports.getDelivery = async (req, res) => {
  try {
    const { id } = req.params;

    const delivery = await Delivery.findByPk(id, {
      include: [{ model: Order }]
    });

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found'
      });
    }

    res.json({
      success: true,
      data: delivery
    });
  } catch (error) {
    console.error('Get delivery error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch delivery'
    });
  }
};

/**
 * Track delivery by tracking number
 */
exports.trackDelivery = async (req, res) => {
  try {
    const { trackingNumber } = req.params;

    const delivery = await Delivery.findOne({
      where: { trackingNumber },
      include: [{ model: Order }]
    });

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Tracking number not found'
      });
    }

    res.json({
      success: true,
      data: {
        trackingNumber: delivery.trackingNumber,
        status: delivery.status,
        estimatedDeliveryDate: delivery.estimatedDeliveryDate,
        actualDeliveryDate: delivery.actualDeliveryDate,
        currentLocation: delivery.currentLocation,
        updateHistory: delivery.updateHistory,
        recipientName: delivery.recipientName,
        address: delivery.shippingAddress
      }
    });
  } catch (error) {
    console.error('Track delivery error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track delivery'
    });
  }
};

/**
 * Update delivery status (seller/admin)
 */
exports.updateDeliveryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, courierName, currentLocation } = req.body;

    const delivery = await Delivery.findByPk(id, {
      include: [{ model: Order, include: [{ model: User }] }]
    });

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found'
      });
    }

    // Validate status
    const validStatuses = ['pending', 'processing', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled', 'failed', 'returned'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values: ${validStatuses.join(', ')}`
      });
    }

    // Update history
    const updateHistory = delivery.updateHistory || [];
    updateHistory.push({
      status: delivery.status,
      updatedAt: new Date(),
      note: `Status changed from ${delivery.status} to ${status}`
    });

    // Update delivery with sync to order status
    await delivery.update({
      status,
      courierName: courierName || delivery.courierName,
      currentLocation: currentLocation || delivery.currentLocation,
      updateHistory,
      actualDeliveryDate: status === 'delivered' ? new Date() : delivery.actualDeliveryDate
    });

    // Sync delivery status to order status using utility
    await updateDeliveryStatusSync(delivery, status);

    // Create notification for customer
    const notificationTypesMap = {
      'processing': 'order_processing',
      'shipped': 'order_shipped',
      'in_transit': 'order_out_for_delivery',
      'out_for_delivery': 'order_out_for_delivery',
      'delivered': 'order_delivered',
      'failed': 'order_cancelled',
      'cancelled': 'order_cancelled'
    };

    const notificationMessages = {
      'processing': 'Your order is being prepared for shipment',
      'shipped': 'Your order has been shipped!',
      'in_transit': 'Your order is out for delivery',
      'out_for_delivery': 'Your order is out for delivery',
      'delivered': 'Your order has been delivered',
      'failed': 'Delivery of your order failed',
      'cancelled': 'Your order has been cancelled'
    };

    const notificationType = notificationTypesMap[status] || status;
    const message = notificationMessages[status] || `Order status updated to ${status}`;

    const order = delivery.Order;
    if (order && order.riderId) {
      // Create in-app notification
      await createNotification(
        order.riderId,
        order.id,
        notificationType,
        `Order ${order.orderNumber} - ${message}`,
        message,
        {
          trackingNumber: delivery.trackingNumber,
          status: status,
          currentLocation: currentLocation
        }
      );

      // Send emails for specific status updates
      const rider = await User.findByPk(order.riderId);
      if (rider && rider.email) {
        try {
          if (status === 'out_for_delivery') {
            // Email when order is ready for pickup
            await emailService.sendMail({
              to: rider.email,
              subject: 'Your BodaZone Order is Ready for Pickup!',
              text: `Hi ${rider.name},\n\nYour order ${order.orderNumber} is now ready for pickup!\n\nTracking Number: ${delivery.trackingNumber}\nStatus: Ready for Pickup\n\nPlease pick up your order at your earliest convenience.\n\nThank you for shopping with BodaZone!`,
              html: `
                <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937">
                  <h2 style="color:#d97706">Order Ready for Pickup!</h2>
                  <p>Hi ${rider.name},</p>
                  <p>Your order <strong>${order.orderNumber}</strong> is now ready for pickup!</p>
                  <div style="background:#fef3c7;padding:16px;border-radius:8px;margin:16px 0">
                    <p><strong>Tracking Number:</strong> ${delivery.trackingNumber}</p>
                    <p><strong>Status:</strong> Ready for Pickup</p>
                  </div>
                  <p>Please pick up your order at your earliest convenience.</p>
                  <p>Thank you for shopping with BodaZone!</p>
                </div>
              `
            });
          } else if (status === 'in_transit' || status === 'processing') {
            // Email when order is released for delivery
            await emailService.sendMail({
              to: rider.email,
              subject: 'Your BodaZone Order Has Been Released for Delivery',
              text: `Hi ${rider.name},\n\nYour order ${order.orderNumber} has been released and is on its way to you!\n\nTracking Number: ${delivery.trackingNumber}\nCurrent Status: ${status.replace(/_/g, ' ').toUpperCase()}\nLocation: ${currentLocation || 'In Transit'}\n\nYou can track your delivery using the tracking number above.\n\nThank you for shopping with BodaZone!`,
              html: `
                <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937">
                  <h2 style="color:#d97706">Order Released for Delivery</h2>
                  <p>Hi ${rider.name},</p>
                  <p>Your order <strong>${order.orderNumber}</strong> has been released and is on its way to you!</p>
                  <div style="background:#fef3c7;padding:16px;border-radius:8px;margin:16px 0">
                    <p><strong>Tracking Number:</strong> ${delivery.trackingNumber}</p>
                    <p><strong>Status:</strong> ${status.replace(/_/g, ' ').toUpperCase()}</p>
                    <p><strong>Location:</strong> ${currentLocation || 'In Transit'}</p>
                  </div>
                  <p>You can track your delivery using the tracking number above.</p>
                  <p>Thank you for shopping with BodaZone!</p>
                </div>
              `
            });
          }
        } catch (emailErr) {
          console.warn('Failed to send delivery status email:', emailErr.message);
          // Don't fail the delivery update if email fails
        }
      }
    }

    res.json({
      success: true,
      message: 'Delivery status updated',
      data: {
        deliveryId: delivery.id,
        deliveryStatus: delivery.status,
        orderStatus: order?.status,
        trackingNumber: delivery.trackingNumber
      }
    });
  } catch (error) {
    console.error('Update delivery error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update delivery'
    });
  }
};

module.exports = exports;
