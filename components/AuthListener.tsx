import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../services/supabase';

export const AuthListener: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log("Auth Event:", event);

            if (event === 'SIGNED_IN' && session) {
                // If user is on public pages, redirect to unlock/dashboard
                const publicPaths = ['/', '/login', '/register'];
                if (publicPaths.includes(location.pathname)) {
                    navigate('/unlock');
                }
            }

            if (event === 'SIGNED_OUT') {
                // Optional: redirect to login if on protected routes
                // For now, ProtectedRoute handles this, so we might not need strict enforcement here
                // but it helps clear state if needed.
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [navigate, location]);

    return null;
};
