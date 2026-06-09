const { Order, OrderItem, Product, Payment, Delivery, User, Seller } = require('../models');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { isSuccessfulPaymentStatus, normalizePaymentStatus } = require('../utils/paymentStatus');

/**
 * Generate and download receipt PDF for an order
 */
exports.generateReceipt = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    // Fetch order with all related data
    const order = await Order.findByPk(orderId, {
      include: [
        {
          model: OrderItem,
          include: [
            { model: Product },
            { model: Seller }
          ]
        },
        { model: Payment },
        { model: Delivery },
        { model: User }
      ]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Verify order belongs to user
    if (order.riderId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to download this receipt'
      });
    }

    // For M-Pesa sandbox: allow receipt download even if payment failed (sandbox reverses transactions)
    // Receipt can be downloaded for orders with payment attempts (not just successful payments)
    const hasPaymentAttempt = (
      (order.Payment && (order.Payment.status === 'pending' || order.Payment.status === 'verified' || order.Payment.status === 'failed')) ||
      order.paymentStatus
    );

    if (!hasPaymentAttempt) {
      return res.status(400).json({
        success: false,
        message: 'Receipt can only be downloaded for orders with payment attempts'
      });
    }

    // Create PDF in memory - improved layout
    const doc = new PDFDocument({ margin: 36, size: 'A4', bufferPages: true });
    const filename = `Receipt-${order.orderNumber}-${Date.now()}.pdf`;
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));

    const left = 36;
    const right = doc.page.width - 36;
    const tableWidth = right - left;
    const lineColor = '#e2e8f0';
    const accentColor = '#0ea5a4';

    const formatCurrency = (v) => `KES ${Number(v || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;

    // Header
    let y = 36;
    doc.font('Helvetica-Bold').fontSize(20).fillColor(accentColor).text('BodaZone Receipt', left, y);
    y += 26;

    doc.font('Helvetica').fontSize(9).fillColor('#0f172a');
    doc.text(`Order: ${order.orderNumber}`, left, y);
    doc.text(`Date: ${new Date(order.createdAt).toLocaleString()}`, left + 260, y);
    y += 16;

    // Seller / Shop info (if available)
    const sellerInfo = order.OrderItems?.[0]?.Seller;
    if (sellerInfo) {
      doc.font('Helvetica-Bold').fontSize(10).text(sellerInfo.shopName || 'Shop', left, y);
      doc.font('Helvetica').fontSize(9).text(sellerInfo.location || '', left, y + 12);
    }

    // Customer block
    const customerX = left + 260;
    doc.font('Helvetica-Bold').fontSize(10).text('Customer', customerX, y);
    doc.font('Helvetica').fontSize(9).text(`${order.User?.name || 'N/A'}`, customerX, y + 12);
    doc.text(`${order.User?.phone || 'N/A'}`, customerX, y + 24);
    const address = order.shippingAddress || {};
    doc.text(`${address.address || 'N/A'}, ${address.city || 'N/A'}`, customerX, y + 36);

    y += 60;
    doc.moveTo(left, y - 6).lineTo(right, y - 6).strokeColor(lineColor).stroke();

    // Items table header
    const columns = [
      { label: 'Item', width: 240 },
      { label: 'Qty', width: 50, align: 'right' },
      { label: 'Unit', width: 90, align: 'right' },
      { label: 'Total', width: 90, align: 'right' }
    ];

    const colX = [];
    let cx = left;
    columns.forEach((c) => { colX.push(cx); cx += c.width; });

    doc.fillColor('#f8fafc').rect(left, y, tableWidth, 22).fill();
    doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(9);
    columns.forEach((c, i) => {
      const opts = c.align ? { width: c.width - 6, align: c.align } : { width: c.width - 6 };
      doc.text(c.label, colX[i] + 4, y + 6, opts);
    });
    y += 28;

    // Items
    const items = order.OrderItems || [];
    items.forEach((item, idx) => {
      const product = item.Product || {};
      const qty = Number(item.quantity || 0);
      const unit = Number(item.price || item.unitPrice || product.price || 0);
      const total = qty * unit;

      // Page break
      if (y > doc.page.height - 120) {
        doc.addPage();
        y = 48;
      }

      const fill = idx % 2 === 0 ? '#ffffff' : '#fbfdff';
      doc.fillColor(fill).rect(left, y - 4, tableWidth, 22).fill();

      doc.fillColor('#0f172a').font('Helvetica').fontSize(9);
      doc.text((product.name || 'N/A').slice(0, 64), colX[0] + 4, y + 2, { width: columns[0].width - 8 });
      doc.text(String(qty), colX[1], y + 2, { width: columns[1].width - 6, align: 'right' });
      doc.text(formatCurrency(unit), colX[2], y + 2, { width: columns[2].width - 6, align: 'right' });
      doc.text(formatCurrency(total), colX[3], y + 2, { width: columns[3].width - 6, align: 'right' });

      y += 24;
    });

    // Summary
    y += 6;
    doc.moveTo(left, y).lineTo(right, y).strokeColor(lineColor).stroke();
    y += 8;

    const subtotal = Number(order.subtotal || 0);
    const tax = Number(order.tax || 0);
    const shipping = Number(order.shippingCost || 0);
    const totalAmount = Number(order.totalAmount || order.total || 0);

    doc.font('Helvetica').fontSize(9).fillColor('#0f172a');
    doc.text('Subtotal', left + 300, y, { width: 100, align: 'left' });
    doc.text(formatCurrency(subtotal), left + 420, y, { width: 100, align: 'right' });
    y += 14;
    doc.text('Tax', left + 300, y, { width: 100, align: 'left' });
    doc.text(formatCurrency(tax), left + 420, y, { width: 100, align: 'right' });
    y += 14;
    doc.text('Shipping', left + 300, y, { width: 100, align: 'left' });
    doc.text(formatCurrency(shipping), left + 420, y, { width: 100, align: 'right' });
    y += 12;
    doc.moveTo(left + 300, y).lineTo(right, y).strokeColor(lineColor).stroke();
    y += 8;
    doc.font('Helvetica-Bold').fontSize(11).text('TOTAL', left + 300, y, { width: 100, align: 'left' });
    doc.text(formatCurrency(totalAmount), left + 420, y, { width: 100, align: 'right' });

    // Payment & Delivery
    y += 28;
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#0f172a').text('Payment', left, y);
    doc.font('Helvetica').fontSize(9).text(`${order.Payment?.method?.toUpperCase() || 'N/A'} — ${normalizePaymentStatus(order.Payment?.status || order.paymentStatus || 'pending')}`, left + 70, y);
    if (order.Payment?.mpesaReference) {
      y += 14;
      doc.text(`Reference: ${order.Payment.mpesaReference}`, left + 70, y);
    }

    if (order.Delivery) {
      y += 16;
      doc.font('Helvetica-Bold').text('Delivery', left, y);
      doc.font('Helvetica').fontSize(9).text(`${order.Delivery?.trackingNumber || 'N/A'} — ${order.Delivery?.status || 'N/A'}`, left + 70, y);
    }

    // Footer
    const footerY = doc.page.height - 72;
    doc.moveTo(left, footerY - 8).lineTo(right, footerY - 8).strokeColor(lineColor).stroke();
    doc.font('Helvetica').fontSize(8).fillColor('#475569').text('Thank you for your purchase! Visit bodazone.com for support and returns.', left, footerY);
    doc.fontSize(7).text(`Generated: ${new Date().toLocaleString()}`, left, footerY + 14);

    // Finalize and send
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.send(pdfBuffer);
      console.log(`Receipt generated successfully for order ${orderId}`);
    });

    doc.on('error', (err) => {
      console.error('PDF generation error:', err);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'Failed to generate receipt', error: err.message });
      }
    });

    doc.end();
  } catch (error) {
    console.error('Generate receipt error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Failed to generate receipt',
        error: error.message
      });
    }
  }
};

/**
 * Check if receipt can be downloaded (payment verified)
 */
exports.canDownloadReceipt = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const order = await Order.findByPk(orderId, {
      include: [{ model: Payment }]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.riderId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const canDownload =
      (order.Payment && isSuccessfulPaymentStatus(order.Payment.status)) ||
      isSuccessfulPaymentStatus(order.paymentStatus);

    res.json({
      success: true,
      data: {
        canDownload,
        message: canDownload ? 'Receipt is ready for download' : 'Payment not verified yet'
      }
    });
  } catch (error) {
    console.error('Check receipt availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check receipt availability'
    });
  }
};
