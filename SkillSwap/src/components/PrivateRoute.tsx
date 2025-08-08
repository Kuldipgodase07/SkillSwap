import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface PrivateRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean; // Restrict to super_admin role
  isActive?: boolean;  // Additional flag for conditional access
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, adminOnly, isActive }) => {
  const { currentUser, userProfile, loading } = useAuth();

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // If isActive is explicitly false, block access
  if (isActive === false) {
    return <Navigate to="/inactive" replace />;
  }

  // If adminOnly, check user role
  if (adminOnly) {
    if (userProfile?.role === 'super_admin' && userProfile?.email === 'admin@gmail.com') {
      return <>{children}</>;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

export default PrivateRoute;
