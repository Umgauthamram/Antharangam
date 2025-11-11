import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useDarkMode } from '../../hooks/useDarkMode'; 
import Sidebar from './Sidebar';
import Header from './Header';

export default function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDarkMode, toggleDarkMode] = useDarkMode();
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <div className={`flex h-screen bg-primary text-primary overflow-hidden ${isDarkMode ? 'dark' : ''}`}>
      <Toaster 
        position="bottom-right"
        toastOptions={{
          style: {
            border: '1px solid var(--color-border)',
            color: 'var(--color-text)',
            backgroundColor: 'var(--color-bg-subtle)',
          },
        }}
      />

      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          toggleDarkMode={toggleDarkMode}
          isDarkMode={isDarkMode}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-subtle">
          <div className="container mx-auto px-6 py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}