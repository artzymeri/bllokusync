import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch, setAuthToken, getAuthToken, removeAuthToken } from './api-client';

class AuthService {
  /**
   * Login user with email or phone
   */
  async login(identifier, password, method = 'email') {
    try {
      const response = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          identifier,
          password,
          loginMethod: method,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store token and user data
      if (data.token) {
        await setAuthToken(data.token);
        await AsyncStorage.setItem('user_data', JSON.stringify(data.data));
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout() {
    try {
      const response = await apiFetch('/api/auth/logout', {
        method: 'POST',
      });

      const data = await response.json();

      // Remove token and user data regardless of response
      await removeAuthToken();

      return data;
    } catch (error) {
      console.error('Logout error:', error);
      // Still remove local data even if API call fails
      await removeAuthToken();
      throw error;
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser() {
    try {
      const token = await getAuthToken();
      if (!token) return null;

      const response = await apiFetch('/api/auth/me', {
        method: 'GET',
      });

      if (!response.ok) {
        await removeAuthToken();
        return null;
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        await AsyncStorage.setItem('user_data', JSON.stringify(data.data));
        return data.data;
      }

      return null;
    } catch (error) {
      console.error('Get current user error:', error);
      await removeAuthToken();
      return null;
    }
  }

  /**
   * Get stored user data
   */
  async getStoredUser() {
    try {
      const userData = await AsyncStorage.getItem('user_data');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting stored user:', error);
      return null;
    }
  }

  /**
   * Verify token validity
   */
  async verifyToken() {
    try {
      const token = await getAuthToken();
      if (!token) return false;

      const response = await apiFetch('/api/auth/me', {
        method: 'GET',
      });

      if (!response.ok) {
        await removeAuthToken();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Token verification error:', error);
      await removeAuthToken();
      return false;
    }
  }
}

export default new AuthService();

