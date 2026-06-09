const { Order, Payment, User, Notification } = require('../models');
const mpesaService = require('../services/mpesaService');
const { createNotification } = require('./notificationController');
const { isSuccessfulPaymentStatus, normalizePaymentStatus } = require('../utils/paymentStatus');
const emailService = require('../services/emailService');

const markPaymentSuccessful = async (payment, callbackResult) => {
  await payment.update({
    status: 'verified',
    mpesaReference: callbackResult.mpesaReference || payment.mpesaReference,
    transactionDate: callbackResult.transactionDate || payment.transactionDate,
    verificationDetails: callbackResult,
    transactionMessage: callbackResult.resultDescription || callbackResult.queryResult?.resultDescription || 'Payment verified',
    verifiedAt: new Date(),
    failureReason: null,
    failedAt: null
  });

  const order = await Order.findByPk(payment.orderId, {
    include: [{ model: User }]
  });

  if (!order) return;

  await order.update({
    paymentStatus: 'verified',
    status: order.status === 'pending' ? 'confirmed' : order.status
  });

  if (!order.User) return;

  try {
    await createNotification(
      order.riderId,
      order.id,
      'order_payment_received',
      `Payment received for Order ${order.orderNumber}`,
      'Your payment has been verified and your order is confirmed!',
      {
        mpesaReference: callbackResult.mpesaReference || null,
        amount: payment.amount
      }
    );

    if (order.User?.email) {
      try {
        await emailService.sendMail({
          to: order.User.email,
          subject: `Payment verified for order ${order.orderNumber}`,
          text: `Your payment for order ${order.orderNumber} has been verified.`,
          html: `<p>Your payment for order <strong>${order.orderNumber}</strong> has been verified.</p>`
        });
      } catch (emailError) {
        console.error('Error sending payment verification email:', emailError);
      }
    }
  } catch (notifError) {
    console.error('Error creating notification:', notifError);
  }
};

/**
 * Initiate M-Pesa payment
 */
exports.initiatePayment = async (req, res) => {
  try {
    const { orderId, phoneNumber, phone } = req.body;
    const normalizedPhone = phoneNumber || phone;

    // Get order
    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Verify order belongs to user
    if (order.riderId !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to pay for this order'
      });
    }

    // Check if payment already exists
    const existingPayment = await Payment.findOne({ where: { orderId } });
    if (existingPayment && isSuccessfulPaymentStatus(existingPayment.status)) {
      return res.status(400).json({
        success: false,
        message: 'This order has already been paid'
      });
    }

    // Initiate STK Push
    const stkResult = await mpesaService.initiateSTKPush(
      normalizedPhone,
      order.totalAmount,
      order.id,
      order.orderNumber
    );

    if (!stkResult.success) {
      return res.status(400).json({
        success: false,
        message: stkResult.error || 'Failed to initiate payment',
        details: {
          errorCode: stkResult.errorCode || null,
          requestId: stkResult.requestId || null
        }
      });
    }

    // Create or update payment record
    let payment = await Payment.findOne({ where: { orderId } });
    
    if (!payment) {
      payment = await Payment.create({
        orderId,
        userId: req.userId,
        amount: order.totalAmount,
        method: 'mpesa',
        phoneNumber: normalizedPhone,
        status: 'pending',
        merchantRequestId: stkResult.merchantRequestId,
        checkoutRequestId: stkResult.checkoutRequestId,
        transactionMessage: stkResult.responseDescription || stkResult.customerMessage || 'STK push sent'
      });
    } else {
      await payment.update({
        phoneNumber: normalizedPhone,
        status: 'pending',
        merchantRequestId: stkResult.merchantRequestId,
        checkoutRequestId: stkResult.checkoutRequestId,
        failureReason: null,
        failedAt: null,
        transactionMessage: stkResult.responseDescription || stkResult.customerMessage || 'STK push sent'
      });
    }

    res.json({
      success: true,
      message: 'Payment initiated. Please complete the transaction on your phone.',
      data: {
        orderId,
        orderNumber: order.orderNumber,
        amount: order.totalAmount,
        merchantRequestId: stkResult.merchantRequestId,
        checkoutRequestId: stkResult.checkoutRequestId,
        responseDescription: stkResult.responseDescription,
        transactionMessage: stkResult.responseDescription || stkResult.customerMessage,
      }
    });
  } catch (error) {
    console.error('Initiate payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate payment'
    });
  }
};

