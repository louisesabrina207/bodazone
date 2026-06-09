const express = require('express');
const { 
  getProducts, 
  getProductById, 
  createProduct, 
  updateProduct, 
  deleteProduct,
  getSellerProducts,
  getMyProducts,
  uploadProductImages,
  getCategories,
  getAllShops
} = require('../controllers/productController');
const { authenticate, authorize, isSeller } = require('../middleware/auth');
const { validate, createProductSchema, updateProductSchema } = require('../middleware/validation');

const router = express.Router();

/**
 * GET /api/products
 * Get all products with search and filter
 */
router.get('/', getProducts);

/**
 * GET /api/products/categories
 * Get all available categories
 */
router.get('/categories', getCategories);

/**
 * GET /api/products/shops/all
 * Get all available shops
 */
router.get('/shops/all', getAllShops);

/**
 * GET /api/products/seller/me
 * Get products for the authenticated seller
 */
router.get('/seller/me', authenticate, isSeller, getMyProducts);

/**
 * GET /api/products/seller/:id
 * Get products by seller
 */
router.get('/seller/:id', getSellerProducts);

/**
 * GET /api/products/:id
 * Get single product details
 */
router.get('/:id', getProductById);

/**
 * POST /api/products
 * Create new product (seller only)
 */
router.post('/', 
  authenticate, 
  isSeller, 
  validate(createProductSchema), 
  createProduct
);

/**
 * POST /api/products/:productId/images
 * Upload product images (seller only)
 */
router.post('/:productId/images',
  authenticate,
  isSeller,
  (req, res, next) => {
    const upload = req.app.locals.upload;
    upload.array('images', 5)(req, res, next);
  },
  uploadProductImages
);

/**
 * PUT /api/products/:id
 * Update product (seller only)
 */
router.put('/:id', 
  authenticate, 
  isSeller, 
  validate(updateProductSchema), 
  updateProduct
);

/**
 * DELETE /api/products/:id
 * Delete product (seller only)
 */
router.delete('/:id', 
  authenticate, 
  isSeller, 
  deleteProduct
);

module.exports = router;
