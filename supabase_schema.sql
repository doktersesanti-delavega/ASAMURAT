-- Eksekusi skema ini di Supabase SQL Editor

-- Aktifkan ekstensi uuid-ossp jika belum aktif
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABEL pasien
CREATE TABLE pasien (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nik VARCHAR UNIQUE NOT NULL,
    nama VARCHAR NOT NULL,
    tempat_lahir VARCHAR,
    tanggal_lahir DATE,
    jenis_kelamin VARCHAR CHECK (jenis_kelamin IN ('Laki-laki', 'Perempuan')),
    agama VARCHAR,
    pekerjaan VARCHAR,
    alamat TEXT,
    no_hp VARCHAR,
    golongan_darah VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABEL tenaga_medis
CREATE TABLE tenaga_medis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nama_lengkap VARCHAR NOT NULL,
    nip VARCHAR,
    no_sip VARCHAR,
    jabatan VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert Data Dummy Tenaga Medis
INSERT INTO tenaga_medis (nama_lengkap, nip, no_sip, jabatan) VALUES
('dr. Sesanti', '198001012005012001', '503/123/SIP.Dr/413.111/2020', 'Kepala Puskesmas'),
('dr. R.M. Ustadho', '198205062014121001', 'SIP-DU1028/SIP.DU/413.111/V/2022', 'Dokter Pemeriksa'),
('dr. Muhammad Machfud', '199003032015031003', '503/125/SIP.Dr/413.111/2022', 'Dokter Pemeriksa');

-- 3. TABEL surat_keterangan
-- JSONB data_klinis structure:
-- SKD: { keperluan, tinggi_badan, berat_badan, tensi, suhu, nadi, gda, kholesterol, uric_acid, kesimpulan }
-- SKI: { diagnosa, tensi, suhu, nadi, terapy, lama_hari, tgl_mulai, tgl_selesai }
-- SKB: { diagnosa, terapy }
-- SKH: { usia_kehamilan }
-- SKSH: { bin_binti, tinggi_badan, berat_badan, tensi, riwayat_penyakit, kesimpulan }
-- SKBN: { keperluan, tinggi_badan, berat_badan, hasil_mop, hasil_coc, hasil_thc, hasil_amp, hasil_met, hasil_bzo }
-- SKV:  { riwayat_vaksin: [{ dosis, tgl_vaksin, no_batch }] }

CREATE TABLE surat_keterangan (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nomor_surat VARCHAR NOT NULL,
    jenis_surat VARCHAR NOT NULL CHECK (jenis_surat IN ('SKD', 'SKI', 'SKB', 'CATIN', 'SKBN', 'SKH', 'SKSH', 'SKV')),
    pasien_id UUID REFERENCES pasien(id) ON DELETE CASCADE,
    dokter_pemeriksa_id UUID REFERENCES tenaga_medis(id),
    mengetahui_id UUID REFERENCES tenaga_medis(id), -- Nullable, khusus untuk SKBN dsb.
    tanggal_terbit DATE DEFAULT CURRENT_DATE,
    data_klinis JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Buat indeks untuk performa pencarian JSONB
CREATE INDEX idx_surat_keterangan_data_klinis ON surat_keterangan USING GIN (data_klinis);

-- 4. Kofigurasi Row-Level Security (RLS)
-- Mengizinkan akses publik untuk operasi CRUD karena belum menggunakan JWT/Supabase Auth penuh
ALTER TABLE pasien ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on pasien" ON pasien;
CREATE POLICY "Allow all on pasien" ON pasien FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE tenaga_medis ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on tenaga_medis" ON tenaga_medis;
CREATE POLICY "Allow all on tenaga_medis" ON tenaga_medis FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE surat_keterangan ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on surat_keterangan" ON surat_keterangan;
CREATE POLICY "Allow all on surat_keterangan" ON surat_keterangan FOR ALL USING (true) WITH CHECK (true);
