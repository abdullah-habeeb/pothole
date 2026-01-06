import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

interface RoleBasedGuardProps {
    children: React.ReactNode;
    allowedRoles: string[];
}

export const RoleBasedGuard: React.FC<RoleBasedGuardProps> = ({ children, allowedRoles }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/auth" state={{ from: location }} replace />;
    }

    // Check role
    if (!allowedRoles.includes(user.role)) {
        // Redirect to their appropriate dashboard if logged in but unauthorized for this route
        // or to a generic "Unauthorized" page.
        // For now, let's redirect to their main dashboard to avoid "Access Denied" dead ends
        return <Navigate to="/dashboard" replace />;
    }

    // Check Government Authorization
    if (user.role === 'government' && !user.isGovernmentAuthorized) {
        return <Navigate to="/waiting" replace />;
    }

    return <>{children}</>;
};

export default RoleBasedGuard;
