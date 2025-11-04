# Quick Setup Guide

## Installation Steps

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure API URL:**
   - Open `src/config/api.config.js`
   - Update `API_BASE_URL` based on your setup:
     - **iOS Simulator**: `http://localhost:5000` (default)
     - **Android Emulator**: `http://10.0.2.2:5000`
     - **Physical Device**: `http://YOUR_COMPUTER_IP:5000`

3. **Start the app:**
   ```bash
   npm start
   ```

## Testing the Authentication

### Login Credentials
Use your existing backend users:
- **Property Manager**: Any user with `role: 'property_manager'`
- **Tenant**: Any user with `role: 'tenant'`

### Expected Behavior

1. **Login Screen**
   - Toggle between Email/Phone mode
   - Enter credentials and tap "Sign In"
   - Loading indicator appears during authentication

2. **After Successful Login**
   - **Property Manager**: Shows "Hello Property Manager" screen with PM badge (blue)
   - **Tenant**: Shows "Hello Tenant" screen with Tenant badge (green)

3. **Logout**
   - Tap the red "Logout" button
   - Confirm in the alert dialog
   - Returns to login screen

4. **Session Persistence**
   - Close and reopen the app
   - Should automatically log you back in
   - No need to enter credentials again

## Network Configuration

### Finding Your Computer's IP Address

**macOS:**
```bash
ipconfig getifaddr en0
```

**Windows:**
```bash
ipconfig
```
Look for "IPv4 Address"

**Linux:**
```bash
hostname -I
```

### Update the config file:
```javascript
// src/config/api.config.js
export const API_BASE_URL = 'http://YOUR_IP_ADDRESS:5000';
```

## Common Issues

### "Network request failed"
- Ensure backend server is running
- Check API_BASE_URL configuration
- For physical device, ensure device and computer are on same WiFi

### "Login failed"
- Verify credentials are correct
- Check backend logs for errors
- Ensure user exists in database

### App crashes on login
- Run `npm install` again
- Clear Metro bundler cache: `npm start -- --reset-cache`

