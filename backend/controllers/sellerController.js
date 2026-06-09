const PDFDocument = require('pdfkit');
const { Op } = require('sequelize');
const { Seller, Product, Order, OrderItem, User, Delivery } = require('../models');
const { updateOrderStatusSync } = require('../utils/orderStatusSync');

const getCurrentSeller = async (userId) => {
  return Seller.findOne({ where: { userId } });
};

exports.getMyShop = async (req, res) => {
  try {
    const seller = await getCurrentSeller(req.userId);
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller profile not found' });
    }

    const user = await User.findByPk(req.userId, {
      attributes: ['id', 'name', 'email', 'phone', 'status']
    });

    res.json({ success: true, data: { seller, user } });
  } catch (error) {
    console.error('Get my shop error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch shop details' });
  }
};

/**
 * Get current seller documents (owner view)
 */
exports.getMyDocuments = async (req, res) => {
  try {
    const seller = await getCurrentSeller(req.userId);
    if (!seller) return res.status(404).json({ success: false, message: 'Seller profile not found' });

    const SellerDocument = require('../models/SellerDocument');
    const docs = await SellerDocument.findAll({ where: { sellerId: seller.id }, order: [['createdAt', 'DESC']] });

    // Return absolute URLs so the owner/admin UI can open the files directly
    const hostBase = process.env.BACKEND_PUBLIC_URL || `${req.protocol}://${req.get('host')}`;
    const data = docs.map(d => ({
      id: d.id,
      filename: d.filename,
      url: `${hostBase}${d.path}`,
      downloadUrl: `${hostBase}/api/sellers/me/documents/${d.id}/file`,
      status: d.status,
      createdAt: d.createdAt
    }));

    res.json({ success: true, data });
  } catch (error) {
    console.error('Get my documents error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch documents' });
  }
};

/**
 * Serve a seller's own document file (seller-only)
 */
exports.getMyDocumentFile = async (req, res) => {
  try {
    const seller = await getCurrentSeller(req.userId);
    if (!seller) return res.status(404).json({ success: false, message: 'Seller profile not found' });

    const { docId } = req.params;
    const SellerDocument = require('../models/SellerDocument');
    const doc = await SellerDocument.findOne({ where: { id: docId, sellerId: seller.id } });
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });

    const path = require('path');
    const fs = require('fs');
    const filePath = path.join(__dirname, '..', doc.path);
    if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, message: 'File not found on server' });

    const options = {};
    if (doc.mimeType) options.headers = { 'Content-Type': doc.mimeType };

    return res.sendFile(filePath, options, (err) => {
      if (err) {
        console.error('Error sending my document file:', err);
        if (!res.headersSent) res.status(500).json({ success: false, message: 'Failed to send file' });
      }
    });
  } catch (error) {
    console.error('Get my document file error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch document file' });
  }
};

/**
 * Upload seller documents (owner flow)
 */
exports.uploadMyDocuments = async (req, res) => {
  try {
    const seller = await getCurrentSeller(req.userId);
    if (!seller) return res.status(404).json({ success: false, message: 'Seller profile not found' });

    if (!req.files || !req.files.length) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    const SellerDocument = require('../models/SellerDocument');
    const docs = req.files.map(f => ({
      sellerId: seller.id,
      filename: f.originalname,
      path: `/uploads/sellers/${f.filename}`,
      mimeType: f.mimetype,
      status: 'pending'
    }));

    const created = await SellerDocument.bulkCreate(docs);

    // Notify admin could be added here

    res.status(201).json({ success: true, message: 'Documents uploaded successfully', data: created.map(d => ({ id: d.id, filename: d.filename, url: d.path, status: d.status })) });
  } catch (error) {
    console.error('Upload my documents error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload documents' });
  }
};

