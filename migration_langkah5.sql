-- MIGRATION SCRIPT 5: Menambahkan kolom logo_kiri, logo_kanan, website, dan nama_kabupaten ke pengaturan_instansi
-- Jalankan kode ini di dalam menu SQL Editor Supabase Anda

ALTER TABLE public.pengaturan_instansi 
ADD COLUMN IF NOT EXISTS logo_kiri TEXT,
ADD COLUMN IF NOT EXISTS logo_kanan TEXT,
ADD COLUMN IF NOT EXISTS website VARCHAR(255),
ADD COLUMN IF NOT EXISTS nama_kabupaten VARCHAR(255);

-- Set default value untuk data yang sudah ada
UPDATE public.pengaturan_instansi 
SET 
  nama_kabupaten = 'Lamongan',
  website = 'https://lamongankab.go.id/puskesmas-kalitengah'
WHERE id = 1;
