const express = require('express');
const { authenticate } = require('../middleware/auth');
const { getProfile, updateProfile } = require('../controllers/userController');

const router = express.Router();

/**
 * GET /api/users/profile
 * Get user profile
 */
router.get('/profile', authenticate, (req, res) => {
  return getProfile(req, res);
});

/**
 * PUT /api/users/profile
 * Update user profile
 */
router.put('/profile', authenticate, (req, res) => {
  return updateProfile(req, res);
});

module.exports = router;
