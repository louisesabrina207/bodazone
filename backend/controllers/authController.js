const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User, Seller } = require('../models');
const emailService = require('../services/emailService');
const SellerDocument = require('../models/SellerDocument');

const isStrongPassword = (pwd) => {
  if (!pwd || typeof pwd !== 'string') return false;
  // Minimum 8 chars, at least one lowercase, one uppercase, one number, one symbol
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(pwd);
};

/**
 * Generate JWT token
 */
const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

const generateVerificationCode = () => String(Math.floor(100000 + Math.random() * 900000));

const hashCode = (code) => crypto.createHash('sha256').update(String(code)).digest('hex');

const clearAuthCodeFields = async (user, fields) => {
  await user.update(fields);
};

const sendVerificationEmail = async (user) => {
  const code = generateVerificationCode();
  await user.update({
    emailVerificationCodeHash: hashCode(code),
    emailVerificationExpiresAt: new Date(Date.now() + 10 * 60 * 1000)
  });

  try {
    await emailService.sendMail({
      to: user.email,
      subject: 'Verify your BodaZone email',
      text: `Your BodaZone verification code is ${code}. It expires in 10 minutes.`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937">
          <h2 style="color:#d97706">Verify your email</h2>
          <p>Use the code below to verify your BodaZone account:</p>
          <div style="font-size:28px;font-weight:700;letter-spacing:6px;padding:16px 24px;background:#fef3c7;display:inline-block;border-radius:12px">${code}</div>
          <p style="margin-top:16px">This code expires in 10 minutes.</p>
        </div>
      `
    });
  } catch (error) {
    console.warn('[auth] Verification email failed to send, but code remains valid:', error.message);
  }

  return code;
};

const sendTwoFactorEmail = async (user) => {
  const code = generateVerificationCode();
  await user.update({
    twoFactorCodeHash: hashCode(code),
    twoFactorCodeExpiresAt: new Date(Date.now() + 10 * 60 * 1000)
  });

  try {
    await emailService.sendMail({
      to: user.email,
      subject: 'Your BodaZone two-factor code',
      text: `Your BodaZone login code is ${code}. It expires in 10 minutes.`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937">
          <h2 style="color:#d97706">Two-factor authentication</h2>
          <p>Use this code to finish signing in:</p>
          <div style="font-size:28px;font-weight:700;letter-spacing:6px;padding:16px 24px;background:#fef3c7;display:inline-block;border-radius:12px">${code}</div>
          <p style="margin-top:16px">This code expires in 10 minutes.</p>
        </div>
      `
    });
  } catch (error) {
    console.warn('[auth] Two-factor email failed to send, but code remains valid:', error.message);
  }

  return code;
};

/**
 * Register a new user
 */
exports.register = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;
    const requestedRole = role === 'seller' ? 'seller' : 'rider';

    // Password strength check
    if (!isStrongPassword(password)) {
      return res.status(400).json({ success: false, message: 'Password is too weak. Use at least 8 characters, including uppercase, lowercase, number and symbol.' });
    }

    // Check if user exists
    const existingUser = await User.findOne({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    const existingPhone = await User.findOne({
      where: { phone }
    });

    if (existingPhone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number already registered'
      });
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      phone,
      password,
      role: requestedRole,
      status: requestedRole === 'seller' ? 'pending_approval' : 'active',
      emailVerified: false,
      twoFactorEnabled: true
    });

    // If registering as seller, create seller profile
    if (requestedRole === 'seller') {
      await Seller.create({
        userId: user.id,
        shopName: `${name}'s Shop`,
        verificationStatus: 'pending'
      });
    }

    await sendVerificationEmail(user);

    res.status(201).json({
      success: true,
      message: 'Account created. Verify your email to continue.',
      data: {
        requiresEmailVerification: true,
        email: user.email,
        userId: user.id,
        role: user.role
      },
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  }
};

/**
 * Register seller with documents (multipart/form-data)
 */
exports.registerWithDocs = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!isStrongPassword(password)) {
      return res.status(400).json({ success: false, message: 'Password is too weak. Use at least 8 characters, including uppercase, lowercase, number and symbol.' });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(400).json({ success: false, message: 'Email already registered' });

    const existingPhone = await User.findOne({ where: { phone } });
    if (existingPhone) return res.status(400).json({ success: false, message: 'Phone number already registered' });

    const user = await User.create({
      name,
      email,
      phone,
      password,
      role: 'seller',
      status: 'pending_approval',
      emailVerified: false,
      twoFactorEnabled: true
    });

    const seller = await Seller.create({
      userId: user.id,
      shopName: `${name}'s Shop`,
      verificationStatus: 'pending'
    });

    // Save uploaded files as SellerDocument entries
    if (req.files && req.files.length) {
      const docs = req.files.map(f => ({
        sellerId: seller.id,
        filename: f.originalname,
        path: `/uploads/sellers/${f.filename}`,
        mimeType: f.mimetype
      }));

      await SellerDocument.bulkCreate(docs);
    }

    await sendVerificationEmail(user);

    res.status(201).json({ success: true, message: 'Seller account created. Documents uploaded for review. Verify your email to continue.', data: { userId: user.id, sellerId: seller.id } });
  } catch (error) {
    console.error('registerWithDocs error:', error);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
};

/**
 * Bootstrap first admin account using ADMIN_BOOTSTRAP_SECRET.
 */
