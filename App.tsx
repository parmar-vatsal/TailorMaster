import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { ToastProvider } from './components/ToastContext';

import { ErrorBoundary } from './components/ErrorBoundary';

const App: React.FC = () => {
  return (
    <ToastProvider>
      <ErrorBoundary>
        <RouterProvider router={router} />
      </ErrorBoundary>
    </ToastProvider>
  );
};

export default App;
