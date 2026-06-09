const { Product, Seller, Review, User, sequelize } = require('../models');
const { Op } = require('sequelize');

const normalizeProductImages = (product) => {
  if (!product) return product;

  const plainProduct = typeof product.get === 'function' ? product.get({ plain: true }) : { ...product };
  let images = plainProduct.images;

  if (typeof images === 'string') {
    try {
      images = JSON.parse(images);
    } catch {
      images = [];
    }
  }

  if (!Array.isArray(images)) {
    images = [];
  }

  const primaryImage = plainProduct.image || images[0] || null;

  return {
    ...plainProduct,
    image: primaryImage,
    images
  };
};

const normalizeProductList = (products) => products.map(normalizeProductImages);

/**
 * Get all products with filters
 */
exports.getProducts = async (req, res) => {
  try {
    const { 
      category, 
      search, 
      minPrice, 
      maxPrice, 
      page = 1, 
      limit = 30,
      sort = '-createdAt',
      sellerId 
    } = req.query;

    const where = { isActive: true };
    if (category) where.category = category;
    if (sellerId) where.sellerId = sellerId;
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Op.gte] = parseFloat(minPrice);
      if (maxPrice) where.price[Op.lte] = parseFloat(maxPrice);
    }

    const offset = (page - 1) * limit;
    const { count, rows } = await Product.findAndCountAll({
      where,
      include: [
        {
          model: Seller,
          where: { verificationStatus: 'verified', isActive: true },
          required: true,
          attributes: ['id', 'shopName', 'rating']
        }
      ],
      order: [[sort.replace('-', ''), sort.startsWith('-') ? 'DESC' : 'ASC']],
      limit: parseInt(limit),
      offset,
      distinct: true
    });

    res.json({
      success: true,
      data: normalizeProductList(rows),
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products'
    });
  }
};

/**
 * Get single product
 */
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id, {
      include: [
        {
          model: Seller,
          where: { verificationStatus: 'verified', isActive: true },
          required: true,
          attributes: ['id', 'shopName', 'location', 'rating', 'averageDeliveryTime']
        },
        {
          model: Review,
          attributes: ['id', 'rating', 'title', 'comment', 'createdAt'],
          include: [
            {
              model: User,
              attributes: ['name']
            }
          ],
          limit: 5,
          order: [['createdAt', 'DESC']]
        }
      ]
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: normalizeProductImages(product)
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product'
    });
  }
};

/**
 * Create product (seller only)
 */
exports.createProduct = async (req, res) => {
  try {
    const { name, category, description, price, deliveryFee, stock, specifications, compatibility } = req.body;

    // Check if user is a seller
    const seller = await Seller.findOne({ where: { userId: req.userId } });
    if (!seller) {
      return res.status(403).json({
        success: false,
        message: 'Only sellers can create products'
      });
    }

    if (seller.verificationStatus !== 'verified' || !seller.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your shop must be verified before you can create products'
      });
    }

    const product = await Product.create({
      sellerId: seller.id,
      name,
      category,
      description,
      price: parseFloat(price),
      deliveryFee: Number.isFinite(Number(deliveryFee)) ? Math.max(0, Number(deliveryFee)) : 0,
      stock: parseInt(stock) || 0,
      specifications,
      compatibility
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: normalizeProductImages(product)
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create product'
    });
  }
};

/**
 * Update product (seller only)
 */
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const seller = await Seller.findOne({ where: { userId: req.userId } });
    if (!seller || product.sellerId !== seller.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this product'
      });
    }

    if (seller.verificationStatus !== 'verified' || !seller.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your shop must be verified before you can update products'
      });
    }

    const updates = { ...req.body };
    if (updates.deliveryFee !== undefined) {
      updates.deliveryFee = Number.isFinite(Number(updates.deliveryFee)) ? Math.max(0, Number(updates.deliveryFee)) : 0;
    }

    await product.update(updates);

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: normalizeProductImages(product)
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product'
    });
  }
};

/**
 * Delete product (seller only)
 */
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const seller = await Seller.findOne({ where: { userId: req.userId } });
    if (!seller || product.sellerId !== seller.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this product'
      });
    }

    if (seller.verificationStatus !== 'verified' || !seller.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your shop must be verified before you can delete products'
      });
    }

    await product.destroy();

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product'
    });
  }
};

/**
 * Get seller products
 */
