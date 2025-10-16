import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ReactNode } from 'react';

interface PrivateRouteProps {
  children: ReactNode;
}

export default function PrivateRoute({ children }: PrivateRouteProps) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (user === undefined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-purple-700 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 animate-fade-in">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
            <p className="text-slate-600">Checking authentication...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login with the current path as state, so we can redirect back after login
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
