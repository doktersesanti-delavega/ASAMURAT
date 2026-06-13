import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { pdf } from '@react-pdf/renderer';
import { KwitansiDocument } from '@/components/KwitansiPDF';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
};

export default function Kasir() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [instansiData, setInstansiData] = useState<any>(null);

  useEffect(() => {
    async function initData() {
      const { data } = await supabase.from('pengaturan_instansi').select('*').eq('id', 1).maybeSingle();
      if (data) setInstansiData(data);
      fetchPayments();
    }
    initData();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      // Supabase mock / client we built supports nested selects loosely via custom processing
      const { data, error } = await supabase
        .from('pembayaran')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        if (error.message?.includes('Could not find the table')) {
          setPayments([]);
          return;
        }
        throw error;
      }
      
      // In the mockup we might need to manually populate surat details
      let enrichedData = data || [];
      const { data: suratData } = await supabase.from('surat_keterangan').select('*');
      const { data: pasienData } = await supabase.from('pasien').select('*');
      
      if (suratData && pasienData) {
        enrichedData = enrichedData.map((p: any) => {
          const surat = suratData.find((s: any) => s.id === p.surat_keterangan_id);
          const pasien = surat ? pasienData.find((ps: any) => ps.id === surat.pasien_id) : null;
          return { ...p, surat, pasien };
        });
      }

      setPayments(enrichedData);
    } catch (error: any) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayment = async (id: string) => {
    setProcessingId(id);
    try {
      const { error } = await supabase
        .from('pembayaran')
        .update({ 
          status: 'LUNAS',
          metode_pembayaran: 'CASH'
        })
        .eq('id', id);

      if (error) throw error;
      await fetchPayments();
    } catch (error: any) {
      alert("Gagal memproses pembayaran: " + error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleCetakKwitansi = async (p: any) => {
    try {
      const doc = <KwitansiDocument 
        nomorKwitansi={p.nomor_kwitansi}
        namaPasien={p.pasien?.nama || 'Tanpa Nama'}
        totalBayar={p.total_bayar}
        jenisPelayanan={p.surat?.jenis_surat || 'Pelayanan Surat Keterangan'}
        tanggal={new Date(p.updated_at || p.created_at).toLocaleDateString('id-ID', {day: '2-digit', month: 'long', year: 'numeric'})}
        instansiData={instansiData}
      />;
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err: any) {
      alert("Gagal mencetak kwitansi: " + err.message);
    }
  };

  const pendingPayments = payments.filter(p => p.status === 'PENDING');
  const finishedPayments = payments.filter(p => p.status === 'LUNAS').slice(0, 50);

  return (
    <div className="flex flex-col h-full bg-slate-50 w-full relative">
      <header className="bg-white border-b border-slate-200 px-8 py-5 shrink-0 z-10 shadow-sm relative">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Antrean Kasir</h2>
            <p className="text-sm text-slate-500 mt-1">Proses pembayaran untuk surat keterangan medis yang diterbitkan</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full border border-amber-200 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
              Akses: Kasir
            </span>
          </div>
        </div>
      </header>

      <div className="flex-1 p-8 overflow-y-auto w-full relative">
        <div className="space-y-8">
          
          {/* PENDING */}
          <div className="bg-white border border-rose-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-rose-100 flex items-center justify-between bg-rose-50/50">
              <h3 className="text-sm font-bold text-rose-800 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                Antrean Pembayaran (Pending)
              </h3>
              <span className="text-xs font-medium text-rose-700 bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-full">{pendingPayments.length} Antrean</span>
            </div>
            
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {loading && pendingPayments.length === 0 ? (
                <div className="col-span-full py-8 text-center text-slate-500">Memuat antrean...</div>
              ) : pendingPayments.length === 0 ? (
                <div className="col-span-full py-12 text-center flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                    <span className="text-2xl">☕</span>
                  </div>
                  <p className="text-slate-500 font-medium">Belum ada antrean pembayaran saat ini.</p>
                </div>
              ) : (
                pendingPayments.map(p => (
                  <div key={p.id} className="border border-slate-200 bg-white rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-rose-400"></div>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 mb-1 border border-slate-200">
                          {p.surat?.jenis_surat || 'SURAT'} - {p.surat?.nomor_surat || 'N/A'}
                        </span>
                        <h4 className="font-bold text-slate-800 leading-tight line-clamp-1">{p.pasien?.nama || 'Tanpa Nama'}</h4>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-0.5">Total Tagihan</p>
                        <p className="font-bold text-rose-600 text-sm tracking-tight">{formatCurrency(p.total_bayar)}</p>
                      </div>
                    </div>
                    
                    <div className="text-xs text-slate-500 mb-4 font-mono truncate">
                      REF: {p.nomor_kwitansi}
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2">
                       <button 
                         onClick={() => handleProcessPayment(p.id)}
                         disabled={processingId === p.id}
                         className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                       >
                         {processingId === p.id ? 'Memproses...' : 'Proses Lunas (Cash)'}
                       </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* HISTORY */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
             <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Riwayat Transaksi (Hari Ini)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-[#f8fafc]/80 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3">Waktu</th>
                    <th className="px-6 py-3">No. Kwitansi</th>
                    <th className="px-6 py-3">Pasien & Layanan</th>
                    <th className="px-6 py-3">Metode</th>
                    <th className="px-6 py-3 text-right">Total Bayar</th>
                    <th className="px-6 py-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {finishedPayments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-500">Belum ada riwayat transaksi lunas.</td>
                    </tr>
                  ) : (
                    finishedPayments.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-3 font-mono text-xs whitespace-nowrap">
                          {new Date(p.updated_at || p.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-6 py-3 font-mono font-medium text-slate-700">
                          {p.nomor_kwitansi}
                        </td>
                        <td className="px-6 py-3">
                          <div className="font-medium text-slate-800">{p.pasien?.nama || 'Tanpa Nama'}</div>
                          <div className="text-xs text-slate-500">{p.surat?.jenis_surat || '-'}</div>
                        </td>
                        <td className="px-6 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {p.metode_pembayaran || 'CASH'}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-right font-medium text-slate-800 tracking-tight">
                          {formatCurrency(p.total_bayar)}
                        </td>
                        <td className="px-6 py-3 text-center">
                          <button 
                            onClick={() => handleCetakKwitansi(p)}
                            className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-3 py-1.5 rounded text-xs font-semibold shadow-sm inline-flex items-center gap-1"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                            Kwitansi
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
      </div>
    </div>
  );
}
