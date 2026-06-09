const express = require('express');
const { 
  register, 
  bootstrapAdmin,
  login, 
  logout, 
  verifyPhone, 
  sendEmailVerification,
  verifyEmailCode,
  sendTwoFactorCode,
  verifyTwoFactorCode,
  getCurrentUser,
  refreshToken 
} = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validate, registerSchema, loginSchema, bootstrapAdminSchema, verifyEmailSchema, verifyTwoFactorSchema, resendVerificationSchema } = require('../middleware/validation');

const router = express.Router();

// Multer for seller document uploads
const uploadDocs = require('../middleware/uploadDocs');

/**
 * POST /api/auth/register
 * Register a new user (rider or seller)
 */
router.post('/register', validate(registerSchema), register);

/**
 * POST /api/auth/register-seller
 * Accepts multipart/form-data with seller documents in `documents` field
 */
router.post('/register-seller', uploadDocs.array('documents', 6), (req, res) => {
  return require('../controllers/authController').registerWithDocs(req, res);
});

/**
 * POST /api/auth/bootstrap-admin
 * Create first admin account (one-time, secret protected)
 */
router.post('/bootstrap-admin', validate(bootstrapAdminSchema), bootstrapAdmin);

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post('/login', validate(loginSchema), login);

/**
 * POST /api/auth/send-email-verification
 * Send a verification code to the user's email
 */
router.post('/send-email-verification', validate(resendVerificationSchema), sendEmailVerification);

/**
 * POST /api/auth/verify-email
 * Verify the user's email with a code
 */
router.post('/verify-email', validate(verifyEmailSchema), verifyEmailCode);

/**
 * POST /api/auth/send-two-factor-code
 * Send a 2FA code to the user's email
 */
router.post('/send-two-factor-code', validate(resendVerificationSchema), sendTwoFactorCode);

/**
 * POST /api/auth/verify-two-factor
 * Verify the user's 2FA code and issue the login token
 */
router.post('/verify-two-factor', validate(verifyTwoFactorSchema), verifyTwoFactorCode);

/**
 * GET /api/auth/logout
 * Logout current user
 */
router.get('/logout', authenticate, logout);

/**
 * POST /api/auth/verify-phone
 * Verify phone number with OTP code
 */
router.post('/verify-phone', authenticate, verifyPhone);

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', authenticate, getCurrentUser);

/**
 * POST /api/auth/refresh-token
 * Refresh JWT token
 */
router.post('/refresh-token', authenticate, refreshToken);

module.exports = router;
