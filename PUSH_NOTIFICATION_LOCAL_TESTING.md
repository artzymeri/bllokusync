# Local Push Notification Testing Guide

## Overview
You can test push notifications locally using Expo Go app on your physical device **without** needing to publish to App Store or Google Play.

## Prerequisites

✅ Physical device (iOS or Android) - **Push notifications don't work on simulators/emulators**
✅ Expo Go app installed on your device
✅ Device and computer on the same WiFi network

## Setup Steps

### 1. Install Expo Go on Your Device

**iOS**: Download from App Store
- Search for "Expo Go"
- Install the app

**Android**: Download from Google Play Store
- Search for "Expo Go"
- Install the app

### 2. Update Your Backend API URL

In `mobile/src/services/pushNotificationService.js`, update the API_URL:
```javascript
const API_URL = 'http://YOUR_LOCAL_IP:5000/api';
```

Find your local IP:
- **macOS**: Open System Preferences → Network → Your active connection shows IP
- **Or via terminal**: `ipconfig getifaddr en0` (WiFi) or `ipconfig getifaddr en1`

⚠️ Use your actual local IP address (e.g., 192.168.1.100), not `localhost` or `127.0.0.1`

### 3. Start Your Backend Server

```bash
cd backend
npm start
```

Make sure your backend is accessible from your local network.

### 4. Start the Expo Development Server

```bash
cd mobile
npm start
```

This will:
- Start the Metro bundler
- Show a QR code in your terminal
- Open Expo DevTools in your browser

### 5. Open App on Your Device

**iOS**:
1. Open Camera app
2. Point at the QR code
3. Tap the notification to open in Expo Go

**Android**:
1. Open Expo Go app
2. Tap "Scan QR Code"
3. Scan the QR code from your terminal

## Testing Push Notifications

### Method 1: Test via Real Payment Confirmation (Recommended)

1. **Login as Property Manager** on web/mobile
2. **Mark a tenant payment as "paid"**
3. **Check tenant's mobile device** - should receive push notification

Steps:
```
1. Open mobile app → Login as tenant
2. Keep app in background or close it
3. Use web dashboard or another device logged in as property manager
4. Go to Payments → Mark a tenant payment as "paid"
5. Tenant's device should receive notification immediately
```

### Method 2: Test with Local Notification (Quick Test)

You can trigger a local test notification to verify the app can receive notifications:

Add this test button to your app (see updated App.js).

### Method 3: Test with Manual API Call

Use curl or Postman to send a test notification:

```bash
curl -X POST http://YOUR_LOCAL_IP:5000/api/test-push \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "userId": 123,
    "title": "Test Payment Confirmation",
    "body": "This is a test payment confirmation notification"
  }'
```

## Troubleshooting

### Push Token Not Registering

**Check Permissions**:
- iOS: Settings → Expo Go → Notifications → Enabled
- Android: Settings → Apps → Expo Go → Notifications → Enabled

**Check Console Logs**:
```bash
# In terminal where you ran `npm start`, look for:
"Push token obtained: ExponentPushToken[xxxxx]"
"Push token saved to backend"
```

### Notifications Not Received

1. **Verify device is physical** (not simulator)
   ```
   Console should show: "Push token obtained: ExponentPushToken[...]"
   If it shows: "Must use physical device" → Use real device
   ```

2. **Check backend logs** when payment is marked as paid:
   ```
   ✅ Payment confirmation push notification sent for payment ID: 123
   ```

3. **Verify push token in database**:
   ```sql
   SELECT * FROM push_tokens WHERE user_id = YOUR_TENANT_ID;
   ```
   Should show an active token with `is_active = 1`

4. **Check Expo push receipt** for errors:
   - Look in backend logs for any Expo API errors
   - Common issues: Invalid token, device not registered

### App Not Connecting to Backend

1. **Verify API URL** uses local IP, not localhost
2. **Check firewall** - allow port 5000
3. **Same WiFi network** - device and computer must be on same network
4. **Test backend is accessible**:
   ```bash
   # From your phone's browser, visit:
   http://YOUR_LOCAL_IP:5000/api/health
   # Should return a response
   ```

### QR Code Not Working

Use manual connection:
1. In Expo Go app, tap "Enter URL manually"
2. Type: `exp://YOUR_LOCAL_IP:8081`
3. Press Connect

## Testing Different Scenarios

### Single Payment Confirmation
```
1. Login as property manager
2. Navigate to Payments
3. Find a pending payment
4. Change status to "Paid"
5. Check tenant's device for notification
```

### Multiple Payment Confirmation
```
1. Login as property manager
2. Navigate to Payments
3. Select multiple payments for same tenant
4. Bulk update to "Paid"
5. Tenant receives ONE notification with summary
```

### Notification While App is Open
- App receives notification
- Shows in-app alert
- Console logs: "Notification received: ..."

### Notification While App is Closed/Background
- Device shows system notification
- Tap notification → app opens
- Console logs: "Notification tapped: ..."

## Expected Behavior

### Push Notification Appearance

**Title**: ✅ Pagesa e Konfirmuar

**Body (single payment)**: 
Faleminderit! Pagesa juaj për 2024-11-01 (€350) është pranuar dhe konfirmuar.

**Body (multiple payments)**:
Faleminderit! 3 pagesa tuaja (€1050.00) janë pranuar dhe konfirmuar.

### Console Output

When payment is confirmed:
```
✅ Payment confirmation email sent for payment ID: 123
✅ Payment confirmation push notification sent for payment ID: 123
✅ Sent 1 push notifications
```

## Production Preparation

When ready for production:

1. **Build standalone app**:
   ```bash
   eas build --platform ios
   eas build --platform android
   ```

2. **No code changes needed** - Expo handles push tokens automatically

3. **Same backend code works** - No changes required

## Quick Test Script

Add this to your tenant dashboard for quick testing:

```javascript
// Test notification button
const testPushNotification = async () => {
  await pushNotificationService.scheduleLocalNotification(
    '✅ Pagesa e Konfirmuar',
    'Faleminderit! Pagesa juaj për Nëntor 2024 (€350) është pranuar dhe konfirmuar.',
    { type: 'payment_confirmation', test: true },
    2 // seconds
  );
  alert('Test notification scheduled in 2 seconds!');
};
```

## Important Notes

- ✅ **No App Store/Play Store required** for testing with Expo Go
- ✅ **Works with development builds** immediately
- ✅ **Real Expo Push Tokens** are generated even in development
- ✅ **Backend sends real push notifications** via Expo Push API
- ⚠️ **Physical device required** - simulators don't support push notifications
- ⚠️ **Same network required** - device and computer must be on same WiFi

## Support

If you encounter issues:
1. Check Expo logs: Look for errors in terminal
2. Check backend logs: Look for push notification errors
3. Verify push token in database: `SELECT * FROM push_tokens WHERE is_active = 1`
4. Test with local notification first to verify permissions

