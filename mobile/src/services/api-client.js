import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api.config';

/**
 * Get the authentication token from AsyncStorage
 */
export async function getAuthToken() {
  try {
    return await AsyncStorage.getItem('auth_token');
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

/**
 * Set the authentication token in AsyncStorage
 */
export async function setAuthToken(token) {
  try {
    await AsyncStorage.setItem('auth_token', token);
  } catch (error) {
    console.error('Error setting auth token:', error);
  }
}

/**
 * Remove the authentication token from AsyncStorage
 */
export async function removeAuthToken() {
  try {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('user_data');
  } catch (error) {
    console.error('Error removing auth token:', error);
  }
}

/**
 * Get default headers including authentication
 */
async function getHeaders(additionalHeaders = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...additionalHeaders,
  };

  const token = await getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Wrapper around fetch that automatically includes auth headers
 */
export async function apiFetch(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  const headers = await getHeaders(options.headers);

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    return response;
  } catch (error) {
    console.error('API Fetch error:', error);
    throw error;
  }
}