/**
 * M-Pesa callback handler
 */
exports.mpesaCallback = async (req, res) => {
  try {
    console.log('M-Pesa Callback received:', JSON.stringify(req.body, null, 2));

    // Validate callback
    const callbackResult = mpesaService.validateCallback(req.body);

    // Find payment by checkoutRequestId from callback
    let payment = await Payment.findOne({
      where: { checkoutRequestId: callbackResult.checkoutRequestId }
    });

    // Fallback: search by merchant request ID
    if (!payment) {
      payment = await Payment.findOne({
        where: { merchantRequestId: callbackResult.merchantRequestId }
      });
    }

    // Last resort: search by phone and pending status (less reliable)
    if (!payment) {
      payment = await Payment.findOne({
        where: { 
          phoneNumber: callbackResult.phoneNumber,
          status: 'pending'
        },
        order: [['createdAt', 'DESC']],
        limit: 1
      });
    }

    if (!payment) {
      console.log('Payment record not found for callback:', callbackResult);
      return res.json({ ResultCode: 1, ResultDesc: 'Payment record not found' });
    }

    // Handle failed STK push (ResultCode !== 0)
    if (!callbackResult.success) {
      console.log('STK Push failed with ResultCode:', callbackResult.resultCode, 'Description:', callbackResult.resultDescription);
      
      // Map M-Pesa result codes to failure reasons
      const failureReasons = {
        '1': 'User cancelled the transaction',
        '26': 'Invalid PIN entered',
        '1032': 'Request timeout - user did not complete transaction',
        '1037': 'Request cancelled by user',
        '2001': 'Unable to process your transaction. Please try again later.'
      };

      const failureReason = failureReasons[String(callbackResult.resultCode)] || callbackResult.resultDescription || 'STK push failed';

      await payment.update({
        status: 'failed',
        failureReason,
        failedAt: new Date(),
        transactionMessage: `Transaction failed: ${failureReason}`
      });

      const order = await Order.findByPk(payment.orderId);
      if (order) {
        await order.update({ paymentStatus: 'failed' });
      }

      console.log('Payment marked as failed:', { paymentId: payment.id, reason: failureReason });
      return res.json({ ResultCode: 0, ResultDesc: 'Payment failure recorded' });
    }

    // Verify amount matches (if we have it)
    if (callbackResult.amount && payment.amount !== callbackResult.amount) {
      console.log('Amount mismatch:', { expected: payment.amount, received: callbackResult.amount });
      // Don't fail - amount might be in different format
    }

    await markPaymentSuccessful(payment, callbackResult);

    res.json({ ResultCode: 0, ResultDesc: 'Payment processed successfully' });
  } catch (error) {
    console.error('M-Pesa callback error:', error);
    res.json({ ResultCode: 1, ResultDesc: 'Callback processing failed' });
  }
};

/**
 * Verify payment status
 */
