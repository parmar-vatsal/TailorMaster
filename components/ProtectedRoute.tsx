import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { db } from '../services/db';
import { AuthUser } from '../types';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<AuthUser | null>(null);
    const location = useLocation();

    useEffect(() => {
        db.auth.getSession().then((u) => {
            setUser(u);
            setLoading(false);
        });
    }, []);

    if (loading) return <div>Loading...</div>;

    if (!user) {
        return <Navigate to="/" replace />;
    }

    // Check implementation of specific lock screen logic if needed
    // For now, if session exists, we render children.
    // However, the original app had a "PIN" lock state 'AUTH_PIN'.
    // We might want to handle that state globally or assume if they have session they are valid,
    // but maybe redirect to /unlock if session exists but 'locked' state is strictly stored.
    // The previous app stored 'view' state. Now we depend on URL.
    // Ideally we should have a context for 'isLocked'.

    return <>{children}</>;
};
