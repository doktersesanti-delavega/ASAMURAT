-- MIGRATION SCRIPT 4: Menambahkan kolom pemerintah_daerah ke pengaturan_instansi
-- Jalankan kode ini di dalam menu SQL Editor Supabase Anda

ALTER TABLE public.pengaturan_instansi 
ADD COLUMN IF NOT EXISTS pemerintah_daerah VARCHAR(255);

-- Set default value untuk data yang sudah ada
UPDATE public.pengaturan_instansi 
SET pemerintah_daerah = 'PEMERINTAH KABUPATEN LAMONGAN' 
WHERE pemerintah_daerah IS NULL AND id = 1;

-- Pastikan RLS untuk tenaga_medis sudah bisa CRUD untuk Authenticated / SuperAdmin
DROP POLICY IF EXISTS "Allow all on tenaga_medis" ON public.tenaga_medis;
CREATE POLICY "Allow all on tenaga_medis" ON public.tenaga_medis FOR ALL USING (true) WITH CHECK (true);
