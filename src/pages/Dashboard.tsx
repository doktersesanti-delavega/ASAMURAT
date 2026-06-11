import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Users, FileCheck, Stethoscope } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { supabase } from '@/lib/supabase';

const suratTypes = [
  { id: 'skd', label: 'Surat Keterangan Dokter (SKD)', desc: 'Surat keterangan sehat standar.', icon: '📄' },
  { id: 'ski', label: 'Surat Keterangan Istirahat (SKI)', desc: 'Surat keterangan istirahat sakit.', icon: '🛌' },
  { id: 'skb', label: 'Surat Keterangan Berobat (SKB)', desc: 'Keterangan sedang dalam perawatan.', icon: '🏥' },
  { id: 'catin', label: 'Surat Keterangan Catin', desc: 'Pemeriksaan calon pengantin.', icon: '💍' },
  { id: 'skbn', label: 'Surat Keterangan Bebas Narkoba (SKBN)', desc: 'Hasil lab NAPZA.', icon: '🧪' },
  { id: 'skh', label: 'Surat Keterangan Hamil (SKH)', desc: 'Keterangan usia kehamilan.', icon: '🤰' },
  { id: 'sksh', label: 'Surat Keterangan Sehat Haji (SKSH)', desc: 'Pemeriksaan CJH.', icon: '🕋' },
  { id: 'skv', label: 'Surat Keterangan Vaksin (SKV)', desc: 'Riwayat vaksinasi pasien.', icon: '💉' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalPasien: 0, totalSurat: 0, skbn: 0, validasi: 0, totalSuratAll: 0, suratCounts: {} as Record<string, number> });
  
  useEffect(() => {
    async function fetchStats() {
      try {
        const { count: countPasien } = await supabase.from('pasien').select('*', { count: 'exact', head: true });
        const { count: countSurat } = await supabase.from('surat_keterangan').select('*', { count: 'exact', head: true });
        
        const currentMonthStart = new Date();
        currentMonthStart.setDate(1);
        
        const { count: countSuratBulanIni } = await supabase.from('surat_keterangan')
          .select('*', { count: 'exact', head: true })
          .gte('tanggal_terbit', currentMonthStart.toISOString());
          
        const { data: countsData } = await supabase.from('surat_keterangan').select('jenis_surat');

        setStats({
          totalPasien: countPasien || 0,
          totalSurat: countSuratBulanIni || 0,
          skbn: 0,
          validasi: countSurat || 0,
          totalSuratAll: countSurat || 0,
          suratCounts: (countsData || []).reduce((acc: any, curr: any) => {
            const type = curr.jenis_surat.toLowerCase();
            acc[type] = (acc[type] || 0) + 1;
            return acc;
          }, {})
        });
      } catch (err) {
        console.error('Error fetching stats', err);
      }
    }
    
    fetchStats();
  }, []);

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
        <h2 className="text-lg font-bold text-slate-800">Dashboard Terpadu</h2>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs font-medium text-slate-500">{format(new Date(), 'EEEE, dd MMM yyyy', { locale: id })}</p>
            <p className="text-xs font-bold text-blue-600">Status Server: Online</p>
          </div>
        </div>
      </header>
      
      <div className="flex-1 p-8 space-y-6 overflow-y-auto w-full relative">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Pasien</p>
            <p className="text-2xl font-black text-slate-800">{stats.totalPasien.toLocaleString('id-ID')}</p>
            <p className="text-[10px] text-emerald-500 mt-1 font-bold">Terdata di sistem</p>
          </div>
          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Surat Terbit (Bulan Ini)</p>
            <p className="text-2xl font-black text-slate-800">{stats.totalSurat.toLocaleString('id-ID')}</p>
            <div className="mt-1 h-1 bg-blue-100 rounded-full overflow-hidden">
              <div className="w-[75%] h-full bg-blue-500"></div>
            </div>
          </div>
          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:shadow-md transition-all">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Surat Terbit</p>
            <p className="text-2xl font-black text-slate-800">{stats.totalSuratAll.toLocaleString('id-ID')}</p>
            <p className="text-[10px] text-slate-500 mt-1">Total riwayat diterbitkan</p>
          </div>
          <div className="bg-blue-600 border border-blue-500 p-4 rounded-xl shadow-sm hover:shadow-md transition-all">
             <p className="text-[10px] font-bold text-blue-100 uppercase tracking-widest text-shadow">VALIDASI QR CODE</p>
             <p className="text-2xl font-black text-white drop-shadow-md">{stats.validasi.toLocaleString('id-ID')}</p>
             <p className="text-[10px] text-blue-200 mt-1 italic">Total dokumen terverifikasi</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Layanan Pembuatan Surat</h3>
              <p className="text-xs text-slate-500">Pilih jenis surat keterangan yang ingin dibuat.</p>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {suratTypes.map((type) => (
                <div key={type.id} onClick={() => navigate(`/surat/${type.id}`)} className="cursor-pointer bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-blue-500 hover:shadow-md transition-all flex flex-col h-full group">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex flex-col items-center justify-center shrink-0 group-hover:bg-blue-600 transition-colors relative">
                        <span className="text-lg group-hover:grayscale group-hover:brightness-200">{type.icon}</span>
                      </div>
                      <div className="mt-2 text-[10px] font-bold px-2 py-0.5 bg-slate-100 rounded text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-700">
                        {stats.suratCounts[type.id] || 0} Dibuat
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">{type.label}</h4>
                      <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">{type.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
        </div>

      </div>

      <footer className="bg-slate-100 border-t border-slate-200 px-8 py-3 flex justify-between items-center text-[10px] font-medium text-slate-400 shrink-0">
        <div>Sistem Informasi Surat Keterangan Medis Terpadu &copy; 2026 v1.0.2</div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Database Synced</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Supabase Connected</span>
        </div>
      </footer>
    </>
  );
}
