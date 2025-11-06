const cron = require('node-cron');
const PaymentReminderService = require('../services/paymentReminder.service');

class PaymentReminderScheduler {
  constructor() {
    this.reminderService = new PaymentReminderService();
    this.isRunning = false;
  }

  /**
   * Start the scheduler
   * Runs every day at 9:00 AM
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️  Payment reminder scheduler is already running');
      return;
    }

    console.log('🚀 Starting payment reminder scheduler...');
    console.log('📅 Schedule: Daily at 9:00 AM');

    // Schedule to run every day at 9:00 AM
    // Format: minute hour day month weekday
    this.job = cron.schedule('0 9 * * *', async () => {
      console.log('\n⏰ [Scheduled Task] Payment reminder check triggered');
      try {
        await this.reminderService.checkAndSendReminders();
      } catch (error) {
        console.error('❌ [Scheduled Task] Failed to run payment reminder check:', error);
      }
    }, {
      scheduled: true,
      timezone: "Europe/Tirane" // Albania timezone
    });

    this.isRunning = true;
    console.log('✅ Payment reminder scheduler started successfully\n');

    // Optional: Run immediately on startup for testing (comment out in production)
    // this.runImmediately();
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (this.job) {
      this.job.stop();
      this.isRunning = false;
      console.log('🛑 Payment reminder scheduler stopped');
    }
  }

  /**
   * Run the check immediately (useful for testing)
   */
  async runImmediately() {
    console.log('\n🔧 [Manual Trigger] Running payment reminder check immediately...');
    try {
      const result = await this.reminderService.checkAndSendReminders();
      console.log('✅ Manual check completed:', result);
      return result;
    } catch (error) {
      console.error('❌ Manual check failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
const scheduler = new PaymentReminderScheduler();
module.exports = scheduler;

