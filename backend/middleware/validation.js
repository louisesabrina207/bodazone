const joi = require('joi');

// Validation middleware factory
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(err => ({
        field: err.path[0],
        message: err.message
      }));
      // Log validation failures to help debugging during development
      try {
        console.warn('Validation failed:', errors);
      } catch (e) {
        // non-fatal
      }
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    req.body = value;
    next();
  };
};

// Auth schemas
const registerSchema = joi.object({
  name: joi.string().min(2).max(100).required().trim(),
  email: joi.string().email().required().lowercase(),
  phone: joi.string().regex(/^(\+?254|0)[0-9]{9}$/).required(),
  password: joi.string().min(6).max(255).required(),
  confirmPassword: joi.string().required().valid(joi.ref('password')),
  role: joi.string().valid('rider', 'seller').default('rider')
});

const loginSchema = joi.object({
  email: joi.string().email().required().lowercase(),
  password: joi.string().required()
});

const verifyEmailSchema = joi.object({
  email: joi.string().email().required().lowercase(),
  code: joi.string().pattern(/^\d{6}$/).required()
});

const verifyTwoFactorSchema = joi.object({
  email: joi.string().email().required().lowercase(),
  code: joi.string().pattern(/^\d{6}$/).required()
});

const resendVerificationSchema = joi.object({
  email: joi.string().email().required().lowercase()
});

// Product schemas
const createProductSchema = joi.object({
  name: joi.string().min(3).max(150).required().trim(),
  category: joi.string().required(),
  description: joi.string().max(5000),
  price: joi.number().positive().required(),
  deliveryFee: joi.number().min(0).default(0),
  stock: joi.number().integer().min(0).default(0),
  reorderLevel: joi.number().integer().min(0).default(5),
  specifications: joi.object(),
  compatibility: joi.array().items(joi.string())
});

const updateProductSchema = joi.object({
  name: joi.string().min(3).max(150).trim(),
  category: joi.string(),
  description: joi.string().max(5000),
  price: joi.number().positive(),
  deliveryFee: joi.number().min(0),
  stock: joi.number().integer().min(0),
  reorderLevel: joi.number().integer().min(0),
  specifications: joi.object(),
  compatibility: joi.array().items(joi.string()),
  isActive: joi.boolean()
});

// Order schemas
const createOrderSchema = joi.object({
  items: joi.array().items(
    joi.object({
      productId: joi.number().required(),
      quantity: joi.number().integer().positive().required()
    })
  ).min(1).required(),
  shippingAddress: joi.object({
    street: joi.string(),
    address: joi.string(),
    fullName: joi.string().allow('', null),
    email: joi.string().email().allow('', null),
    phone: joi.string().allow('', null),
    city: joi.string().required(),
    county: joi.string().required(),
    zipCode: joi.string(),
    postalCode: joi.string()
  }).required(),
  paymentMethod: joi.string().valid('mpesa').default('mpesa'),
  notes: joi.string().max(500)
});

const bootstrapAdminSchema = joi.object({
  name: joi.string().min(2).max(100).required().trim(),
  email: joi.string().email().required().lowercase(),
  phone: joi.string().regex(/^(\+?254|0)[0-9]{9}$/).required(),
  password: joi.string().min(6).max(255).required(),
  secret: joi.string().required()
});

// Payment schemas
const initiatePaymentSchema = joi.object({
  orderId: joi.number().required(),
  phoneNumber: joi.string().regex(/^(\+?254|0)[0-9]{9}$/),
  phone: joi.string().regex(/^(\+?254|0)[0-9]{9}$/),
  amount: joi.number().positive()
}).or('phoneNumber', 'phone')
  .messages({
    'object.missing': 'Either phoneNumber or phone is required'
  });

// Review schemas
const createReviewSchema = joi.object({
  productId: joi.number().required(),
  orderId: joi.number().required(),
  rating: joi.number().integer().min(1).max(5).required(),
  title: joi.string().max(100),
  comment: joi.string().min(10).required(),
  quality: joi.number().integer().min(1).max(5),
  deliverySpeed: joi.number().integer().min(1).max(5),
  sellerService: joi.number().integer().min(1).max(5)
});

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  verifyTwoFactorSchema,
  resendVerificationSchema,
  createProductSchema,
  updateProductSchema,
  createOrderSchema,
  initiatePaymentSchema,
  createReviewSchema,
  bootstrapAdminSchema
};
