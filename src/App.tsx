import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Surat from './pages/Surat';
import Verify from './pages/Verify';
import History from './pages/History';
import Tarif from './pages/Tarif';
import Kasir from './pages/Kasir';
import UsersPage from './pages/UsersPage';
import Pengaturan from './pages/Pengaturan';
import AppLayout from './components/AppLayout';

// Komponen pelindung rute yang wajib login
function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) {
  const { session, profile, isLoading } = useAuth();

  if (isLoading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-slate-50"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div></div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/surat/:jenis_surat" element={<ProtectedRoute allowedRoles={['Dokter', 'Pendaftaran', 'SuperAdmin']}><Surat /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute allowedRoles={['Dokter', 'Pendaftaran', 'SuperAdmin']}><History /></ProtectedRoute>} />
            <Route path="/tarif" element={<ProtectedRoute allowedRoles={['Kasir', 'SuperAdmin']}><Tarif /></ProtectedRoute>} />
            <Route path="/kasir" element={<ProtectedRoute allowedRoles={['Kasir', 'SuperAdmin']}><Kasir /></ProtectedRoute>} />
            <Route path="/pengguna" element={<ProtectedRoute allowedRoles={['SuperAdmin']}><UsersPage /></ProtectedRoute>} />
            <Route path="/pengaturan" element={<ProtectedRoute allowedRoles={['SuperAdmin']}><Pengaturan /></ProtectedRoute>} />
          </Route>
          <Route path="/verify/:id" element={<Verify />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
