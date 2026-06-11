import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Whitelist Email Petugas/Admin (simulasi security level frontend sementara)
    const allowedEmails = ['admin@medisign.com', 'ady.alfinady@gmail.com', 'petugas@puskesmas.com', 'mbakdana@puskesmas.com', 'doktersesanti@gmail.com'];

    setTimeout(() => {
      if (!allowedEmails.includes(email.toLowerCase())) {
        setError('Akses ditolak! Email Anda tidak terdaftar sebagai petugas valid yang memiliki izin sistem.');
        setIsLoading(false);
        return;
      }
      navigate('/dashboard');
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans p-4">
      <Card className="w-full max-w-md border-slate-200 shadow-sm rounded-xl">
        <CardHeader className="text-center space-y-3 pb-8">
          <div className="w-12 h-12 bg-blue-600 rounded flex items-center justify-center mx-auto mb-2 shadow-lg shadow-blue-500/20">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800">MediSign Elite</CardTitle>
          <CardDescription className="text-sm font-medium text-slate-500 uppercase tracking-widest">Sistem Informasi Surat Keterangan</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-medium text-center">
              {error}
            </div>
          )}
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-bold text-slate-600 uppercase">Email Petugas</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="mbakdana@puskesmas.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
                className="bg-slate-50 border-slate-300 py-2.5"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-bold text-slate-600 uppercase">Password</Label>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                className="bg-slate-50 border-slate-300 py-2.5"
              />
            </div>
            
            <p className="text-[10px] text-slate-400 text-center">
              *Hanya email yang telah didaftarkan (contoh: mbakdana@puskesmas.com) yang dapat mengakses sistem ini.
            </p>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Memverifikasi Akses...' : 'Masuk Sistem'}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
