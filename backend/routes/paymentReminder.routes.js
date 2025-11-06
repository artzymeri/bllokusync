const express = require('express');
const router = express.Router();
const paymentReminderScheduler = require('../schedulers/paymentReminder.scheduler');
const { authenticateToken, authorizeRoles } = require('../middleware/auth.middleware');

/**
 * @route   POST /api/payment-reminders/trigger
 * @desc    Manually trigger payment reminder check (admin only)
 * @access  Admin
 */
router.post('/trigger', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    console.log('🔧 Manual trigger requested by admin');
    const result = await paymentReminderScheduler.runImmediately();
    
    res.status(200).json({
      success: true,
      message: 'Payment reminder check completed',
      data: result
    });
  } catch (error) {
    console.error('Failed to trigger payment reminder check:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger payment reminder check',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/payment-reminders/status
 * @desc    Get scheduler status (admin only)
 * @access  Admin
 */
router.get('/status', authenticateToken, authorizeRoles('admin'), (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      isRunning: paymentReminderScheduler.isRunning,
      schedule: 'Daily at 9:00 AM (Europe/Tirane timezone)',
      nextRun: 'Check server logs for next scheduled run'
    }
  });
});

module.exports = router;

