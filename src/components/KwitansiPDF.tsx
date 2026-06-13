import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import logoPemkab from '../lib/logo.pemkab.png';
import logoPuskesmas from '../lib/logo.puskesmas.png';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 11 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  headerTextContainer: { alignItems: 'center', flex: 1, paddingHorizontal: 10 },
  headerTitle: { fontSize: 14, fontWeight: 'bold', textAlign: 'center' },
  headerSubtitle: { fontSize: 16, fontWeight: 'bold', marginVertical: 3, textAlign: 'center' },
  headerAddress: { fontSize: 10, textAlign: 'center' },
  divider: { borderBottomWidth: 2, borderBottomColor: '#000', marginBottom: 2, marginTop: 10 },
  dividerThin: { borderBottomWidth: 1, borderBottomColor: '#000', marginBottom: 20 },
  title: { textAlign: 'center', fontSize: 16, fontWeight: 'bold', textDecoration: 'underline', marginBottom: 10 },
  nomor: { textAlign: 'center', marginBottom: 30 },
  contentRow: { flexDirection: 'row', marginBottom: 10, lineHeight: 1.5 },
  label: { width: 140 },
  colon: { width: 10 },
  value: { flex: 1 },
  amountContainer: { backgroundColor: '#f0f0f0', padding: 10, marginTop: 20, marginBottom: 30, border: '1px solid #ccc' },
  amountText: { fontSize: 14, fontWeight: 'bold' },
  signatureSection: { marginTop: 40, flexDirection: 'row', justifyContent: 'flex-end' },
  signatureBlock: { alignItems: 'center', width: 220 },
  signatureName: { marginTop: 60, fontWeight: 'bold', textDecoration: 'underline' },
  signatureNip: { marginTop: 2 }
});

// Helper for currency and words
const formatFormatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
};

// Basic Terbilang generator for Rupiah
function terbilangFunction(angka: number): string {
    const huruf = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
    let hasil = "";
    if (angka < 12) {
        hasil = hasil + huruf[angka];
    } else if (angka < 20) {
        hasil = hasil + terbilangFunction(angka - 10) + " Belas";
    } else if (angka < 100) {
        hasil = hasil + terbilangFunction(Math.floor(angka / 10)) + " Puluh " + terbilangFunction(angka % 10);
    } else if (angka < 200) {
        hasil = hasil + "Seratus " + terbilangFunction(angka - 100);
    } else if (angka < 1000) {
        hasil = hasil + terbilangFunction(Math.floor(angka / 100)) + " Ratus " + terbilangFunction(angka % 100);
    } else if (angka < 2000) {
        hasil = hasil + "Seribu " + terbilangFunction(angka - 1000);
    } else if (angka < 1000000) {
        hasil = hasil + terbilangFunction(Math.floor(angka / 1000)) + " Ribu " + terbilangFunction(angka % 1000);
    } else if (angka < 1000000000) {
        hasil = hasil + terbilangFunction(Math.floor(angka / 1000000)) + " Juta " + terbilangFunction(angka % 1000000);
    }
    return hasil.trim();
}

interface KwitansiDocumentProps {
  nomorKwitansi: string;
  namaPasien: string;
  totalBayar: number;
  jenisPelayanan: string;
  tanggal: string;
  instansiData?: any;
}

export const KwitansiDocument = ({
  nomorKwitansi,
  namaPasien,
  totalBayar,
  jenisPelayanan,
  tanggal,
  instansiData
}: KwitansiDocumentProps) => {

  const titleDinas = instansiData?.dinas_naungan ? instansiData.dinas_naungan.toUpperCase() : 'DINAS KESEHATAN KABUPATEN LAMONGAN';
  const nameInstansi = instansiData?.nama_instansi ? instansiData.nama_instansi.toUpperCase() : 'PUSKESMAS KALITENGAH';
  const addressInstansi = instansiData?.alamat || 'Jl. Pemuda No. 1, Kalitengah';
  const telpInstansi = instansiData?.telepon || '08111111111';
  const emailInstansi = instansiData?.email || 'info@puskesmaskalitengah.com';
  const webInstansi = instansiData?.website || 'www.puskesmaskalitengah.com';
  
  const cityInstansi = addressInstansi.split(',').pop()?.trim() || 'Kalitengah';
  
  const terbilangFormatted = totalBayar > 0 ? terbilangFunction(totalBayar) + " Rupiah" : "Nihil";

  return (
    <Document>
      <Page size="A4" style={[styles.page, { height: '50%' }]}>
        {/* KOP SURAT */}
        <View style={styles.header}>
          {/* Logo Kiri */}
          <View style={{ width: 100, height: 100, justifyContent: 'center', alignItems: 'center' }}>
            <Image src={instansiData?.logo_kiri_url || logoPemkab} style={{ width: 95, height: 95, objectFit: 'contain' }} />
          </View>
          
          <View style={styles.headerTextContainer}>
             <Text style={styles.headerTitle}>{titleDinas}</Text>
             <Text style={styles.headerSubtitle}>{nameInstansi}</Text>
             <Text style={styles.headerAddress}>{addressInstansi}</Text>
             <Text style={styles.headerAddress}>Telp: {telpInstansi} | Email: {emailInstansi}</Text>
             <Text style={styles.headerAddress}>Web: {webInstansi}</Text>
          </View>

          {/* Logo Kanan */}
          <View style={{ width: 100, height: 100, justifyContent: 'center', alignItems: 'center' }}>
             <Image src={instansiData?.logo_kanan_url || logoPuskesmas} style={{ width: 95, height: 95, objectFit: 'contain' }} />
          </View>
        </View>

        <View style={styles.divider} />
        <View style={styles.dividerThin} />
        
        {/* JUDUL */}
        <Text style={styles.title}>BUKTI PEMBAYARAN (KWITANSI)</Text>
        <Text style={styles.nomor}>Nomor : {nomorKwitansi}</Text>
        
        {/* ISI */}
        <View style={styles.contentRow}>
          <Text style={styles.label}>Telah terima dari</Text>
          <Text style={styles.colon}>:</Text>
          <Text style={styles.value}>{namaPasien}</Text>
        </View>
        
        <View style={styles.contentRow}>
          <Text style={styles.label}>Uang Sejumlah</Text>
          <Text style={styles.colon}>:</Text>
          <Text style={[styles.value, { fontStyle: 'italic', backgroundColor: '#f0f0f0', padding: 4 }]}>
            {terbilangFormatted}
          </Text>
        </View>
        
        <View style={styles.contentRow}>
          <Text style={styles.label}>Untuk Pembayaran</Text>
          <Text style={styles.colon}>:</Text>
          <Text style={styles.value}>{jenisPelayanan}</Text>
        </View>
        
        {/* TOTAL BOX */}
        <View style={styles.amountContainer}>
          <Text style={styles.amountText}>{formatFormatCurrency(totalBayar)}</Text>
        </View>
        
        {/* TTD BENDAHARA */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBlock}>
            <Text>{cityInstansi}, {tanggal}</Text>
            <Text>Bendahara Penerimaan,</Text>
            <Text style={styles.signatureName}>____________________________</Text>
          </View>
        </View>
        
      </Page>
    </Document>
  );
};
