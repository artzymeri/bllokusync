const pushNotificationService = require('../services/pushNotification.service');

/**
 * Test endpoint to send a push notification
 * Only for development/testing purposes
 */
exports.sendTestNotification = async (req, res) => {
  try {
    const userId = req.user.id; // Get from authenticated user
    const { title, body, data } = req.body;

    const result = await pushNotificationService.sendToUsers(
      [userId],
      title || '🔔 Test Notification',
      body || 'This is a test push notification from BllokuSync',
      data || { type: 'test' }
    );

    res.json({
      success: true,
      message: 'Test notification sent',
      data: result
    });
  } catch (error) {
    console.error('Test notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending test notification',
      error: error.message
    });
  }
};

/**
 * Test endpoint to send payment confirmation notification
 */
exports.sendTestPaymentConfirmation = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pushNotificationService.sendPaymentConfirmation(
      userId,
      '2024-11-01', // month
      350, // amount
      'Test Property', // property name
      '2024-11-06' // payment date
    );

    res.json({
      success: true,
      message: 'Test payment confirmation sent',
      data: result
    });
  } catch (error) {
    console.error('Test payment confirmation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending test payment confirmation',
      error: error.message
    });
  }
};

