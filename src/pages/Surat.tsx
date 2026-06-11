import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Save, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PatientSearch, PatientData } from '@/components/PatientSearch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { generateNomorSurat } from '@/lib/nomorSurat';
import { supabase } from '@/lib/supabase';

// PDF Generator dependencies
import { pdf } from '@react-pdf/renderer';
import { SuratPDF } from '@/components/SuratPDF';

// Helper for parsing DD-MM-YYYY to YYYY-MM-DD for DB
function parseDateToDBFormat(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  const parts = dateStr.split(/[-/]/);
  if (parts.length === 3) {
    if (parts[0].length <= 2 && parts[2].length === 4) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }
  return dateStr;
}

// Helper for formatting YYYY-MM-DD from DB to DD-MM-YYYY
function formatDateFromDB(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const parts = dateStr.split(/[-T ]/); // Handle potential timestamp suffixes just in case
  if (parts.length >= 3 && parts[0].length === 4) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
}

export default function FormSurat() {
  const { jenis_surat } = useParams<{ jenis_surat: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<PatientData | null>(null);
  
  // Data Klinis State (using any for simplicity across different forms in this demo)
  const [dataKlinis, setDataKlinis] = useState<any>({});
  
  // For saving simulation
  const [isSaving, setIsSaving] = useState(false);
  const [generatedPdfBlob, setGeneratedPdfBlob] = useState<Blob | null>(null);
  const [successMsg, setSuccessMsg] = useState("");

  const [nomorUrutOverride, setNomorUrutOverride] = useState('');
  const [liveNomorPreview, setLiveNomorPreview] = useState('');

  const currentSuratType = jenis_surat?.toUpperCase() || '';

  const handlePatientSelect = (p: PatientData | null) => {
    if (p && p.tanggal_lahir) {
      p.tanggal_lahir = formatDateFromDB(p.tanggal_lahir);
    }
    setPatient(p);
  };

  const handleClinicalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setDataKlinis({ ...dataKlinis, [e.target.name]: e.target.value });
  };

  // Fetch a live preview when override or type changes
  useEffect(() => {
    async function updatePreview() {
       const { nomor_surat_full } = await generateNomorSurat(currentSuratType, nomorUrutOverride);
       setLiveNomorPreview(nomor_surat_full);
    }
    updatePreview();
  }, [currentSuratType, nomorUrutOverride]);

  const [searchParams, setSearchParams] = useSearchParams();
  const editIdParam = searchParams.get('edit_id');

  const [suratHistory, setSuratHistory] = useState<any[]>([]);
  const [editingSuratId, setEditingSuratId] = useState<string | null>(null);

  useEffect(() => {
    async function loadEditData() {
      if (editIdParam) {
        setEditingSuratId(editIdParam);
        try {
          const { data, error } = await supabase
            .from('surat_keterangan')
            .select('*, pasien(*)')
            .eq('id', editIdParam)
            .single();
            
          if (data && !error) {
            setDataKlinis(data.data_klinis);
            if (data.pasien) {
               data.pasien.tanggal_lahir = formatDateFromDB(data.pasien.tanggal_lahir);
               setPatient(data.pasien);
            }
          }
        } catch (err) {
          console.error("Failed to load edit data", err);
        }
      }
    }
    loadEditData();
  }, [editIdParam]);

  useEffect(() => {
    async function fetchHistory() {
      if (!patient?.id) {
        setSuratHistory([]);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('surat_keterangan')
          .select('*')
          .eq('pasien_id', patient.id)
          .eq('jenis_surat', currentSuratType)
          .order('tanggal_terbit', { ascending: false });
        
        if (data) setSuratHistory(data);
      } catch (err) {
        console.error(err);
      }
    }
    fetchHistory();
  }, [patient?.id, currentSuratType]);

  const renderDiagnosticForm = () => {
    switch (currentSuratType) {
      case 'SKD':
        return (
          <div className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Keperluan</Label>
                  <Input name="keperluan" placeholder="Melamar kerja..." onChange={handleClinicalChange} />
                </div>
                <div className="space-y-2">
                  <Label>Kesimpulan</Label>
                  <select name="kesimpulan" onChange={handleClinicalChange as any} className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
                    <option value="SEHAT">SEHAT</option>
                    <option value="TIDAK SEHAT">TIDAK SEHAT</option>
                  </select>
                </div>
             </div>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="space-y-2"><Label>Tinggi (cm)</Label><Input type="number" name="tinggi_badan" onChange={handleClinicalChange} /></div>
                <div className="space-y-2"><Label>Berat (kg)</Label><Input type="number" name="berat_badan" onChange={handleClinicalChange} /></div>
                <div className="space-y-2"><Label>Tensi (mmHg)</Label><Input name="tensi" onChange={handleClinicalChange} /></div>
                <div className="space-y-2"><Label>Suhu (°C)</Label><Input name="suhu" onChange={handleClinicalChange} /></div>
                <div className="space-y-2"><Label>Nadi (x/mnt)</Label><Input name="nadi" onChange={handleClinicalChange} /></div>
                <div className="space-y-2"><Label>GDA (mg/dl)</Label><Input name="gda" onChange={handleClinicalChange} /></div>
                <div className="space-y-2"><Label>Chol (mg/dl)</Label><Input name="chol" onChange={handleClinicalChange} /></div>
                <div className="space-y-2"><Label>Trigliserida</Label><Input name="trigliserida" onChange={handleClinicalChange} /></div>
             </div>
          </div>
        );
      case 'SKB':
        return (
          <div className="space-y-4">
             <div className="space-y-2">
                <Label>Diagnosa</Label>
                <Input name="diagnosa" placeholder="ISPA..." onChange={handleClinicalChange} />
             </div>
             <div className="space-y-2">
                <Label>Terapy</Label>
                <textarea 
                  name="terapy" 
                  className="flex min-h-[120px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  placeholder="Ambroxol 3x1&#10;Amoxicillin 3x1&#10;Dexa 3x1" 
                  onChange={handleClinicalChange as any} 
                />
             </div>
          </div>
        );
      case 'SKH':
        return (
          <div className="space-y-4">
             <div className="space-y-2">
                <Label>Usia Kehamilan (minggu)</Label>
                <Input type="number" name="usia_kehamilan" placeholder="24" onChange={handleClinicalChange} />
             </div>
          </div>
        );
      case 'SKSH':
        return (
          <div className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Bin / Binti</Label><Input name="bin_binti" onChange={handleClinicalChange} /></div>
                <div className="space-y-2"><Label>Agama</Label><Input name="agama" value={patient?.agama || ''} onChange={(e) => setPatient(prev => ({...prev, agama: e.target.value} as any))} /></div>
             </div>
             <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                <div className="space-y-2"><Label>Tinggi (cm)</Label><Input type="number" name="tinggi_badan" onChange={handleClinicalChange} /></div>
                <div className="space-y-2"><Label>Berat (kg)</Label><Input type="number" name="berat_badan" onChange={handleClinicalChange} /></div>
                <div className="space-y-2"><Label>Tekanan Darah</Label><Input name="tensi" onChange={handleClinicalChange} /></div>
                <div className="space-y-2"><Label>Gol. Darah</Label><Input name="golongan_darah" value={patient?.golongan_darah || ''} onChange={(e) => setPatient(prev => ({...prev, golongan_darah: e.target.value} as any))} /></div>
             </div>
             <div className="space-y-2 mt-4">
                <Label>Riwayat Penyakit</Label>
                <Input name="riwayat_penyakit" placeholder="-" onChange={handleClinicalChange} />
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label>Kesimpulan</Label>
                  <Input name="kesimpulan" placeholder="SEHAT (BAIK)" defaultValue="SEHAT (BAIK)" onChange={handleClinicalChange} />
                </div>
                <div className="space-y-2">
                  <Label>Keperluan</Label>
                  <Input name="keperluan" placeholder="Melengkapi Persyaratan Administrasi Mendaftar Haji" defaultValue="Melengkapi Persyaratan Administrasi Mendaftar Haji" onChange={handleClinicalChange} />
                </div>
             </div>
          </div>
        );
      case 'SKV':
        return (
          <div className="space-y-4">
             <Label className="text-base font-semibold mb-3 block border-b pb-2">Riwayat Vaksinasi (Satu Sehat)</Label>
             {[1, 2, 3].map((dosis) => (
                <div key={dosis} className="grid grid-cols-3 gap-4 mb-2">
                   <div className="space-y-2"><Label>Dosis {dosis} - Tanggal</Label><Input type="date" name={`tgl_vaksin_${dosis}`} onChange={handleClinicalChange} /></div>
                   <div className="space-y-2 col-span-2"><Label>Dosis {dosis} - No. Batch</Label><Input name={`no_batch_${dosis}`} onChange={handleClinicalChange} /></div>
                </div>
             ))}
          </div>
        );
      case 'CATIN':
        return (
          <div className="space-y-4">
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2"><Label>Tinggi Badan (cm)</Label><Input type="number" name="tinggi_badan" onChange={handleClinicalChange} /></div>
                <div className="space-y-2"><Label>Berat Badan (kg)</Label><Input type="number" name="berat_badan" onChange={handleClinicalChange} /></div>
                <div className="space-y-2"><Label>Tensi (mmHg)</Label><Input name="tensi" onChange={handleClinicalChange} /></div>
                <div className="space-y-2"><Label>Suhu (°C)</Label><Input name="suhu" onChange={handleClinicalChange} /></div>
             </div>
             <div className="space-y-2 mt-4">
               <Label>Kesimpulan Pemeriksaan</Label>
               <Input name="kesimpulan" placeholder="Dalam keadaan SEHAT untuk melangsungkan pernikahan" onChange={handleClinicalChange} />
             </div>
          </div>
        );
      case 'SKI':
        return (
          <div className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Tensi (mmHg)</Label>
                  <Input name="tensi" placeholder="120/80" onChange={handleClinicalChange} />
                </div>
                <div className="space-y-2">
                  <Label>Suhu (°C)</Label>
                  <Input name="suhu" placeholder="36.5" onChange={handleClinicalChange} />
                </div>
                <div className="space-y-2">
                  <Label>Nadi (x/mnt)</Label>
                  <Input name="nadi" placeholder="80" onChange={handleClinicalChange} />
                </div>
             </div>
             <div className="space-y-2">
                <Label>Diagnosa</Label>
                <Input name="diagnosa" placeholder="Gejala Typus / Ispa..." onChange={handleClinicalChange} />
             </div>
             <div className="space-y-2">
                <Label>Terapy</Label>
                <textarea 
                  name="terapy" 
                  className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Obat-obatan yang diberikan..." 
                  onChange={handleClinicalChange as any} 
                />
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4 mt-4">
                <div className="space-y-2">
                  <Label>Lama Istirahat (Hari)</Label>
                  <Input type="number" name="lama_hari" placeholder="3" onChange={handleClinicalChange} />
                </div>
                <div className="space-y-2">
                  <Label>Tanggal Mulai</Label>
                  <Input type="date" name="tgl_mulai" onChange={handleClinicalChange} />
                </div>
                <div className="space-y-2">
                  <Label>Tanggal Selesai</Label>
                  <Input type="date" name="tgl_selesai" onChange={handleClinicalChange} />
                </div>
             </div>
          </div>
        );
      case 'SKBN':
        return (
          <div className="space-y-6">
             <div className="space-y-2">
                <Label>Keperluan</Label>
                <Input name="keperluan" placeholder="Melamar Pekerjaan / Masuk Perguruan Tinggi" onChange={handleClinicalChange} />
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tinggi Badan (cm)</Label>
                  <Input type="number" name="tinggi_badan" placeholder="170" onChange={handleClinicalChange} />
                </div>
                <div className="space-y-2">
                  <Label>Berat Badan (kg)</Label>
                  <Input type="number" name="berat_badan" placeholder="65" onChange={handleClinicalChange} />
                </div>
             </div>
             <div>
                <Label className="text-base font-semibold mb-3 block border-b pb-2">Drugs Urine Test (Parameter LAB)</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {['mop', 'coc', 'thc', 'amp', 'met', 'bzo'].map(param => (
                    <div key={param} className="space-y-2">
                      <Label className="uppercase">{param}</Label>
                      <select 
                        name={`hasil_${param}`} 
                        onChange={handleClinicalChange as any}
                        className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        defaultValue="NEGATIF"
                      >
                        <option value="NEGATIF">NEGATIF</option>
                        <option value="POSITIF">POSITIF</option>
                      </select>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        );
      default:
        return <div className="p-4 bg-yellow-50 text-yellow-800 rounded-md">Form untuk {currentSuratType} sedang dalam pengembangan.</div>;
    }
  };

  const handleSave = async () => {
    if (!patient) {
      alert("Harap cari atau isi data pasien terlebih dahulu.");
      return;
    }

    setIsSaving(true);
    try {
      // 1. In a real app we'd upsert patient data to supabase here if it's new
      let patientId = patient.id;
      
      const patientPayload = {
        nik: patient.nik || null,
        nama: patient.nama || 'Tanpa Nama',
        tempat_lahir: patient.tempat_lahir || null,
        tanggal_lahir: parseDateToDBFormat(patient.tanggal_lahir),
        jenis_kelamin: patient.jenis_kelamin || 'Laki-laki',
        agama: patient.agama || null,
        pekerjaan: patient.pekerjaan || null,
        alamat: patient.alamat || null,
        no_hp: patient.no_hp || null,
        golongan_darah: patient.golongan_darah || null
      };

      if (patientId) {
        // Update existing patient
        const { error: pError } = await supabase.from('pasien').update(patientPayload).eq('id', patientId);
        if (pError) {
           console.error('Error updating patient:', pError);
           throw new Error(`Gagal memperbarui data pasien: ${pError.message}`);
        }
      } else {
        // Find if patient exists by NIK just in case (only if NIK is provided)
        let existPatient = null;
        if (patient.nik) {
           const { data } = await supabase.from('pasien').select('id').eq('nik', patient.nik).maybeSingle();
           existPatient = data;
        }
        
        if (existPatient) {
           patientId = existPatient.id;
           const { error: pError } = await supabase.from('pasien').update(patientPayload).eq('id', patientId);
           if (pError) throw new Error(`Gagal memperbarui data pasien: ${pError.message}`);
        } else {
           // Insert new patient
           const { data: pData, error: pError } = await supabase.from('pasien').insert(patientPayload).select().single();
           if (pError) {
             console.error('Error inserting patient:', pError);
             throw new Error(`Gagal menyimpan data pasien baru: ${pError.message}`);
           }
           patientId = pData.id;
        }
      }

      // Check for duplicates on the same day if creating a new surat
      if (!editingSuratId && patientId) {
         const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
         const { data: existingSurat } = await supabase
            .from('surat_keterangan')
            .select('id, tanggal_terbit')
            .eq('pasien_id', patientId)
            .eq('jenis_surat', currentSuratType.toUpperCase())
            .gte('tanggal_terbit', `${today}T00:00:00Z`)
            .lte('tanggal_terbit', `${today}T23:59:59Z`)
            .maybeSingle();

         if (existingSurat) {
            throw new Error(`Pasien ini sudah dibuatkan ${currentSuratType} pada hari ini. Jika ada kesalahan, silakan gunakan riwayat untuk 'Edit Data'.`);
         }
      }

      let sData, sError;
      let finalNomorSurat = '';
      
      if (editingSuratId) {
        // If editing, only update specific fields, do not change nomor surat or terbit
        const { data, error } = await supabase.from('surat_keterangan')
           .update({ data_klinis: dataKlinis })
           .eq('id', editingSuratId)
           .select()
           .single();
        sData = data;
        sError = error;
        finalNomorSurat = sData?.nomor_surat;
      } else {
        // 2. Generate Nomor Surat
        const { no_urut, nomor_surat_full } = await generateNomorSurat(currentSuratType, nomorUrutOverride);
        finalNomorSurat = nomor_surat_full;

        // 3. Insert surat_keterangan
        const suratData = { 
           jenis_surat: currentSuratType.toUpperCase(), 
           pasien_id: patientId, 
           data_klinis: dataKlinis, 
           nomor_surat: finalNomorSurat
           // We do not have login sessions hooked up fully to get tenaga_medis id,
           // for now we lookup dr. R.M. Ustadho if possible, or null
        };
  
        // Try looking up the doctor
        const { data: drData } = await supabase.from('tenaga_medis').select('id').ilike('nama_lengkap', '%Ustadho%').maybeSingle();
        if (drData) {
          (suratData as any).dokter_pemeriksa_id = drData.id;
        }
  
        const { data, error } = await supabase.from('surat_keterangan').insert(suratData).select().single();
        sData = data;
        sError = error;
      }
      
      if (sError) {
         console.error('Error inserting surat:', sError);
         throw new Error(`Gagal menyimpan surat keterangan ke database: ${sError.message}`);
      }

      // 4. Generate PDF internally for printing
      const doc = <SuratPDF suratType={currentSuratType} patient={{...patient, id: patientId}} dataKlinis={dataKlinis} suratId={sData.id} nomorSuratFull={finalNomorSurat} />;
      const blob = await pdf(doc).toBlob();
      
      setGeneratedPdfBlob(blob);
      setSuccessMsg(editingSuratId ? "Data riwayat berhasil diperbarui!" : "Data surat berhasil disimpan!");
      setNomorUrutOverride(""); // Clear override so the next letter increments automatically
      setTimeout(() => setSuccessMsg(''), 5000);
      
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Gagal menyimpan data");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200">
            <ChevronLeft className="w-4 h-4 text-slate-600" />
          </Button>
          <h2 className="text-lg font-bold text-slate-800">Form Pembuatan {currentSuratType}</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs font-bold text-blue-600">Terhubung ke Database</p>
          </div>
        </div>
      </header>
      
      <div className="flex-1 p-8 space-y-6 overflow-y-auto bg-slate-50">
        <div className="max-w-4xl mx-auto space-y-6">
          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg relative flex items-center shadow-sm">
              <svg className="w-5 h-5 text-emerald-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              <span className="text-sm font-bold">{successMsg}</span>
            </div>
          )}

          <PatientSearch onPatientSelect={(p) => {
            handlePatientSelect(p);
            setEditingSuratId(null);
            setDataKlinis({});
          }} />

          {suratHistory.length > 0 && (
            <Card className="bg-amber-50 border-amber-200 shadow-sm rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-amber-800">Riwayat {currentSuratType} Pasien Ini</CardTitle>
                <CardDescription className="text-xs text-amber-700">Pasien ini sudah pernah membuat {currentSuratType}. Anda dapat mengedit data riwayat jika ada kesalahan ketik.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {suratHistory.map((riwayat) => (
                   <div key={riwayat.id} className="flex flex-col sm:flex-row items-center justify-between bg-white p-3 rounded-lg border border-amber-100 shadow-sm gap-4">
                     <div>
                       <p className="text-xs font-bold text-slate-800">{riwayat.nomor_surat}</p>
                       <p className="text-[10px] text-slate-500">{new Date(riwayat.tanggal_terbit).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                     </div>
                     <div className="flex gap-2">
                       <button 
                         onClick={() => {
                           setDataKlinis(riwayat.data_klinis);
                           setEditingSuratId(riwayat.id);
                           setGeneratedPdfBlob(null);
                           window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                         }} 
                         className={`px-3 py-1.5 text-xs font-semibold rounded-md border ${editingSuratId === riwayat.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100'}`}
                       >
                         {editingSuratId === riwayat.id ? 'Sedang Edit' : 'Edit Data'}
                       </button>
                       <button 
                         onClick={async () => {
                           try {
                             const doc = <SuratPDF suratType={currentSuratType} patient={{...patient, id: patient?.id}} dataKlinis={riwayat.data_klinis} suratId={riwayat.id} nomorSuratFull={riwayat.nomor_surat} />;
                             const blob = await pdf(doc).toBlob();
                             window.open(URL.createObjectURL(blob), '_blank');
                           } catch (err) {
                             console.error(err);
                           }
                         }} 
                         className="px-3 py-1.5 text-xs font-semibold bg-white text-slate-700 rounded-md border border-slate-200 hover:bg-slate-50 shadow-sm"
                       >
                         Cetak Ulang
                       </button>
                     </div>
                   </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Patient Identity Form - Pre-filled if patient found, editable if new */}
          <Card className="bg-white border-slate-200 shadow-sm rounded-xl">
            <CardHeader className="border-b border-slate-100 pb-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-800">Identitas Pasien</CardTitle>
                <CardDescription className="text-xs text-slate-400">Data demografis pasien terintegrasi NIK.</CardDescription>
              </div>
              <div className="flex flex-col space-y-1 w-64 text-right">
                 <Label className="text-[10px] font-bold text-slate-500">SET NOMOR URUT (OPSIONAL)</Label>
                 <Input 
                    type="number"
                    value={nomorUrutOverride}
                    onChange={(e) => setNomorUrutOverride(e.target.value)}
                    className="h-8 text-xs bg-slate-50 border-slate-300 ml-auto w-32"
                    placeholder="Contoh: 1050"
                    title="Kosongkan agar otomatis melanjutkan urutan terakhir"
                 />
                 <p className="text-[10px] text-slate-400 truncate" title={liveNomorPreview}>{liveNomorPreview || 'Loading nomor...'}</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-600 uppercase">NAMA LENGKAP</Label>
                    <Input value={patient?.nama || ''} onChange={(e) => setPatient(prev => ({...prev, nama: e.target.value} as any))} className="bg-slate-50 border-slate-300" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-600 uppercase">NIK</Label>
                    <Input value={patient?.nik || ''} onChange={(e) => setPatient(prev => ({...prev, nik: e.target.value} as any))} className="bg-slate-50 border-slate-300 font-mono text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-600 uppercase">Tempat Lahir</Label>
                      <Input value={patient?.tempat_lahir || ''} onChange={(e) => setPatient(prev => ({...prev, tempat_lahir: e.target.value} as any))} className="bg-slate-50 border-slate-300" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-600 uppercase">Tgl Lahir</Label>
                      <Input type="text" placeholder="DD-MM-YYYY" value={patient?.tanggal_lahir || ''} onChange={(e) => setPatient(prev => ({...prev, tanggal_lahir: e.target.value} as any))} className="bg-slate-50 border-slate-300" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-600 uppercase">Jenis Kelamin</Label>
                      <select 
                        className="flex h-10 w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        value={patient?.jenis_kelamin || 'Laki-laki'}
                        onChange={(e) => setPatient(prev => ({...prev, jenis_kelamin: e.target.value} as any))}
                      >
                        <option value="Laki-laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-600 uppercase">Pekerjaan</Label>
                      <Input value={patient?.pekerjaan || ''} onChange={(e) => setPatient(prev => ({...prev, pekerjaan: e.target.value} as any))} className="bg-slate-50 border-slate-300" />
                    </div>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-xs font-bold text-slate-600 uppercase">Alamat Lengkap</Label>
                    <Input value={patient?.alamat || ''} onChange={(e) => setPatient(prev => ({...prev, alamat: e.target.value} as any))} className="bg-slate-50 border-slate-300" />
                  </div>
                </div>
            </CardContent>
          </Card>

          {/* Clinical Data Form */}
          <Card className="bg-white border-slate-200 shadow-sm rounded-xl">
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle className="text-sm font-bold text-slate-800">Data Klinis & Pemeriksaan</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {renderDiagnosticForm()}
            </CardContent>
          </Card>

          <div className="flex gap-4 items-center justify-end border-t border-slate-200 pt-6">
            <button className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-200" onClick={() => navigate('/dashboard')}>Batal</button>
            <button className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Menyimpan...' : (
                <>
                  <Save className="w-4 h-4 mr-2" /> Simpan & Generate Dokumen
                </>
              )}
            </button>
          </div>

          {generatedPdfBlob && (
            <div className="border border-blue-200 bg-blue-50 rounded-xl p-8 flex flex-col items-center text-center space-y-4 shadow-sm mt-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Printer className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Dokumen Siap Dicetak</h3>
                <p className="text-slate-600 text-sm">Surat Keterangan {currentSuratType} telah diterbitkan dengan QR Code verifikasi resmi.</p>
                <button className="px-6 py-3 bg-white border border-slate-200 text-blue-600 rounded-lg text-sm font-bold hover:bg-slate-50 shadow-sm" onClick={() => window.open(URL.createObjectURL(generatedPdfBlob), '_blank')}>
                  Pratinjau & Cetak PDF
                </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
