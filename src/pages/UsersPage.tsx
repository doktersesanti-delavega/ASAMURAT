import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string }>({ type: 'success', text: '' });

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

  const handleRoleChange = async (userId: string, newRole: string) => {
    const { error } = await supabase
      .from('users_profile')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) {
      setMessage({ type: 'error', text: 'Gagal mengubah role: ' + error.message });
    } else {
      setMessage({ type: 'success', text: 'Hak akses berhasil diperbarui.' });
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Manajemen Pengguna</h2>
          <p className="text-sm text-slate-500">Atur hak akses akun petugas dan dokter</p>
        </div>
      </div>

      {message.text && (
        <div className={`p-4 rounded-lg text-sm font-medium border ${message.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'}`}>
          {message.text}
        </div>
      )}

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
                  <th className="px-6 py-3 rounded-tl-lg">Nama Lengkap</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Role / Hak Akses</th>
                  <th className="px-6 py-3">Tgl Daftar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">Memuat data pengguna...</td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">Belum ada pengguna terdaftar selain Anda.</td>
                  </tr>
                ) : (
                  users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-800">{u.nama_lengkap}</td>
                      <td className="px-6 py-4 text-slate-600">{u.email || '-'}</td>
                      <td className="px-6 py-4">
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
                      <td className="px-6 py-4 text-slate-500">
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
  );
}
