const { Expo } = require('expo-server-sdk');
const db = require('../models');

class PushNotificationService {
  constructor() {
    // Create a new Expo SDK client
    this.expo = new Expo();
  }

  /**
   * Send push notification to specific users
   */
  async sendToUsers(userIds, title, body, data = {}) {
    try {
      // Get all active push tokens for these users
      const pushTokens = await db.PushToken.findAll({
        where: {
          user_id: userIds,
          is_active: true
        }
      });

      if (pushTokens.length === 0) {
        console.log('No active push tokens found for users:', userIds);
        return { success: true, sent: 0 };
      }

      const messages = [];
      
      for (const tokenRecord of pushTokens) {
        // Check that the token is a valid Expo push token
        if (!Expo.isExpoPushToken(tokenRecord.push_token)) {
          console.error(`Push token ${tokenRecord.push_token} is not a valid Expo push token`);
          continue;
        }

        messages.push({
          to: tokenRecord.push_token,
          sound: 'default',
          title: title,
          body: body,
          data: data,
          priority: 'high',
          channelId: data.type === 'payment_confirmation' ? 'payment_confirmations' : 
                     data.type === 'payment_reminder' ? 'payment_reminders' : 'default',
          badge: 1,
        });
      }

      // Send notifications in chunks (Expo recommends batching)
      const chunks = this.expo.chunkPushNotifications(messages);
      const tickets = [];

      for (const chunk of chunks) {
        try {
          const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          console.error('Error sending push notification chunk:', error);
        }
      }

      console.log(`✅ Sent ${messages.length} push notifications`);
      return { success: true, sent: messages.length, tickets };

    } catch (error) {
      console.error('Error sending push notifications:', error);
      throw error;
    }
  }

  /**
   * Send payment reminder notification
   */
  async sendPaymentReminder(userId, monthName, amount, propertyName) {
    return await this.sendToUsers(
      [userId],
      '🔔 Kujtesë Pagese',
      `Pagesa juaj për ${monthName} (€${amount}) në ${propertyName} po afron. Ju lutemi sigurohuni që të paguani në kohë.`,
      {
        type: 'payment_reminder',
        month: monthName,
        amount: amount,
        property: propertyName
      }
    );
  }

  /**
   * Send payment confirmation notification
   */
  async sendPaymentConfirmation(userId, monthName, amount, propertyName, paymentDate) {
    return await this.sendToUsers(
      [userId],
      '✅ Pagesa e Konfirmuar',
      `Faleminderit! Pagesa juaj për ${monthName} (€${amount}) është pranuar dhe konfirmuar.`,
      {
        type: 'payment_confirmation',
        month: monthName,
        amount: amount,
        property: propertyName,
        paymentDate: paymentDate
      }
    );
  }

  /**
   * Send complaint/report status update notification
   */
  async sendStatusUpdate(userId, type, status, title) {
    const typeText = type === 'complaint' ? 'Ankesa' : type === 'report' ? 'Raporti' : 'Sugjerimi';
    const statusText = status === 'resolved' ? 'u zgjidh' : status === 'in_progress' ? 'është në proces' : 'u përditësua';
    
    return await this.sendToUsers(
      [userId],
      `📋 ${typeText} u Përditësua`,
      `${typeText} juaj "${title}" ${statusText}.`,
      {
        type: 'status_update',
        itemType: type,
        status: status
      }
    );
  }

  /**
   * Send new monthly report notification
   */
  async sendMonthlyReportNotification(userIds, monthName, propertyName) {
    return await this.sendToUsers(
      userIds,
      '📊 Raport i Ri Mujor',
      `Raporti mujor për ${monthName} në ${propertyName} është gati për t'u parë.`,
      {
        type: 'monthly_report',
        month: monthName,
        property: propertyName
      }
    );
  }

  /**
   * Send welcome notification to new user
   */
  async sendWelcomeNotification(userId, userName) {
    return await this.sendToUsers(
      [userId],
      '👋 Mirë se erdhe në BllokuSync!',
      `Përshëndetje ${userName}! Llogaria juaj është miratuar dhe jeni gati të filloni.`,
      {
        type: 'welcome'
      }
    );
  }

  /**
   * Check notification receipts (to see if they were delivered)
   */
  async checkReceipts(tickets) {
    const receiptIds = tickets
      .filter(ticket => ticket.id)
      .map(ticket => ticket.id);

    if (receiptIds.length === 0) {
      return [];
    }

    const receiptIdChunks = this.expo.chunkPushNotificationReceiptIds(receiptIds);
    const receipts = [];

    for (const chunk of receiptIdChunks) {
      try {
        const receiptChunk = await this.expo.getPushNotificationReceiptsAsync(chunk);
        receipts.push(receiptChunk);

        // Check for errors
        for (const receiptId in receiptChunk) {
          const receipt = receiptChunk[receiptId];
          
          if (receipt.status === 'error') {
            console.error(`Error in receipt ${receiptId}:`, receipt.message);
            
            // Handle specific errors (like DeviceNotRegistered)
            if (receipt.details && receipt.details.error === 'DeviceNotRegistered') {
              // TODO: Remove this push token from database
              console.log('Device not registered, should remove token');
            }
          }
        }
      } catch (error) {
        console.error('Error fetching receipts:', error);
      }
    }

    return receipts;
  }

  /**
   * Clean up invalid/expired tokens
   */
  async cleanupInvalidTokens() {
    // This should be called periodically to remove tokens that are no longer valid
    // You can implement this based on receipt errors
    console.log('Cleaning up invalid push tokens...');
  }
}

module.exports = new PushNotificationService();
