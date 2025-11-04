"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: Array<'admin' | 'property_manager' | 'tenant'>;
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    const verifyAccess = async () => {
      // Wait for auth check to complete
      if (isLoading) return;

      // Not authenticated - redirect to login immediately
      if (!isAuthenticated || !user) {
        setIsRedirecting(true);
        router.replace('/login');
        return;
      }

      // Check if user role is allowed
      if (!allowedRoles.includes(user.role)) {
        setIsRedirecting(true);
        // Redirect to appropriate dashboard based on their role
        const roleRoutes = {
          admin: '/admin',
          property_manager: '/property_manager',
          tenant: '/tenant'
        };
        router.replace(roleRoutes[user.role]);
        return;
      }

      // User is authenticated and authorized
      setIsAuthorized(true);
    };

    verifyAccess();
  }, [user, isLoading, isAuthenticated, allowedRoles, router]);

  // Show loading state while checking auth or redirecting
  if (isLoading || isRedirecting || !isAuthorized) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-600 border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
        </div>
      </div>
    );
  }

  // Render protected content
  return <>{children}</>;
}
