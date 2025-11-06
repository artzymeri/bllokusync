import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.1.100:5000/api'; // Update with your API URL

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class PushNotificationService {
  /**
   * Register for push notifications and get Expo Push Token
   */
  async registerForPushNotifications() {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#3b82f6',
        sound: 'default',
        enableVibrate: true,
        enableLights: true,
        showBadge: true,
      });
      
      // Create additional channels for different notification types
      await Notifications.setNotificationChannelAsync('payment_confirmations', {
        name: 'Payment Confirmations',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#10b981',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });
      
      await Notifications.setNotificationChannelAsync('payment_reminders', {
        name: 'Payment Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#f59e0b',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
            allowAnnouncements: true,
          },
        });
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }
      
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: 'your-project-id' // Optional: Add when you create EAS project
      })).data;
      console.log('Push token obtained:', token);
    } else {
      console.log('Must use physical device for Push Notifications');
      return null;
    }

    return token;
  }

  /**
   * Save push token to backend
   */
  async savePushToken(token, authToken) {
    try {
      const response = await fetch(`${API_URL}/push-tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          push_token: token,
          device_type: Platform.OS,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('Push token saved to backend');
        await AsyncStorage.setItem('push_token', token);
      } else {
        console.error('Failed to save push token:', data.message);
      }

      return data;
    } catch (error) {
      console.error('Error saving push token:', error);
      throw error;
    }
  }

  /**
   * Remove push token from backend (on logout)
   */
  async removePushToken(authToken) {
    try {
      const token = await AsyncStorage.getItem('push_token');
      if (!token) return;

      const response = await fetch(`${API_URL}/push-tokens`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          push_token: token,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('Push token removed from backend');
        await AsyncStorage.removeItem('push_token');
      }

      return data;
    } catch (error) {
      console.error('Error removing push token:', error);
      throw error;
    }
  }

  /**
   * Setup notification listeners
   */
  setupNotificationListeners(onNotificationReceived, onNotificationTapped) {
    // Listener for notifications received while app is in foreground
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      if (onNotificationReceived) {
        onNotificationReceived(notification);
      }
    });

    // Listener for when user taps on notification
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
      if (onNotificationTapped) {
        onNotificationTapped(response);
      }
    });

    return {
      notificationListener,
      responseListener,
    };
  }

  /**
   * Remove notification listeners
   */
  removeNotificationListeners(listeners) {
    if (listeners.notificationListener) {
      Notifications.removeNotificationSubscription(listeners.notificationListener);
    }
    if (listeners.responseListener) {
      Notifications.removeNotificationSubscription(listeners.responseListener);
    }
  }

  /**
   * Schedule a local notification (for testing)
   */
  async scheduleLocalNotification(title, body, data = {}, seconds = 1) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: { seconds },
    });
  }

  /**
   * Get notification permissions status
   */
  async getPermissionsStatus() {
    const { status } = await Notifications.getPermissionsAsync();
    return status;
  }

  /**
   * Request notification permissions
   */
  async requestPermissions() {
    const { status } = await Notifications.requestPermissionsAsync();
    return status;
  }
}

export default new PushNotificationService();
