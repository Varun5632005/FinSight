import React, { useState, useEffect } from 'react';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import AskFinSightChat from './components/AskFinSightChat';
import BudgetPop from './components/BudgetPop';
import DashboardOverview from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Insights from './pages/Insights';
import Settings from './pages/Settings';
import { AnimatePresence, motion } from 'framer-motion';
import { useDashboard } from './context/DashboardContext';
import Auth from './pages/Auth';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('finsight_auth');
  });
  const { user, setUser } = useDashboard();

  useEffect(() => {
    // If not authenticated but we have auth data in storage, clear it to be safe
    // If authenticated, ensure user context has the data
    const savedAuth = localStorage.getItem('finsight_auth');
    if (savedAuth && !user) {
      try {
        setUser(JSON.parse(savedAuth));
      } catch (e) {
        setIsAuthenticated(false);
      }
    }
  }, []);

  const handleAuth = async (status, userData) => {
    setIsAuthenticated(status);
    if (status) {
      setUser(userData);
      localStorage.setItem('finsight_auth', JSON.stringify(userData));
    } else {
      // Securely clear cookie from the backend
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      try {
        await fetch(`${BACKEND_URL}/api/users/logout`, {
          method: 'POST',
          credentials: 'include'
        });
      } catch (err) {
        console.error('Logout failed', err);
      }
      setUser(null);
      localStorage.removeItem('finsight_auth');
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardOverview />;
      case 'transactions':
        return <Transactions />;
      case 'insights':
        return <Insights />;
      case 'settings':
        return <Settings />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="app-container">
      {!isAuthenticated ? (
        <Auth setAuth={handleAuth} />
      ) : (
        <>
          <Sidebar 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            mobileOpen={mobileOpen}
            setMobileOpen={setMobileOpen}
            handleLogout={() => handleAuth(false)}
          />
          
          <main className="main-wrapper">
            <Topbar setMobileOpen={setMobileOpen} />
            <div className="content-scroll">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 15, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -15, scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                >
                  {renderContent()}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>

          <AskFinSightChat />
          <BudgetPop />
        </>
      )}
    </div>
  );
}

export default App;