exports.updateMyShop = async (req, res) => {
  try {
    const seller = await getCurrentSeller(req.userId);
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller profile not found' });
    }

    const allowedFields = [
      'shopName',
      'shopDescription',
      'shopImage',
      'location',
      'businessRegistration',
      'responsiveness',
      'averageDeliveryTime'
    ];

    const payload = {};
    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        payload[field] = req.body[field];
      }
    }

    await seller.update(payload);

    res.json({
      success: true,
      message: 'Shop updated successfully',
      data: seller
    });
  } catch (error) {
    console.error('Update shop error:', error);
    res.status(500).json({ success: false, message: 'Failed to update shop' });
  }
};

exports.getSellerDashboard = async (req, res) => {
  try {
    const seller = await getCurrentSeller(req.userId);
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller profile not found' });
    }

    const products = await Product.findAll({ where: { sellerId: seller.id } });
    const productIds = products.map((p) => p.id);

    const whereItems = productIds.length ? { productId: { [Op.in]: productIds } } : { productId: null };
    const orderItems = await OrderItem.findAll({ where: whereItems, include: [{ model: Order }] });

    const totalProducts = products.length;
    const activeProducts = products.filter((p) => p.isActive).length;
    const lowStockProducts = products.filter((p) => p.stock <= p.reorderLevel).length;
    const totalSales = orderItems.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);
    const totalOrders = new Set(orderItems.map((item) => item.orderId)).size;
    const pendingOrders = new Set(
      orderItems
        .filter((item) => ['pending', 'confirmed', 'processing'].includes(item.Order?.status))
        .map((item) => item.orderId)
    ).size;

    res.json({
      success: true,
      data: {
        seller,
        stats: {
          totalProducts,
          activeProducts,
          lowStockProducts,
          totalSales,
          totalOrders,
          pendingOrders
        }
      }
    });
  } catch (error) {
    console.error('Get seller dashboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard data' });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const seller = await getCurrentSeller(req.userId);
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller profile not found' });
    }

    const { status, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = { sellerId: seller.id };

    const { count, rows } = await OrderItem.findAndCountAll({
      where,
      include: [
        {
          model: Order,
          where: status ? { status } : undefined,
          include: [{ model: User, attributes: ['id', 'name', 'email', 'phone'] }, { model: Delivery }]
        },
        { model: Product, attributes: ['id', 'name', 'image'] }
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
    console.error('Get seller orders error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch seller orders' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const seller = await getCurrentSeller(req.userId);
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller profile not found' });
    }

    const { orderId } = req.params;
    const { status } = req.body;

    const allowedOrderStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];
    if (!allowedOrderStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values: ${allowedOrderStatuses.join(', ')}`
      });
    }

    const sellerOrderItem = await OrderItem.findOne({ where: { orderId, sellerId: seller.id } });
    if (!sellerOrderItem) {
      return res.status(403).json({ success: false, message: 'You cannot manage this order' });
    }

    const order = await Order.findByPk(orderId, {
      include: [{ model: Delivery }]
    });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Use sync utility to update order and delivery status together
    await updateOrderStatusSync(order, status, {
      updateDeliveryDate: status === 'delivered' ? new Date() : null
    });

    res.json({ 
      success: true, 
      message: 'Order status updated successfully',
      data: {
        orderId: order.id,
        orderStatus: order.status,
        deliveryStatus: order.Delivery?.status
      }
    });
  } catch (error) {
    console.error('Update seller order status error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update order status' });
  }
};

exports.downloadInventoryInvoice = async (req, res) => {
  try {
    const seller = await getCurrentSeller(req.userId);
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller profile not found' });
    }

    const products = await Product.findAll({
      where: { sellerId: seller.id },
      order: [['category', 'ASC'], ['name', 'ASC']]
    });

    const formatCurrency = (value) => {
      const amount = Number(value || 0);
      return `KES ${amount.toLocaleString('en-KE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`;
    };

    const totalItems = products.length;
    const activeProducts = products.filter((product) => product.isActive).length;
    const lowStockProducts = products.filter((product) => Number(product.stock || 0) <= Number(product.reorderLevel || 0)).length;
    const outOfStockProducts = products.filter((product) => Number(product.stock || 0) === 0).length;
    const totalUnits = products.reduce((sum, product) => sum + Number(product.stock || 0), 0);
    const inventoryValue = products.reduce((sum, product) => sum + (Number(product.stock || 0) * Number(product.price || 0)), 0);
    const averageUnitPrice = totalItems ? products.reduce((sum, product) => sum + Number(product.price || 0), 0) / totalItems : 0;

    const filenameBase = (seller.shopName || 'inventory-invoice')
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase();
    const filename = `${filenameBase || 'inventory-invoice'}-${Date.now()}.pdf`;

    const doc = new PDFDocument({ margin: 36, size: 'A4', bufferPages: true });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));

    const left = 36;
    const right = doc.page.width - 36;
    const tableWidth = right - left;
    const lineColor = '#cbd5e1';
    const accentColor = '#d97706';

    const columns = [
      { label: 'Product', width: 160 },
      { label: 'Category', width: 72 },
      { label: 'Stock', width: 46, align: 'right' },
      { label: 'Unit Price', width: 80, align: 'right' },
      { label: 'Value', width: 86, align: 'right' },
      { label: 'Status', width: 81 }
    ];

    const columnX = [];
    let cursorX = left;
    columns.forEach((column) => {
      columnX.push(cursorX);
      cursorX += column.width;
    });

    const drawHeader = (y) => {
      doc
        .font('Helvetica-Bold')
        .fillColor(accentColor)
        .fontSize(22)
        .text('BodaZone Shop Inventory Invoice', left, y);

      doc
        .font('Helvetica')
        .fillColor('#334155')
        .fontSize(9)
        .text(`Shop: ${seller.shopName || 'N/A'}`, left, y + 28)
        .text(`Location: ${seller.location || 'N/A'}`, left, y + 40)
        .text(`Generated: ${new Date().toLocaleString()}`, left, y + 52);

      doc
        .font('Helvetica')
        .fillColor('#334155')
        .fontSize(9)
        .text(`Owner account: User ${req.userId}`, right - 170, y + 28, { width: 170, align: 'right' })
        .text(`Verification: ${seller.verificationStatus || 'pending'}`, right - 170, y + 40, { width: 170, align: 'right' });

      doc
        .moveTo(left, y + 72)
        .lineTo(right, y + 72)
        .strokeColor(lineColor)
        .stroke();

      return y + 84;
    };

    const drawSummary = (y) => {
      const boxHeight = 92;
      doc.roundedRect(left, y, tableWidth, boxHeight, 6).fillAndStroke('#fff7ed', '#fed7aa');

      doc
        .fillColor('#9a3412')
        .font('Helvetica-Bold')
        .fontSize(11)
        .text('Accounting Summary', left + 12, y + 10);

      doc
        .fillColor('#334155')
        .font('Helvetica')
        .fontSize(9)
        .text(
          'This report shows stock-on-hand and estimated inventory value using each product\'s listed unit price. It is intended for monthly reconciliation, valuation, and restocking decisions.',
          left + 12,
          y + 26,
          { width: tableWidth - 24, lineGap: 2 }
        );

      const summaryY1 = y + 56;
      const summaryY2 = y + 68;
      const summaryRows = [
        [`Products: ${totalItems}`, `Active: ${activeProducts}`, `Low stock: ${lowStockProducts}`, `Out of stock: ${outOfStockProducts}`],
        [`Units: ${totalUnits}`, `Avg price: ${formatCurrency(averageUnitPrice)}`, `Inventory value: ${formatCurrency(inventoryValue)}`]
      ];

      summaryRows.forEach((row, rowIndex) => {
        let summaryX = left + 12;
        const summaryY = rowIndex === 0 ? summaryY1 : summaryY2;
        row.forEach((item) => {
          doc
            .fillColor('#7c2d12')
            .font('Helvetica-Bold')
            .fontSize(8)
            .text(item, summaryX, summaryY);
          summaryX += doc.widthOfString(item) + 18;
        });
      });

      return y + boxHeight + 14;
    };

    const drawTableHeader = (y) => {
      doc
        .fillColor('#f8fafc')
        .rect(left, y, tableWidth, 20)
        .fill();

      doc
        .strokeColor(lineColor)
        .moveTo(left, y)
        .lineTo(right, y)
        .stroke()
        .moveTo(left, y + 20)
        .lineTo(right, y + 20)
        .stroke();

      doc.fillColor('#334155').font('Helvetica-Bold').fontSize(8);
      columns.forEach((column, index) => {
        const textOptions = column.align ? { width: column.width - 4, align: column.align } : { width: column.width - 4 };
        doc.text(column.label, columnX[index] + 2, y + 6, textOptions);
      });

      return y + 24;
    };

    const startNewPage = () => {
      doc.addPage();
      let nextY = drawHeader(36);
      nextY = drawTableHeader(nextY);
      return nextY;
    };

    const ensureSpace = (y, heightNeeded) => {
      if (y + heightNeeded < doc.page.height - 56) {
        return y;
      }

      return startNewPage();
    };

    let currentY = drawHeader(36);
    currentY = drawSummary(currentY);
    currentY = drawTableHeader(currentY);

    if (!products.length) {
      doc
        .fillColor('#475569')
        .font('Helvetica')
        .fontSize(10)
        .text('No products are currently registered for this shop.', left, currentY + 8);
    } else {
      products.forEach((product, index) => {
        const stock = Number(product.stock || 0);
        const unitPrice = Number(product.price || 0);
        const stockValue = stock * unitPrice;
        const status = stock === 0 ? 'Out of stock' : stock <= Number(product.reorderLevel || 0) ? 'Low stock' : 'In stock';

        const rowHeight = Math.max(
          24,
          doc.heightOfString(product.name || 'N/A', { width: columns[0].width - 10 }) + 10,
          doc.heightOfString(product.category || 'N/A', { width: columns[1].width - 10 }) + 10
        );

        currentY = ensureSpace(currentY, rowHeight + 10);

        const fill = index % 2 === 0 ? '#ffffff' : '#f8fafc';
        doc.fillColor(fill).rect(left, currentY, tableWidth, rowHeight).fill();

        doc.strokeColor(lineColor).moveTo(left, currentY).lineTo(right, currentY).stroke();
        doc.strokeColor(lineColor).moveTo(left, currentY + rowHeight).lineTo(right, currentY + rowHeight).stroke();

        doc.fillColor('#0f172a').font('Helvetica').fontSize(8.5);
        doc.text(product.name || 'N/A', columnX[0] + 2, currentY + 6, { width: columns[0].width - 10 });
        doc.text(product.category || 'N/A', columnX[1] + 2, currentY + 6, { width: columns[1].width - 10 });
        doc.text(String(stock), columnX[2], currentY + 6, { width: columns[2].width - 6, align: 'right' });
        doc.text(formatCurrency(unitPrice), columnX[3], currentY + 6, { width: columns[3].width - 6, align: 'right' });
        doc.text(formatCurrency(stockValue), columnX[4], currentY + 6, { width: columns[4].width - 6, align: 'right' });

        doc
          .fillColor(status === 'In stock' ? '#166534' : '#9a3412')
          .text(status, columnX[5] + 2, currentY + 6, { width: columns[5].width - 10 });

        currentY += rowHeight;
      });
    }

    const footerY = Math.max(currentY + 16, doc.page.height - 112);
    doc
      .moveTo(left, footerY)
      .lineTo(right, footerY)
      .strokeColor(lineColor)
      .stroke();

    doc
      .fillColor('#475569')
      .font('Helvetica')
      .fontSize(8)
      .text('Prepared for internal accounting, stock control, and shop record keeping.', left, footerY + 10, { width: tableWidth });

    doc
      .fontSize(7)
      .text('BodaZone inventory reports reflect live data at the time of generation.', left, footerY + 24, { width: tableWidth, align: 'center' });

    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.send(pdfBuffer);
    });

    doc.on('error', (error) => {
      console.error('Inventory invoice PDF error:', error);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'Failed to generate inventory invoice', error: error.message });
      }
    });

    doc.end();
  } catch (error) {
    console.error('Download inventory invoice error:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Failed to generate inventory invoice', error: error.message });
    }
  }
};
