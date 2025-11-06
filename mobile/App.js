import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import LoginScreen from './src/screens/LoginScreen';
import PropertyManagerScreen from './src/screens/PropertyManagerScreen';
import TenantScreen from './src/screens/TenantScreen';
import AuthService from './src/services/auth.service';
import pushNotificationService from './src/services/pushNotificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notificationListeners, setNotificationListeners] = useState(null);

  // Check if user is already logged in on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Setup push notifications when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      setupPushNotifications();
    } else {
      // Cleanup listeners on logout
      if (notificationListeners) {
        pushNotificationService.removeNotificationListeners(notificationListeners);
        setNotificationListeners(null);
      }
    }

    return () => {
      if (notificationListeners) {
        pushNotificationService.removeNotificationListeners(notificationListeners);
      }
    };
  }, [isAuthenticated, user]);

  const checkAuthStatus = async () => {
    try {
      const isValid = await AuthService.verifyToken();
      if (isValid) {
        const userData = await AuthService.getCurrentUser();
        if (userData) {
          setUser(userData);
          setIsAuthenticated(true);
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setupPushNotifications = async () => {
    try {
      // Register for push notifications
      const pushToken = await pushNotificationService.registerForPushNotifications();
      
      if (pushToken) {
        console.log('📱 Push token obtained:', pushToken);
        
        // Save token to backend
        const authToken = await AsyncStorage.getItem('token');
        if (authToken) {
          await pushNotificationService.savePushToken(pushToken, authToken);
          console.log('✅ Push notifications registered successfully');
        }
      } else {
        console.log('⚠️ Could not obtain push token (physical device required)');
      }

      // Setup notification listeners
      const listeners = pushNotificationService.setupNotificationListeners(
        (notification) => {
          // Handle notification received while app is open
          console.log('🔔 Notification received:', notification.request.content);
          
          // You can show an in-app alert or update UI here
          const { title, body, data } = notification.request.content;
          console.log('Title:', title);
          console.log('Body:', body);
          console.log('Data:', data);
        },
        (response) => {
          // Handle notification tap
          console.log('👆 Notification tapped:', response.notification.request.content);
          
          const data = response.notification.request.content.data;
          
          // Navigate based on notification type
          if (data.type === 'payment_confirmation') {
            console.log('Navigate to payments screen');
            // TODO: Add navigation to payments screen when navigation is implemented
          } else if (data.type === 'payment_reminder') {
            console.log('Navigate to payments screen');
          } else if (data.type === 'status_update') {
            console.log('Navigate to complaints/reports screen');
          }
        }
      );

      setNotificationListeners(listeners);
    } catch (error) {
      console.error('❌ Push notification setup failed:', error);
    }
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      // Remove push token from backend
      const authToken = await AsyncStorage.getItem('token');
      if (authToken) {
        await pushNotificationService.removePushToken(authToken);
        console.log('🔕 Push token removed');
      }
    } catch (error) {
      console.error('Error removing push token:', error);
    }
    
    setUser(null);
    setIsAuthenticated(false);
  };

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  // Route to appropriate screen based on auth state and role
  const renderScreen = () => {
    if (!isAuthenticated) {
      return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
    }

    // Route based on user role
    if (user?.role === 'property_manager') {
      return <PropertyManagerScreen user={user} onLogout={handleLogout} onUpdateUser={handleUpdateUser} />;
    } else if (user?.role === 'tenant') {
      return <TenantScreen user={user} onLogout={handleLogout} onUpdateUser={handleUpdateUser} />;
    }

    // Default fallback
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      {renderScreen()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
