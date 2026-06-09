require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('express-async-errors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { sequelize, Sequelize } = require('./config/database');

const ensureSchemaCompatibility = async () => {
  const queryInterface = sequelize.getQueryInterface();
  let createdDeliveryFeeColumn = false;
  let createdPaymentMessageColumn = false;
  let createdUserAuthColumns = false;

  try {
    const usersTable = await queryInterface.describeTable('users');
    if (!usersTable.email_verified) {
      await queryInterface.addColumn('users', 'email_verified', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
      createdUserAuthColumns = true;
    }
    if (!usersTable.two_factor_enabled) {
      await queryInterface.addColumn('users', 'two_factor_enabled', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      });
      createdUserAuthColumns = true;
    }
    if (!usersTable.email_verification_code_hash) {
      await queryInterface.addColumn('users', 'email_verification_code_hash', {
        type: Sequelize.STRING(255),
        allowNull: true
      });
      createdUserAuthColumns = true;
    }
    if (!usersTable.email_verification_expires_at) {
      await queryInterface.addColumn('users', 'email_verification_expires_at', {
        type: Sequelize.DATE,
        allowNull: true
      });
      createdUserAuthColumns = true;
    }
    if (!usersTable.two_factor_code_hash) {
      await queryInterface.addColumn('users', 'two_factor_code_hash', {
        type: Sequelize.STRING(255),
        allowNull: true
      });
      createdUserAuthColumns = true;
    }
    if (!usersTable.two_factor_code_expires_at) {
      await queryInterface.addColumn('users', 'two_factor_code_expires_at', {
        type: Sequelize.DATE,
        allowNull: true
      });
      createdUserAuthColumns = true;
    }

    const productsTable = await queryInterface.describeTable('products');
    if (!productsTable.delivery_fee) {
      await queryInterface.addColumn('products', 'delivery_fee', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      });
      console.log('Schema compatibility patch applied: added products.delivery_fee');
      createdDeliveryFeeColumn = true;
    }

    if (createdDeliveryFeeColumn) {
      await sequelize.query('UPDATE products SET delivery_fee = 0');
      console.log('Schema compatibility patch applied: normalized existing products delivery_fee to 0');
    } else {
      await sequelize.query('UPDATE products SET delivery_fee = 0 WHERE delivery_fee IS NULL');
    }

    const paymentsTable = await queryInterface.describeTable('payments');
    if (!paymentsTable.transaction_message) {
      await queryInterface.addColumn('payments', 'transaction_message', {
        type: Sequelize.TEXT,
        allowNull: true
      });
      createdPaymentMessageColumn = true;
    }

    if (createdUserAuthColumns) {
      console.log('Schema compatibility patch applied: added user auth verification columns');
    }
    if (createdPaymentMessageColumn) {
      console.log('Schema compatibility patch applied: added payments.transaction_message');
    }
  } catch (err) {
    console.error('Schema compatibility patch failed for products.delivery_fee:', err.message);
    throw err;
  }
};

// Multer configuration for file uploads
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const receiptRoutes = require('./routes/receiptRoutes');
const adminRoutes = require('./routes/adminRoutes');
const sellerRoutes = require('./routes/sellerRoutes');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const { authenticate } = require('./middleware/auth');

const app = express();

// Export multer for use in routes
app.locals.upload = upload;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Body parser middleware
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ limit: '10kb', extended: true }));

// Logging middleware
app.use(morgan('combined'));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/sellers', sellerRoutes);

// Welcome endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'BodaZone API - Motorbike Spare Parts E-Commerce Platform',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      products: '/api/products',
      orders: '/api/orders',
      payments: '/api/payments',
      deliveries: '/api/deliveries',
      reviews: '/api/reviews',
      admin: '/api/admin',
      sellers: '/api/sellers'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Start server only when this file is run directly.
if (require.main === module) {
  const shouldAlterSchema = process.env.DB_SYNC_ALTER === 'true';
  sequelize.sync({ alter: shouldAlterSchema })
    .then(async () => {
      await ensureSchemaCompatibility();
      console.log('Database synchronized successfully');
      console.log(`Schema alter mode: ${shouldAlterSchema ? 'enabled' : 'disabled'}`);

      app.listen(PORT, () => {
        console.log(`BodaZone API running on port ${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`API URL: http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.error('Database synchronization failed:', err);
      process.exit(1);
    });

  process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
    process.exit(1);
  });

  process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    process.exit(0);
  });
}

module.exports = app;