exports.verifyPayment = async (req, res) => {
  try {
    const { orderId } = req.params;

    const payment = await Payment.findOne({ where: { orderId } });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // If payment is still pending, query M-Pesa and reconcile status
    if (normalizePaymentStatus(payment.status) === 'pending' && payment.checkoutRequestId) {
      const queryResult = await mpesaService.querySTKPushStatus(payment.checkoutRequestId);

      if (queryResult.success || queryResult.resultCode !== undefined) {
        const resultCode = String(queryResult.resultCode ?? '');

        if (resultCode === '0') {
          // Transaction successful
          await markPaymentSuccessful(payment, {
            checkoutRequestId: payment.checkoutRequestId,
            merchantRequestId: payment.merchantRequestId,
            mpesaReference: payment.mpesaReference,
            transactionDate: payment.transactionDate,
            amount: payment.amount,
            phoneNumber: payment.phoneNumber,
            queryResult
          });
          await payment.reload();
        } else if (resultCode && !['1032', '1037', '1'].includes(resultCode)) {
          // Transaction failed with specific error
          const failureReasons = {
            '1': 'User cancelled the transaction',
            '26': 'Invalid PIN entered',
            '1032': 'Request timeout - user did not complete transaction',
            '1037': 'Request cancelled by user',
            '2001': 'Unable to process your transaction. Please try again later.'
          };

          const failureReason = failureReasons[resultCode] || queryResult.resultDescription || 'M-Pesa transaction failed';

          await payment.update({
            status: 'failed',
            failureReason,
            failedAt: new Date()
          });

          const order = await Order.findByPk(payment.orderId);
          if (order) {
            await order.update({ paymentStatus: 'failed' });
          }

          await payment.reload();
        } else if (resultCode === '1032' || resultCode === '1037' || resultCode === '1') {
          // Timeout or user cancellation - keep as pending but log attempt
          console.log('Transaction pending/timeout - ResultCode:', resultCode, 'Payment:', payment.id);
          // Don't update status - user can retry
        }
      } else if (!queryResult.success) {
        // Query itself failed - don't update payment status yet
        console.warn('STK Query failed:', queryResult.error);
      }
    }

    res.json({
      success: true,
      data: {
        paymentId: payment.id,
        orderId: payment.orderId,
        amount: payment.amount,
        status: normalizePaymentStatus(payment.status),
        method: payment.method,
        mpesaReference: payment.mpesaReference,
        checkoutRequestId: payment.checkoutRequestId,
        merchantRequestId: payment.merchantRequestId,
        transactionMessage: payment.transactionMessage,
        failureReason: payment.failureReason,
        verifiedAt: payment.verifiedAt
      }
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment'
    });
  }
};

/**
 * Query payment status from M-Pesa
 */
exports.queryPaymentStatus = async (req, res) => {
  try {
    const { checkoutRequestId } = req.body;

    const queryResult = await mpesaService.querySTKPushStatus(checkoutRequestId);

    res.json({
      success: queryResult.success,
      data: queryResult
    });
  } catch (error) {
    console.error('Query payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to query payment status'
    });
  }
};

/**
 * Get payment history
 */
exports.getPaymentHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await Payment.findAndCountAll({
      where: { userId: req.userId },
      include: [{ model: Order }],
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
    console.error('Get payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment history'
    });
  }
};

exports.retryPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findByPk(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.riderId !== req.userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to retry this payment' });
    }

    const payment = await Payment.findOne({ where: { orderId } });
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    const normalizedPhone = payment.phoneNumber || order.shippingAddress?.phone;
    const stkResult = await mpesaService.initiateSTKPush(normalizedPhone, order.totalAmount, order.id, order.orderNumber);

    if (!stkResult.success) {
      return res.status(400).json({
        success: false,
        message: stkResult.error || 'Failed to retry payment',
        details: {
          errorCode: stkResult.errorCode || null,
          requestId: stkResult.requestId || null
        }
      });
    }

    await payment.update({
      status: 'pending',
      phoneNumber: normalizedPhone,
      merchantRequestId: stkResult.merchantRequestId,
      checkoutRequestId: stkResult.checkoutRequestId,
      failureReason: null,
      failedAt: null,
      transactionMessage: stkResult.responseDescription || stkResult.customerMessage || 'STK push resent'
    });

    res.json({
      success: true,
      message: 'Payment retry sent successfully',
      data: {
        orderId,
        orderNumber: order.orderNumber,
        merchantRequestId: stkResult.merchantRequestId,
        checkoutRequestId: stkResult.checkoutRequestId,
        transactionMessage: stkResult.responseDescription || stkResult.customerMessage
      }
    });
  } catch (error) {
    console.error('Retry payment error:', error);
    res.status(500).json({ success: false, message: 'Failed to retry payment' });
  }
};

module.exports = exports;
