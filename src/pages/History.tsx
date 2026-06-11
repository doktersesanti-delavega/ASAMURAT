import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Edit2, Printer, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { pdf } from '@react-pdf/renderer';
import { SuratPDF } from '@/components/SuratPDF';

export default function History() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('surat_keterangan')
        .select(`
          *,
          pasien (*)
        `)
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) throw error;
      setHistory(data || []);
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleEdit = (row: any) => {
    navigate(`/surat/${row.jenis_surat.toLowerCase()}?edit_id=${row.id}`);
  };

  const handlePrint = async (row: any) => {
    try {
      if (!row.pasien) {
        alert("Data pasien tidak lengkap untuk dicetak.");
        return;
      }
      const doc = <SuratPDF suratType={row.jenis_surat} patient={row.pasien} dataKlinis={row.data_klinis || {}} suratId={row.id} nomorSuratFull={row.nomor_surat} />;
      const blob = await pdf(doc).toBlob();
      window.open(URL.createObjectURL(blob), '_blank');
    } catch (err) {
      console.error("Gagal mencetak dokumen:", err);
      alert("Terjadi kesalahan saat memproses dokumen cetak.");
    }
  };

  const handleDelete = async (rowId: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data ini?')) {
      try {
        const { error } = await supabase.from('surat_keterangan').delete().eq('id', rowId);
        if (error) throw error;
        setHistory(history.filter(item => item.id !== rowId));
      } catch (error) {
        console.error('Error deleting record:', error);
        alert('Gagal menghapus data.');
      }
    }
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
        <h2 className="text-lg font-bold text-slate-800">Riwayat Entry</h2>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs font-medium text-slate-500">{format(new Date(), 'EEEE, dd MMM yyyy', { locale: id })}</p>
            <p className="text-xs font-bold text-blue-600">Status Server: Online</p>
          </div>
        </div>
      </header>

      <div className="flex-1 p-8 overflow-y-auto w-full relative">
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Riwayat Inputan Terakhir</h3>
            <p className="text-xs text-slate-500">Menampilkan 30 surat terakhir yang dibuat</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-[#f8fafc]/80 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">No. Surat</th>
                  <th className="px-6 py-3">Jenis Surat</th>
                  <th className="px-6 py-3">Nama Pasien</th>
                  <th className="px-6 py-3">NIK</th>
                  <th className="px-6 py-3">Tanggal Entry</th>
                  <th className="px-6 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">Loading data...</td>
                  </tr>
                ) : history.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">Belum ada riwayat surat.</td>
                  </tr>
                ) : (
                  history.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-medium text-slate-900">{row.nomor_surat || '-'}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                          {row.jenis_surat}
                        </span>
                      </td>
                      <td className="px-6 py-4">{row.pasien?.nama || 'Tanpa Nama'}</td>
                      <td className="px-6 py-4">{row.pasien?.nik || '-'}</td>
                      <td className="px-6 py-4 text-xs whitespace-nowrap">
                        {row.created_at ? format(new Date(row.created_at), 'dd MMM yyyy HH:mm', { locale: id }) : '-'}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                        <button onClick={() => handlePrint(row)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Cetak">
                          <Printer className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleEdit(row)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(row.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Hapus">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
