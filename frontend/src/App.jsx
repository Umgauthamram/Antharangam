import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import MainLayout from './components/layout/MainLayout';
import AuthLayout from './components/layout/AuthLayout';

import Dashboard from './pages/main/Dashboard';
import Cases from './pages/main/Cases';
import Search from './pages/main/Search';
import Harvesters from './pages/main/Harvesters';
import Settings from './pages/main/Settings';

import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import PageNotFound from './pages/PageNotFound';
import Landing from './pages/Landing';
import NewStrike from './pages/main/NewStrike';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AuthLayout />}>
        <Route index element={<Landing />} />
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Signup />} />
      </Route>

      <Route path="" element={<MainLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="cases" element={<Cases />} />
        <Route path="search" element={<Search />} />
        <Route path="harvesters" element={<Harvesters />} />
        <Route path="settings" element={<Settings />} />
        <Route path="new-strike" element={<NewStrike />} />
      </Route>

  
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
}