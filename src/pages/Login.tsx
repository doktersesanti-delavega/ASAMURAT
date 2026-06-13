import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Login() {
  const navigate = useNavigate();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [namaLengkap, setNamaLengkap] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isLoginMode) {
        // Mode Login
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes('Email not confirmed')) {
             throw new Error('Email belum dikonfirmasi.\n\nSolusi: Buka dashboard Supabase Anda > menu Authentication > Providers > Email > matikan pengaturan "Confirm email", lalu simpan. Setelah itu Anda bisa langsung masuk tanpa konfirmasi email.');
          }
          throw error;
        }
        
        navigate('/dashboard');
      } else {
        // Mode Register
        if (!namaLengkap.trim()) {
           throw new Error("Nama lengkap wajib diisi.");
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              nama_lengkap: namaLengkap
            }
          }
        });

        if (error) throw error;

        if (data.session === null) {
            setSuccess('Pendaftaran berhasil! Sistem membutuhkan konfirmasi email. Silakan cek kotak masuk email Anda, atau matikan fitur "Confirm Email" pada pengaturan Supabase Anda.');
        } else {
            setSuccess('Pendaftaran berhasil! Silakan masuk menggunakan akun baru Anda.');
        }
        setIsLoginMode(true);
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan pada saat memproses permintaan.');
    } finally {
      setIsLoading(false);
    }
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
          <div className="flex bg-slate-100 p-1 rounded-lg mb-6">
            <button 
              type="button"
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${isLoginMode ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => { setIsLoginMode(true); setError(''); setSuccess(''); }}
            >
              Masuk
            </button>
            <button 
              type="button"
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${!isLoginMode ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => { setIsLoginMode(false); setError(''); setSuccess(''); }}
            >
              Daftar Baru
            </button>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-medium text-center whitespace-pre-wrap text-left">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm font-medium text-center whitespace-pre-wrap">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLoginMode && (
              <div className="space-y-2">
                <Label htmlFor="nama" className="text-xs font-bold text-slate-600 uppercase">Nama Lengkap</Label>
                <Input 
                  id="nama" 
                  type="text" 
                  placeholder="Dr. Andi Susanto" 
                  value={namaLengkap}
                  onChange={(e) => setNamaLengkap(e.target.value)}
                  required={!isLoginMode} 
                  className="bg-slate-50 border-slate-300 py-2.5"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-bold text-slate-600 uppercase">Email Petugas</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="petugas@fasilitas.com" 
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
                minLength={6}
                className="bg-slate-50 border-slate-300 py-2.5"
              />
            </div>
            
            <p className="text-[10px] text-slate-400 text-center">
              {isLoginMode 
                ? "*Silakan masuk menggunakan akun yang telah terdaftar." 
                : "*Peran standar akun baru adalah 'Pendaftaran'. Hubungi SuperAdmin untuk mengubah peran."}
            </p>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Memproses...' : (isLoginMode ? 'Masuk Sistem' : 'Daftar Akun')}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
