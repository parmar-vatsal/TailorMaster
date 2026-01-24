import React from 'react';
import { Outlet } from 'react-router-dom';
import { AuthListener } from './AuthListener';

export const GlobalLayout: React.FC = () => {
    return (
        <>
            <AuthListener />
            <Outlet />
        </>
    );
};
