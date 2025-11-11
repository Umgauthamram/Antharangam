import React from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useDarkMode } from '../../hooks/useDarkMode'; 

export default function AuthLayout() {
  const [isDarkMode] = useDarkMode();

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <Toaster position="top-center" />
      <Outlet />
    </div>
  );
}