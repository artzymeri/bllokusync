import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import LoginScreen from './src/screens/LoginScreen';
import PropertyManagerScreen from './src/screens/PropertyManagerScreen';
import TenantScreen from './src/screens/TenantScreen';
import AuthService from './src/services/auth.service';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

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

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
  };

  const handleUpdateUser = (updatedUserData) => {
    setUser(updatedUserData);
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
