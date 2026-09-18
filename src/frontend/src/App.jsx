import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import BottomNav from './components/BottomNav';
import Login from './pages/Login';
import Laboratory from './pages/Laboratory';
import Products from './pages/Products';
import FaydaDashboard from './pages/FaydaDashboard';
import Profile from './pages/Profile';

// Eya • Pyjamas Collection & Le Laboratoire - Production Build
export default function App() {
  const [user, setUser] = useState(api.getUser());
  const [activeTab, setActiveTab] = useState('laboratoire');

  useEffect(() => {
    const handleLogout = () => {
      setUser(null);
    };

    window.addEventListener('auth-logout', handleLogout);
    return () => window.removeEventListener('auth-logout', handleLogout);
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setActiveTab('laboratoire');
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
  };

  if (!user) {
    return (
      <div className="app-container">
        <Login onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  return (
    <div className="app-container">
      <main style={{ flex: 1 }}>
        {activeTab === 'laboratoire' && <Laboratory />}
        {activeTab === 'produits' && <Products />}
        {activeTab === 'fayda' && <FaydaDashboard />}
        {activeTab === 'profil' && <Profile user={user} onLogout={handleLogout} />}
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
