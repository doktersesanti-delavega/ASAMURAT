import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase';

// Helper for currency formatting
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
};

export default function Tarif() {
  const [tarifData, setTarifData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchTarif();
  }, []);

  const fetchTarif = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('tarif_layanan').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setTarifData(data || []);
    } catch (error: any) {
      console.error("Error fetching tarif:", error.message);
      if (error.message?.includes('Could not find the table')) {
        setMessage({ type: 'error', text: 'Tabel tarif_layanan belum tersedia di database. Harap jalankan script migration_langkah2.sql di SQL Editor Supabase Anda.' });
      } else {
        setMessage({ type: 'error', text: 'Gagal mengambil data tarif: ' + error.message });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        Kategori: 'Poli Umum',
        Jenis_Pelayanan: 'Surat Keterangan Sehat (SKBN)',
        Tarif_Layanan: 15000,
      },
      {
        Kategori: 'Poli KIA',
        Jenis_Pelayanan: 'Surat Keterangan Hamil (SKH)',
        Tarif_Layanan: 20000,
      }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template_Tarif");
    XLSX.writeFile(wb, "Template_Tarif_Layanan.xlsx");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileLoading(true);
    setMessage({ type: '', text: '' });

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        // Asumsi data ada di sheet pertama
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Parse ke JSON
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet);
        
        if (rawJson.length === 0) {
          throw new Error('File Excel kosong atau format tidak sesuai.');
        }

        // Mapping ke format database
        // Header minimal: Jenis_Pelayanan, Tarif_Layanan (kasus insensitif via script)
        const payload = rawJson.map((row) => {
          // Cari property case-insensitive
          const getProp = (key: string) => {
            const foundKey = Object.keys(row).find(k => k.toLowerCase().replace(/_|\s/g, '') === key.toLowerCase());
            return foundKey ? row[foundKey] : null;
          };

          const jenisPelayanan = getProp('jenispelayanan');
          let tarifLayanan = getProp('tariflayanan') || getProp('tarifrupiah') || getProp('tarif');

          if (!jenisPelayanan) throw new Error('Kolom Jenis_Pelayanan tidak ditemukan di salah satu baris.');
          
          if (typeof tarifLayanan === 'string') {
              // Hapus semua karakter non-digit jika string
              tarifLayanan = parseFloat(tarifLayanan.replace(/[^0-9.-]+/g, '')) || 0;
          }

          return {
            jenis_pelayanan: jenisPelayanan,
            kategori: getProp('kategori') || 'Umum',
            tarif_rupiah: tarifLayanan || 0,
          };
        });

        // Insert database
        const { error } = await supabase.from('tarif_layanan').insert(payload);
        if (error) {
          if (error.message.includes('row-level security policy')) {
             throw new Error('Akses Ditolak (RLS). Buka Supabase > SQL Editor, lalu jalankan perintah ini:\n\nCREATE POLICY "Allow anon insert" ON public.tarif_layanan FOR ALL USING (true) WITH CHECK (true);');
          }
          throw error;
        }

        setMessage({ type: 'success', text: `Berhasil mengimpor ${payload.length} data tarif.` });
        fetchTarif();

      } catch (error: any) {
        setMessage({ type: 'error', text: error.message || 'Terjadi kesalahan saat memproses file Excel.' });
      } finally {
        setFileLoading(false);
        // Reset input file
        if (e.target) e.target.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 w-full relative">
      <header className="bg-white border-b border-slate-200 px-8 py-5 shrink-0 z-10 shadow-sm relative">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Manajemen Tarif Layanan</h2>
            <p className="text-sm text-slate-500 mt-1">Import dan kelola tarif layanan kesehatan fasilitas Anda</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Label info peran - visual mock */}
            <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full border border-amber-200 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
              Akses: Kasir / SuperAdmin
            </span>
          </div>
        </div>
      </header>

      <div className="flex-1 p-8 overflow-y-auto w-full relative">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-1 space-y-6">
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 relative overflow-hidden">
                    <h3 className="text-md font-bold text-slate-800 mb-2">Import Data Excel</h3>
                    <p className="text-sm text-slate-500 mb-4">Unggah file .xlsx untuk menambahkan tarif secara massal. Pastikan kolom memuat minimal <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">Jenis_Pelayanan</code> dan <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">Tarif_Layanan</code>.</p>
                    
                    <button 
                        onClick={handleDownloadTemplate}
                        className="mb-6 flex items-center justify-center w-full gap-2 px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:ring-2 focus:ring-slate-200 transition-colors bg-white shadow-sm"
                    >
                        <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path></svg>
                        Unduh Template Excel
                    </button>
                    
                    {message.text && (
                        <div className={`p-3 mb-4 rounded-lg text-sm font-medium border whitespace-pre-wrap ${message.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-slate-50/50 hover:bg-slate-50 transition-colors">
                        <svg className="w-10 h-10 text-slate-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        <span className="text-sm font-bold text-slate-700">Pilih file Excel</span>
                        <span className="text-xs text-slate-500 mt-1 mb-4">Mendukung file .xlsx dan .xls</span>
                        
                        <label className={`cursor-pointer px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors ${fileLoading ? 'opacity-50 pointer-events-none' : ''}`}>
                            {fileLoading ? 'Memproses...' : 'Browse File'}
                            <input 
                                type="file" 
                                className="hidden" 
                                accept=".xlsx, .xls" 
                                onChange={handleFileUpload} 
                                disabled={fileLoading}
                            />
                        </label>
                    </div>
                </div>
            </div>

            <div className="xl:col-span-2">
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-800">Daftar Tarif Layanan (Master Data)</h3>
                        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">{tarifData.length} Item</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-[#f8fafc]/80 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3">Kategori</th>
                                    <th className="px-6 py-3">Jenis Pelayanan</th>
                                    <th className="px-6 py-3 text-right">Tarif (Rp)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                                            <div className="w-6 h-6 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-2"></div>
                                            Memuat data...
                                        </td>
                                    </tr>
                                ) : tarifData.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-8 text-center text-slate-500">Menunggu import data tarif...</td>
                                    </tr>
                                ) : (
                                    tarifData.map((tarif) => (
                                        <tr key={tarif.id} className="hover:bg-slate-50/50">
                                            <td className="px-6 py-3">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700">
                                                    {tarif.kategori || 'Umum'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 font-medium text-slate-800">
                                                {tarif.jenis_pelayanan}
                                            </td>
                                            <td className="px-6 py-3 text-right font-mono text-slate-700">
                                                {formatCurrency(tarif.tarif_rupiah)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
