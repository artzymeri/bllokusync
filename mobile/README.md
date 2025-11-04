# BllokuSync Mobile App

A React Native mobile application for BllokuSync with full authentication and role-based access.

## Features

- 🔐 **Authentication System**
  - Login with email or phone number
  - JWT token-based authentication
  - Secure token storage with AsyncStorage
  - Automatic token verification on app start
  - Session persistence

- 👥 **Role-Based Access**
  - Property Manager dashboard
  - Tenant dashboard
  - Automatic routing based on user role

- 🔄 **User Experience**
  - Switch between email and phone login modes
  - Password visibility toggle
  - Loading states and error handling
  - Logout functionality with confirmation

## Setup

1. **Install dependencies:**
```bash
cd mobile
npm install
```

2. **Configure API endpoint:**
   - Edit `src/config/api.config.js`
   - For iOS simulator: use `http://localhost:5000`
   - For Android emulator: use `http://10.0.2.2:5000`
   - For physical device: use your computer's IP address (e.g., `http://192.168.1.100:5000`)

3. **Start the backend server:**
```bash
cd ../backend
npm start
```

4. **Start the development server:**
```bash
npm start
```

5. **Run on device:**
   - iOS: `npm run ios` or scan QR code with Expo Go
   - Android: `npm run android` or scan QR code with Expo Go

## Project Structure

```
mobile/
├── App.js                          # Main app with auth routing
├── src/
│   ├── config/
│   │   └── api.config.js          # API configuration
│   ├── services/
│   │   ├── api-client.js          # HTTP client with auth headers
│   │   └── auth.service.js        # Authentication service
│   └── screens/
│       ├── LoginScreen.js         # Login with email/phone toggle
│       ├── PropertyManagerScreen.js # PM dashboard
│       └── TenantScreen.js        # Tenant dashboard
├── package.json
└── app.json
```

## Authentication Flow

1. **Login**: User enters credentials (email or phone + password)
2. **Token Storage**: JWT token is stored in AsyncStorage
3. **API Requests**: Token is automatically included in all API requests via Authorization header
4. **Auto-Login**: On app restart, token is verified and user is logged in automatically
5. **Logout**: Token is removed from storage and user returns to login screen

## API Endpoints Used

- `POST /api/auth/login` - Login with email or phone
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user data

## Screen Features

### Login Screen
- Email/Phone toggle switch
- Dynamic input validation
- Loading indicator during authentication
- Error handling with alerts

### Property Manager Screen
- Welcome message with user name
- Account information display
- Logout button with confirmation

### Tenant Screen
- Welcome message with user name
- Account information display
- Logout button with confirmation

## Testing

### Test Accounts
Use your existing backend test accounts:
- Property Manager: Login with a property_manager role user
- Tenant: Login with a tenant role user

## Troubleshooting

### Cannot connect to backend
- Make sure backend server is running on port 5000
- Update `src/config/api.config.js` with correct IP address
- For Android emulator, use `http://10.0.2.2:5000`
- For iOS simulator, use `http://localhost:5000`
- For physical device, use your computer's local IP

### Token issues
- Clear AsyncStorage: Close app and reinstall
- Check backend JWT token generation
- Verify token expiration settings

## Next Steps

- [ ] Add React Navigation for better routing
- [ ] Implement dashboard features for each role
- [ ] Add profile editing
- [ ] Implement push notifications
- [ ] Add biometric authentication
- [ ] Create registration flow
- [ ] Add forgot password functionality
