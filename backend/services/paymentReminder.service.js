const db = require('../models');
const { Op } = require('sequelize');
const emailService = require('./email.service');
const pushNotificationService = require('./pushNotification.service');
const { Resend } = require('resend');

class PaymentReminderService {
  constructor() {
    this.emailService = emailService; // Use the singleton instance
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  /**
   * Calculate the reminder date (3 days before notice_day)
   * Takes into account the number of days in the month
   */
  calculateReminderDate(noticeDay, year, month) {
    // Get the last day of the previous month
    const lastDayOfPrevMonth = new Date(year, month, 0).getDate();
    
    // Calculate 3 days before notice_day
    let reminderDay = noticeDay - 3;
    
    // If reminderDay is <= 0, it means we need to go back to previous month
    if (reminderDay <= 0) {
      reminderDay = lastDayOfPrevMonth + reminderDay;
      // Return previous month's date
      const prevMonth = month - 1;
      const prevYear = prevMonth === 0 ? year - 1 : year;
      const actualMonth = prevMonth === 0 ? 12 : prevMonth;
      return new Date(prevYear, actualMonth - 1, reminderDay);
    }
    
    return new Date(year, month - 1, reminderDay);
  }

  /**
   * Check if today is the reminder date for a tenant
   */
  isReminderDate(noticeDay) {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1; // JavaScript months are 0-indexed
    const currentDay = today.getDate();
    
    // Determine which month's payment we're checking for
    // If we haven't reached the notice_day yet this month, we're checking current month
    // If we've passed the notice_day, we're checking next month
    let targetMonth, targetYear;
    
    if (currentDay >= noticeDay) {
      // We've passed this month's notice day, so check for next month
      targetMonth = currentMonth === 12 ? 1 : currentMonth + 1;
      targetYear = currentMonth === 12 ? currentYear + 1 : currentYear;
    } else {
      // We haven't reached this month's notice day yet, so check for current month
      targetMonth = currentMonth;
      targetYear = currentYear;
    }
    
    // Calculate the reminder date (3 days before notice_day for the target month)
    const reminderDate = this.calculateReminderDate(noticeDay, targetYear, targetMonth);
    
    // Check if today matches the reminder date
    return (
      reminderDate.getDate() === currentDay &&
      reminderDate.getMonth() === today.getMonth() &&
      reminderDate.getFullYear() === currentYear
    );
  }

  /**
   * Get the payment month we're checking (current or next month based on notice_day)
   */
  getPaymentMonthToCheck(noticeDay) {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    const currentDay = today.getDate();
    
    let targetMonth, targetYear;
    
    if (currentDay >= noticeDay) {
      // We've passed this month's notice day, check for next month's payment
      targetMonth = currentMonth === 12 ? 1 : currentMonth + 1;
      targetYear = currentMonth === 12 ? currentYear + 1 : currentYear;
    } else {
      // We haven't reached this month's notice day yet, check current month's payment
      targetMonth = currentMonth;
      targetYear = currentYear;
    }
    
    // Return first day of target month in YYYY-MM-DD format
    return `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
  }

  /**
   * Check all tenants and send reminders if needed
   */
  async checkAndSendReminders() {
    console.log('\n🔔 [Payment Reminder Service] Starting daily check...');
    console.log(`📅 Current date: ${new Date().toISOString().split('T')[0]}`);
    
    try {
      // Get all tenants with their payment information
      const tenants = await db.User.findAll({
        where: {
          role: 'tenant',
          notice_day: { [Op.not]: null }
        },
        attributes: ['id', 'name', 'surname', 'email', 'notice_day', 'monthly_rate', 'property_ids']
      });

      console.log(`👥 Found ${tenants.length} tenants to check`);

      let remindersSent = 0;
      let tenantsChecked = 0;

      for (const tenant of tenants) {
        tenantsChecked++;
        
        // Check if today is the reminder date for this tenant
        if (!this.isReminderDate(tenant.notice_day)) {
          console.log(`  ⏭️  Tenant ${tenant.name} ${tenant.surname} (notice_day: ${tenant.notice_day}) - Not reminder date today`);
          continue;
        }

        // Get the payment month to check for this specific tenant
        const paymentMonthToCheck = this.getPaymentMonthToCheck(tenant.notice_day);
        console.log(`  🔍 Checking tenant: ${tenant.name} ${tenant.surname} (notice_day: ${tenant.notice_day}, checking: ${paymentMonthToCheck})`);

        // Check each property the tenant is assigned to
        const propertyIds = tenant.property_ids || [];
        
        for (const propertyId of propertyIds) {
          // Check if payment exists for the target month
          const payment = await db.TenantPayment.findOne({
            where: {
              tenant_id: tenant.id,
              property_id: propertyId,
              payment_month: paymentMonthToCheck
            }
          });

          // If no payment record or payment is not paid, send reminder
          if (!payment || payment.status !== 'paid') {
            console.log(`  📧 Sending reminder to ${tenant.email} for property ${propertyId}`);
            
            // Get property details
            const property = await db.Property.findByPk(propertyId);
            
            await this.sendPaymentReminderEmail(tenant, property, paymentMonthToCheck);
            remindersSent++;
          } else {
            console.log(`  ✅ Payment already made for ${tenant.name} ${tenant.surname} - property ${propertyId}`);
          }
        }
      }

      console.log(`\n✅ [Payment Reminder Service] Check completed`);
      console.log(`   Tenants checked: ${tenantsChecked}`);
      console.log(`   Reminders sent: ${remindersSent}\n`);

      return {
        success: true,
        tenantsChecked,
        remindersSent,
        checkDate: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ [Payment Reminder Service] Error:', error);
      throw error;
    }
  }

  /**
   * Send payment reminder email and push notification to tenant
   */
  async sendPaymentReminderEmail(tenant, property, paymentMonth) {
    try {
      const recipientEmail = this.emailService.getRecipientEmail(tenant.email);
      const isRedirected = recipientEmail !== tenant.email;

      // Format payment month for display (e.g., "July 2025")
      const monthDate = new Date(paymentMonth);
      const monthName = monthDate.toLocaleDateString('sq-AL', { month: 'long', year: 'numeric' });
      const amount = tenant.monthly_rate ? parseFloat(tenant.monthly_rate).toFixed(2) : '0.00';

      // Send email
      const { data, error } = await this.resend.emails.send({
        from: 'BllokuSync Apartments <noreply@notifications.bllokusync.com>',
        to: recipientEmail,
        replyTo: 'support@bllokusync.com',
        subject: isRedirected
          ? `[TEST] Kujtesë Pagese për ${tenant.email} - ${monthName}`
          : `Kujtesë Pagese - ${monthName}`,
        html: this.getPaymentReminderEmailTemplate(tenant, property, monthName, isRedirected),
        text: this.getPaymentReminderPlainText(tenant, property, monthName),
        headers: {
          'X-Entity-Ref-ID': `payment-reminder-${tenant.id}-${paymentMonth}`,
        },
      });

      if (error) {
        console.error('Resend API Error:', error);
        throw error;
      }

      if (isRedirected) {
        console.log(`  ✅ Email reminder sent to ${recipientEmail} (intended for ${tenant.email})`);
      } else {
        console.log(`  ✅ Email reminder sent to ${tenant.email}`);
      }

      // Send push notification to mobile
      try {
        await pushNotificationService.sendPaymentReminder(
          tenant.id,
          monthName,
          amount,
          property ? property.name : 'N/A'
        );
        console.log(`  📱 Push notification sent to tenant ${tenant.id}`);
      } catch (pushError) {
        console.error(`  ⚠️  Failed to send push notification:`, pushError.message);
        // Don't throw - email was sent successfully
      }

      return { success: true, data };
    } catch (error) {
      console.error(`  ❌ Failed to send reminder to ${tenant.email}:`, error);
      throw error;
    }
  }

  /**
   * HTML email template for payment reminder
   */
  getPaymentReminderEmailTemplate(tenant, property, monthName, isRedirected) {
    const loginUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const amount = tenant.monthly_rate ? `€${parseFloat(tenant.monthly_rate).toFixed(2)}` : 'N/A';

    return `
<!DOCTYPE html>
<html lang="sq">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kujtesë Pagese</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f7fa;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f7fa;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          ${isRedirected ? `
          <tr>
            <td style="padding: 16px; background-color: #fef3c7; border-top-left-radius: 12px; border-top-right-radius: 12px; text-align: center;">
              <p style="margin: 0; color: #92400e; font-size: 14px; font-weight: 600;">
                ⚠️ TEST MODE: Email i destinuar për ${tenant.email}
              </p>
            </td>
          </tr>
          ` : ''}
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-top-left-radius: ${isRedirected ? '0' : '12px'}; border-top-right-radius: ${isRedirected ? '0' : '12px'};">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                🔔 Kujtesë Pagese
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #1f2937; font-size: 16px; line-height: 1.6;">
                Përshëndetje <strong>${tenant.name} ${tenant.surname}</strong>,
              </p>

              <p style="margin: 0 0 30px; color: #4b5563; font-size: 15px; line-height: 1.6;">
                Ky është një kujtesë për pagesën tuaj të qirasë për <strong>${monthName}</strong>.
              </p>

              <!-- Payment Details Box -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f9fafb; border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 24px;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Prona:</td>
                        <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">
                          ${property ? property.name : 'N/A'}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Lokacioni:</td>
                        <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">
                          ${property ? property.location : 'N/A'}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Muaji:</td>
                        <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">
                          ${monthName}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; border-top: 2px solid #e5e7eb; color: #6b7280; font-size: 14px;">Shuma:</td>
                        <td style="padding: 8px 0; border-top: 2px solid #e5e7eb; color: #7c3aed; font-size: 18px; font-weight: 700; text-align: right;">
                          ${amount}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 30px; color: #4b5563; font-size: 15px; line-height: 1.6;">
                Ju lutemi, sigurohuni që pagesa të kryhet brenda datës së caktuar (<strong>deri më ${tenant.notice_day} ${monthName}</strong>) për të shmangur vonesën.
              </p>

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 30px;">
                <tr>
                  <td align="center">
                    <a href="${loginUrl}/tenant" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.4);">
                      Shiko Detajet e Pagesës
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                Nëse keni pyetje ose nëse pagesa është bërë tashmë, ju lutemi kontaktoni menaxherin tuaj të pronës.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-bottom-left-radius: 12px; border-bottom-right-radius: 12px; text-align: center;">
              <p style="margin: 0 0 10px; color: #6b7280; font-size: 13px;">
                Faleminderit që zgjidhni BllokuSync!
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} BllokuSync. Të gjitha të drejtat e rezervuara.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  /**
   * Plain text version of payment reminder email
   */
  getPaymentReminderPlainText(tenant, property, monthName) {
    const loginUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const amount = tenant.monthly_rate ? `€${parseFloat(tenant.monthly_rate).toFixed(2)}` : 'N/A';

    return `
Kujtesë Pagese - ${monthName}

Përshëndetje ${tenant.name} ${tenant.surname},

Ky është një kujtesë për pagesën tuaj të qirasë për ${monthName}.

Detajet e Pagesës:
- Prona: ${property ? property.name : 'N/A'}
- Lokacioni: ${property ? property.location : 'N/A'}
- Muaji: ${monthName}
- Shuma: ${amount}

Ju lutemi, sigurohuni që pagesa të kryhet brenda datës së caktuar (deri më ${tenant.notice_day} ${monthName}) për të shmangur vonesën.

Shiko detajet e pagesës këtu: ${loginUrl}/tenant

Nëse keni pyetje ose nëse pagesa është bërë tashmë, ju lutemi kontaktoni menaxherin tuaj të pronës.

Faleminderit që zgjidhni BllokuSync!

© ${new Date().getFullYear()} BllokuSync. Të gjitha të drejtat e rezervuara.
    `;
  }
}

module.exports = PaymentReminderService;
