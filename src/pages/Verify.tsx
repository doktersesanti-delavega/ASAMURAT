import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';

export default function Verify() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [instansiName, setInstansiName] = useState('Puskesmas Kalitengah');

  useEffect(() => {
    async function verifyDoc() {
      try {
        const { data: instansi } = await supabase.from('pengaturan_instansi').select('nama_instansi').eq('id', 1).maybeSingle();
        if (instansi?.nama_instansi) {
          setInstansiName(instansi.nama_instansi);
        }

        const { data: dbData, error } = await supabase
          .from('surat_keterangan')
          .select(`
            *,
            pasien!inner (
              nama, nik
            ),
            tenaga_medis!surat_keterangan_dokter_pemeriksa_id_fkey (
              nama_lengkap
            )
          `)
          .eq('id', id)
          .single();

        if (error) {
          throw error;
        }
        setData(dbData);
      } catch (e) {
        // Doc not found or other error
        console.error("Dokumen tidak ditemukan:", e);
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      verifyDoc();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md border-emerald-200">
        <CardHeader className="text-center bg-emerald-50 rounded-t-xl pb-8 pt-8">
          {data ? (
            <div className="flex flex-col items-center">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4" />
              <CardTitle className="text-2xl text-emerald-800">DOKUMEN VALID</CardTitle>
              <CardDescription className="text-emerald-600 mt-2">
                Surat Keterangan resmi dikeluarkan oleh {instansiName}
              </CardDescription>
            </div>
          ) : (
             <div className="flex flex-col items-center">
              <XCircle className="w-16 h-16 text-red-500 mb-4" />
              <CardTitle className="text-2xl text-red-800">DOKUMEN TIDAK VALID</CardTitle>
              <CardDescription className="text-red-600 mt-2">
                Dokumen tidak ditemukan dalam database sistem.
              </CardDescription>
            </div>
          )}
        </CardHeader>
        
        {data && (
          <CardContent className="pt-6">
            <dl className="space-y-4 text-sm">
              <div className="flex justify-between border-b pb-2">
                <dt className="text-slate-500">Nomor Surat</dt>
                <dd className="font-semibold">{data.nomor_surat}</dd>
              </div>
              <div className="flex justify-between border-b pb-2">
                <dt className="text-slate-500">Jenis Surat</dt>
                <dd className="font-semibold">Surat Keterangan {data.jenis_surat}</dd>
              </div>
              <div className="flex justify-between border-b pb-2">
                <dt className="text-slate-500">Tanggal Terbit</dt>
                <dd className="font-semibold">
                  {format(new Date(data.tanggal_terbit), 'dd MMM yyyy')}
                </dd>
              </div>
              <div className="flex justify-between border-b pb-2">
                <dt className="text-slate-500">Nama Pasien</dt>
                <dd className="font-semibold text-right">{data.pasien.nama}</dd>
              </div>
              {data.data_klinis?.keperluan && (
                <div className="flex justify-between border-b pb-2">
                  <dt className="text-slate-500">Keperluan</dt>
                  <dd className="font-semibold text-right">{data.data_klinis.keperluan}</dd>
                </div>
              )}
              {data.data_klinis?.diagnosa && (
                <div className="flex justify-between border-b pb-2">
                  <dt className="text-slate-500">Diagnosa</dt>
                  <dd className="font-semibold text-right">{data.data_klinis.diagnosa}</dd>
                </div>
              )}
              {data.data_klinis?.kesimpulan && (
                <div className="flex justify-between border-b pb-2">
                  <dt className="text-slate-500">Kesimpulan</dt>
                  <dd className="font-semibold text-right">{data.data_klinis.kesimpulan}</dd>
                </div>
              )}
              <div className="flex justify-between border-b pb-2">
                <dt className="text-slate-500">Tanda Tangan</dt>
                <dd className="font-semibold text-right">{data.tenaga_medis?.nama_lengkap}</dd>
              </div>
            </dl>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
