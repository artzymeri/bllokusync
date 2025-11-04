"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/auth-api';

interface User {
  id: number;
  name: string;
  surname: string;
  email: string;
  number?: string;
  role: 'admin' | 'property_manager' | 'tenant';
  property_ids?: number[];
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (identifier: string, password: string, method?: 'email' | 'phone') => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  updateProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const isLoginInProgress = useRef(false);

  const isAuthenticated = !!user;

  const checkAuth = useCallback(async (): Promise<boolean> => {
    try {
      const isValid = await authAPI.verifyToken();

      if (isValid) {
        const response = await authAPI.getCurrentUser();
        if (response && response.success) {
          setUser(response.data);
          setIsLoading(false);
          return true;
        }
      }

      // Token invalid or no user - clear everything and redirect
      setUser(null);
      authAPI.removeToken();
      setIsLoading(false);
      return false;
    } catch (error) {
      console.error('Auth check error:', error);
      setUser(null);
      authAPI.removeToken();
      setIsLoading(false);
      return false;
    }
  }, []);

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = useCallback(async (identifier: string, password: string, method: 'email' | 'phone' = 'email') => {
    try {
      isLoginInProgress.current = true;
      
      const response = await authAPI.login(identifier, password, method);

      if (response.success && response.token) {
        // Store token
        authAPI.setToken(response.token);

        // Set user immediately - this prevents the checkAuth from running
        setUser(response.data);
        setIsLoading(false);

        // Give Safari iOS a moment to persist localStorage
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Redirect based on role
        const roleRoutes = {
          admin: '/admin',
          property_manager: '/property_manager',
          tenant: '/tenant'
        };

        const redirectPath = roleRoutes[response.data.role as keyof typeof roleRoutes] || '/';

        // Use setTimeout to ensure state updates complete before navigation
        setTimeout(() => {
          isLoginInProgress.current = false;
          router.push(redirectPath);
        }, 50);

        return { success: true };
      } else {
        isLoginInProgress.current = false;
        return {
          success: false,
          message: response.message || 'Login failed'
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      isLoginInProgress.current = false;
      return {
        success: false,
        message: 'An error occurred during login'
      };
    }
  }, [router]);

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      authAPI.removeToken();
    }
  }, [router]);

  const updateProfile = useCallback(async () => {
    try {
      const response = await authAPI.getCurrentUser();
      if (response && response.success) {
        setUser(response.data);
      }
    } catch (error) {
      console.error('Update profile error:', error);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated,
      login,
      logout,
      checkAuth,
      updateProfile
    }),
    [user, isLoading, isAuthenticated, login, logout, checkAuth, updateProfile]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
