
import React, { useState, useEffect } from 'react';
import { ViewState, AppConfig } from './types';
import { db } from './services/db';
import { Layout } from './components/Layout';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { OrderCreation } from './components/OrderCreation';
import { OrderList } from './components/OrderList';
import { InvoiceView } from './components/InvoiceView';
import { Settings } from './components/Settings';
import { Reports } from './components/Reports';
import { CustomerList } from './components/CustomerList';
import { LandingPage } from './components/LandingPage';
import { AuthFlow } from './components/AuthFlow';
import { ExpenseTracker } from './components/ExpenseTracker';
import { DesignCatalog } from './components/DesignCatalog';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('LANDING');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [config, setConfig] = useState<AppConfig>({ shopName: '', pin: '' });
  
  // Initialize App State based on Session
  useEffect(() => {
    const init = async () => {
        const user = await db.auth.checkSession();
        if (user) {
          // If session exists, go to PIN lock
          setView('AUTH_PIN');
        } else {
          setView('LANDING');
        }
        
        // Load config
        try {
            const conf = await db.config.get();
            setConfig(conf);
        } catch (e) {
            console.log("No config loaded");
        }
    };
    init();
  }, []);

  // Auto-lock feature
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        // Only lock if we are inside the authenticated part of the app
        if (view !== 'LANDING' && view !== 'LOGIN' && view !== 'REGISTER' && view !== 'AUTH_PIN') {
            setView('AUTH_PIN');
        }
      }, 5 * 60 * 1000); // 5 minutes inactivity
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
  }, [view]);

  // Auth Handlers
  const handleAuthSuccess = () => {
    setView('DASHBOARD');
  };

  const handleLogout = () => {
    db.auth.logout();
    setView('LANDING');
  };

  // Render logic based on ViewState
  const renderContent = () => {
    switch (view) {
      case 'LANDING':
        return <LandingPage onLogin={() => setView('LOGIN')} onRegister={() => setView('REGISTER')} />;
      
      case 'LOGIN':
        return <AuthFlow mode="LOGIN" onBack={() => setView('LANDING')} onSuccess={() => {
            db.config.get().then(setConfig);
            setView('AUTH_PIN');
        }} onSwitchMode={() => setView('REGISTER')} />;
      
      case 'REGISTER':
        return <AuthFlow mode="REGISTER" onBack={() => setView('LANDING')} onSuccess={() => {
            db.config.get().then(setConfig);
            setView('AUTH_PIN');
        }} onSwitchMode={() => setView('LOGIN')} />;

      case 'AUTH_PIN':
        return <Auth onSuccess={handleAuthSuccess} onLogout={handleLogout} />;
      
      // Protected Routes
      default:
        return (
          <Layout 
              view={view} 
              onNavigate={setView} 
              shopName={config.shopName}
              onLogout={() => setView('AUTH_PIN')} // Standard logout just locks the screen
          >
            {(() => {
              switch(view) {
                case 'DASHBOARD': return <Dashboard onNavigate={setView} />;
                case 'NEW_ORDER': return <OrderCreation onCancel={() => setView('DASHBOARD')} onSuccess={(id) => { setSelectedOrderId(id); setView('INVOICE'); }} />;
                case 'ORDER_LIST': return <OrderList onSelectOrder={(id) => { setSelectedOrderId(id); setView('INVOICE'); }} />;
                case 'CUSTOMER_LIST': return <CustomerList />;
                case 'INVOICE': return selectedOrderId ? <InvoiceView orderId={selectedOrderId} onBack={() => setView('ORDER_LIST')} /> : null;
                case 'REPORTS': return <Reports />;
                case 'SETTINGS': return <Settings />;
                case 'EXPENSES': return <ExpenseTracker />;
                case 'CATALOG': return <DesignCatalog />;
                default: return <Dashboard onNavigate={setView} />;
              }
            })()}
          </Layout>
        );
    }
  };

  return <>{renderContent()}</>;
};

export default App;
