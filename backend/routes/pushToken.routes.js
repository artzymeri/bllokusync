const express = require('express');
const router = express.Router();
const db = require('../models');
const { authenticateToken } = require('../middleware/auth.middleware');
const pushNotificationController = require('../controllers/pushNotification.controller');

/**
 * @route   POST /api/push-tokens
 * @desc    Register push token for current user
 * @access  Private
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { push_token, device_type } = req.body;
    const userId = req.user.id;

    if (!push_token || !device_type) {
      return res.status(400).json({
        success: false,
        message: 'Push token and device type are required'
      });
    }

    // Check if token already exists
    const existingToken = await db.PushToken.findOne({
      where: { push_token }
    });

    if (existingToken) {
      // Update existing token
      await existingToken.update({
        user_id: userId,
        device_type,
        is_active: true,
        last_used_at: new Date()
      });

      return res.status(200).json({
        success: true,
        message: 'Push token updated',
        data: existingToken
      });
    }

    // Create new token
    const newToken = await db.PushToken.create({
      user_id: userId,
      push_token,
      device_type,
      is_active: true,
      last_used_at: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Push token registered',
      data: newToken
    });
  } catch (error) {
    console.error('Error registering push token:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering push token',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/push-tokens
 * @desc    Remove push token for current user
 * @access  Private
 */
router.delete('/', authenticateToken, async (req, res) => {
  try {
    const { push_token } = req.body;
    const userId = req.user.id;

    if (!push_token) {
      return res.status(400).json({
        success: false,
        message: 'Push token is required'
      });
    }

    const token = await db.PushToken.findOne({
      where: {
        push_token,
        user_id: userId
      }
    });

    if (!token) {
      return res.status(404).json({
        success: false,
        message: 'Push token not found'
      });
    }

    await token.destroy();

    res.status(200).json({
      success: true,
      message: 'Push token removed'
    });
  } catch (error) {
    console.error('Error removing push token:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing push token',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/push-tokens/my-tokens
 * @desc    Get all push tokens for current user
 * @access  Private
 */
router.get('/my-tokens', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const tokens = await db.PushToken.findAll({
      where: { user_id: userId },
      order: [['last_used_at', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: tokens
    });
  } catch (error) {
    console.error('Error fetching push tokens:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching push tokens',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/push-tokens/test
 * @desc    Send a test push notification to current user
 * @access  Private (for testing only)
 */
router.post('/test', authenticateToken, pushNotificationController.sendTestNotification);

/**
 * @route   POST /api/push-tokens/test-payment
 * @desc    Send a test payment confirmation notification to current user
 * @access  Private (for testing only)
 */
router.post('/test-payment', authenticateToken, pushNotificationController.sendTestPaymentConfirmation);

module.exports = router;
