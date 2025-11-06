# Mobile Push Notifications Implementation Guide

## Overview
Complete push notification system for iOS and Android using Expo Push Notifications. Sends payment reminders and other notifications to mobile devices.

## Architecture

### Components
1. **Mobile App (Expo)**: Registers device, receives notifications
2. **Backend Service**: Sends notifications via Expo Push API
3. **Database**: Stores push tokens
4. **Payment Reminder**: Sends both email + push notifications

## Installation

### Step 1: Install Mobile Dependencies
```bash
cd mobile
npm install
```

This installs:
- `expo-notifications` - Handle push notifications
- `expo-device` - Detect device capabilities

### Step 2: Install Backend Dependencies
```bash
cd backend
npm install
```

This installs:
- `expo-server-sdk` - Send push notifications from server

### Step 3: Run Database Migration
The migration creates the `push_tokens` table:

```bash
cd backend
npm run migrate
```

Or restart your backend server - it will run migrations automatically.

## Mobile App Setup

### 1. Update App.js or Main Entry Point

Add push notification registration on app startup:

```javascript
import { useEffect } from 'react';
import pushNotificationService from './src/services/pushNotificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

function App() {
  useEffect(() => {
    // Register for push notifications after user logs in
    registerPushNotifications();
  }, []);

  const registerPushNotifications = async () => {
    try {
      const authToken = await AsyncStorage.getItem('token');
      if (!authToken) return; // User not logged in

      // Get push token
      const pushToken = await pushNotificationService.registerForPushNotifications();
      if (!pushToken) return;

      // Save to backend
      await pushNotificationService.savePushToken(pushToken, authToken);
      
      // Setup listeners
      const listeners = pushNotificationService.setupNotificationListeners(
        (notification) => {
          console.log('Received:', notification);
          // Handle notification received while app is open
        },
        (response) => {
          console.log('Tapped:', response);
          // Handle notification tap - navigate to relevant screen
          const data = response.notification.request.content.data;
          if (data.type === 'payment_reminder') {
            // Navigate to payments screen
          }
        }
      );

      // Cleanup listeners on unmount
      return () => {
        pushNotificationService.removeNotificationListeners(listeners);
      };
    } catch (error) {
      console.error('Push notification setup failed:', error);
    }
  };

  return (
    // Your app components
  );
}
```

### 2. Update Login Flow

Register push token after successful login:

```javascript
// In your login screen
const handleLogin = async (email, password) => {
  try {
    // Your existing login logic
    const response = await loginAPI(email, password);
    await AsyncStorage.setItem('token', response.token);
    
    // Register for push notifications
    const pushToken = await pushNotificationService.registerForPushNotifications();
    if (pushToken) {
      await pushNotificationService.savePushToken(pushToken, response.token);
    }
    
    // Navigate to home
  } catch (error) {
    console.error('Login failed:', error);
  }
};
```

### 3. Update Logout Flow

Remove push token on logout:

```javascript
const handleLogout = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    
    // Remove push token from backend
    await pushNotificationService.removePushToken(token);
    
    // Clear local storage
    await AsyncStorage.clear();
    
    // Navigate to login
  } catch (error) {
    console.error('Logout failed:', error);
  }
};
```

### 4. Update API URL

Edit `mobile/src/services/pushNotificationService.js`:

```javascript
// Change this line to your backend URL
const API_URL = 'http://YOUR_IP:5000/api'; // Use your actual IP or domain
```

For development:
- iOS Simulator: `http://localhost:5000/api`
- Android Emulator: `http://10.0.2.2:5000/api`
- Physical Device: `http://YOUR_LOCAL_IP:5000/api` (e.g., `http://192.168.1.100:5000/api`)

## Backend Configuration

The backend is already configured! It will:
- ✅ Accept push token registrations
- ✅ Send push notifications with payment reminders
- ✅ Handle token cleanup

## Testing

### Test on Physical Device (Required!)

**⚠️ Push notifications only work on physical devices, NOT simulators/emulators**

1. **Build Development App**:
```bash
cd mobile
npx expo start
```

2. **Scan QR Code**:
   - iOS: Use Camera app to scan QR code
   - Android: Use Expo Go app to scan QR code

3. **Grant Permissions**:
   - Allow notifications when prompted

4. **Login**:
   - Login with a tenant account
   - Push token will be automatically registered

5. **Test Notification**:
   - Backend admin can trigger test notification via API
   - Or wait for scheduled payment reminder (9 AM daily)

### Manual Test via API

Trigger a test notification (as admin):

```bash
# First, test the payment reminder check
curl -X POST http://localhost:5000/api/payment-reminders/trigger \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

### Check Push Tokens

View registered tokens for your account:

```bash
curl http://localhost:5000/api/push-tokens/my-tokens \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Notification Types

The system supports multiple notification types:

### 1. Payment Reminders
Automatically sent 3 days before notice_day:
```javascript
pushNotificationService.sendPaymentReminder(
  userId,
  'Nëntor 2025',
  '500.00',
  'Building ABC'
);
```

### 2. Status Updates
When complaint/report status changes:
```javascript
pushNotificationService.sendStatusUpdate(
  userId,
  'complaint',
  'resolved',
  'Water leak in bathroom'
);
```

### 3. Monthly Reports
When new monthly report is published:
```javascript
pushNotificationService.sendMonthlyReportNotification(
  [userId1, userId2],
  'Nëntor 2025',
  'Building ABC'
);
```

