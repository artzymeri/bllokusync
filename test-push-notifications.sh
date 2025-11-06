#!/bin/bash

# Push Notification Testing Script
# This script helps you test push notifications locally

echo "🔔 Push Notification Testing Helper"
echo "===================================="
echo ""

# Get local IP
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null)

if [ -z "$LOCAL_IP" ]; then
    echo "❌ Could not detect local IP address"
    echo "Please find your IP manually:"
    echo "  System Preferences → Network → Your Connection"
    exit 1
fi

echo "📡 Your Local IP: $LOCAL_IP"
echo ""
echo "Step 1: Update Mobile API URL"
echo "-----------------------------"
echo "Edit: mobile/src/services/pushNotificationService.js"
echo "Change API_URL to: http://$LOCAL_IP:5000/api"
echo ""

read -p "Press Enter when you've updated the API URL..."

echo ""
echo "Step 2: Start Backend Server"
echo "-----------------------------"
echo "Opening new terminal for backend..."

# Open new terminal with backend command
osascript -e "tell app \"Terminal\"
    do script \"cd $(pwd)/backend && echo '🚀 Starting Backend Server...' && npm start\"
end tell"

sleep 2

echo ""
echo "Step 3: Start Mobile App"
echo "------------------------"
echo "Opening new terminal for mobile..."

# Open new terminal with mobile command
osascript -e "tell app \"Terminal\"
    do script \"cd $(pwd)/mobile && echo '📱 Starting Expo Dev Server...' && npm start\"
end tell"

echo ""
echo "Step 4: Open App on Device"
echo "--------------------------"
echo "1. Install Expo Go on your physical device (from App/Play Store)"
echo "2. Make sure device is on the same WiFi"
echo "3. Scan QR code from Expo terminal"
echo "4. Login to the app"
echo ""

echo "Step 5: Test Notifications"
echo "--------------------------"
echo "Choose a test method:"
echo ""
echo "A) Test via Real Payment (Recommended)"
echo "   - Use web dashboard to mark a payment as 'paid'"
echo "   - Tenant will receive notification"
echo ""
echo "B) Test via API Call"
echo "   After logging in to mobile app, run:"
echo ""
echo "   curl -X POST http://$LOCAL_IP:5000/api/push-tokens/test-payment \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -H 'Authorization: Bearer YOUR_TOKEN' \\"
echo ""
echo "   Replace YOUR_TOKEN with token from mobile app logs"
echo ""
echo "✅ Setup Complete!"
echo ""
echo "Check mobile terminal for logs:"
echo "  📱 Push token obtained: ExponentPushToken[...]"
echo "  ✅ Push notifications registered successfully"
echo ""
echo "When payment is confirmed, you'll see:"
echo "  ✅ Payment confirmation push notification sent"
echo ""

