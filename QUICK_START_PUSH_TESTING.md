# Quick Start: Testing Push Notifications Locally

## 🚀 Quick Setup (5 minutes)

### Step 1: Find Your Local IP Address
```bash
# Run in terminal:
ipconfig getifaddr en0
# Or if that doesn't work:
ipconfig getifaddr en1
```
**Example output**: `192.168.1.100` ← This is your local IP

### Step 2: Update Mobile API URL

Edit `mobile/src/services/pushNotificationService.js`:
```javascript
const API_URL = 'http://192.168.1.100:5000/api'; // Use YOUR local IP
```

### Step 3: Start Backend
```bash
cd backend
npm start
```
**Watch for**: Server running on port 5000

### Step 4: Start Mobile App
```bash
cd mobile
npm start
```
**Watch for**: QR code in terminal

### Step 5: Install Expo Go & Open App

**On your phone:**
1. Download "Expo Go" from App Store (iOS) or Play Store (Android)
2. Scan the QR code from terminal
3. Login to the app

**Watch mobile terminal for:**
```
📱 Push token obtained: ExponentPushToken[xxxxx]
✅ Push notifications registered successfully
```

## ✅ Testing Methods

### Method 1: Real Payment Test (Best)

1. **Open web dashboard** (as property manager)
2. **Go to Payments** → Find a tenant payment
3. **Mark as "Paid"**
4. **Check tenant's phone** → Should receive notification immediately!

### Method 2: Test API Endpoint

After logging in to mobile app, get the auth token from console logs, then:

```bash
# Replace YOUR_LOCAL_IP and YOUR_AUTH_TOKEN
curl -X POST http://YOUR_LOCAL_IP:5000/api/push-tokens/test-payment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

### Method 3: Database Check

```sql
-- Verify token was saved
SELECT * FROM push_tokens WHERE is_active = 1;
```

## 🔍 Expected Results

### When Logging In:
**Mobile console shows:**
```
📱 Push token obtained: ExponentPushToken[xxxxxx]
✅ Push notifications registered successfully
```

### When Payment Confirmed:
**Backend console shows:**
```
✅ Payment confirmation email sent for payment ID: 123
✅ Payment confirmation push notification sent for payment ID: 123
✅ Sent 1 push notifications
```

**Phone receives:**
- **Title**: ✅ Pagesa e Konfirmuar
- **Body**: Faleminderit! Pagesa juaj për 2024-11-01 (€350) është pranuar dhe konfirmuar.
- **Sound**: Default notification sound
- **Badge**: App icon badge increments

### When Tapping Notification:
**Mobile console shows:**
```
👆 Notification tapped: { title: '✅ Pagesa e Konfirmuar', ... }
Navigate to payments screen
```

## 🐛 Troubleshooting

### "Must use physical device"
- ❌ **Simulators DON'T work** for push notifications
- ✅ Use real iPhone/Android device

### "No push token obtained"
```javascript
// Check permissions:
// iOS: Settings → Expo Go → Notifications → ON
// Android: Settings → Apps → Expo Go → Notifications → ON
```

### "Connection refused" / "Network request failed"
1. Verify device and computer on **same WiFi**
2. Check API_URL uses **local IP** (not localhost)
3. Test backend accessible: Open `http://YOUR_IP:5000/api/health` in phone browser

### "Push token saved" but no notification received
1. Check database: `SELECT * FROM push_tokens WHERE user_id = ?;`
2. Check backend logs for Expo API errors
3. Try test endpoint: `POST /api/push-tokens/test-payment`

## 📱 Testing Different Scenarios

### Test 1: Notification While App Open
1. Keep mobile app open
2. Mark payment as paid
3. **Expected**: Console log + in-app alert (no system notification)

### Test 2: Notification While App Backgrounded
1. Press home button (app in background)
2. Mark payment as paid
3. **Expected**: System notification appears

### Test 3: Notification While App Closed
1. Force close mobile app
2. Mark payment as paid
3. **Expected**: System notification appears

### Test 4: Tap Notification
1. Receive notification
2. Tap it
3. **Expected**: App opens + console shows "Navigate to payments screen"

### Test 5: Multiple Payments
1. Select 3 payments for same tenant
2. Bulk mark as paid
3. **Expected**: ONE notification with summary

## 🎯 Quick Verification Checklist

- [ ] Expo Go installed on physical device
- [ ] Device and computer on same WiFi
- [ ] Backend running (`npm start` in backend/)
- [ ] Mobile app running (`npm start` in mobile/)
- [ ] API_URL uses local IP (not localhost)
- [ ] App opened in Expo Go via QR code
- [ ] Logged in successfully
- [ ] Console shows "Push token obtained"
- [ ] Console shows "Push notifications registered successfully"
- [ ] Database has push_token record

## 🔥 Quick Test Commands

```bash
# Terminal 1: Backend
cd backend && npm start

# Terminal 2: Mobile
cd mobile && npm start

# Terminal 3: Check your IP
ipconfig getifaddr en0

# Terminal 4: Test notification (after getting token)
curl -X POST http://YOUR_LOCAL_IP:5000/api/push-tokens/test-payment \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📝 Notes

- ✅ Works immediately with Expo Go (no build needed)
- ✅ No App Store/Play Store submission required
- ✅ Real push notifications via Expo Push API
- ✅ Same code works in production
- ⚠️ Must use physical device
- ⚠️ Must be on same network as backend

## 🎉 Success Indicators

You'll know it's working when you see:

1. **Mobile console**: `✅ Push notifications registered successfully`
2. **Backend console**: `✅ Payment confirmation push notification sent`
3. **Phone screen**: Notification appears with green checkmark emoji
4. **Sound**: Device plays notification sound

That's it! You're ready to test! 🚀

