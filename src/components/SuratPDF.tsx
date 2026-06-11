import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { PatientData } from './PatientSearch';
import logoPemkab from '../lib/logo.pemkab.png';
import logoPuskesmas from '../lib/logo.puskesmas.png';

// Function to generate Base64 QR code since React-PDF Image component requires a URL/Base64
// We'll generate it client side using qrcode.react in the UI, but for PDF we can use a service or pre-generate it.
// To keep it simple and robust locally, we use a public QR code generation API for the document payload, 
// OR we could just simulate it. Here we use an API that returns an image.
const getQrCodeUrl = (url: string) => `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(url)}`;

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 11 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  headerTextContainer: { alignItems: 'center', flex: 1, paddingHorizontal: 10 },
  headerTitle: { fontSize: 14, fontWeight: 'bold', textAlign: 'center' },
  headerSubtitle: { fontSize: 16, fontWeight: 'bold', marginVertical: 3, textAlign: 'center' },
  headerAddress: { fontSize: 10, textAlign: 'center' },
  divider: { borderBottomWidth: 2, borderBottomColor: '#000', marginBottom: 2, marginTop: 10 },

  dividerThin: { borderBottomWidth: 1, borderBottomColor: '#000', marginBottom: 20 },
  suratTitle: { textAlign: 'center', fontSize: 14, fontWeight: 'bold', textDecoration: 'underline' },
  suratNumber: { textAlign: 'center', marginBottom: 20 },
  contentRow: { flexDirection: 'row', marginBottom: 5 },
  label: { width: 120 },
  colon: { width: 10 },
  value: { flex: 1, fontWeight: 'bold' },
  paragraph: { marginTop: 10, marginBottom: 10, lineHeight: 1.5, textAlign: 'justify' },
  signatureSection: { marginTop: 40, flexDirection: 'row', justifyContent: 'space-between' },
  qrContainer: { width: 80, height: 80 },
  signatureBlock: { alignItems: 'center', width: 200 },
  signatureName: { marginTop: 60, fontWeight: 'bold', textDecoration: 'underline' },
  signatureNip: { marginTop: 2 }
});

interface SuratPDFProps {
  suratType: string;
  patient: PatientData;
  dataKlinis: any;
  suratId: string;
  nomorSuratFull: string;
}

