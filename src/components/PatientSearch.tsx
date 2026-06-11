import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Loader2, User } from 'lucide-react';

export interface PatientData {
  id?: string;
  nik: string;
  nama: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  jenis_kelamin: string;
  agama: string;
  pekerjaan: string;
  alamat: string;
  no_hp: string;
  golongan_darah: string;
}

interface PatientSearchProps {
  onPatientSelect: (patient: PatientData | null) => void;
}

export function PatientSearch({ onPatientSelect }: PatientSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<PatientData[]>([]);

  const searchPatient = async () => {
    if (!searchTerm) return;
    
    setLoading(true);
    setError('');
    setResults([]);

    try {
      // Search by NIK or part of nama
      const { data, error } = await supabase
        .from('pasien')
        .select('*')
        .or(`nik.ilike.%${searchTerm}%,nama.ilike.%${searchTerm}%`)
        .limit(10);

      if (error) {
        setError(error.message);
      } else if (data && data.length > 0) {
        if (data.length === 1) {
           onPatientSelect(data[0] as PatientData);
           setResults([]); // hide list if exact
        } else {
           setResults(data as PatientData[]);
        }
      } else {
        setError('Pasien tidak ditemukan. Silakan isi form Identitas Pasien untuk mendaftarkan.');
        onPatientSelect(null); // Clear selected to show empty form
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFromResult = (p: PatientData) => {
     onPatientSelect(p);
     setResults([]);
     setError('');
  };

  return (
    <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 w-full">
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="flex-1 relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input 
            type="text" 
            className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg bg-slate-50 text-sm focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400 font-medium" 
            placeholder="Cari NIK atau Sebagian Nama (Contoh: Toni)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchPatient()}
          />
        </div>
        <div className="flex gap-4 w-full sm:w-auto">
          <button 
            onClick={searchPatient} 
            disabled={loading || !searchTerm}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50 disabled:shadow-none flex items-center justify-center min-w-[140px]"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Cari Data'}
          </button>
          <button 
            onClick={() => onPatientSelect(null)}
            className="px-4 py-3 bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-200 whitespace-nowrap"
          >
            + Pasien Baru
          </button>
        </div>
      </div>
      
      {results.length > 0 && (
         <div className="mt-4 border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
            <div className="bg-slate-50 px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
               Pilih Pasien ({results.length} ditemukan)
            </div>
            {results.map((p) => (
               <div key={p.id} onClick={() => handleSelectFromResult(p)} className="p-3 hover:bg-blue-50 cursor-pointer flex items-center gap-3 transition-colors">
                  <div className="h-10 w-10 shrink-0 bg-slate-200 rounded-full flex items-center justify-center">
                     <User className="h-5 w-5 text-slate-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                     <p className="text-sm font-bold text-slate-900 truncate">{p.nama}</p>
                     <p className="text-xs text-slate-500 truncate mt-0.5"><span className="font-medium text-slate-700">NIK:</span> {p.nik} • <span className="font-medium text-slate-700">Alamat:</span> {p.alamat}</p>
                  </div>
                  <div className="shrink-0 text-xs font-semibold text-blue-600 border border-blue-200 bg-white px-3 py-1.5 rounded-full">
                     Pilih
                  </div>
               </div>
            ))}
         </div>
      )}

      {error && (
        <p className="mt-4 text-sm font-medium text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">{error}</p>
      )}
    </section>
  );
}
