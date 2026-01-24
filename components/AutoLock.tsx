import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export const AutoLock = () => {
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const publicPaths = ['/', '/login', '/register', '/unlock'];
        if (publicPaths.includes(location.pathname)) return;

        let timer: NodeJS.Timeout;
        const resetTimer = () => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                navigate('/unlock');
            }, 5 * 60 * 1000); // 5 minutes
        };

        window.addEventListener('click', resetTimer);
        window.addEventListener('touchstart', resetTimer);
        window.addEventListener('keypress', resetTimer);
        resetTimer();

        return () => {
            window.removeEventListener('click', resetTimer);
            window.removeEventListener('touchstart', resetTimer);
            window.removeEventListener('keypress', resetTimer);
            clearTimeout(timer);
        };
    }, [location.pathname, navigate]);

    return null;
};