export const SuratPDF = ({ suratType, patient, dataKlinis, suratId, nomorSuratFull }: SuratPDFProps) => {
  const verifyUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/verify/${suratId}`;
  const qrCodeImg = getQrCodeUrl(verifyUrl);

  const pageStyle = suratType === 'SKV' 
    ? { ...styles.page, fontSize: 10, padding: 30 }
    : styles.page;

  const parseYear = (dateString?: string) => {
     if (!dateString) return null;
     const d = new Date(dateString);
     if (!isNaN(d.getTime())) return d.getFullYear();
     const parts = dateString.split(/[-/ \.]/);
     if (parts.length >= 3) {
        let possibleYear = parseInt(parts[2]);
        if (possibleYear > 1900 && possibleYear < 2100) return possibleYear;
        possibleYear = parseInt(parts[0]);
        if (possibleYear > 1900 && possibleYear < 2100) return possibleYear;
     }
     return null;
  };

  const birthYear = parseYear(patient.tanggal_lahir);
  const calculatedAge = birthYear ? `${new Date().getFullYear() - birthYear} tahun` : '-';

  return (
    <Document>
      <Page size="A4" style={pageStyle}>
        {/* KOP SURAT */}
        <View style={styles.header}>
          {/* Logo Kiri */}
          <View style={{ width: 100, height: 100, justifyContent: 'center', alignItems: 'center' }}>
            <Image src={logoPemkab} style={{ width: 95, height: 95, objectFit: 'contain' }} />
          </View>
          
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>PEMERINTAH KABUPATEN LAMONGAN</Text>
            <Text style={styles.headerTitle}>DINAS KESEHATAN</Text>
            <Text style={styles.headerSubtitle}>PUSKESMAS KALITENGAH</Text>
            <Text style={styles.headerAddress}>Jl. Mahkota No. 100 Desa Dibee Kalitengah Lamongan 62255</Text>
            <Text style={styles.headerAddress}>Telp. 0322-391971 Email: puskes.kalitengah@gmail.com</Text>
            <Text style={styles.headerAddress}>Web : https://lamongankab.go.id/puskesmas-kalitengah</Text>
          </View>

          {/* Logo Kanan */}
          <View style={{ width: 100, height: 100, justifyContent: 'center', alignItems: 'center' }}>
             <Image src={logoPuskesmas} style={{ width: 95, height: 95, objectFit: 'contain' }} />
          </View>
        </View>

        <View style={styles.divider} />
        <View style={styles.dividerThin} />

        {/* JUDUL SURAT */}
        <Text style={styles.suratTitle}>
          {suratType === 'SKD' ? 'SURAT KETERANGAN DOKTER (SKD)' : 
           suratType === 'SKI' ? 'SURAT KETERANGAN ISTIRAHAT' : 
           suratType === 'SKBN' ? 'SURAT KETERANGAN BEBAS NARKOBA' : 
           suratType === 'SKB' ? 'SURAT KETERANGAN BEROBAT' :
           suratType === 'CATIN' ? 'SURAT KETERANGAN CALON PENGANTIN' :
           suratType === 'SKH' ? 'SURAT KETERANGAN HAMIL' :
           suratType === 'SKSH' ? 'SURAT KETERANGAN CALON JAMAAH HAJI' :
           suratType === 'SKV' ? 'SURAT KETERANGAN VAKSINASI' :
           `SURAT KETERANGAN ${suratType}`}
        </Text>
        <Text style={styles.suratNumber}>Nomor : {nomorSuratFull}</Text>

        <Text style={{ marginBottom: 10 }}>Yang bertanda tangan di bawah ini dokter Pemeriksa Puskesmas Kalitengah, menerangkan bahwa :</Text>
        
        {/* IDENTITAS */}
        <View style={{ marginLeft: 20, marginBottom: 15 }}>
          <View style={styles.contentRow}>
            <Text style={styles.label}>Nama</Text><Text style={styles.colon}>:</Text><Text style={styles.value}>{patient.nama}</Text>
          </View>
          {suratType === 'SKSH' && (
            <View style={styles.contentRow}>
              <Text style={styles.label}>Bin/ Binti</Text><Text style={styles.colon}>:</Text><Text style={styles.value}>{dataKlinis.bin_binti || '-'}</Text>
            </View>
          )}
          {suratType === 'SKV' ? (
            <View style={styles.contentRow}>
              <Text style={styles.label}>NIK</Text><Text style={styles.colon}>:</Text><Text style={styles.value}>{patient.nik}</Text>
            </View>
          ) : null}
          <View style={styles.contentRow}>
            <Text style={styles.label}>{suratType === 'SKSH' ? 'Tempat, Tgl Lahir' : suratType === 'SKV' ? 'Tanggal Lahir' : 'Umur'}</Text><Text style={styles.colon}>:</Text>
            <Text style={styles.value}>
               {suratType === 'SKSH' ? `${patient.tempat_lahir}, ${patient.tanggal_lahir}` : 
                suratType === 'SKV' ? patient.tanggal_lahir : calculatedAge}
            </Text>
          </View>
          {suratType !== 'SKV' && (
            <View style={styles.contentRow}>
              <Text style={styles.label}>Jenis Kelamin</Text><Text style={styles.colon}>:</Text><Text style={styles.value}>{patient.jenis_kelamin || 'Laki-laki'}</Text>
            </View>
          )}
          {suratType === 'SKSH' && (
            <>
              <View style={styles.contentRow}>
                <Text style={styles.label}>Agama</Text><Text style={styles.colon}>:</Text><Text style={styles.value}>{patient.agama}</Text>
              </View>
              <View style={styles.contentRow}>
                <Text style={styles.label}>Tinggi Badan</Text><Text style={styles.colon}>:</Text><Text style={styles.value}>{dataKlinis.tinggi_badan || '-'} cm</Text>
              </View>
              <View style={styles.contentRow}>
                <Text style={styles.label}>Berat Badan</Text><Text style={styles.colon}>:</Text><Text style={styles.value}>{dataKlinis.berat_badan || '-'} kg</Text>
              </View>
              <View style={styles.contentRow}>
                <Text style={styles.label}>Tekanan Darah</Text><Text style={styles.colon}>:</Text><Text style={styles.value}>{dataKlinis.tensi || '-'} mm/Hg</Text>
              </View>
              <View style={styles.contentRow}>
                <Text style={styles.label}>Golongan Darah</Text><Text style={styles.colon}>:</Text><Text style={styles.value}>{patient.golongan_darah || '-'}</Text>
              </View>
              <View style={styles.contentRow}>
                <Text style={styles.label}>Riwayat Penyakit</Text><Text style={styles.colon}>:</Text><Text style={styles.value}>{dataKlinis.riwayat_penyakit || '-'}</Text>
              </View>
            </>
          )}
          {suratType === 'SKV' && (
            <View style={styles.contentRow}>
              <Text style={styles.label}>No. Handphone</Text><Text style={styles.colon}>:</Text><Text style={styles.value}>{patient.no_hp || '-'}</Text>
            </View>
          )}
          <View style={styles.contentRow}>
            <Text style={styles.label}>Pekerjaan</Text><Text style={styles.colon}>:</Text><Text style={styles.value}>{patient.pekerjaan}</Text>
          </View>
          <View style={styles.contentRow}>
            <Text style={styles.label}>Alamat</Text><Text style={styles.colon}>:</Text><Text style={styles.value}>{patient.alamat}</Text>
          </View>
        </View>

        {/* DATA KLINIS SPESIFIK */}
        {suratType === 'SKD' && (
          <View>
            <Text style={styles.paragraph}>
              bahwa pada pemeriksaan kesehatan saat ini, orang tersebut dalam keadaan <Text style={{fontWeight: 'bold'}}>SEHAT / <Text style={{textDecoration: 'line-through'}}>TIDAK SEHAT</Text> (*)</Text>.
              {'\n'}Surat Keterangan ini akan dipergunakan sebagai persyaratan untuk <Text style={{fontWeight: 'bold'}}>{dataKlinis.keperluan || '...'}</Text>
            </Text>
            <Text style={styles.paragraph}>Demikian surat keterangan ini dibuat untuk dapat dipergunakan seperlunya.</Text>
          </View>
        )}

        {suratType === 'SKB' && (
          <View>
            <Text style={styles.paragraph}>
              Pada tanggal {new Date().toLocaleDateString('id-ID', {day: '2-digit', month: 'long', year: 'numeric'})} yang bersangkutan <Text style={{fontWeight: 'bold'}}>TELAH BEROBAT</Text> di Puskesmas Kalitengah.
            </Text>
            <Text style={styles.paragraph}>Demikian surat keterangan ini dibuat untuk dapat dipergunakan seperlunya.</Text>
            
            <View style={{ marginTop: 20 }}>
              <View style={styles.contentRow}>
                <Text style={{width: 80}}>Diagnosa</Text><Text style={{width: 10}}>:</Text>
                <Text style={{fontWeight: 'bold'}}>{dataKlinis.diagnosa || '-'}</Text>
              </View>
              <View style={styles.contentRow}>
                <Text style={{width: 80}}>Terapy</Text><Text style={{width: 10}}>:</Text>
                <Text style={{fontWeight: 'bold', flex: 1}}>{dataKlinis.terapy?.replace(/\n/g, '\n  ') || '-'}</Text>
              </View>
            </View>
          </View>
        )}

         {suratType === 'SKH' && (
          <View>
            <Text style={styles.paragraph}>
              Bahwa nama yang tersebut diatas saat ini sedang Hamil dengan usia kehamilan {dataKlinis.usia_kehamilan || '...'} minggu.
            </Text>
            <Text style={styles.paragraph}>Demikian surat keterangan ini dibuat untuk dapat dipergunakan seperlunya.</Text>
          </View>
        )}

        {suratType === 'SKSH' && (
          <View>
            <Text style={styles.paragraph}>
              Setelah diperiksa kesehatannya dengan teliti saat ini, orang tersebut dalam keadaan berbadan <Text style={{fontWeight: 'bold'}}>{dataKlinis.kesimpulan || 'SEHAT (BAIK)'}</Text>. Surat Keterangan ini diberikan sehubungan dengan maksud untuk : {'\n'}
              <Text style={{fontWeight: 'bold'}}>“{dataKlinis.keperluan || 'Melengkapi Persyaratan Administrasi Mendaftar Haji'}”</Text>.
            </Text>
            <Text style={styles.paragraph}>Demikian surat keterangan ini dibuat untuk dapat digunakan seperlunya.</Text>
          </View>
        )}

         {suratType === 'SKV' && (
          <View style={{ fontSize: 9 }}>
            <Text style={{ marginTop: 5, marginBottom: 5, lineHeight: 1.2, textAlign: 'justify' }}>
              Yang bersangkutan <Text style={{fontWeight: 'bold'}}>SUDAH</Text> melakukan vaksinasi akan tetapi ada kendala pada aplikasi SATU SEHAT sehingga sertifikat belum muncul berikut tanggal vaksinasi :
            </Text>
            
            <View style={{ display: 'flex', flexDirection: 'column', border: '1 solid #000', marginTop: 5, marginBottom: 5 }}>
               <View style={{ display: 'flex', flexDirection: 'row', borderBottom: '1 solid #000', padding: 3 }}>
                 <Text style={{ flex: 1, textAlign: 'center' }}>Dosis</Text>
                 <Text style={{ flex: 2, textAlign: 'center', borderLeft: '1 solid #000', borderRight: '1 solid #000' }}>Tanggal Vaksin</Text>
                 <Text style={{ flex: 2, textAlign: 'center' }}>No. Batch Vaksin</Text>
               </View>
               {[1, 2, 3].map((dosis) => (
                  <View key={dosis} style={{ display: 'flex', flexDirection: 'row', padding: 3, borderBottom: dosis === 3 ? 'none' : '1 solid #000' }}>
                    <Text style={{ flex: 1, textAlign: 'center' }}>Dosis {dosis === 1 ? 'I' : dosis === 2 ? 'II' : 'III'}</Text>
                    <Text style={{ flex: 2, textAlign: 'center', borderLeft: '1 solid #000', borderRight: '1 solid #000', fontWeight: 'bold' }}>
                      {dataKlinis[`tgl_vaksin_${dosis}`] ? new Date(dataKlinis[`tgl_vaksin_${dosis}`]).toLocaleDateString('id-ID') : ''}
                    </Text>
                    <Text style={{ flex: 2, textAlign: 'center', fontWeight: 'bold' }}>{dataKlinis[`no_batch_${dosis}`] || ''}</Text>
                  </View>
               ))}
            </View>

            <Text style={{ marginTop: 5, marginBottom: 5, lineHeight: 1.2, textAlign: 'justify' }}>Surat Keterangan ini bukan sertifikat Vaksin ataupun sebagai pengganti sertifikat vaksin.</Text>
            <Text style={{ marginTop: 5, marginBottom: 5, lineHeight: 1.2, textAlign: 'justify' }}>Demikian surat keterangan ini dibuat dengan sesungguhnya dan sebenar-benarnya untuk dapat dipergunakan sebagaimana mestinya sampai dengan Etiket vaksin muncul di aplikasi Satu Sehat.</Text>
          </View>
        )}

        {suratType === 'SKI' && (
          <View>
            <Text style={styles.paragraph}>
              Berdasarkan hasil pemeriksaan medis, pasien tersebut didiagnosa mengalami <Text style={{fontWeight: 'bold'}}>{dataKlinis.diagnosa || '...'}</Text>. 
              Oleh karena itu, yang bersangkutan memerlukan istirahat selama <Text style={{fontWeight: 'bold'}}>{dataKlinis.lama_hari || '...'}</Text> hari, 
              terhitung mulai tanggal <Text style={{fontWeight: 'bold'}}>{dataKlinis.tgl_mulai ? new Date(dataKlinis.tgl_mulai).toLocaleDateString('id-ID') : '...'}</Text> sampai dengan <Text style={{fontWeight: 'bold'}}>{dataKlinis.tgl_selesai ? new Date(dataKlinis.tgl_selesai).toLocaleDateString('id-ID') : '...'}</Text>.
            </Text>
             <Text style={styles.paragraph}>Demikian surat keterangan ini dibuat untuk dapat dipergunakan seperlunya.</Text>
          </View>
        )}
        
        {suratType === 'CATIN' && (
           <View>
            <Text style={styles.paragraph}>
              Berdasarkan hasil pemeriksaan medis, pasien tersebut diderangkan: <Text style={{fontWeight: 'bold'}}>{dataKlinis.kesimpulan || '...'}</Text>.
            </Text>
             <Text style={styles.paragraph}>Demikian surat keterangan ini dibuat untuk dapat dipergunakan seperlunya.</Text>
          </View>
        )}

        {suratType === 'SKBN' && (
          <View>
            <Text style={styles.paragraph}>
              Berdasarkan pemeriksaan fisik dan uji laboratorium urin pada hari ini, dinyatakan bahwa:
            </Text>
            <View style={{ marginLeft: 20, marginBottom: 10 }}>
              <Text>MOP (Morphine) : {dataKlinis.hasil_mop || 'NEGATIF'}</Text>
              <Text>COC (Cocaine)  : {dataKlinis.hasil_coc || 'NEGATIF'}</Text>
              <Text>THC (Marijuana): {dataKlinis.hasil_thc || 'NEGATIF'}</Text>
              <Text>AMP (Amphetamine): {dataKlinis.hasil_amp || 'NEGATIF'}</Text>
              <Text>MET (Methamphetamine): {dataKlinis.hasil_met || 'NEGATIF'}</Text>
              <Text>BZO (Benzodiazepine): {dataKlinis.hasil_bzo || 'NEGATIF'}</Text>
            </View>
            <Text style={styles.paragraph}>
              Surat ini dipergunakan untuk: {dataKlinis.keperluan}
            </Text>
            <Text style={styles.paragraph}>Demikian surat keterangan ini dibuat dengan sebenarnya untuk dipergunakan sebagaimana mestinya.</Text>
          </View>
        )}

        {/* TANDA TANGAN & QR & KETERANGAN */}
        <View style={{...styles.signatureSection, marginTop: suratType === 'SKV' ? 10 : 40, alignItems: 'flex-start'}}>
          {suratType === 'SKD' ? (
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text>Keterangan :</Text>
              <View style={{...styles.contentRow, marginTop: 5}}>
                <Text style={{width: 60}}>Tinggi badan</Text><Text style={{width: 5}}>:</Text><Text style={{width: 30, textAlign: 'right'}}>{dataKlinis.tinggi_badan || '-'}</Text><Text style={{marginLeft: 5}}>cm</Text>
              </View>
              <View style={styles.contentRow}>
                <Text style={{width: 60}}>Berat badan</Text><Text style={{width: 5}}>:</Text><Text style={{width: 30, textAlign: 'right'}}>{dataKlinis.berat_badan || '-'}</Text><Text style={{marginLeft: 5}}>kg</Text>
              </View>
              <View style={styles.contentRow}>
                <Text style={{width: 60}}>Tensi</Text><Text style={{width: 5}}>:</Text><Text style={{width: 30, textAlign: 'right'}}>{dataKlinis.tensi || '-'}</Text><Text style={{marginLeft: 5}}>mm/Hg</Text>
              </View>
              <View style={styles.contentRow}>
                <Text style={{width: 60}}>Suhu</Text><Text style={{width: 5}}>:</Text><Text style={{width: 30, textAlign: 'right'}}>{dataKlinis.suhu || '-'}</Text><Text style={{marginLeft: 5}}>°C</Text>
              </View>
              <View style={styles.contentRow}>
                <Text style={{width: 60}}>Nadi</Text><Text style={{width: 5}}>:</Text><Text style={{width: 30, textAlign: 'right'}}>{dataKlinis.nadi || '-'}</Text><Text style={{marginLeft: 5}}>x/menit</Text>
              </View>
              <View style={styles.contentRow}>
                <Text style={{width: 60}}>GDA</Text><Text style={{width: 5}}>:</Text><Text style={{width: 30, textAlign: 'right'}}>{dataKlinis.gda || '-'}</Text><Text style={{marginLeft: 5}}>mg/dl</Text>
              </View>
              <View style={styles.contentRow}>
                <Text style={{width: 60}}>Chol</Text><Text style={{width: 5}}>:</Text><Text style={{width: 30, textAlign: 'right'}}>{dataKlinis.chol || '-'}</Text><Text style={{marginLeft: 5}}>mg/dl</Text>
              </View>
              <View style={styles.contentRow}>
                <Text style={{width: 60}}>Trigliserida</Text><Text style={{width: 5}}>:</Text><Text style={{width: 30, textAlign: 'right'}}>{dataKlinis.trigliserida || '-'}</Text><Text style={{marginLeft: 5}}>mg/dl</Text>
              </View>
              <Text style={{fontSize: 9, fontStyle: 'italic', marginTop: 5}}>Keterangan: (*) Coret yang tidak perlu</Text>
            </View>
          ) : suratType === 'SKI' ? (
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={{fontWeight: 'bold', textDecoration: 'underline'}}>Resep / Terapy:</Text>
              <Text style={{fontSize: 10, lineHeight: 1.5, marginTop: 5}}>{dataKlinis.terapy?.replace(/\n/g, '\n') || '-'}</Text>
            </View>
          ) : (
            <View style={{ flex: 1 }} />
          )}
          
          <View style={{ width: 120, alignItems: 'center' }}>
             {/* QR Code Verification */}
             <Text style={{fontSize: 8, marginBottom: 4, textAlign: 'center'}}>Scan untuk</Text>
             <Text style={{fontSize: 8, marginBottom: 4, textAlign: 'center'}}>verifikasi keaslian:</Text>
             <Image src={qrCodeImg} style={styles.qrContainer} />
          </View>

          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <View style={styles.signatureBlock}>
              <Text>Kalitengah, {new Date().toLocaleDateString('id-ID', {day: '2-digit', month: 'long', year: 'numeric'})}</Text>
              <Text>{suratType === 'SKV' ? 'Kepala Puskesmas Kalitengah' : 'Dokter Pemeriksa,'}</Text>
              <Text style={{ ...styles.signatureName, marginTop: suratType === 'SKV' ? 40 : 60 }}>dr. R.M. Ustadho</Text>
              <Text style={styles.signatureNip}>NIP. 19820506 201412 1 001</Text>
              <Text style={{ marginTop: 2 }}>No SIP-DU1028/SIP.DU/413.111/V/2022</Text>
            </View>
          </View>
        </View>

      </Page>
    </Document>
  );
};
