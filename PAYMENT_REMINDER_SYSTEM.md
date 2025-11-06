# Payment Reminder System - Implementation Guide

## Overview
The payment reminder system automatically sends email notifications to tenants who haven't paid their rent 3 days before their designated `notice_day`.

## How It Works

### Notice Day Calculation
- Each tenant has a `notice_day` field (1-31) indicating when payment is due each month
- The system calculates **3 days before** the notice_day as the reminder date
- Examples:
  - `notice_day = 1`: Reminder sent on the 29th (or 28th for February)
  - `notice_day = 2`: Reminder sent on the 30th (or 29th depending on month)
  - `notice_day = 15`: Reminder sent on the 12th

### Payment Check Logic
- Checks if tenant has paid for the **next month**
- Example scenario (current date: June 30):
  - `notice_day = 2` → June 30 is 2 days before July 2
  - System checks: Has July payment been made?
  - If YES: No email sent ✅
  - If NO: Email reminder sent 📧

## Components

### 1. PaymentReminderService
**Location:** `backend/services/paymentReminder.service.js`

**Key Methods:**
- `calculateReminderDate(noticeDay, year, month)` - Calculates when to send reminder
- `isReminderDate(noticeDay)` - Checks if today is reminder day for a tenant
- `checkAndSendReminders()` - Main method that checks all tenants
- `sendPaymentReminderEmail(tenant, property, paymentMonth)` - Sends the email

### 2. PaymentReminderScheduler
**Location:** `backend/schedulers/paymentReminder.scheduler.js`

**Schedule:** Runs daily at 9:00 AM (Europe/Tirane timezone)

**Methods:**
- `start()` - Starts the scheduler
- `stop()` - Stops the scheduler
- `runImmediately()` - Manually trigger check (for testing)

### 3. API Routes
**Location:** `backend/routes/paymentReminder.routes.js`

**Endpoints:**
- `POST /api/payment-reminders/trigger` - Manually trigger reminder check (Admin only)
- `GET /api/payment-reminders/status` - Get scheduler status (Admin only)

## Installation

### Step 1: Install Dependencies
```bash
cd backend
npm install node-cron
```

### Step 2: Start Server
The scheduler starts automatically when the server starts:
```bash
npm start
```

You should see:
```
🚀 Starting payment reminder scheduler...
📅 Schedule: Daily at 9:00 AM
✅ Payment reminder scheduler started successfully
```

## Testing

### Manual Trigger (Admin Only)
You can manually trigger the payment reminder check via API:

```bash
curl -X POST http://localhost:5000/api/payment-reminders/trigger \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

### Check Scheduler Status
```bash
curl http://localhost:5000/api/payment-reminders/status \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Enable Immediate Testing
To run the check immediately on server startup (for development), uncomment this line in `paymentReminder.scheduler.js`:

```javascript
// this.runImmediately();
```

## Email Template

The reminder email includes:
- Tenant's name
- Property information
- Month for payment
- Amount due
- Due date (notice_day)
- Link to tenant dashboard
- Professional styling with your branding

### Test Mode
If `EMAIL_TEST_MODE=true` in your `.env`, all emails are redirected to your verified test email address with a test mode banner.

## Database Requirements

The system requires:
1. `notice_day` column in `users` table (already migrated ✅)
2. `tenant_payments` table with payment records
3. `properties` table for property details

## Configuration

### Environment Variables
Ensure these are set in your `.env`:

```env
RESEND_API_KEY=your_resend_api_key
EMAIL_TEST_MODE=true  # Set to false in production
TEST_EMAIL=your-verified@email.com
FRONTEND_URL=http://localhost:3000
```

### Scheduler Schedule
To change the schedule, edit `paymentReminder.scheduler.js`:

```javascript
// Current: Daily at 9:00 AM
this.job = cron.schedule('0 9 * * *', async () => {
  // ...
});

// Examples:
// Every day at 8:00 AM: '0 8 * * *'
// Every day at 6:00 PM: '0 18 * * *'
// Every Monday at 9:00 AM: '0 9 * * 1'
```

## Logs

The system provides detailed logging:

```
🔔 [Payment Reminder Service] Starting daily check...
📅 Current date: 2025-11-06
👥 Found 10 tenants to check
💰 Checking payments for: 2025-12-01
  ⏭️  Tenant John Doe (notice_day: 5) - Not reminder date today
  🔍 Checking tenant: Jane Smith (notice_day: 1)
  📧 Sending reminder to jane@example.com for property 1
  ✅ Reminder sent to jane@example.com
✅ [Payment Reminder Service] Check completed
   Tenants checked: 10
   Reminders sent: 1
```

## Troubleshooting

### Emails Not Sending
1. Check `EMAIL_TEST_MODE` setting in `.env`
2. Verify `RESEND_API_KEY` is valid
3. Check server logs for errors
4. Ensure tenant has valid email and `notice_day` set

### Scheduler Not Running
1. Check server logs for scheduler start message
2. Verify `node-cron` is installed
3. Check timezone setting matches your location

### Wrong Reminder Dates
1. Verify tenant's `notice_day` is set correctly (1-31)
2. Check server timezone setting
3. Review calculation logic in `calculateReminderDate()` method

## Production Deployment

Before deploying to production:

1. ✅ Set `EMAIL_TEST_MODE=false` in production `.env`
2. ✅ Verify email domain is verified with Resend
3. ✅ Test manually with admin API endpoint
4. ✅ Monitor logs for first few days
5. ✅ Set up error alerting for failed emails

## Future Enhancements

Potential improvements:
- Add SMS reminders
- Multiple reminder intervals (7 days, 3 days, 1 day)
- Customizable email templates per property
- Reminder history tracking in database
- Admin dashboard for reminder statistics

## Support

For issues or questions:
- Check server logs first
- Use manual trigger endpoint for debugging
- Review this documentation
- Contact system administrator

