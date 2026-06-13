import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string }>({ type: 'success', text: '' });
  
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newNamaLengkap, setNewNamaLengkap] = useState('');
  const [newRole, setNewRole] = useState('Pendaftaran');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    setMessage({ type: 'success', text: '' });
    
    // Coba ambil dari view (apabila migration_auth.sql sudah di-run)
    const { data: viewData, error: viewError } = await supabase
      .from('vw_users_with_email')
      .select('*')
      .order('created_at', { ascending: false });

    if (!viewError && viewData) {
      setUsers(viewData);
    } else {
      // Fallback ke users_profile biasa jika view gagal
      const { data: profileData, error: profileError } = await supabase
        .from('users_profile')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (profileError) {
        setMessage({ type: 'error', text: 'Gagal memuat pengguna. Apakah Anda sudah menjalankan script migration_auth.sql?' });
      } else {
        setUsers(profileData || []);
        setMessage({ type: 'error', text: 'Menggunakan mode fallback (tanpa email). Harap jalankan file migration_auth.sql di Supabase SQL Editor.' });
      }
    }
    
    setIsLoading(false);
  };

  const handleRoleChange = async (userId: string, targetRole: string) => {
    const { error } = await supabase
      .from('users_profile')
      .update({ role: targetRole })
      .eq('id', userId);

    if (error) {
      setMessage({ type: 'error', text: 'Gagal mengubah role: ' + error.message });
    } else {
      setMessage({ type: 'success', text: 'Hak akses berhasil diperbarui.' });
      setUsers(users.map(u => u.id === userId ? { ...u, role: targetRole } : u));
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: 'success', text: '' });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Anda tidak sedang login.');
      }

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          email: newEmail,
          password: newPassword,
          nama_lengkap: newNamaLengkap,
          role: newRole
        })
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || 'Gagal membuat pengguna');
      }

      setMessage({ type: 'success', text: 'Pengguna berhasil dibuat secara eksklusif.' });
      setNewEmail('');
      setNewPassword('');
      setNewNamaLengkap('');
      setNewRole('Pendaftaran');
      
      // Refresh list
      fetchUsers();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Manajemen Pengguna</h2>
          <p className="text-sm text-slate-500">Buat dan atur hak akses akun petugas secara eksklusif.</p>
        </div>
      </div>

      {message.text && (
        <div className={`p-4 rounded-lg text-sm font-medium border ${message.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Buat Akun Baru</CardTitle>
              <CardDescription>Tambah pengguna baru ke dalam sistem.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nama">Nama Lengkap</Label>
                  <Input 
                    id="nama" 
                    type="text" 
                    value={newNamaLengkap}
                    onChange={(e) => setNewNamaLengkap(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role (Hak Akses)</Label>
                  <select 
                    id="role"
                    className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                  >
                    <option value="SuperAdmin">SuperAdmin</option>
                    <option value="Pendaftaran">Pendaftaran</option>
                    <option value="Dokter">Dokter</option>
                    <option value="Kasir">Kasir</option>
                  </select>
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? 'Memproses...' : 'Buat Akun Eksklusif'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Daftar Akun Terdaftar</CardTitle>
              <CardDescription>Semua akun yang mendaftar ke sistem tampil di sini.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-lg">Nama Lengkap</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Role / Hak Akses</th>
                      <th className="px-4 py-3">Tgl Daftar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isLoading ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-slate-500">Memuat data pengguna...</td>
                      </tr>
                    ) : users.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-slate-500">Belum ada pengguna terdaftar.</td>
                      </tr>
                    ) : (
                      users.map(u => (
                        <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-4 font-medium text-slate-800">{u.nama_lengkap}</td>
                          <td className="px-4 py-4 text-slate-600">{u.email || '-'}</td>
                          <td className="px-4 py-4">
                            <select 
                              className="bg-white border border-slate-200 text-slate-700 rounded px-2 py-1 text-sm focus:ring-slate-300 focus:border-slate-400"
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            >
                              <option value="SuperAdmin">SuperAdmin</option>
                              <option value="Pendaftaran">Pendaftaran</option>
                              <option value="Dokter">Dokter</option>
                              <option value="Kasir">Kasir</option>
                            </select>
                          </td>
                          <td className="px-4 py-4 text-slate-500">
                            {new Date(u.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