### 4. Welcome Message
When new user is approved:
```javascript
pushNotificationService.sendWelcomeNotification(
  userId,
  'John Doe'
);
```

## Troubleshooting

### "Must use physical device for Push Notifications"
- ✅ This is expected - use a real phone
- Simulators/emulators don't support push notifications

### Notifications Not Received
1. Check device permissions (Settings > BllokuSync > Notifications)
2. Verify push token is saved: Check `push_tokens` table in database
3. Check backend logs for errors
4. Ensure device has internet connection
5. Check if notification was sent: Backend logs show `📱 Push notification sent`

### "Invalid Push Token"
- Token may have expired
- User may have uninstalled/reinstalled app
- Re-login to register new token

### iOS: Notifications Work in Development but Not Production
- Production iOS apps need APNs certificate
- Configure in Expo Application Services (EAS)
- See: https://docs.expo.dev/push-notifications/push-notifications-setup/

### Android: Notifications Not Showing
- Check notification channel is created (done automatically)
- Verify Android OS notification settings

## Production Deployment

### iOS (App Store)
1. Create app in App Store Connect
2. Configure push notification capability
3. Build with EAS: `eas build --platform ios`
4. Submit for review

### Android (Play Store)
1. Create app in Play Console
2. Configure Firebase Cloud Messaging (automatic with Expo)
3. Build with EAS: `eas build --platform android`
4. Submit for review

### Backend
Already configured! Just deploy your backend and it works.

## Database Schema

### push_tokens Table
```sql
- id: INTEGER (PK)
- user_id: INTEGER (FK to users)
- push_token: STRING (Expo Push Token)
- device_type: ENUM('ios', 'android')
- is_active: BOOLEAN (default: true)
- last_used_at: DATETIME
- created_at: DATETIME
- updated_at: DATETIME
```

## API Endpoints

### POST /api/push-tokens
Register/update push token for current user

**Request:**
```json
{
  "push_token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "device_type": "ios"
}
```

### DELETE /api/push-tokens
Remove push token for current user

**Request:**
```json
{
  "push_token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
}
```

### GET /api/push-tokens/my-tokens
Get all push tokens for current user

## Payment Reminder Flow

**Complete flow for payment reminders:**

1. **Daily Check (9 AM)**:
   - Scheduler runs `checkAndSendReminders()`
   - Checks all tenants with `notice_day` set

2. **For Each Tenant**:
   - Calculate if today is 3 days before notice_day
   - Check if payment for target month is made
   - If NOT paid → Send reminder

3. **Send Reminder**:
   - ✉️ Send email via Resend
   - 📱 Send push notification via Expo
   - Both notifications contain same information

4. **Mobile Receives**:
   - Notification appears on device
   - User taps → Opens app
   - Can navigate to payment screen

## Best Practices

### 1. Handle Permissions Gracefully
```javascript
const status = await pushNotificationService.getPermissionsStatus();
if (status !== 'granted') {
  // Show explanation UI before requesting
  Alert.alert(
    'Enable Notifications',
    'Get reminders about your rent payments',
    [
      { text: 'Not Now', style: 'cancel' },
      { 
        text: 'Enable', 
        onPress: () => pushNotificationService.requestPermissions() 
      }
    ]
  );
}
```

### 2. Handle Notification Taps
```javascript
const handleNotificationTap = (response) => {
  const { data } = response.notification.request.content;
  
  switch (data.type) {
    case 'payment_reminder':
      navigation.navigate('Payments');
      break;
    case 'status_update':
      navigation.navigate('Reports');
      break;
    case 'monthly_report':
      navigation.navigate('Reports', { month: data.month });
      break;
  }
};
```

### 3. Clean Up on User Switch
If app supports multiple accounts, clean up tokens:
```javascript
const switchAccount = async () => {
  await pushNotificationService.removePushToken(oldToken);
  // Login to new account
  // Register new push token
};
```

## Monitoring

### Check Notification Delivery
Backend logs show:
```
📱 Push notification sent to tenant 123
✅ Sent 5 push notifications
```

### Check Failed Notifications
```
⚠️  Failed to send push notification: DeviceNotRegistered
```

### Database Queries
```sql
-- Active tokens count
SELECT COUNT(*) FROM push_tokens WHERE is_active = true;

-- Tokens per user
SELECT user_id, COUNT(*) as token_count 
FROM push_tokens 
WHERE is_active = true 
GROUP BY user_id;

-- Recently used tokens
SELECT * FROM push_tokens 
WHERE last_used_at > DATE_SUB(NOW(), INTERVAL 7 DAY);
```

## Support

### Expo Documentation
- Push Notifications Guide: https://docs.expo.dev/push-notifications/overview/
- Testing: https://docs.expo.dev/push-notifications/testing/

### Common Issues
- Expo Forums: https://forums.expo.dev/
- Stack Overflow: Tag with `expo` and `push-notification`

## Summary

✅ **Backend**: Fully configured and ready
✅ **Mobile**: Service file created, needs integration
✅ **Database**: Migration ready to run
✅ **Testing**: Works on physical devices only
✅ **Production**: Ready for deployment

**Next Steps:**
1. Install mobile dependencies: `cd mobile && npm install`
2. Install backend dependencies: `cd backend && npm install`
3. Run migration: Backend server will do this automatically
4. Update API_URL in mobile service
5. Integrate into your App.js and login/logout flows
6. Test on a physical device!

