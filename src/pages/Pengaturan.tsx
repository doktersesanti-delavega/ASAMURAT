import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function Pengaturan() {
  const [instansi, setInstansi] = useState<any>(null);
  const [tenagaMedis, setTenagaMedis] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingInstansi, setIsSavingInstansi] = useState(false);
  const [instansiMessage, setInstansiMessage] = useState<{ type: 'error' | 'success', text: string }>({ type: 'success', text: '' });
  
  // Dokter form state
  const [isSavingDokter, setIsSavingDokter] = useState(false);
  const [dokterMessage, setDokterMessage] = useState<{ type: 'error' | 'success', text: string }>({ type: 'success', text: '' });
  const [editDokterId, setEditDokterId] = useState<string | null>(null);
  const [dokterForm, setDokterForm] = useState({
    nama_lengkap: '',
    nip: '',
    no_sip: '',
    jabatan: 'Dokter Pemeriksa'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    
    // Fetch Instansi
    const { data: instansiData } = await supabase
      .from('pengaturan_instansi')
      .select('*')
      .eq('id', 1)
      .maybeSingle();
      
    if (instansiData) {
      setInstansi(instansiData);
    }

    // Fetch Tenaga Medis
    const { data: medisData } = await supabase
      .from('tenaga_medis')
      .select('*')
      .order('created_at', { ascending: true });
      
    if (medisData) {
      setTenagaMedis(medisData);
    }
    
    setIsLoading(false);
  };

  const handleSaveInstansi = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingInstansi(true);
    setInstansiMessage({ type: 'success', text: '' });

    try {
      const { error } = await supabase
        .from('pengaturan_instansi')
        .update({
          pemerintah_daerah: instansi.pemerintah_daerah,
          dinas_naungan: instansi.dinas_naungan,
          nama_instansi: instansi.nama_instansi,
          alamat: instansi.alamat,
          telepon: instansi.telepon,
          email: instansi.email,
          website: instansi.website,
          nama_kabupaten: instansi.nama_kabupaten,
          logo_kiri: instansi.logo_kiri,
          logo_kanan: instansi.logo_kanan,
        })
        .eq('id', 1);

      if (error) throw error;
      setInstansiMessage({ type: 'success', text: 'Pengaturan instansi berhasil disimpan.' });
    } catch (err: any) {
      setInstansiMessage({ type: 'error', text: err.message });
    } finally {
      setIsSavingInstansi(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>, position: 'kiri' | 'kanan') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit for base64 storage
        setInstansiMessage({ type: 'error', text: 'Ukuran logo maksimal 1MB.' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setInstansi({ ...instansi, [position === 'kiri' ? 'logo_kiri' : 'logo_kanan']: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveDokter = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingDokter(true);
    setDokterMessage({ type: 'success', text: '' });

    try {
      if (editDokterId) {
        // Edit
        const { error } = await supabase
          .from('tenaga_medis')
          .update(dokterForm)
          .eq('id', editDokterId);
        if (error) throw error;
        setDokterMessage({ type: 'success', text: 'Data tenaga medis berhasil diperbarui.' });
      } else {
        // Create
        const { error } = await supabase
          .from('tenaga_medis')
          .insert([dokterForm]);
        if (error) throw error;
        setDokterMessage({ type: 'success', text: 'Data tenaga medis berhasil ditambahkan.' });
      }
      
      setEditDokterId(null);
      setDokterForm({ nama_lengkap: '', nip: '', no_sip: '', jabatan: 'Dokter Pemeriksa' });
      fetchData();
    } catch (err: any) {
      setDokterMessage({ type: 'error', text: err.message });
    } finally {
      setIsSavingDokter(false);
    }
  };

  const handleEditDokter = (dokter: any) => {
    setEditDokterId(dokter.id);
    setDokterForm({
      nama_lengkap: dokter.nama_lengkap,
      nip: dokter.nip || '',
      no_sip: dokter.no_sip || '',
      jabatan: dokter.jabatan || 'Dokter Pemeriksa'
    });
    setDokterMessage({ type: 'success', text: '' });
  };

  const handleDeleteDokter = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus data tenaga medis ini?')) return;
    
    setDokterMessage({ type: 'success', text: '' });
    try {
      const { error } = await supabase.from('tenaga_medis').delete().eq('id', id);
      if (error) throw error;
      setDokterMessage({ type: 'success', text: 'Data berhasil dihapus.' });
      fetchData();
    } catch (err: any) {
      setDokterMessage({ type: 'error', text: err.message });
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Memuat pengaturan...</div>;
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-800">Pengaturan Instansi & Tenaga Medis</h2>
        <p className="text-sm text-slate-500">Kelola identitas Puskesmas/Klinik dan daftar dokter pemeriksa.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* BAGIAN INSTANSI */}
        <Card>
          <CardHeader>
            <CardTitle>Identitas KOP Surat</CardTitle>
            <CardDescription>Informasi ini akan tercetak sebagai Kop pada semua Surat Keterangan.</CardDescription>
          </CardHeader>
          <CardContent>
            {instansiMessage.text && (
              <div className={`p-3 mb-4 rounded-lg text-sm font-medium border ${instansiMessage.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'}`}>
                {instansiMessage.text}
              </div>
            )}
            <form onSubmit={handleSaveInstansi} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pemerintah_daerah">Pemerintah Daerah / Kota (KOP Atas)</Label>
                  <Input 
                    id="pemerintah_daerah" 
                    value={instansi?.pemerintah_daerah || ''}
                    onChange={(e) => setInstansi({...instansi, pemerintah_daerah: e.target.value})}
                    placeholder="Contoh: PEMERINTAH KABUPATEN LAMONGAN"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dinas_naungan">Dinas Naungan</Label>
                  <Input 
                    id="dinas_naungan" 
                    value={instansi?.dinas_naungan || ''}
                    onChange={(e) => setInstansi({...instansi, dinas_naungan: e.target.value})}
                    placeholder="Contoh: DINAS KESEHATAN"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nama_kabupaten">Nama Kabupaten/Kota</Label>
                  <Input 
                    id="nama_kabupaten" 
                    value={instansi?.nama_kabupaten || ''}
                    onChange={(e) => setInstansi({...instansi, nama_kabupaten: e.target.value})}
                    placeholder="Contoh: Lamongan"
                  />
                  <p className="text-xs text-slate-500">Akan digunakan pada tempat & tanggal TTD.</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nama_instansi">Nama Instansi</Label>
                <Input 
                  id="nama_instansi" 
                  value={instansi?.nama_instansi || ''}
                  onChange={(e) => setInstansi({...instansi, nama_instansi: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="alamat">Alamat Lengkap</Label>
                <Input 
                  id="alamat" 
                  value={instansi?.alamat || ''}
                  onChange={(e) => setInstansi({...instansi, alamat: e.target.value})}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telepon">Telepon</Label>
                  <Input 
                    id="telepon" 
                    value={instansi?.telepon || ''}
                    onChange={(e) => setInstansi({...instansi, telepon: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email_instansi">Email</Label>
                  <Input 
                    id="email_instansi" 
                    type="email"
                    value={instansi?.email || ''}
                    onChange={(e) => setInstansi({...instansi, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="website">Website</Label>
                  <Input 
                    id="website" 
                    type="url"
                    value={instansi?.website || ''}
                    onChange={(e) => setInstansi({...instansi, website: e.target.value})}
                    placeholder="Contoh: https://lamongankab.go.id/puskesmas"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <div className="space-y-2">
                  <Label htmlFor="logo_kiri">Logo Kiri (Opsional)</Label>
                  <div className="flex flex-col gap-2">
                    {instansi?.logo_kiri && (
                       <img src={instansi.logo_kiri} alt="Logo Kiri" className="w-16 h-16 object-contain border border-slate-200 rounded bg-white p-1" />
                    )}
                    <Input 
                      id="logo_kiri" 
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleLogoChange(e, 'kiri')}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logo_kanan">Logo Kanan (Opsional)</Label>
                   <div className="flex flex-col gap-2">
                    {instansi?.logo_kanan && (
                       <img src={instansi.logo_kanan} alt="Logo Kanan" className="w-16 h-16 object-contain border border-slate-200 rounded bg-white p-1" />
                    )}
                    <Input 
                      id="logo_kanan" 
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleLogoChange(e, 'kanan')}
                    />
                  </div>
                </div>
              </div>
              <Button type="submit" disabled={isSavingInstansi} className="w-full">
                {isSavingInstansi ? 'Menyimpan...' : 'Simpan Pengaturan KOP'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* BAGIAN DOKTER */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Tenaga Medis / Dokter</CardTitle>
            <CardDescription>Atur daftar dokter penandatangan / pemeriksa.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {dokterMessage.text && (
              <div className={`p-3 rounded-lg text-sm font-medium border ${dokterMessage.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'}`}>
                {dokterMessage.text}
              </div>
            )}
            
            <form onSubmit={handleSaveDokter} className="space-y-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <h3 className="font-semibold text-slate-700 text-sm">{editDokterId ? 'Edit Tenaga Medis' : 'Tambah Tenaga Medis Baru'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="nama_dokter">Nama Lengkap & Gelar</Label>
                  <Input 
                    id="nama_dokter" 
                    value={dokterForm.nama_lengkap}
                    onChange={(e) => setDokterForm({...dokterForm, nama_lengkap: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nip">NIP (Optional)</Label>
                  <Input 
                    id="nip" 
                    value={dokterForm.nip}
                    onChange={(e) => setDokterForm({...dokterForm, nip: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="no_sip">No. SIP (Optional)</Label>
                  <Input 
                    id="no_sip" 
                    value={dokterForm.no_sip}
                    onChange={(e) => setDokterForm({...dokterForm, no_sip: e.target.value})}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="jabatan">Jabatan</Label>
                  <Input 
                    id="jabatan" 
                    value={dokterForm.jabatan}
                    onChange={(e) => setDokterForm({...dokterForm, jabatan: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isSavingDokter} className="flex-1">
                  {isSavingDokter ? 'Menyimpan...' : (editDokterId ? 'Perbarui Data' : 'Tambah Data')}
                </Button>
                {editDokterId && (
                  <Button type="button" variant="outline" onClick={() => { setEditDokterId(null); setDokterForm({ nama_lengkap: '', nip: '', no_sip: '', jabatan: 'Dokter Pemeriksa' }); }}>
                    Batal
                  </Button>
                )}
              </div>
            </form>

            <div className="overflow-x-auto flex-1 border border-slate-200 rounded-lg">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2">Nama Lengkap</th>
                    <th className="px-4 py-2">NIP / SIP</th>
                    <th className="px-4 py-2 w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tenagaMedis.map(m => (
                    <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {m.nama_lengkap}
                        <div className="text-xs text-slate-500 font-normal">{m.jabatan}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        <div>NIP: {m.nip || '-'}</div>
                        <div>SIP: {m.no_sip || '-'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => handleEditDokter(m)} className="text-blue-600 hover:text-blue-800" title="Edit">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                          </button>
                          <button onClick={() => handleDeleteDokter(m.id)} className="text-red-500 hover:text-red-700" title="Hapus">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {tenagaMedis.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-6 text-center text-slate-500">Belum ada data tenaga medis.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </CardContent>
        </Card>

      </div>
    </div>
  );
}
