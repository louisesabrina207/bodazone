const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Verify JWT token
exports.authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    req.userRole = decoded.role;
    
    const user = await User.findByPk(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired'
      });
    }
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// Authorize specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }
    next();
  };
};

// Verify user is admin
exports.isAdmin = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Only administrators can access this resource'
    });
  }
  next();
};

// Verify user is seller
exports.isSeller = (req, res, next) => {
  if (req.userRole !== 'seller') {
    return res.status(403).json({
      success: false,
      message: 'Only sellers can access this resource'
    });
  }
  next();
};

// Verify user is rider
exports.isRider = (req, res, next) => {
  if (req.userRole !== 'rider') {
    return res.status(403).json({
      success: false,
      message: 'Only riders can access this resource'
    });
  }
  next();
};

// Optional authentication (doesn't fail if no token)
exports.optionalAuth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = decoded.id;
      req.userRole = decoded.role;
    }
  } catch (err) {
    // Silently fail - user is not authenticated but can continue
  }
  next();
};

module.exports = exports;
