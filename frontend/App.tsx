
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar.tsx';
import Dashboard from './pages/Dashboard.tsx';
import AccountDetail from './pages/AccountDetail.tsx';
import EventsFeed from './pages/EventsFeed.tsx';
import LandingPage from './pages/LandingPage.tsx';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  // Simple session check
  useEffect(() => {
    const session = sessionStorage.getItem('operator_session');
    if (session) setIsLoggedIn(true);
  }, []);

  const handleLogin = (operatorId: string) => {
    sessionStorage.setItem('operator_session', operatorId);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('operator_session');
    setIsLoggedIn(false);
    setSelectedAccountId(null);
    setActiveTab('dashboard');
  };

  const handleSelectAccount = (id: string) => {
    setSelectedAccountId(id);
    setActiveTab('account-detail');
  };

  const handleBackToDashboard = () => {
    setSelectedAccountId(null);
    setActiveTab('dashboard');
  };

  if (!isLoggedIn) {
    return <LandingPage onLogin={handleLogin} />;
  }

  const renderContent = () => {
    if (activeTab === 'dashboard') {
      return <Dashboard onSelectAccount={handleSelectAccount} />;
    }
    if (activeTab === 'account-detail' && selectedAccountId) {
      return <AccountDetail accountId={selectedAccountId} onBack={handleBackToDashboard} />;
    }
    if (activeTab === 'events') {
      return <EventsFeed />;
    }
    return null;
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-200">
      <Sidebar 
        activeTab={activeTab === 'account-detail' ? 'dashboard' : activeTab} 
        onTabChange={(tab) => {
          setActiveTab(tab);
          setSelectedAccountId(null);
        }} 
        onLogout={handleLogout}
      />
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