exports.getSellerProducts = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const offset = (page - 1) * limit;

    const { count, rows } = await Product.findAndCountAll({
      where: { sellerId: id, isActive: true },
      limit: parseInt(limit),
      offset,
      distinct: true
    });

    res.json({
      success: true,
      data: normalizeProductList(rows),
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get seller products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch seller products'
    });
  }
};

exports.getMyProducts = async (req, res) => {
  try {
    const seller = await Seller.findOne({ where: { userId: req.userId } });
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller profile not found'
      });
    }

    // For the seller's own dashboard, return ALL products without pagination
    const rows = await Product.findAll({
      where: { sellerId: seller.id, isActive: true },
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: normalizeProductList(rows),
      pagination: {
        total: rows.length,
        page: 1,
        pages: 1
      }
    });
  } catch (error) {
    console.error('Get my products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch seller products'
    });
  }
};

/**
 * Upload product images
 */
exports.uploadProductImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No images provided'
      });
    }

    const { productId } = req.params;
    const product = await Product.findByPk(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Verify seller ownership
    const seller = await Seller.findOne({ where: { userId: req.userId } });
    if (!seller || product.sellerId !== seller.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to upload images for this product'
      });
    }

    if (seller.verificationStatus !== 'verified' || !seller.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your shop must be verified before you can upload product images'
      });
    }

    // Generate image URLs (in production, would upload to S3/CDN)
    const imageUrls = req.files.map(file => `/uploads/${file.filename}`);
    
    // Update product with new images
    const currentImages = product.images || [];
    const updatedImages = [...currentImages, ...imageUrls];
    
    // Set primary image if not set
    if (!product.image || product.image === '') {
      product.image = imageUrls[0];
    }

    await product.update({
      image: product.image,
      images: updatedImages
    });

    res.json({
      success: true,
      message: 'Images uploaded successfully',
      data: {
        productId: product.id,
        images: normalizeProductImages(product).images,
        primaryImage: normalizeProductImages(product).image
      }
    });
  } catch (error) {
    console.error('Upload images error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload images'
    });
  }
};

/**
 * Get all categories
 */
exports.getCategories = async (req, res) => {
  try {
    const categories = [
      'tires',
      'brakes',
      'engines',
      'batteries',
      'lights',
      'suspension',
      'exhaust',
      'chain',
      'sprockets',
      'clutch',
      'oil',
      'filters',
      'spark_plugs',
      'mirrors',
      'seats',
      'helmets',
      'accessories',
      'other'
    ];

    // Get product count per category
    // sequelize.query returns [results, metadata] even with raw: true
    // Note: Use snake_case for column names because sequelize config has underscored: true
    const [categoryCounts] = await sequelize.query(
      'SELECT category, COUNT(*) as count FROM products WHERE is_active = true GROUP BY category',
      { raw: true }
    );

    const categoryData = categories.map(cat => {
      const countObj = categoryCounts.find(c => c.category === cat);
      return {
        name: cat,
        displayName: cat
          .replace(/_/g, ' ')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' '),
        count: countObj ? countObj.count : 0
      };
    });

    res.json({
      success: true,
      data: categoryData
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories'
    });
  }
};

/**
 * Get all shops/sellers
 */
exports.getAllShops = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', verificationStatus } = req.query;
    const offset = (page - 1) * limit;

    const where = { isActive: true, verificationStatus: verificationStatus && verificationStatus !== 'all' ? verificationStatus : 'verified' };
    if (search) {
      where[Op.or] = [
        { shopName: { [Op.like]: `%${search}%` } },
        { location: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Seller.findAndCountAll({
      where,
      include: [
        {
          model: User,
          attributes: ['name', 'email']
        },
        {
          model: Product,
          attributes: ['id'],
          where: { isActive: true },
          required: false
        }
      ],
      limit: parseInt(limit),
      offset,
      distinct: true,
      order: [['rating', 'DESC']]
    });

    const shopsWithProductCount = rows.map(shop => ({
      id: shop.id,
      shopName: shop.shopName,
      shopDescription: shop.shopDescription,
      shopImage: shop.shopImage,
      location: shop.location,
      rating: shop.rating,
      verificationStatus: shop.verificationStatus,
      responsiveness: shop.responsiveness,
      averageDeliveryTime: shop.averageDeliveryTime,
      productCount: shop.Products ? shop.Products.length : 0,
      ownerName: shop.User?.name,
      ownerEmail: shop.User?.email
    }));

    res.json({
      success: true,
      data: shopsWithProductCount,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get shops error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shops'
    });
  }
};

module.exports = exports;