exports.bootstrapAdmin = async (req, res) => {
  try {
    const { name, email, phone, password, secret } = req.body;

    if (!process.env.ADMIN_BOOTSTRAP_SECRET) {
      return res.status(500).json({
        success: false,
        message: 'ADMIN_BOOTSTRAP_SECRET is not configured'
      });
    }

    if (secret !== process.env.ADMIN_BOOTSTRAP_SECRET) {
      return res.status(403).json({
        success: false,
        message: 'Invalid bootstrap secret'
      });
    }

    const existingAdmin = await User.findOne({ where: { role: 'admin' } });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'An admin account already exists. Disable this route in production.'
      });
    }

    const existingUser = await User.findOne({
      where: {
        [require('sequelize').Op.or]: [{ email }, { phone }]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email or phone is already registered'
      });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({ success: false, message: 'Password is too weak. Use at least 8 characters, including uppercase, lowercase, number and symbol.' });
    }

    const admin = await User.create({
      name,
      email,
      phone,
      password,
      role: 'admin',
      status: 'active',
      phoneVerified: true,
      emailVerified: true,
      twoFactorEnabled: true
    });

    const token = generateToken(admin.id, admin.role);

    res.status(201).json({
      success: true,
      message: 'Admin account created successfully',
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        role: admin.role
      },
      token
    });
  } catch (error) {
    console.error('Admin bootstrap error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create admin account'
    });
  }
};

/**
 * Login user
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check account status
    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended'
      });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({
        success: false,
        message: 'Your account is inactive'
      });
    }

    // Allow sellers to log in even if their account is pending admin approval.
    // They will be restricted from creating products until their shop is verified
    // (see productController checks against Seller.verificationStatus).

    // Email verification only required during registration, not login
    // If email not verified, they can still login and verify later via link
    if (!user.emailVerified) {
      // Optionally send verification email if not yet verified
      try {
        await sendVerificationEmail(user);
      } catch (e) {
        console.warn('Could not send verification email on login:', e.message);
      }
      // Allow login to proceed regardless
    }

    if (user.twoFactorEnabled) {
      await sendTwoFactorEmail(user);

      return res.json({
        success: true,
        message: 'Two-factor code sent to your email',
        data: {
          requiresTwoFactor: true,
          email: user.email,
          userId: user.id
        }
      });
    }

    // Update last login
    await user.update({ lastLogin: new Date() });

    const token = generateToken(user.id, user.role);

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
};

exports.sendEmailVerification = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await sendVerificationEmail(user);

    res.json({
      success: true,
      message: 'Verification code sent to your email'
    });
  } catch (error) {
    console.error('Send email verification error:', error);
    res.status(500).json({ success: false, message: 'Failed to send verification code' });
  }
};

exports.verifyEmailCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.emailVerificationCodeHash || !user.emailVerificationExpiresAt) {
      return res.status(400).json({ success: false, message: 'No verification code is active for this account' });
    }

    if (new Date(user.emailVerificationExpiresAt).getTime() < Date.now()) {
      return res.status(400).json({ success: false, message: 'Verification code has expired' });
    }

    if (hashCode(code) !== user.emailVerificationCodeHash) {
      return res.status(400).json({ success: false, message: 'Invalid verification code' });
    }

    await clearAuthCodeFields(user, {
      emailVerified: true,
      emailVerificationCodeHash: null,
      emailVerificationExpiresAt: null
    });

    res.json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    console.error('Verify email code error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify email' });
  }
};

exports.sendTwoFactorCode = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.emailVerified) {
      return res.status(400).json({ success: false, message: 'Please verify your email first' });
    }

    await sendTwoFactorEmail(user);

    res.json({
      success: true,
      message: 'Two-factor code sent successfully'
    });
  } catch (error) {
    console.error('Send two factor error:', error);
    res.status(500).json({ success: false, message: 'Failed to send two-factor code' });
  }
};

exports.verifyTwoFactorCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.twoFactorCodeHash || !user.twoFactorCodeExpiresAt) {
      return res.status(400).json({ success: false, message: 'No two-factor code is active for this account' });
    }

    if (new Date(user.twoFactorCodeExpiresAt).getTime() < Date.now()) {
      return res.status(400).json({ success: false, message: 'Two-factor code has expired' });
    }

    if (hashCode(code) !== user.twoFactorCodeHash) {
      return res.status(400).json({ success: false, message: 'Invalid two-factor code' });
    }

    await clearAuthCodeFields(user, {
      lastLogin: new Date(),
      twoFactorCodeHash: null,
      twoFactorCodeExpiresAt: null
    });

    const token = generateToken(user.id, user.role);

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        emailVerified: user.emailVerified
      },
      token
    });
  } catch (error) {
    console.error('Verify two factor error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify two-factor code' });
  }
};

/**
 * Logout user (token-based, so mainly for frontend)
 */
exports.logout = (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful'
  });
};

/**
 * Verify phone number (placeholder)
 */
exports.verifyPhone = async (req, res) => {
  try {
    const { userId, code } = req.body;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // In a real application, verify the code
    // For now, just mark as verified
    await user.update({ phoneVerified: true });

    res.json({
      success: true,
      message: 'Phone verified successfully'
    });
  } catch (error) {
    console.error('Phone verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Verification failed'
    });
  }
};

/**
 * Get current user profile
 */
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile'
    });
  }
};

/**
 * Refresh token
 */
exports.refreshToken = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const token = generateToken(user.id, user.role);

    res.json({
      success: true,
      message: 'Token refreshed',
      token
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Token refresh failed'
    });
  }
};

module.exports = exports;
