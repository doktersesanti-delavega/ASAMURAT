import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Surat from './pages/Surat';
import Verify from './pages/Verify';
import History from './pages/History';
import AppLayout from './components/AppLayout';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/surat/:jenis_surat" element={<Surat />} />
          <Route path="/history" element={<History />} />
        </Route>
        <Route path="/verify/:id" element={<Verify />} />
      </Routes>
    </BrowserRouter>
  );
}
